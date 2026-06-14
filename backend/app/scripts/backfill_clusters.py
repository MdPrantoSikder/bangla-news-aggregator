"""
One-time clustering for all articles. Run AFTER backfill_embeddings.

Iterates through every article. For each, runs the dedup logic to
attach it to an existing cluster or create a new one.
"""
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.article import Article
from app.services.dedup import find_or_create_cluster_for


def run() -> None:
    db = SessionLocal()
    try:
        stmt = select(Article).where(Article.story_cluster_id.is_(None)).order_by(Article.id)
        articles = db.scalars(stmt).all()
        total = len(articles)
        print(f"Found {total} articles without a cluster.")

        for i, article in enumerate(articles, start=1):
            find_or_create_cluster_for(db, article)
            if i % 20 == 0:
                db.commit()
                print(f"  [{i}/{total}] committed batch.")

        db.commit()
        print(f"Done. Clustered {total} articles.")

    finally:
        db.close()


if __name__ == "__main__":
    run()
