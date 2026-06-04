"""
Search endpoint for the Bangla News Aggregator.

Single route: GET /search?q=...&type=hybrid&limit=20

Returns ranked article results.
"""
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.article import ArticleRead
from app.services.search import (
    keyword_search,
    semantic_search,
    hybrid_search,
)


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/", response_model=list[ArticleRead])
def search_articles(
    q: str = Query(..., min_length=1, description="Search query string"),
    type: Literal["keyword", "semantic", "hybrid"] = Query(
        "hybrid",
        description="Search algorithm to use",
    ),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
    db: Session = Depends(get_db),
) -> list[ArticleRead]:
    """
    Search articles.

    - **q**: query string (required)
    - **type**: 'keyword' (exact terms), 'semantic' (meaning-based),
      or 'hybrid' (best of both, default)
    - **limit**: 1-50 results (default 20)
    """
    if type == "keyword":
        articles = keyword_search(db, q, limit=limit)
    elif type == "semantic":
        # semantic_search returns (article, score) tuples; we only want articles.
        articles = [a for a, _score in semantic_search(db, q, limit=limit)]
    else:  # hybrid
        articles = [a for a, _score in hybrid_search(db, q, limit=limit)]

    return articles