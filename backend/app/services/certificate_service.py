from datetime import datetime
import os

from bson import ObjectId
from fastapi import HTTPException, UploadFile, status

from backend.app.core.cloudinary_client import storage
from backend.app.core.database import mongo_manager
from backend.app.services.score_service import ScoreService
from backend.app.utils.serializers import serialize_document

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}


class CertificateService:
    @staticmethod
    async def upload_certificate(
        upload: UploadFile,
        current_user: dict,
        student_email: str,
        event_name: str,
        achievement: str,
    ) -> dict:
        CertificateService._validate_upload(upload)
        normalized_email = student_email.strip().lower()
        normalized_event_name = event_name.strip()
        normalized_achievement = achievement.strip().lower()
        file_bytes = await upload.read()

        if not normalized_event_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event name is required.",
            )

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        CertificateService._validate_student_email_access(normalized_email, current_user)

        student_user = mongo_manager.users.find_one(
            {"email": normalized_email, "role": "student"}
        )
        if student_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student account could not be found for the provided email.",
            )

        upload_result = storage.upload_certificate(file_bytes, upload.filename or "certificate")
        timestamp = datetime.utcnow()
        document = {
            "student_user_id": str(student_user["_id"]),
            "student_email": normalized_email,
            "student_name": student_user.get("name"),
            "department": student_user.get("department"),
            "event_name": normalized_event_name,
            "achievement": normalized_achievement,
            "file_url": upload_result["url"],
            "public_id": upload_result["public_id"],
            "file_name": upload.filename,
            "content_type": upload.content_type,
            "verified": False,
            "verification_status": "pending",
            "uploaded_by_email": current_user["email"],
            "uploaded_at": timestamp,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        result = mongo_manager.certificates.insert_one(document)
        created = mongo_manager.certificates.find_one({"_id": result.inserted_id})
        return serialize_document(created)

    @staticmethod
    def list_certificates(current_user: dict) -> list[dict]:
        query: dict = {}
        role = current_user.get("role")
        if role == "student":
            query["student_email"] = current_user["email"]
        elif role in {"faculty", "hod"} and current_user.get("department"):
            query["department"] = current_user["department"]

        results = mongo_manager.certificates.find(query).sort("uploaded_at", -1)
        return [serialize_document(item) for item in results]

    @staticmethod
    def verify_certificate(certificate_id: str, current_user: dict) -> dict:
        certificate_oid = CertificateService._validate_certificate_id(certificate_id)
        certificate = mongo_manager.certificates.find_one({"_id": certificate_oid})
        if certificate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate could not be found.",
            )

        if certificate.get("verification_status") == "verified":
            ScoreService.sync_student_score(certificate["student_email"])
            return serialize_document(certificate)

        verified_at = datetime.utcnow()
        mongo_manager.certificates.update_one(
            {"_id": certificate_oid},
            {
                "$set": {
                    "verified": True,
                    "verification_status": "verified",
                    "verified_at": verified_at,
                    "verified_by_user_id": str(current_user["_id"]),
                    "verified_by_email": current_user["email"],
                    "updated_at": verified_at,
                }
            },
        )
        updated = mongo_manager.certificates.find_one({"_id": certificate_oid})
        ScoreService.sync_student_score(updated["student_email"])
        return serialize_document(updated)

    @staticmethod
    def delete_certificate(certificate_id: str, current_user: dict) -> dict:
        certificate_oid = CertificateService._validate_certificate_id(certificate_id)
        certificate = mongo_manager.certificates.find_one({"_id": certificate_oid})
        if certificate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate could not be found.",
            )

        is_owner = certificate.get("student_email") == current_user.get("email")
        is_privileged = current_user.get("role") in {"admin", "hod", "super_admin"}
        if not is_owner and not is_privileged:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner or an administrator can delete this certificate.",
            )

        was_verified = certificate.get("verification_status") == "verified" or certificate.get(
            "verified"
        )

        mongo_manager.certificates.delete_one({"_id": certificate_oid})
        if was_verified:
            ScoreService.sync_student_score(certificate["student_email"])

        deleted = serialize_document(certificate)
        deleted["message"] = "Certificate deleted successfully."
        return deleted

    @staticmethod
    def _validate_student_email_access(student_email: str, current_user: dict) -> None:
        if current_user.get("role") == "student" and student_email != current_user.get("email"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can upload certificates only for their own email address.",
            )

    @staticmethod
    def _validate_upload(upload: UploadFile) -> None:
        extension = os.path.splitext(upload.filename or "")[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and image certificate files are allowed.",
            )

        if upload.content_type and upload.content_type.lower() not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported certificate content type.",
            )

    @staticmethod
    def _validate_certificate_id(certificate_id: str) -> ObjectId:
        if not ObjectId.is_valid(certificate_id):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Certificate identifier is invalid.",
            )
        return ObjectId(certificate_id)
