from pydantic import BaseModel

from backend.app.models import Achievement, Role


class MessageResponse(BaseModel):
    message: str
