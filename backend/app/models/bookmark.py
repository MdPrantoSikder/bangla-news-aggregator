"""
SQLAlchemy ORM model for the 'bookmarks' table.

A Bookmark links a User to an Article they want to save. Each (user, article)
pair is unique - you can't bookmark the same article twice.
"""
from datetime import datetime

from sqlalchemy import ForeignKey, Text, Integer, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_bookmark_user_article"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Optional user note attached to the bookmark.
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Optional folder ID. Folder system itself is client-side localStorage for V1.
    folder_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="bookmarks")
