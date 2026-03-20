from datetime import datetime

from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    student_email: str
    student_name: str
    department: str | None = None
    total_points: int
    participations: int
    wins: int
    activity_level: str
    last_submission: datetime | None = None


class ActivityStatusEntry(BaseModel):
    student_email: str
    student_name: str
    department: str | None = None
    participations: int
    activity_level: str
