from fastapi import APIRouter, Depends

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.ai import (
    PredictionRequest,
    PredictionResponse,
    PressNoteRequest,
    PressNoteResponse,
)
from backend.app.services.ai_service import AIService

router = APIRouter(tags=["AI"])


@router.post("/press-note", response_model=PressNoteResponse)
def generate_press_note(
    payload: PressNoteRequest,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> PressNoteResponse:
    return PressNoteResponse(press_note=AIService.generate_press_note(payload))


@router.post("/predict-achievement", response_model=PredictionResponse)
def predict_achievement(
    payload: PredictionRequest,
    current_user: dict = Depends(get_current_user),
) -> PredictionResponse:
    return PredictionResponse(**AIService.predict_achievement(payload))
