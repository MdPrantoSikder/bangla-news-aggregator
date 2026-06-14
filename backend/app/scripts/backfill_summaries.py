"""
Backfill summaries for articles in multi-article clusters.

Strategy: only summarize articles that are part of a cluster with 2+ articles.
These represent the actual news events covered across sources — the most
valuable to have summaries for.

Run with:
    python -m app.scripts.backfill_summaries

Cost-conscious: includes a small delay between calls to respect the
free tier rate limit (15 requests per minute).
"""
import time

from sqlalchemy import select, func

from app.core.database import SessionLocal
from app.models.article import Article
from app.services.summarization import summarize_text


# Be polite to the API: 15 RPM free tier = 4 seconds between calls.
# We use 5 to be safe.
DELAY_BETWEEN_CALLS_SECONDS = 5.0


def run() -> None:
    db = SessionLocal()
    try:
        # Step 1: find cluster IDs that have 2+ articles.
        multi_cluster_stmt = (
            select(Article.story_cluster_id)
            .where(Article.story_cluster_id.is_not(None))
            .group_by(Article.story_cluster_id)
            .having(func.count(Article.id) > 1)
        )
        multi_cluster_ids = [
            row for row in db.scalars(multi_cluster_stmt).all()
        ]
        print(f"Found {len(multi_cluster_ids)} multi-article clusters.")

        # Step 2: get articles in those clusters that don't have a summary yet.
        stmt = (
            select(Article)
            .where(Article.story_cluster_id.in_(multi_cluster_ids))
            .where(Article.summary_en.is_(None))
        )
        articles = db.scalars(stmt).all()
        total = len(articles)
        print(f"Found {total} articles to summarize.")

        if total == 0:
            print("Nothing to do. Exiting.")
            return

        # Step 3: summarize each.
        for i, article in enumerate(articles, start=1):
            print(f"\n[{i}/{total}] Article {article.id} (source={article.source_id}, lang={article.language})")
            print(f"  Headline: {article.headline[:80]}")

            try:
                summary_en, summary_bn = summarize_text(article.headline, article.body)
                article.summary_en = summary_en
                article.summary_bn = summary_bn
                db.commit()
                print(f"  OK: EN={len(summary_en)} chars, BN={len(summary_bn)} chars")
            except Exception as e:
                print(f"  FAILED: {e}")
                db.rollback()

            # Sleep between calls to respect rate limit.
            if i < total:
                time.sleep(DELAY_BETWEEN_CALLS_SECONDS)

        print(f"\nDone. Processed {total} articles.")

    finally:
        db.close()


if __name__ == "__main__":
    run()