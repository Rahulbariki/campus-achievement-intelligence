from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from ai_engine.scoring import calculate_points
from backend.app.core.database import mongo_manager
from backend.app.schemas.participation import ParticipationCreate
from backend.app.utils.serializers import serialize_document


class ParticipationService:
    @staticmethod
    def submit_participation(payload: ParticipationCreate, current_user: dict) -> dict:
        if not ObjectId.is_valid(payload.event_id):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid event identifier.",
            )

        event = mongo_manager.events.find_one({"_id": ObjectId(payload.event_id)})
        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event was not found.",
            )

        event_name = event.get("event_name") or event.get("title")
        timestamp = datetime.utcnow()
        document = {
            "student_user_id": str(current_user["_id"]),
            "event_id": payload.event_id,
            "event_name": event_name,
            "event_title": event_name,
            "student_email": current_user["email"],
            "student_name": current_user["name"],
            "department": current_user.get("department"),
            "achievement": payload.achievement,
            "points": calculate_points(payload.achievement),
            "status": "submitted",
            "notes": payload.notes,
            "submitted_at": timestamp,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        try:
            result = mongo_manager.participations.insert_one(document)
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Participation for this event already exists.",
            ) from exc

        created = mongo_manager.participations.find_one({"_id": result.inserted_id})
        return serialize_document(created)

    @staticmethod
    def list_participations(current_user: dict) -> list[dict]:
        query: dict = {}
        role = current_user.get("role")

        if role == "student":
            query["student_email"] = current_user["email"]
        elif role in {"faculty", "hod"} and current_user.get("department"):
            query["department"] = current_user["department"]

        results = mongo_manager.participations.find(query).sort("submitted_at", -1)
        return [serialize_document(item) for item in results]
