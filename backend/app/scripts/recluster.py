"""
One-shot: nuke all clusters and rebuild from scratch using current threshold.
Run this after changing SIMILARITY_THRESHOLD in dedup.py.

Usage: python -m app.scripts.recluster
"""
from sqlalchemy import update

from app.core.database import SessionLocal
from app.models.article import Article
from app.models.story_cluster import StoryCluster
from app.services.dedup import find_or_create_cluster_for


def recluster_all() -> None:
    db = SessionLocal()
    try:
        # 1. Detach all articles from clusters
        db.execute(update(Article).values(story_cluster_id=None))
        db.flush()

        # 2. Delete all existing clusters
        deleted = db.query(StoryCluster).delete()
        db.commit()
        print(f"Deleted {deleted} old clusters.")

        # 3. Rebuild from scratch, oldest article first
        articles = db.query(Article).filter(
            Article.embedding.is_not(None)
        ).order_by(Article.scraped_at.asc()).all()

        print(f"Reclustering {len(articles)} articles...")
        for i, article in enumerate(articles, start=1):
            find_or_create_cluster_for(db, article)
            if i % 50 == 0:
                db.commit()
                print(f"  {i}/{len(articles)} done")
        db.commit()

        # 4. Report
        total_clusters = db.query(StoryCluster).count()
        multi_article = sum(
            1 for c in db.query(StoryCluster).all() if c.article_count >= 2
        )
        print(f"\nDone. {total_clusters} clusters total, {multi_article} with 2+ articles.")
    finally:
        db.close()


if __name__ == "__main__":
    recluster_all()
