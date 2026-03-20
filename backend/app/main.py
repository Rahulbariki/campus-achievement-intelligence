from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.router import api_router
from backend.app.core.config import settings
from backend.app.core.database import mongo_manager
from backend.app.routes.auth import router as auth_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Starter API for the Campus Achievement Intelligence Platform. "
        "Includes JWT auth, MongoDB persistence, Cloudinary uploads, and AI hooks."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins) or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.on_event("startup")
def on_startup() -> None:
    try:
        mongo_manager.ensure_indexes()
    except Exception as exc:  # pragma: no cover - deployment resilience guard
        print(f"Mongo index initialization skipped: {exc}")


@app.get("/", tags=["System"])
def read_root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "message": "CAIP backend is online.",
    }


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "database": settings.mongodb_db_name}
