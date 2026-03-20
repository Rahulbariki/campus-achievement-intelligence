from fastapi import APIRouter, Depends, Query

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.leaderboard import ActivityStatusEntry, LeaderboardEntry
from backend.app.services.leaderboard_service import LeaderboardService

router = APIRouter(tags=["Analytics"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
) -> list[LeaderboardEntry]:
    entries = LeaderboardService.build_leaderboard(limit=limit, current_user=current_user)
    return [LeaderboardEntry(**entry) for entry in entries]


@router.get("/activity-status", response_model=list[ActivityStatusEntry])
def get_activity_status(
    current_user: dict = Depends(require_roles("faculty", "admin", "hod", "super_admin")),
) -> list[ActivityStatusEntry]:
    entries = LeaderboardService.build_activity_status(current_user)
    return [ActivityStatusEntry(**entry) for entry in entries]
