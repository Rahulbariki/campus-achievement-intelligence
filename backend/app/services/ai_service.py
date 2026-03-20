from datetime import datetime
import re

from bson import ObjectId
from fastapi import HTTPException, status

from ai_engine.achievement_predictor import (
    calculate_participation_frequency,
    predict_student_outcomes,
)
from ai_engine.certificate_ocr import extract_certificate_details
from ai_engine.press_note_generator import generate_press_note as build_press_note
from backend.app.core.database import mongo_manager
from backend.app.schemas.ai import PredictionRequest, PressNoteRequest
from backend.app.utils.serializers import serialize_document


class AIService:
    @staticmethod
    def extract_certificate(
        filename: str,
        file_bytes: bytes,
        current_user: dict,
        certificate_id: str | None = None,
    ) -> dict:
        try:
            result = extract_certificate_details(filename=filename, file_bytes=file_bytes)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

        if certificate_id:
            certificate = AIService._get_certificate_for_ocr(certificate_id, current_user)
            ocr_payload = {
                "name": result.get("student_name"),
                "event": result.get("event_name"),
                "achievement": result.get("achievement"),
                "confidence": result.get("confidence"),
                "raw_text": result.get("raw_text"),
            }
            mongo_manager.certificates.update_one(
                {"_id": certificate["_id"]},
                {
                    "$set": {
                        "ocr": ocr_payload,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            result["certificate_id"] = str(certificate["_id"])

        return result

    @staticmethod
    def generate_press_note(payload: PressNoteRequest, current_user: dict) -> dict:
        student = mongo_manager.users.find_one(
            {
                "role": "student",
                "name": {
                    "$regex": f"^{re.escape(payload.student_name.strip())}$",
                    "$options": "i",
                },
                "department": payload.department.strip(),
            }
        )
        event = mongo_manager.events.find_one(
            {
                "event_name": {
                    "$regex": f"^{re.escape(payload.event_name.strip())}$",
                    "$options": "i",
                }
            }
        ) or mongo_manager.events.find_one(
            {
                "title": {
                    "$regex": f"^{re.escape(payload.event_name.strip())}$",
                    "$options": "i",
                }
            }
        )

        press_note = build_press_note(
            student_name=payload.student_name.strip(),
            department=payload.department.strip(),
            event_name=payload.event_name.strip(),
            achievement=payload.achievement,
        )
        timestamp = datetime.utcnow()
        document = {
            "student_user_id": str(student["_id"]) if student else None,
            "student_email": student.get("email") if student else None,
            "student_name": payload.student_name.strip(),
            "department": payload.department.strip(),
            "event_name": payload.event_name.strip(),
            "event_id": str(event["_id"]) if event else None,
            "generated_by_user_id": str(current_user["_id"]),
            "generated_by_email": current_user["email"],
            "achievement": payload.achievement,
            "title": AIService._build_press_note_title(
                payload.student_name,
                payload.event_name,
            ),
            "body": press_note,
            "status": "draft",
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        result = mongo_manager.press_notes.insert_one(document)
        created = mongo_manager.press_notes.find_one({"_id": result.inserted_id})
        serialized = serialize_document(created)
        serialized["press_note"] = serialized["body"]
        return serialized

    @staticmethod
    def predict_achievement(payload: PredictionRequest) -> dict:
        try:
            return predict_student_outcomes(
                events_participated=payload.events_participated,
                wins=payload.wins,
                participation_frequency=payload.participation_frequency,
                student_name=payload.student_name,
            )
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

    @staticmethod
    def predict_student(student_email: str, current_user: dict) -> dict:
        normalized_email = student_email.strip().lower()
        student = mongo_manager.users.find_one(
            {
                "email": normalized_email,
                "role": "student",
            }
        )
        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student account could not be found.",
            )

        AIService._validate_prediction_access(student, current_user)

        participation_records = list(
            mongo_manager.participations.find(
                {"student_email": normalized_email},
                {
                    "achievement": 1,
                    "submitted_at": 1,
                    "created_at": 1,
                    "updated_at": 1,
                },
            )
        )
        if participation_records:
            events_participated = len(participation_records)
            wins = sum(
                1
                for record in participation_records
                if record.get("achievement") == "winner"
            )
            participation_frequency = calculate_participation_frequency(
                [
                    record.get("submitted_at")
                    or record.get("created_at")
                    or record.get("updated_at")
                    for record in participation_records
                ]
            )
        else:
            score = mongo_manager.scores.find_one({"student_email": normalized_email}) or {}
            verified_certificates = list(
                mongo_manager.certificates.find(
                    {
                        "student_email": normalized_email,
                        "verification_status": "verified",
                    },
                    {
                        "achievement": 1,
                        "verified_at": 1,
                        "uploaded_at": 1,
                        "updated_at": 1,
                    },
                )
            )
            events_participated = int(
                score.get("participations_count", len(verified_certificates))
            )
            wins = int(score.get("wins_count", 0)) or sum(
                1
                for record in verified_certificates
                if record.get("achievement") == "winner"
            )
            participation_frequency = calculate_participation_frequency(
                [
                    record.get("verified_at")
                    or record.get("uploaded_at")
                    or record.get("updated_at")
                    for record in verified_certificates
                ]
            )

        try:
            return predict_student_outcomes(
                events_participated=events_participated,
                wins=wins,
                participation_frequency=participation_frequency,
                student_name=student.get("name"),
                student_email=normalized_email,
            )
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

    @staticmethod
    def _build_press_note_title(student_name: str, event_name: str) -> str:
        return f"{student_name.strip()} Earns Recognition in {event_name.strip()}"

    @staticmethod
    def _validate_prediction_access(student: dict, current_user: dict) -> None:
        current_role = current_user.get("role")
        current_email = str(current_user.get("email", "")).strip().lower()
        target_email = str(student.get("email", "")).strip().lower()

        if current_role == "student" and current_email != target_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only request predictions for their own account.",
            )

        if current_role in {"faculty", "hod"}:
            student_department = student.get("department")
            if student_department != current_user.get("department"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only access predictions for students in your department.",
                )

    @staticmethod
    def _get_certificate_for_ocr(certificate_id: str, current_user: dict) -> dict:
        if not ObjectId.is_valid(certificate_id):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Certificate identifier is invalid.",
            )

        certificate = mongo_manager.certificates.find_one({"_id": ObjectId(certificate_id)})
        if certificate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate could not be found.",
            )

        is_owner = certificate.get("student_email") == current_user.get("email")
        is_privileged = current_user.get("role") in {
            "faculty",
            "admin",
            "hod",
            "super_admin",
        }
        if not is_owner and not is_privileged:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to update OCR data for this certificate.",
            )

        return certificate
