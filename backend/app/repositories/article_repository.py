from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, case
from app.models.article import Article
from app.schemas.article import ArticleCreate


# Source priority for sorting (lower number = higher priority).
# Daily Star (1) first, Prothom Alo (2) second, TBS (6) third.
# Used as a tiebreaker so that when two articles have the same scraped_at,
# the more "trusted" source appears first.
SOURCE_PRIORITY = {
    1: 1,   # Daily Star
    2: 2,   # Prothom Alo
    6: 3,   # The Business Standard
}


def _source_priority_expr():
    """SQL CASE expression: maps source_id -> priority number for ORDER BY."""
    return case(SOURCE_PRIORITY, value=Article.source_id, else_=999)


def get_all_articles(
    db: Session,
    source_id: int | None = None,
    language: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Article]:
    """
    Return articles, newest first with source priority as tiebreaker.

    Ordering:
      1. scraped_at DESC  (newest first)
      2. source_priority ASC  (DS > PA > TBS within same time)
    """
    stmt = select(Article)
    if source_id is not None:
        stmt = stmt.where(Article.source_id == source_id)
    if language is not None:
        stmt = stmt.where(Article.language == language)
    if category is not None:
        stmt = stmt.where(Article.category == category)

    stmt = stmt.order_by(
        Article.scraped_at.desc(),
        _source_priority_expr().asc(),
    ).limit(limit).offset(offset)

    return list(db.scalars(stmt).all())


def get_article_by_id(db: Session, article_id: int) -> Article | None:
    """Return one article by id, or None if not found."""
    return db.get(Article, article_id)


def _new_article_from_schema(article_in: ArticleCreate) -> Article:
    """
    Build an Article ORM object from an ArticleCreate schema.
    We set scraped_at explicitly here because the schema doesn't include it.
    """
    data = article_in.model_dump()
    return Article(**data, scraped_at=datetime.utcnow())


def create_article(db: Session, article_in: ArticleCreate) -> Article:
    """Insert a new article and return the saved row."""
    new_article = _new_article_from_schema(article_in)
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article


def upsert_article(db: Session, article_in: ArticleCreate) -> tuple[Article, bool]:
    """Insert if URL doesn't exist; return (article, created)."""
    existing = db.scalar(
        select(Article).where(Article.url == article_in.url)
    )
    if existing is not None:
        return existing, False

    new_article = _new_article_from_schema(article_in)
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article, True
