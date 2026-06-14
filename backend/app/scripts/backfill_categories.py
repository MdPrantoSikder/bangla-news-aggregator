"""
Backfill category for all articles by parsing their URL.

Run with:
    python -m app.scripts.backfill_categories

Safe to re-run: only updates articles where category is NULL.
"""
from sqlalchemy import select
from collections import Counter

from app.core.database import SessionLocal
from app.models.article import Article
from app.services.categories import extract_category


def run() -> None:
    db = SessionLocal()
    try:
        stmt = select(Article).where(Article.category.is_(None))
        articles = db.scalars(stmt).all()
        total = len(articles)
        print(f"Found {total} articles without category.")

        if total == 0:
            print("Nothing to do. Exiting.")
            return

        counter = Counter()
        for article in articles:
            cat = extract_category(article.url)
            article.category = cat
            counter[cat] += 1

        db.commit()
        print(f"Done. Updated {total} articles.")
        print("\nCategory breakdown:")
        for cat, n in counter.most_common():
            print(f"  {cat:14}  {n}")

    finally:
        db.close()


if __name__ == "__main__":
    run()