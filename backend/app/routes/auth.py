from fastapi import APIRouter, Depends, status

from backend.app.auth import (
    authenticate_user,
    build_auth_response,
    create_user,
    get_current_user,
    to_public_user,
)
from backend.app.models import AuthResponse, LoginRequest, MeResponse, RegisterRequest

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> AuthResponse:
    user = create_user(payload)
    return build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = authenticate_user(payload.email, payload.password)
    return build_auth_response(user)


@router.get("/me", response_model=MeResponse)
def me(current_user: dict = Depends(get_current_user)) -> MeResponse:
    return MeResponse(user=to_public_user(current_user))
