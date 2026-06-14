"""
Bootstrap news pipeline.

Run with:  python -m app.scripts.bootstrap_news

What it does:
1. Waits for internet connection (retries up to 5 minutes)
2. Scrapes Daily Star, Prothom Alo, and TBS (in order, skips failures)
3. Runs embedding + clustering on any new articles
4. Prints final summary

Designed to be safe to run repeatedly - existing articles are skipped
by the upsert logic in each scraper.
"""
import socket
import sys
import time
from datetime import datetime

from sqlalchemy import select, func

from app.core.database import SessionLocal
from app.models.article import Article


# How long to wait between internet retries
INTERNET_RETRY_SECONDS = 30
INTERNET_MAX_WAIT_MINUTES = 5


def check_internet(host="www.google.com", port=443, timeout=5) -> bool:
    """Quick DNS + TCP check. Returns True if we can reach the internet."""
    try:
        socket.setdefaulttimeout(timeout)
        socket.gethostbyname(host)  # DNS resolution
        return True
    except Exception:
        return False


def wait_for_internet() -> bool:
    """Block until internet is available, or give up after 5 minutes."""
    if check_internet():
        return True

    print("[bootstrap] Internet not available. Waiting...")
    max_attempts = (INTERNET_MAX_WAIT_MINUTES * 60) // INTERNET_RETRY_SECONDS

    for attempt in range(1, max_attempts + 1):
        time.sleep(INTERNET_RETRY_SECONDS)
        print(f"[bootstrap] Retry {attempt}/{max_attempts}...")
        if check_internet():
            print("[bootstrap] Internet is back!")
            return True

    print(f"[bootstrap] Gave up after {INTERNET_MAX_WAIT_MINUTES} minutes. Aborting.")
    return False


def run_scraper_safely(name: str, run_func) -> bool:
    """
    Run a scraper, log result, never crash the whole bootstrap.
    Returns True on success, False on failure.
    """
    print()
    print("=" * 60)
    print(f"[bootstrap] Scraping: {name}")
    print("=" * 60)
    try:
        run_func()
        return True
    except Exception as e:
        print(f"[bootstrap] {name} FAILED: {type(e).__name__}: {e}")
        print(f"[bootstrap] Continuing with next scraper...")
        return False


def run_embedding_clustering():
    """
    Run embedding + clustering on articles that don't have them yet.

    We import inside the function so the bootstrap doesn't crash with
    import errors if HuggingFace cache isn't set up.
    """
    print()
    print("=" * 60)
    print("[bootstrap] Embedding + clustering new articles")
    print("=" * 60)
    try:
        from app.services.embeddings import compute_embedding
        from app.services.dedup import find_or_create_cluster_for

        db = SessionLocal()
        embedded = 0
        try:
            stmt = select(Article).where(Article.embedding.is_(None))
            articles = list(db.scalars(stmt).all())
            print(f"[bootstrap] Found {len(articles)} articles to embed.")

            for i, article in enumerate(articles, start=1):
                text = f"{article.headline}\n\n{(article.body or '')[:500]}"
                article.embedding = compute_embedding(text)
                db.flush()
                find_or_create_cluster_for(db, article)
                embedded += 1
                if i % 10 == 0:
                    print(f"[bootstrap]   Embedded {i}/{len(articles)}...")
                    db.commit()

            db.commit()
            print(f"[bootstrap] Embedded + clustered: {embedded} articles")
        finally:
            db.close()
    except Exception as e:
        print(f"[bootstrap] Embedding/clustering FAILED: {type(e).__name__}: {e}")


def count_articles() -> dict:
    """Return current article counts: total + per-source."""
    db = SessionLocal()
    try:
        total = db.scalar(select(func.count()).select_from(Article))
        per_source = {}
        for sid in [1, 2, 6]:
            per_source[sid] = db.scalar(
                select(func.count()).select_from(Article).where(Article.source_id == sid)
            )
        return {"total": total, "by_source": per_source}
    finally:
        db.close()


def main():
    started_at = datetime.now()
    print()
    print("=" * 60)
    print(f"[bootstrap] News Bootstrap Started at {started_at:%Y-%m-%d %H:%M:%S}")
    print("=" * 60)

    # 1. Check internet
    if not wait_for_internet():
        sys.exit(1)

    # 2. Snapshot current state
    before = count_articles()
    print(f"\n[bootstrap] Before: {before['total']} total articles")
    print(f"  Daily Star:   {before['by_source'][1]}")
    print(f"  Prothom Alo:  {before['by_source'][2]}")
    print(f"  TBS:          {before['by_source'][6]}")

    # 3. Run all 3 scrapers (skip failures, continue)
    from app.scrapers.run_daily_star import run as run_ds
    from app.scrapers.run_prothom_alo import run as run_pa
    from app.scrapers.run_tbs import run as run_tbs

    results = {
        "Daily Star": run_scraper_safely("Daily Star", run_ds),
        "Prothom Alo": run_scraper_safely("Prothom Alo", run_pa),
        "The Business Standard": run_scraper_safely("TBS", run_tbs),
    }

    # 4. Embed + cluster new articles
    run_embedding_clustering()

    # 5. Final summary
    after = count_articles()
    elapsed = (datetime.now() - started_at).total_seconds()
    new_total = after["total"] - before["total"]

    print()
    print("=" * 60)
    print("[bootstrap] BOOTSTRAP COMPLETE")
    print("=" * 60)
    print(f"  Elapsed:        {elapsed:.0f} seconds")
    print(f"  New articles:   {new_total}")
    print(f"  Total now:      {after['total']}")
    print()
    print(f"  Daily Star:   {before['by_source'][1]:4d} -> {after['by_source'][1]:4d}  (+{after['by_source'][1] - before['by_source'][1]})")
    print(f"  Prothom Alo:  {before['by_source'][2]:4d} -> {after['by_source'][2]:4d}  (+{after['by_source'][2] - before['by_source'][2]})")
    print(f"  TBS:          {before['by_source'][6]:4d} -> {after['by_source'][6]:4d}  (+{after['by_source'][6] - before['by_source'][6]})")
    print()
    print("  Scraper status:")
    for name, ok in results.items():
        status = "OK" if ok else "FAILED"
        print(f"    {name:25s} {status}")
    print("=" * 60)


if __name__ == "__main__":
    main()
