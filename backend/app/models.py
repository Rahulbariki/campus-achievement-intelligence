from datetime import date, datetime
from typing import Literal

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, validator

Role = Literal["student", "faculty", "admin", "hod", "super_admin"]
Achievement = Literal["participation", "runner_up", "finalist", "winner"]
ActivityLevel = Literal["Highly Active", "Moderate", "Inactive"]
ParticipationStatus = Literal["submitted", "under_review", "verified", "rejected"]
CertificateVerificationStatus = Literal["pending", "verified", "rejected"]
PressNoteStatus = Literal["draft", "approved", "published"]
RelationshipCardinality = Literal["one-to-one", "one-to-many", "many-to-one"]


class MongoDocument(BaseModel):
    id: str | None = Field(
        default=None,
        alias="_id",
        description="MongoDB ObjectId stored as a string for FastAPI compatibility.",
    )
    created_at: datetime | None = Field(
        default=None,
        description="UTC timestamp for initial document creation.",
    )
    updated_at: datetime | None = Field(
        default=None,
        description="UTC timestamp for the most recent document update.",
    )

    @validator("id", pre=True)
    def stringify_object_id(cls, value):  # noqa: N805
        if isinstance(value, ObjectId):
            return str(value)
        return value

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class RelationshipDefinition(BaseModel):
    field: str
    target_collection: str
    target_field: str = "_id"
    cardinality: RelationshipCardinality
    required: bool
    description: str


class CollectionSchemaDefinition(BaseModel):
    collection: str
    model_name: str
    required_fields: list[str]
    relationships: list[RelationshipDefinition]


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    role: Role
    department: str | None = Field(default=None, max_length=120)


class RegisterRequest(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserPublic(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    user: UserPublic


class MeResponse(BaseModel):
    user: UserPublic


class UserDocument(MongoDocument):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    role: Role
    department: str | None = Field(default=None, max_length=120)
    password_hash: str = Field(..., min_length=20)
    is_active: bool = True
    last_login_at: datetime | None = None


class EventDocument(MongoDocument):
    title: str = Field(..., min_length=3, max_length=160)
    category: str = Field(..., min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=500)
    date: date
    department: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=160)
    created_by_user_id: str = Field(..., min_length=6)
    created_by_email: EmailStr
    status: Literal["draft", "published", "completed", "cancelled"] = "published"


class ParticipationDocument(MongoDocument):
    student_user_id: str = Field(..., min_length=6)
    student_email: EmailStr
    student_name: str = Field(..., min_length=2, max_length=120)
    department: str | None = Field(default=None, max_length=120)
    event_id: str = Field(..., min_length=6)
    event_title: str = Field(..., min_length=3, max_length=160)
    achievement: Achievement = "participation"
    points: int = Field(..., ge=0)
    status: ParticipationStatus = "submitted"
    notes: str | None = Field(default=None, max_length=500)
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    verified_by_user_id: str | None = Field(default=None, min_length=6)
    verified_at: datetime | None = None


class OCRExtraction(BaseModel):
    name: str | None = None
    event: str | None = None
    achievement: Achievement | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    raw_text: str | None = None


class CertificateDocument(MongoDocument):
    student_user_id: str | None = Field(default=None, min_length=6)
    student_email: EmailStr
    student_name: str | None = Field(default=None, min_length=2, max_length=120)
    department: str | None = Field(default=None, max_length=120)
    event_name: str = Field(..., min_length=3, max_length=160)
    achievement: Achievement
    participation_id: str | None = Field(default=None, min_length=6)
    event_id: str | None = Field(default=None, min_length=6)
    file_url: str = Field(..., min_length=10)
    public_id: str | None = None
    file_name: str | None = Field(default=None, max_length=255)
    content_type: str | None = Field(default=None, max_length=120)
    verified: bool = False
    verification_status: CertificateVerificationStatus = "pending"
    uploaded_by_email: EmailStr | None = None
    verified_by_user_id: str | None = Field(default=None, min_length=6)
    verified_by_email: EmailStr | None = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    verified_at: datetime | None = None
    ocr: OCRExtraction = Field(default_factory=OCRExtraction)


class ScoreDocument(MongoDocument):
    student_user_id: str = Field(..., min_length=6)
    student_email: EmailStr
    student_name: str = Field(..., min_length=2, max_length=120)
    department: str | None = Field(default=None, max_length=120)
    total_points: int = Field(default=0, ge=0)
    participations_count: int = Field(default=0, ge=0)
    wins_count: int = Field(default=0, ge=0)
    activity_level: ActivityLevel = "Inactive"
    last_participation_at: datetime | None = None


class PressNoteDocument(MongoDocument):
    student_user_id: str | None = Field(default=None, min_length=6)
    student_email: EmailStr | None = None
    student_name: str = Field(..., min_length=2, max_length=120)
    department: str | None = Field(default=None, max_length=120)
    event_name: str = Field(..., min_length=3, max_length=160)
    event_id: str | None = Field(default=None, min_length=6)
    participation_id: str | None = Field(default=None, min_length=6)
    certificate_id: str | None = Field(default=None, min_length=6)
    generated_by_user_id: str = Field(..., min_length=6)
    generated_by_email: EmailStr | None = None
    achievement: Achievement
    title: str = Field(..., min_length=6, max_length=200)
    body: str = Field(..., min_length=20)
    status: PressNoteStatus = "draft"
    published_at: datetime | None = None


COLLECTION_MODELS = {
    "users": UserDocument,
    "events": EventDocument,
    "participations": ParticipationDocument,
    "certificates": CertificateDocument,
    "scores": ScoreDocument,
    "press_notes": PressNoteDocument,
}


COLLECTION_SCHEMAS = {
    "users": CollectionSchemaDefinition(
        collection="users",
        model_name="UserDocument",
        required_fields=[
            "name",
            "email",
            "role",
            "password_hash",
            "is_active",
            "created_at",
        ],
        relationships=[
            RelationshipDefinition(
                field="_id",
                target_collection="events",
                target_field="created_by_user_id",
                cardinality="one-to-many",
                required=False,
                description="A user can create many events.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="participations",
                target_field="student_user_id",
                cardinality="one-to-many",
                required=False,
                description="A student user can have many participation records.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="certificates",
                target_field="student_user_id",
                cardinality="one-to-many",
                required=False,
                description="A user can upload many certificates.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="scores",
                target_field="student_user_id",
                cardinality="one-to-one",
                required=False,
                description="Each student has at most one score aggregate document.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="press_notes",
                target_field="student_user_id",
                cardinality="one-to-many",
                required=False,
                description="A student can appear in many generated press notes.",
            ),
        ],
    ),
    "events": CollectionSchemaDefinition(
        collection="events",
        model_name="EventDocument",
        required_fields=[
            "title",
            "category",
            "date",
            "created_by_user_id",
            "created_by_email",
            "status",
            "created_at",
        ],
        relationships=[
            RelationshipDefinition(
                field="created_by_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="many-to-one",
                required=True,
                description="Each event is created by one platform user.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="participations",
                target_field="event_id",
                cardinality="one-to-many",
                required=False,
                description="An event can have many participation records.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="press_notes",
                target_field="event_id",
                cardinality="one-to-many",
                required=False,
                description="An event can be referenced in many press notes.",
            ),
        ],
    ),
    "participations": CollectionSchemaDefinition(
        collection="participations",
        model_name="ParticipationDocument",
        required_fields=[
            "student_user_id",
            "student_email",
            "student_name",
            "event_id",
            "event_title",
            "achievement",
            "points",
            "status",
            "submitted_at",
            "created_at",
        ],
        relationships=[
            RelationshipDefinition(
                field="student_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="many-to-one",
                required=True,
                description="Each participation belongs to one student user.",
            ),
            RelationshipDefinition(
                field="event_id",
                target_collection="events",
                target_field="_id",
                cardinality="many-to-one",
                required=True,
                description="Each participation belongs to one event.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="certificates",
                target_field="participation_id",
                cardinality="one-to-many",
                required=False,
                description="A participation can be supported by one or more certificates.",
            ),
            RelationshipDefinition(
                field="_id",
                target_collection="press_notes",
                target_field="participation_id",
                cardinality="one-to-many",
                required=False,
                description="A participation can inspire one or more press notes.",
            ),
        ],
    ),
    "certificates": CollectionSchemaDefinition(
        collection="certificates",
        model_name="CertificateDocument",
        required_fields=[
            "student_email",
            "event_name",
            "achievement",
            "file_url",
            "verified",
            "verification_status",
            "uploaded_at",
            "created_at",
        ],
        relationships=[
            RelationshipDefinition(
                field="student_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A certificate can optionally resolve to a registered student user.",
            ),
            RelationshipDefinition(
                field="participation_id",
                target_collection="participations",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A certificate can optionally be linked to a participation record.",
            ),
            RelationshipDefinition(
                field="event_id",
                target_collection="events",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A certificate can optionally reference its parent event.",
            ),
            RelationshipDefinition(
                field="verified_by_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="An admin, HOD, or super admin can verify the certificate.",
            ),
        ],
    ),
    "scores": CollectionSchemaDefinition(
        collection="scores",
        model_name="ScoreDocument",
        required_fields=[
            "student_user_id",
            "student_email",
            "student_name",
            "total_points",
            "participations_count",
            "wins_count",
            "activity_level",
            "updated_at",
        ],
        relationships=[
            RelationshipDefinition(
                field="student_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="one-to-one",
                required=True,
                description="Each score aggregate belongs to one student user.",
            ),
        ],
    ),
    "press_notes": CollectionSchemaDefinition(
        collection="press_notes",
        model_name="PressNoteDocument",
        required_fields=[
            "student_name",
            "event_name",
            "generated_by_user_id",
            "achievement",
            "title",
            "body",
            "status",
            "created_at",
        ],
        relationships=[
            RelationshipDefinition(
                field="student_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A press note can optionally resolve to a registered student.",
            ),
            RelationshipDefinition(
                field="generated_by_user_id",
                target_collection="users",
                target_field="_id",
                cardinality="many-to-one",
                required=True,
                description="Each press note is generated by an admin, HOD, or super admin.",
            ),
            RelationshipDefinition(
                field="event_id",
                target_collection="events",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A press note can reference one event.",
            ),
            RelationshipDefinition(
                field="participation_id",
                target_collection="participations",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A press note can reference the participation record that triggered it.",
            ),
            RelationshipDefinition(
                field="certificate_id",
                target_collection="certificates",
                target_field="_id",
                cardinality="many-to-one",
                required=False,
                description="A press note can cite the verifying certificate used as evidence.",
            ),
        ],
    ),
}
