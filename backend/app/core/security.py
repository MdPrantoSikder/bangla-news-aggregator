"""
Security utilities for auth.

Provides three things:
  - hash_password()    : bcrypt-hash a plain password
  - verify_password()  : check a plain password against a stored hash
  - create_access_token(): create a signed JWT for a logged-in user
  - decode_access_token(): verify and decode a JWT
"""
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings


# bcrypt is the industry standard for password hashing.
# Auto-deprecation lets us upgrade hash algorithms later without breaking
# existing user accounts.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Password hashing ──────────────────────────────────────────────
def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash for the given plain-text password."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Return True if the plain password matches the stored bcrypt hash."""
    try:
        return _pwd_context.verify(plain_password, password_hash)
    except Exception:
        # If the stored hash is malformed, treat it as a failed login.
        return False


# ─── JWT tokens ────────────────────────────────────────────────────
def create_access_token(
    user_id: int,
    email:    str,
    is_admin: bool = False,
    expires_minutes: int | None = None,
) -> str:
    """
    Create a signed JWT containing user_id, email, is_admin, and expiry.
    """
    minutes = expires_minutes or settings.JWT_EXPIRE_MINUTES
    now     = datetime.now(timezone.utc)
    expire  = now + timedelta(minutes=minutes)

    payload = {
        "sub":      str(user_id),     # JWT "subject" - convention for user id
        "email":    email,
        "is_admin": is_admin,
        "exp":      expire,
        "iat":      now,
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    """
    Verify a JWT and return its payload dict, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None
