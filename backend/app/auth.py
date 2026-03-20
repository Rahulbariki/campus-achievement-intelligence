from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError

from backend.app.core.config import settings
from backend.app.core.database import mongo_manager
from backend.app.models import AuthResponse, RegisterRequest, Role, UserPublic

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_context.verify(password, hashed_password)


def create_access_token(user: dict) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": str(user["_id"]),
        "role": user["role"],
        "email": user["email"],
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired.",
        ) from exc


def normalize_email(email: str) -> str:
    return email.strip().lower()


def serialize_user(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "email": document["email"],
        "role": document["role"],
        "department": document.get("department"),
        "is_active": document.get("is_active", True),
        "created_at": document.get("created_at"),
    }


def create_user(payload: RegisterRequest) -> dict:
    document = {
        "name": payload.name.strip(),
        "email": normalize_email(payload.email),
        "role": payload.role,
        "department": payload.department.strip() if payload.department else None,
        "password_hash": hash_password(payload.password),
        "is_active": True,
        "created_at": datetime.utcnow(),
    }

    try:
        result = mongo_manager.users.insert_one(document)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that email already exists.",
        ) from exc

    created_user = mongo_manager.users.find_one({"_id": result.inserted_id})
    if created_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User was created but could not be loaded.",
        )
    return created_user


def authenticate_user(email: str, password: str) -> dict:
    user = mongo_manager.users.find_one({"email": normalize_email(email)})
    if user is None or not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )
    return user


def get_user_by_id(user_id: str) -> dict | None:
    if not ObjectId.is_valid(user_id):
        return None
    return mongo_manager.users.find_one({"_id": ObjectId(user_id)})


def to_public_user(user: dict) -> UserPublic:
    return UserPublic(**serialize_user(user))


def build_auth_response(user: dict) -> AuthResponse:
    public_user = to_public_user(user)
    return AuthResponse(
        access_token=create_access_token(user),
        role=public_user.role,
        user=public_user,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
        )

    payload = decode_access_token(credentials.credentials)
    user = get_user_by_id(payload.get("sub", ""))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User could not be resolved from the provided token.",
        )
    return user


def require_roles(*roles: Role) -> Callable[[dict], dict]:
    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of the following roles: {', '.join(roles)}.",
            )
        return current_user

    return dependency
