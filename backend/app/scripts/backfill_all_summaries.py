"""
Backfill summaries for ALL articles using Groq (Llama 3.3 70B).

Strategy: with Groq's generous free tier (14,400 req/day), we summarize
every article that doesn't already have a summary. No cluster filter.

Run with:
    python -m app.scripts.backfill_all_summaries

Expected runtime: ~180 articles x ~1.5 sec = ~5 minutes.
"""
import time
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.article import Article
from app.services.summarization import summarize_text


# Groq free tier: ~30 req/sec hard cap. 0.2s delay = 5 req/sec, very safe.
DELAY_BETWEEN_CALLS_SECONDS = 0.2


def run() -> None:
    db = SessionLocal()
    try:
        # Find all articles without an English summary.
        stmt = (
            select(Article)
            .where(Article.summary_en.is_(None))
            .order_by(Article.scraped_at.desc())
        )
        articles = db.scalars(stmt).all()
        total = len(articles)

        print("=" * 60)
        print("Groq Summarization Backfill")
        print("=" * 60)
        print(f"Articles to summarize: {total}")
        if total == 0:
            print("Nothing to do. All articles already have summaries.")
            return
        print(f"Estimated time:        {total * 1.5:.0f} seconds")
        print()

        success_count = 0
        fail_count = 0

        for i, article in enumerate(articles, start=1):
            short_headline = article.headline[:60]
            print(f"[{i:3d}/{total}] (s={article.source_id}) {short_headline}", end="")

            try:
                summary_en, summary_bn = summarize_text(article.headline, article.body)
                article.summary_en = summary_en
                article.summary_bn = summary_bn
                db.commit()
                print("  OK")
                success_count += 1
            except Exception as e:
                print(f"  FAIL: {type(e).__name__}")
                db.rollback()
                fail_count += 1

            if i < total:
                time.sleep(DELAY_BETWEEN_CALLS_SECONDS)

        print()
        print("=" * 60)
        print("Backfill complete")
        print("=" * 60)
        print(f"  Succeeded: {success_count}")
        print(f"  Failed:    {fail_count}")
        print(f"  Total:     {total}")

    finally:
        db.close()


if __name__ == "__main__":
    run()
