from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, root_validator

from backend.app.schemas.common import Achievement, MessageResponse


class CertificateResponse(BaseModel):
    id: str
    student_email: EmailStr
    event_name: str
    achievement: Achievement
    file_url: str
    verified: bool = False
    public_id: str | None = None
    file_name: str | None = None
    content_type: str | None = None
    uploaded_by_email: EmailStr | None = None
    uploaded_at: datetime | None = None
    verified_at: datetime | None = None
    verification_status: str = "pending"

    @root_validator(pre=True)
    def mirror_legacy_fields(cls, values):  # noqa: N805
        if not values.get("event_name") and values.get("extracted_event"):
            values["event_name"] = values["extracted_event"]
        if not values.get("achievement") and values.get("extracted_achievement"):
            values["achievement"] = values["extracted_achievement"]
        if values.get("verification_status") is None:
            values["verification_status"] = "verified" if values.get("verified") else "pending"
        return values


class CertificateDeleteResponse(MessageResponse):
    id: str
