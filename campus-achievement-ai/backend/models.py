from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = 'student'
    department: Optional[str]
    year: Optional[int]
    section: Optional[str]

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserRead(UserBase):
    id: str

class EventCreate(BaseModel):
    event_name: str
    organizer: str
    event_type: str
    event_date: str
    location: Optional[str]

class ParticipationCreate(BaseModel):
    student_id: str
    event_id: str
    participation_type: str
    status: str = 'pending'

class CertificateCreate(BaseModel):
    student_id: str
    participation_id: str
    certificate_url: str

class PressNoteCreate(BaseModel):
    student_id: str
    participation_id: str
    text: str

class Event(BaseModel):
    event_name: str
    organizer: str
    category: str
    event_date: str
    description: str

class Participation(BaseModel):
    student_email: str
    event_name: str
    achievement: str
    date: str

class Certificate(BaseModel):
    student_email: str
    event_name: str
    achievement: str
    file_name: str
    verified: bool = False
