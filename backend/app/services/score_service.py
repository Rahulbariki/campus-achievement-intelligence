from datetime import datetime

from ai_engine.scoring import calculate_points, determine_activity_level
from backend.app.core.database import mongo_manager
from backend.app.utils.serializers import serialize_document


class ScoreService:
    SORT_ORDER = [
        ("total_points", -1),
        ("wins_count", -1),
        ("participations_count", -1),
        ("student_name", 1),
    ]

    @staticmethod
    def sync_student_score(student_email: str) -> dict:
        normalized_email = student_email.strip().lower()
        student = mongo_manager.users.find_one({"email": normalized_email})
        if student is None:
            mongo_manager.scores.delete_one({"student_email": normalized_email})
            return {}

        verified_certificates = list(
            mongo_manager.certificates.find(
                {
                    "student_email": normalized_email,
                    "verification_status": "verified",
                }
            )
        )

        participations_count = len(verified_certificates)
        total_points = sum(
            calculate_points(str(certificate.get("achievement", "")))
            for certificate in verified_certificates
        )
        wins_count = sum(
            1 for certificate in verified_certificates if certificate.get("achievement") == "winner"
        )
        last_participation_at = max(
            (
                certificate.get("verified_at")
                or certificate.get("updated_at")
                or certificate.get("uploaded_at")
            )
            for certificate in verified_certificates
        ) if verified_certificates else None

        timestamp = datetime.utcnow()
        document = {
            "student_user_id": str(student["_id"]),
            "student_email": normalized_email,
            "student_name": student.get("name", normalized_email),
            "department": student.get("department"),
            "total_points": total_points,
            "participations_count": participations_count,
            "wins_count": wins_count,
            "activity_level": determine_activity_level(participations_count),
            "last_participation_at": last_participation_at,
            "updated_at": timestamp,
        }

        mongo_manager.scores.update_one(
            {"student_email": normalized_email},
            {
                "$set": document,
                "$setOnInsert": {"created_at": timestamp},
            },
            upsert=True,
        )
        score = mongo_manager.scores.find_one({"student_email": normalized_email})
        return serialize_document(score)
