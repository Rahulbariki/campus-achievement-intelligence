from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, root_validator


class EventBase(BaseModel):
    event_name: str = Field(..., min_length=3, max_length=160)
    organizer: str = Field(..., min_length=2, max_length=160)
    category: str = Field(..., min_length=2, max_length=80)
    date: date
    description: str | None = Field(default=None, max_length=1000)
    title: str | None = Field(
        default=None,
        description="Backward-compatible alias for older clients. Mirrors event_name.",
    )

    @root_validator(pre=True)
    def populate_event_name_from_title(cls, values):  # noqa: N805
        if not values.get("event_name") and values.get("title"):
            values["event_name"] = values["title"]
        if not values.get("title") and values.get("event_name"):
            values["title"] = values["event_name"]
        return values


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_name: str | None = Field(default=None, min_length=3, max_length=160)
    organizer: str | None = Field(default=None, min_length=2, max_length=160)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    date: date | None = None
    description: str | None = Field(default=None, max_length=1000)


class EventResponse(EventBase):
    id: str
    created_by_user_id: str
    created_by_email: EmailStr
    created_at: datetime | None = None
    updated_at: datetime | None = None
