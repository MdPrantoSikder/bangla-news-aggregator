"""
Authentication endpoints for BanglaBrief.

POST /auth/signup  → create a new account, return JWT
POST /auth/login   → verify credentials, return JWT
GET  /auth/me      → return the currently logged-in user (requires JWT)
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.models.user import User
from app.schemas.auth import UserSignup, UserLogin, UserRead, Token


router = APIRouter(prefix="/auth", tags=["auth"])


# OAuth2PasswordBearer is a FastAPI dependency that reads the
# "Authorization: Bearer <token>" header. tokenUrl is just for OpenAPI docs.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ─── Dependency: get current user from JWT ──────────────────────────
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Decode the JWT, look up the user, return them. Raise 401 if invalid."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exc

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exc

    user = db.get(User, int(user_id_str))
    if user is None or not user.is_active:
        raise credentials_exc

    return user


def get_current_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Dependency that requires the current user to be an admin."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


# ─── POST /auth/signup ──────────────────────────────────────────────
@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Annotated[Session, Depends(get_db)]):
    """Create a new user account and return a JWT for immediate login."""
    # Email uniqueness check
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create the user
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        last_login_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        is_admin=user.is_admin,
    )
    return Token(access_token=token, user=user)


# ─── POST /auth/login ───────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Annotated[Session, Depends(get_db)]):
    """Verify email + password, return a JWT."""
    user = db.scalar(select(User).where(User.email == payload.email))

    # Use generic message - don't leak whether the email exists
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated",
        )

    # Stamp last_login_at
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        is_admin=user.is_admin,
    )
    return Token(access_token=token, user=user)


# ─── GET /auth/me ───────────────────────────────────────────────────
@router.get("/me", response_model=UserRead)
def me(user: Annotated[User, Depends(get_current_user)]):
    """Return the currently logged-in user. Used by frontend to verify session."""
    return user


from pydantic import BaseModel, Field


class PasswordChange(BaseModel):
    current_password: str
    new_password:     str = Field(min_length=6, max_length=72)


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Change the logged-in user's password."""
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"status": "password_changed", "email": user.email}