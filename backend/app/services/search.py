"""
Search service for the Bangla News Aggregator.
"""

from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.models.article import Article
from app.services.embeddings import compute_embedding, cosine_similarity


def keyword_search(db: Session, query: str, limit: int = 20) -> list[Article]:
    if not query or not query.strip():
        return []

    tsquery = func.websearch_to_tsquery("simple", query)
    rank = func.ts_rank(Article.search_vector, tsquery)

    stmt = (
        select(Article)
        .where(Article.search_vector.op("@@")(tsquery))
        .order_by(desc(rank))
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def semantic_search(
    db: Session,
    query: str,
    limit: int = 20,
    min_similarity: float = 0.45,
) -> list[tuple[Article, float]]:
    if not query or not query.strip():
        return []

    query_embedding = compute_embedding(query)

    stmt = select(Article).where(Article.embedding.is_not(None))
    articles = db.scalars(stmt).all()

    scored = [
        (article, cosine_similarity(query_embedding, article.embedding))
        for article in articles
    ]
    scored = [(a, s) for a, s in scored if s >= min_similarity]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:limit]


def hybrid_search(
    db: Session,
    query: str,
    limit: int = 20,
    keyword_weight: float = 0.4,
    semantic_weight: float = 0.6,
    min_combined_score: float = 0.25,
) -> list[tuple[Article, float]]:
    if not query or not query.strip():
        return []

    keyword_hits = keyword_search(db, query, limit=limit * 2)
    semantic_hits = semantic_search(db, query, limit=limit * 2)

    keyword_scores: dict[int, float] = {}
    n = len(keyword_hits)
    for i, article in enumerate(keyword_hits):
        keyword_scores[article.id] = 1.0 - (i / max(n, 1))

    semantic_scores: dict[int, float] = {
        article.id: score for article, score in semantic_hits
    }

    # Only include articles that appear in BOTH lists, OR score high enough alone
    all_ids = set(keyword_scores) | set(semantic_scores)

    article_by_id: dict[int, Article] = {a.id: a for a in keyword_hits}
    for article, _score in semantic_hits:
        article_by_id.setdefault(article.id, article)

    combined = []
    for article_id in all_ids:
        kw = keyword_scores.get(article_id, 0.0)
        sm = semantic_scores.get(article_id, 0.0)

        # Penalize articles that only appear in one list
        in_both = (article_id in keyword_scores) and (article_id in semantic_scores)
        score = keyword_weight * kw + semantic_weight * sm
        if not in_both:
            score *= 0.6  # 40% penalty for single-source results

        if score >= min_combined_score:
            combined.append((article_by_id[article_id], score))

    combined.sort(key=lambda pair: pair[1], reverse=True)
    return combined[:limit]
