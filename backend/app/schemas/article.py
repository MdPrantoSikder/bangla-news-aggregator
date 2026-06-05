from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ArticleCreate(BaseModel):
    source_id: int
    url: str
    headline: str
    body: str
    language: str
    published_at: datetime | None = None
    category: str | None = None
    image_url: str | None = None


class ArticleRead(BaseModel):
    id: int
    source_id: int
    url: str
    headline: str
    body: str
    language: str
    published_at: datetime | None
    scraped_at: datetime
    category: str | None = None
    image_url: str | None = None
    summary_en: str | None = None
    summary_bn: str | None = None

    # BCS analysis fields - populated by Groq.
    bcs_relevance: str | None = None
    bcs_subject:   str | None = None
    key_facts:     list[str] | None = None

    model_config = ConfigDict(from_attributes=True)


class ArticleReadShort(BaseModel):
    """Compact version of an article - used inside StoryRead."""
    id: int
    source_id: int
    url: str
    headline: str
    language: str
    category: str | None = None
    image_url: str | None = None
    summary_en: str | None = None
    summary_bn: str | None = None

    # BCS fields available in short version too (for BCS Feed cards).
    bcs_relevance: str | None = None
    bcs_subject:   str | None = None
    key_facts:     list[str] | None = None

    model_config = ConfigDict(from_attributes=True)


class StoryRead(BaseModel):
    """A story cluster with its grouped articles."""
    story_id: int
    created_at: datetime
    article_count: int
    articles: list[ArticleReadShort]

    model_config = ConfigDict(from_attributes=True)
