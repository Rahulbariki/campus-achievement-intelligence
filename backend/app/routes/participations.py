from fastapi import APIRouter, Depends, status

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.participation import ParticipationCreate, ParticipationResponse
from backend.app.services.participation_service import ParticipationService

router = APIRouter(tags=["Participations"])


@router.post(
    "/submit-participation",
    response_model=ParticipationResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_participation(
    payload: ParticipationCreate,
    current_user: dict = Depends(require_roles("student")),
) -> ParticipationResponse:
    participation = ParticipationService.submit_participation(payload, current_user)
    return ParticipationResponse(**participation)


@router.get("/participations", response_model=list[ParticipationResponse])
def list_participations(
    current_user: dict = Depends(get_current_user),
) -> list[ParticipationResponse]:
    participations = ParticipationService.list_participations(current_user)
    return [ParticipationResponse(**entry) for entry in participations]
