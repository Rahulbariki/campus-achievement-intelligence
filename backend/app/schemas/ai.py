from pydantic import BaseModel, Field


class PressNoteRequest(BaseModel):
    name: str
    department: str
    event: str
    achievement: str


class PressNoteResponse(BaseModel):
    press_note: str


class PredictionRequest(BaseModel):
    student_name: str | None = None
    events_participated: int = Field(..., ge=0)
    wins: int = Field(..., ge=0)
    categories: list[str] = Field(default_factory=list)


class PredictionResponse(BaseModel):
    win_probability: float
    activity_level: str
    summary: str
