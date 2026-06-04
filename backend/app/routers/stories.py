"""
Stories endpoint - return article clusters (grouped news events).

GET /stories         - list stories (multi-source recent first, paginated)
GET /stories/{id}    - get one story with its articles
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.article import Article
from app.models.story_cluster import StoryCluster
from app.schemas.article import StoryRead, ArticleReadShort


router = APIRouter(prefix="/stories", tags=["stories"])


# Top Stories on the homepage should only feature recent events.
# Clusters whose newest article is older than this drop off the list.
RECENT_HOURS = 24


def _build_story_read(cluster: StoryCluster, articles: list[Article]) -> StoryRead:
    return StoryRead(
        story_id=cluster.id,
        created_at=cluster.created_at,
        article_count=cluster.article_count,
        articles=[ArticleReadShort.model_validate(a) for a in articles],
    )


@router.get("/", response_model=list[StoryRead])
def list_stories(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    multi_only: bool = Query(False, description="Only stories covered by 2+ distinct sources"),
    language: str | None = Query(None, description="Filter by article language (en, bn)"),
    recent_only: bool = Query(True, description="Only show clusters with articles from last 24h"),
    db: Session = Depends(get_db),
):
    """List story clusters - newest first, optionally filtered."""
    # Precompute: latest scraped_at per cluster, for sorting and filtering.
    latest_article = (
        select(func.max(Article.scraped_at))
        .where(Article.story_cluster_id == StoryCluster.id)
        .correlate(StoryCluster)
        .scalar_subquery()
    )

    stmt = select(StoryCluster)

    if multi_only:
        distinct_source_count = (
            select(func.count(func.distinct(Article.source_id)))
            .where(Article.story_cluster_id == StoryCluster.id)
            .scalar_subquery()
        )
        stmt = stmt.where(distinct_source_count >= 2)

    if language is not None:
        stmt = stmt.where(
            StoryCluster.id.in_(
                select(Article.story_cluster_id).where(Article.language == language)
            )
        )

    if recent_only:
        cutoff = datetime.utcnow() - timedelta(hours=RECENT_HOURS)
        stmt = stmt.where(latest_article >= cutoff)

    # Sort by the latest article's scraped_at DESC (most active recent first),
    # then by article_count DESC, then by cluster age.
    stmt = stmt.order_by(
        desc(latest_article),
        desc(StoryCluster.article_count),
        desc(StoryCluster.created_at),
    ).offset(offset).limit(limit)

    clusters = list(db.scalars(stmt).all())
    results = []
    for cluster in clusters:
        article_stmt = (
            select(Article)
            .where(Article.story_cluster_id == cluster.id)
            .order_by(Article.scraped_at.desc())
        )
        articles = list(db.scalars(article_stmt).all())
        results.append(_build_story_read(cluster, articles))
    return results


@router.get("/{story_id}", response_model=StoryRead)
def get_story(story_id: int, db: Session = Depends(get_db)):
    """Get one story cluster with all its articles."""
    cluster = db.get(StoryCluster, story_id)
    if cluster is None:
        raise HTTPException(status_code=404, detail="Story not found")
    article_stmt = (
        select(Article)
        .where(Article.story_cluster_id == story_id)
        .order_by(Article.scraped_at.desc())
    )
    articles = list(db.scalars(article_stmt).all())
    return _build_story_read(cluster, articles)
