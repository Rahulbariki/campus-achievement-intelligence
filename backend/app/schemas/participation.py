from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, root_validator

from backend.app.schemas.common import Achievement


class ParticipationCreate(BaseModel):
    event_id: str = Field(..., min_length=6)
    achievement: Achievement = "participation"
    notes: str | None = Field(default=None, max_length=500)


class ParticipationResponse(BaseModel):
    id: str
    student_user_id: str
    event_id: str
    event_name: str
    event_title: str
    student_email: EmailStr
    student_name: str
    department: str | None = None
    achievement: Achievement
    points: int
    status: str
    notes: str | None = None
    submitted_at: datetime | None = None
    created_at: datetime | None = None

    @root_validator(pre=True)
    def mirror_event_and_submission_fields(cls, values):  # noqa: N805
        event_name = values.get("event_name") or values.get("event_title")
        if event_name and not values.get("event_title"):
            values["event_title"] = event_name
        if event_name and not values.get("event_name"):
            values["event_name"] = event_name
        if values.get("submitted_at") is None and values.get("created_at") is not None:
            values["submitted_at"] = values["created_at"]
        return values
