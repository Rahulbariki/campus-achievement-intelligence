from fastapi import APIRouter, Depends

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.event import EventCreate, EventResponse
from backend.app.services.event_service import EventService

router = APIRouter(tags=["Events"])


@router.post("/create-event", response_model=EventResponse)
def create_event(
    payload: EventCreate,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> EventResponse:
    return EventResponse(**EventService.create_event(payload, current_user))


@router.get("/events", response_model=list[EventResponse])
def list_events(current_user: dict = Depends(get_current_user)) -> list[EventResponse]:
    return [EventResponse(**event) for event in EventService.list_events(current_user)]
