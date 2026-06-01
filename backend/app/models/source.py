# Column types and helpers from SQLAlchemy
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Standard library for timestamps
from datetime import datetime
from typing import List

# Our Base class — every model inherits from this so SQLAlchemy
# knows it represents a database table.
from app.core.database import Base


# Each class that inherits from Base = one table.
# The table name is set explicitly with __tablename__.
class Source(Base):
    __tablename__ = "sources"

    # Primary key. autoincrement is default for integer PKs in PostgreSQL.
    id: Mapped[int] = mapped_column(primary_key=True)

    # name: required, max 100 chars, unique so we can't add the same source twice.
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # base_url: the homepage URL of this news source.
    base_url: Mapped[str] = mapped_column(String(255), nullable=False)

    # language: "bn" or "en". Short fixed-length string is fine.
    language: Mapped[str] = mapped_column(String(10), nullable=False)

    # created_at: auto-set to current time when row is inserted.
    # default=datetime.utcnow passes the function itself, not the value at
    # class-load time, so each new row gets the current time.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship to articles — NOT a database column. This is a Python-side
    # convenience: source.articles gives you a list of related Article objects.
    # "Article" is a string here because the Article class is defined elsewhere
    # and might not be imported yet when this file loads.
    articles: Mapped[List["Article"]] = relationship(back_populates="source")