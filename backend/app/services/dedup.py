"""
Story deduplication service.

Given a new article (with embedding already computed), find the most similar
existing article. If similarity is above threshold, attach the new article to
that existing article's story_cluster. Otherwise, create a new cluster.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.story_cluster import StoryCluster
from app.services.embeddings import cosine_similarity


# Tuned for our actual data. Real cross-source matches typically score 0.65+.
# We can tighten this later as we get more cross-day overlap.
SIMILARITY_THRESHOLD = 0.92


def find_or_create_cluster_for(db: Session, new_article: Article) -> StoryCluster:
    """
    Decide whether new_article belongs to an existing cluster or starts a new one.
    Mutates new_article.story_cluster_id but does NOT commit.
    Returns the StoryCluster that the article was attached to.
    """
    if new_article.embedding is None:
        raise ValueError(f"Article {new_article.id} has no embedding")

    # Compare against ALL other articles that have an embedding.
    # For thousands of articles this is fine; for millions we would switch
    # to pgvector with an HNSW index for sub-100ms search.
    # Only consider articles in the SAME category. This prevents the
    # multilingual-MiniLM model from creating noisy cross-topic clusters
    # (e.g. Eid markets + Putin + measles all grouped by writing style).
    stmt = (
        select(Article)
        .where(Article.id != new_article.id)
        .where(Article.embedding.is_not(None))
        .where(Article.category == new_article.category)
    )
    candidates = db.scalars(stmt).all()

    best_article: Article | None = None
    best_sim = -1.0

    for candidate in candidates:
        sim = cosine_similarity(new_article.embedding, candidate.embedding)
        if sim > best_sim:
            best_sim = sim
            best_article = candidate

    if best_article is not None and best_sim >= SIMILARITY_THRESHOLD and best_article.story_cluster_id is not None:
        # Attach to existing cluster.
        cluster = db.get(StoryCluster, best_article.story_cluster_id)
        cluster.article_count += 1
        new_article.story_cluster_id = cluster.id
        return cluster

    # No match -> create a new cluster, with this article as the seed.
    # If best_article had no cluster yet, we attach it to this new cluster too.
    cluster = StoryCluster(article_count=1)
    db.add(cluster)
    db.flush()  # populate cluster.id

    new_article.story_cluster_id = cluster.id

    if best_article is not None and best_sim >= SIMILARITY_THRESHOLD and best_article.story_cluster_id is None:
        best_article.story_cluster_id = cluster.id
        cluster.article_count += 1

    return cluster
