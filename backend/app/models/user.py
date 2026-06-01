"""
SQLAlchemy ORM model for the 'users' table.

A User is an authenticated person who can save bookmarks, create folders,
and (if is_admin=True) access the admin panel.

Passwords are NEVER stored in plain text - only bcrypt hashes.
"""
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Login identifier. Indexed + unique.
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # bcrypt hash - NEVER plain text. Verified via passlib's CryptContext.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Display name shown in profile and comments.
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Soft-delete flag. Admin can deactivate without losing the user's data.
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true",
    )

    # Grants access to /admin endpoints.
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationship to bookmarks (one-to-many).
    bookmarks: Mapped[list["Bookmark"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
