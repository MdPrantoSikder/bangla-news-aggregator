"""
Backfill BCS analysis (relevance + subject + summaries + key_facts)
for all articles that don't have it yet.

Uses Groq's analyze_article() - one API call per article extracts everything.

Run with:
    python -m app.scripts.backfill_bcs

Expected: ~1 sec per article + ~800 tokens.
For 195 articles: ~3 min runtime + ~160K tokens (exceeds 100K free daily cap).
You may need to run twice across two days, OR upgrade Groq to Dev Tier ($0.10).

The script is safe to re-run - it skips articles already classified.
"""
import time
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.article import Article
from app.services.summarization import analyze_article


# Polite rate limit: 0.5s between calls = 2 req/sec, well under Groq's cap.
DELAY_BETWEEN_CALLS_SECONDS = 0.5


def run() -> None:
    db = SessionLocal()
    try:
        # Articles without BCS analysis yet
        stmt = (
            select(Article)
            .where(Article.bcs_relevance.is_(None))
            .order_by(Article.scraped_at.desc())
        )
        articles = db.scalars(stmt).all()
        total = len(articles)

        print("=" * 60)
        print("BCS Analysis Backfill (Groq)")
        print("=" * 60)
        print(f"Articles to analyze: {total}")
        if total == 0:
            print("Nothing to do. All articles already classified.")
            return
        print(f"Estimated time:      {total * 1.5:.0f} seconds")
        print(f"Estimated tokens:    {total * 800:,}")
        print()

        success = 0
        failed = 0
        skipped = 0
        # Track relevance distribution as we go
        relevance_count = {"high": 0, "medium": 0, "low": 0, "skip": 0}

        for i, article in enumerate(articles, start=1):
            short_headline = article.headline[:55]
            print(f"[{i:3d}/{total}] (s={article.source_id}) {short_headline}", end="")

            try:
                result = analyze_article(article.headline, article.body)

                article.bcs_relevance = result["bcs_relevance"]
                article.bcs_subject   = result["bcs_subject"]
                article.key_facts     = result["key_facts"]

                # Only update summaries if Groq returned them and existing are empty
                if result["summary_en"] and not article.summary_en:
                    article.summary_en = result["summary_en"]
                if result["summary_bn"] and not article.summary_bn:
                    article.summary_bn = result["summary_bn"]

                db.commit()

                rel = result["bcs_relevance"]
                relevance_count[rel] = relevance_count.get(rel, 0) + 1

                # Display tag
                tag = {
                    "high":   "[HIGH  ]",
                    "medium": "[MEDIUM]",
                    "low":    "[LOW   ]",
                    "skip":   "[SKIP  ]",
                }.get(rel, "[??????]")
                print(f"  {tag}  {result['bcs_subject']}")
                success += 1

            except Exception as e:
                err_type = type(e).__name__
                # Detect rate-limit errors so we can stop gracefully
                if "RateLimit" in err_type or "rate_limit" in str(e).lower():
                    print(f"  FAIL: rate limit hit")
                    print()
                    print("=" * 60)
                    print("Groq daily quota reached. Stopping safely.")
                    print(f"Successfully processed: {success}")
                    print(f"Remaining articles:     {total - i}")
                    print("Re-run tomorrow to continue from where we stopped.")
                    print("=" * 60)
                    db.rollback()
                    return
                print(f"  FAIL: {err_type}")
                db.rollback()
                failed += 1

            if i < total:
                time.sleep(DELAY_BETWEEN_CALLS_SECONDS)

        print()
        print("=" * 60)
        print("Backfill complete")
        print("=" * 60)
        print(f"  Succeeded: {success}")
        print(f"  Failed:    {failed}")
        print(f"  Total:     {total}")
        print()
        print("Relevance distribution:")
        for rel, cnt in relevance_count.items():
            print(f"  {rel:8s}: {cnt}")

    finally:
        db.close()


if __name__ == "__main__":
    run()
