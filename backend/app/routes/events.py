from fastapi import APIRouter, Depends

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.common import MessageResponse
from backend.app.schemas.event import EventCreate, EventResponse, EventUpdate
from backend.app.services.event_service import EventService

router = APIRouter(tags=["Events"])


@router.post("/events", response_model=EventResponse)
@router.post("/create-event", response_model=EventResponse, include_in_schema=False)
def create_event(
    payload: EventCreate,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> EventResponse:
    return EventResponse(**EventService.create_event(payload, current_user))


@router.get("/events", response_model=list[EventResponse])
def get_all_events(current_user: dict = Depends(get_current_user)) -> list[EventResponse]:
    return [EventResponse(**event) for event in EventService.list_events()]


@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    payload: EventUpdate,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> EventResponse:
    return EventResponse(**EventService.update_event(event_id, payload, current_user))


@router.delete("/events/{event_id}", response_model=MessageResponse)
def delete_event(
    event_id: str,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> MessageResponse:
    deleted = EventService.delete_event(event_id)
    return MessageResponse(
        message=f"Event '{deleted.get('event_name', deleted.get('title', event_id))}' deleted successfully."
    )
