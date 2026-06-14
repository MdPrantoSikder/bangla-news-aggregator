"""
One-time script to compute embeddings for all articles that don't have one yet.

Run with:
    python -m app.scripts.backfill_embeddings

Safe to run multiple times: skips articles that already have an embedding.
"""

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.article import Article
from app.services.embeddings import compute_embedding


def build_text_for_embedding(article: Article) -> str:
    """Concatenate headline + first 500 chars of body for embedding input."""
    body_snippet = article.body[:500] if article.body else ""
    return f"{article.headline}\n\n{body_snippet}"


def run() -> None:
    db = SessionLocal()
    try:
        # Find all articles without an embedding.
        stmt = select(Article).where(Article.embedding.is_(None))
        articles = db.scalars(stmt).all()

        total = len(articles)
        print(f"Found {total} articles without embeddings.")

        if total == 0:
            print("Nothing to do. Exiting.")
            return

        for i, article in enumerate(articles, start=1):
            text = build_text_for_embedding(article)
            embedding = compute_embedding(text)
            article.embedding = embedding

            # Commit every 10 articles so a crash doesnt lose all work.
            if i % 10 == 0:
                db.commit()
                print(f"  [{i}/{total}] committed batch.")

        # Final commit for any remaining articles.
        db.commit()
        print(f"Done. {total} articles now have embeddings.")

    finally:
        db.close()


if __name__ == "__main__":
    run()
