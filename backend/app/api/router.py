from fastapi import APIRouter

from backend.app.api.routes import ai, leaderboard
from backend.app.routes import auth, certificates, events, participations

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(participations.router)
api_router.include_router(certificates.router)
api_router.include_router(leaderboard.router)
api_router.include_router(ai.router)
