from datetime import datetime

from pydantic import BaseModel, Field, root_validator

from backend.app.models import Achievement


class PressNoteRequest(BaseModel):
    student_name: str = Field(..., min_length=2, max_length=120)
    department: str = Field(..., min_length=2, max_length=120)
    event_name: str = Field(..., min_length=3, max_length=160)
    achievement: Achievement

    @root_validator(pre=True)
    def map_legacy_fields(cls, values):  # noqa: N805
        if not values.get("student_name") and values.get("name"):
            values["student_name"] = values["name"]
        if not values.get("event_name") and values.get("event"):
            values["event_name"] = values["event"]
        return values


class PressNoteResponse(BaseModel):
    id: str
    title: str
    student_name: str
    department: str
    event_name: str
    achievement: Achievement
    press_note: str
    status: str
    created_at: datetime | None = None


class PredictionRequest(BaseModel):
    student_name: str | None = None
    events_participated: int = Field(..., ge=0)
    wins: int = Field(..., ge=0)
    categories: list[str] = Field(default_factory=list)


class PredictionResponse(BaseModel):
    win_probability: float
    activity_level: str
    summary: str
