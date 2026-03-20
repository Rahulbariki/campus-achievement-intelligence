from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, root_validator, validator

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


class CertificateAIResponse(BaseModel):
    student_name: str | None = None
    event_name: str | None = None
    achievement: Achievement | None = None
    confidence: float = Field(..., ge=0, le=1)
    raw_text: str = ""
    certificate_id: str | None = None

    @root_validator(pre=True)
    def map_legacy_fields(cls, values):  # noqa: N805
        if not values.get("student_name") and values.get("name"):
            values["student_name"] = values["name"]
        if not values.get("event_name") and values.get("event"):
            values["event_name"] = values["event"]
        if values.get("raw_text") is None:
            values["raw_text"] = ""
        return values


class PredictionRequest(BaseModel):
    student_name: str | None = None
    events_participated: int = Field(..., ge=0)
    wins: int = Field(..., ge=0)
    participation_frequency: float | None = Field(default=None, ge=0)
    categories: list[str] = Field(default_factory=list)

    @validator("wins")
    def wins_cannot_exceed_events(cls, value, values):  # noqa: N805
        events_participated = values.get("events_participated")
        if events_participated is not None and value > events_participated:
            raise ValueError("wins cannot be greater than events_participated")
        return value


class PredictionResponse(BaseModel):
    student_email: EmailStr | None = None
    events_participated: int = Field(..., ge=0)
    wins: int = Field(..., ge=0)
    participation_frequency: float = Field(..., ge=0)
    win_probability: float
    activity_level: str
    model_version: str
    summary: str
