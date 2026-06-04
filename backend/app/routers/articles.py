from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, case
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleRead
from app.services import article_service


router = APIRouter(prefix="/articles", tags=["articles"])


BCS_RELEVANCE_ORDER = {"high": 1, "medium": 2, "low": 3, "skip": 4}


@router.get("/", response_model=list[ArticleRead])
def list_articles(
    source_id: int | None = Query(None),
    language: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List articles. Optional filters: source_id, language, category."""
    return article_service.list_articles(
        db,
        source_id=source_id,
        language=language,
        category=category,
        limit=limit,
        offset=offset,
    )


@router.get("/stats/categories")
def category_stats(db: Session = Depends(get_db)):
    """Real article counts per category."""
    stmt = (
        select(Article.category, func.count())
        .where(Article.category.is_not(None))
        .group_by(Article.category)
    )
    return {cat: count for cat, count in db.execute(stmt)}


@router.get("/bcs-feed", response_model=list[ArticleRead])
def bcs_feed(
    subject: str | None = Query(None, description="Filter by BCS subject slug"),
    relevance: str | None = Query(None, description="Filter by relevance level"),
    max_age_days: int = Query(2, ge=1, le=30, description="Hide articles older than N days"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    BCS-curated feed.

    Returns articles classified as BCS-relevant (high or medium by default),
    from the last `max_age_days` days, ordered by relevance then recency.
    """
    cutoff = datetime.utcnow() - timedelta(days=max_age_days)

    stmt = select(Article).where(Article.scraped_at >= cutoff)

    if relevance:
        stmt = stmt.where(Article.bcs_relevance == relevance)
    else:
        stmt = stmt.where(Article.bcs_relevance.in_(["high", "medium"]))

    if subject:
        stmt = stmt.where(Article.bcs_subject == subject)

    relevance_priority = case(BCS_RELEVANCE_ORDER, value=Article.bcs_relevance, else_=999)
    stmt = (
        stmt
        .order_by(relevance_priority.asc(), Article.scraped_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(db.scalars(stmt).all())


@router.get("/bcs-feed/stats")
def bcs_feed_stats(
    max_age_days: int = Query(2, ge=1, le=30),
    db: Session = Depends(get_db),
):
    """BCS classification stats for articles in last N days."""
    cutoff = datetime.utcnow() - timedelta(days=max_age_days)

    relevance_stmt = (
        select(Article.bcs_relevance, func.count())
        .where(Article.bcs_relevance.is_not(None))
        .where(Article.scraped_at >= cutoff)
        .group_by(Article.bcs_relevance)
    )
    subject_stmt = (
        select(Article.bcs_subject, func.count())
        .where(Article.bcs_subject.is_not(None))
        .where(Article.bcs_subject != "not_relevant")
        .where(Article.scraped_at >= cutoff)
        .group_by(Article.bcs_subject)
    )

    by_relevance = {rel: cnt for rel, cnt in db.execute(relevance_stmt)}
    by_subject   = {sub: cnt for sub, cnt in db.execute(subject_stmt)}

    return {
        "by_relevance":     by_relevance,
        "by_subject":       by_subject,
        "total_classified": sum(by_relevance.values()),
        "max_age_days":     max_age_days,
    }


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = article_service.get_article(db, article_id)
    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with id {article_id} not found",
        )
    return article


@router.post("/", response_model=ArticleRead, status_code=status.HTTP_201_CREATED)
def create_article(article_in: ArticleCreate, db: Session = Depends(get_db)):
    return article_service.create_article(db, article_in)
