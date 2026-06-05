"""
Pydantic schemas for authentication endpoints.

Three kinds of schemas:
  - *Create: incoming data when user signs up or logs in
  - *Read:   outgoing data, NEVER includes password_hash
  - Token*:  JWT token responses
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


# ─── Signup / Login inputs ──────────────────────────────────────────
class UserSignup(BaseModel):
    """Payload for POST /auth/signup."""
    email:    EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str | None = Field(default=None, max_length=100)


class UserLogin(BaseModel):
    """Payload for POST /auth/login."""
    email:    EmailStr
    password: str


# ─── User responses ─────────────────────────────────────────────────
class UserRead(BaseModel):
    """Public user data. Never contains password_hash."""
    id:         int
    email:      EmailStr
    full_name:  str | None = None
    is_active:  bool
    is_admin:   bool
    created_at: datetime
    last_login_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ─── JWT token responses ────────────────────────────────────────────
class Token(BaseModel):
    """JWT bearer token returned from signup and login."""
    access_token: str
    token_type:   str = "bearer"
    user:         UserRead


class TokenData(BaseModel):
    """Internal: decoded JWT payload."""
    user_id: int
    email:   str
    is_admin: bool
