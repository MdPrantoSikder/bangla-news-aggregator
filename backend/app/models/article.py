"""
SQLAlchemy ORM model for the 'articles' table.
"""

from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, Computed
from sqlalchemy.dialects.postgresql import TSVECTOR, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    headline: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False)

    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    # 384-dim sentence embedding (Multilingual MiniLM-L12).
    embedding: Mapped[list[float] | None] = mapped_column(JSONB, nullable=True)

    # FK to story_clusters - groups articles covering same event across sources.
    story_cluster_id: Mapped[int | None] = mapped_column(
        ForeignKey("story_clusters.id"),
        nullable=True,
    )
    story_cluster: Mapped["StoryCluster | None"] = relationship(
        back_populates="articles"
    )

    # LLM-generated bilingual summaries (populated by Groq).
    summary_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_bn: Mapped[str | None] = mapped_column(Text, nullable=True)

    # URL-extracted news category (bangladesh, world, economy, etc.).
    category: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Hero image URL from og:image meta tag.
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ===== BCS analysis fields (populated by Groq analyze_article()) =====
    # Relevance for BCS exam preparation: high | medium | low | skip.
    bcs_relevance: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # BCS exam subject classification: bangladesh_affairs | international |
    # economy | science_tech | geography | history_culture | current_affairs |
    # not_relevant.
    bcs_subject: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 3-5 BCS-relevant facts extracted from the article (numbers, names, dates).
    key_facts: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    # PostgreSQL-managed full-text search vector.
    search_vector: Mapped[str | None] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('simple', coalesce(headline, '') || ' ' || coalesce(body, ''))",
            persisted=True,
        ),
        nullable=True,
    )

    source: Mapped["Source"] = relationship(back_populates="articles")
