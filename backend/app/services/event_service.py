from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, status

from backend.app.core.database import mongo_manager
from backend.app.schemas.event import EventCreate, EventUpdate
from backend.app.utils.serializers import serialize_document


class EventService:
    @staticmethod
    def create_event(payload: EventCreate, current_user: dict) -> dict:
        timestamp = datetime.utcnow()
        document = {
            "event_name": payload.event_name.strip(),
            "title": payload.event_name.strip(),
            "organizer": payload.organizer.strip(),
            "category": payload.category.strip(),
            "date": payload.date,
            "description": payload.description,
            "created_by_user_id": str(current_user["_id"]),
            "created_by_email": current_user["email"],
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        result = mongo_manager.events.insert_one(document)
        created = mongo_manager.events.find_one({"_id": result.inserted_id})
        return serialize_document(created)

    @staticmethod
    def list_events() -> list[dict]:
        events = mongo_manager.events.find({}).sort("date", 1)
        return [serialize_document(event) for event in events]

    @staticmethod
    def update_event(event_id: str, payload: EventUpdate, current_user: dict) -> dict:
        event_object_id = EventService._validate_event_id(event_id)
        existing = mongo_manager.events.find_one({"_id": event_object_id})
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event was not found.",
            )

        update_data = payload.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one event field must be provided for update.",
            )

        if "event_name" in update_data:
            update_data["event_name"] = update_data["event_name"].strip()
            update_data["title"] = update_data["event_name"]
        if "organizer" in update_data and update_data["organizer"] is not None:
            update_data["organizer"] = update_data["organizer"].strip()
        if "category" in update_data and update_data["category"] is not None:
            update_data["category"] = update_data["category"].strip()

        update_data["updated_at"] = datetime.utcnow()
        update_data["updated_by_user_id"] = str(current_user["_id"])
        update_data["updated_by_email"] = current_user["email"]

        mongo_manager.events.update_one({"_id": event_object_id}, {"$set": update_data})
        updated = mongo_manager.events.find_one({"_id": event_object_id})
        return serialize_document(updated)

    @staticmethod
    def delete_event(event_id: str) -> dict:
        event_object_id = EventService._validate_event_id(event_id)
        existing = mongo_manager.events.find_one({"_id": event_object_id})
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event was not found.",
            )

        mongo_manager.events.delete_one({"_id": event_object_id})
        return serialize_document(existing)

    @staticmethod
    def _validate_event_id(event_id: str) -> ObjectId:
        if not ObjectId.is_valid(event_id):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid event identifier.",
            )
        return ObjectId(event_id)
