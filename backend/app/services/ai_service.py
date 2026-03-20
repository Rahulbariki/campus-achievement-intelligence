from datetime import datetime
import re

from bson import ObjectId
from fastapi import HTTPException, status

from ai_engine.achievement_predictor import predict_student_outcomes
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
        return predict_student_outcomes(
            events_participated=payload.events_participated,
            wins=payload.wins,
            categories=payload.categories,
            student_name=payload.student_name,
        )

    @staticmethod
    def _build_press_note_title(student_name: str, event_name: str) -> str:
        return f"{student_name.strip()} Earns Recognition in {event_name.strip()}"

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
