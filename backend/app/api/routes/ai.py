from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.ai import (
    CertificateAIResponse,
    PredictionRequest,
    PredictionResponse,
    PressNoteRequest,
    PressNoteResponse,
)
from backend.app.services.ai_service import AIService

router = APIRouter(tags=["AI"])


@router.post("/verify-certificate-ai", response_model=CertificateAIResponse)
async def verify_certificate_ai(
    file: UploadFile = File(...),
    certificate_id: str | None = Form(default=None),
    current_user: dict = Depends(get_current_user),
) -> CertificateAIResponse:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    result = AIService.extract_certificate(
        filename=file.filename or "certificate",
        file_bytes=file_bytes,
        current_user=current_user,
        certificate_id=certificate_id,
    )
    return CertificateAIResponse(**result)


@router.post("/generate-press-note", response_model=PressNoteResponse)
@router.post("/press-note", response_model=PressNoteResponse)
def generate_press_note(
    payload: PressNoteRequest,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> PressNoteResponse:
    return PressNoteResponse(**AIService.generate_press_note(payload, current_user))


@router.get("/predict/{student_email}", response_model=PredictionResponse)
def predict_student(
    student_email: str,
    current_user: dict = Depends(get_current_user),
) -> PredictionResponse:
    return PredictionResponse(**AIService.predict_student(student_email, current_user))


@router.post("/predict-achievement", response_model=PredictionResponse)
def predict_achievement(
    payload: PredictionRequest,
    current_user: dict = Depends(get_current_user),
) -> PredictionResponse:
    return PredictionResponse(**AIService.predict_achievement(payload))
