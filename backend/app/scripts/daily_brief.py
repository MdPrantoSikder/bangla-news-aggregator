"""
Daily morning brief - the heart of the auto-fetcher.

Phases:
  1. Internet check
  2. Scrape 4 sources in parallel (with retry, 80% healthy ratio)
  3. Embeddings + clustering
  4. Groq quota probe
  5. BCS analysis (priority order, stops on quota)
  6. Cleanup - delete articles >30 days old (skips bookmarked)
"""
import logging
import socket
import sys
import time
import concurrent.futures
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import select, func

from app.core.database import SessionLocal
from app.models import Article, Bookmark
from app.scrapers.run_daily_star     import run as run_daily_star_scraper
from app.scrapers.run_prothom_alo    import run as run_prothom_alo_scraper
from app.scrapers.run_tbs            import run as run_tbs_scraper
from app.scrapers.run_prothom_alo_en import run as run_prothom_alo_en_scraper
from app.services.embeddings         import compute_embedding
from app.services.dedup              import find_or_create_cluster_for
from app.services.summarization      import analyze_article


# --- Logging setup --------------------------------------------------
LOG_FILE = Path(__file__).resolve().parent.parent.parent / "daily_brief.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("daily_brief")


# --- Config ---------------------------------------------------------
SCRAPER_HEALTHY_RATIO = 0.8
SCRAPER_RETRY_COUNT   = 3
SCRAPER_RETRY_DELAY   = 30
GROQ_CALL_DELAY       = 2.0
GROQ_TEST_BODY        = "This is a test body."

CLEANUP_AFTER_DAYS = 30   # Auto-delete articles older than this (bookmarked ones excluded)

BCS_PRIORITY_CATEGORIES = [
    "bangladesh", "world", "economy", "science_tech", "education",
]

SCRAPERS = [
    ("Daily Star",  run_daily_star_scraper),
    ("Prothom Alo", run_prothom_alo_scraper),
    ("TBS",         run_tbs_scraper),
    ("PA English",  run_prothom_alo_en_scraper),
]


# --- Internet check ------------------------------------------------
def has_internet(timeout: float = 5.0) -> bool:
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=timeout)
        return True
    except OSError:
        return False


# --- Scrape phase (PARALLEL) ---------------------------------------
def _scrape_one_source(name: str, fn) -> bool:
    for attempt in range(1, SCRAPER_RETRY_COUNT + 1):
        try:
            fn()
            log.info(f"    {name}: OK (attempt {attempt})")
            return True
        except Exception as e:
            log.warning(f"    {name} attempt {attempt}/{SCRAPER_RETRY_COUNT} failed: {e}")
            if attempt < SCRAPER_RETRY_COUNT:
                time.sleep(SCRAPER_RETRY_DELAY)
    log.error(f"    {name}: gave up after {SCRAPER_RETRY_COUNT} attempts")
    return False


def scrape_all_sources() -> tuple[int, int]:
    """Run all scrapers in parallel. Returns (success_count, total)."""
    success_count = 0
    log.info(f"  Running {len(SCRAPERS)} scrapers in parallel...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(SCRAPERS)) as ex:
        futures = {ex.submit(_scrape_one_source, name, fn): name for name, fn in SCRAPERS}
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                success_count += 1
    return success_count, len(SCRAPERS)


# --- Embedding + clustering phase ----------------------------------
def process_new_articles() -> tuple[int, int]:
    db = SessionLocal()
    embedded = clustered = 0
    try:
        stmt = select(Article).where(Article.embedding.is_(None))
        for article in db.scalars(stmt).all():
            try:
                text = f"{article.headline}\n\n{(article.body or '')[:500]}"
                article.embedding = compute_embedding(text)
                db.flush()
                find_or_create_cluster_for(db, article)
                embedded  += 1
                clustered += 1
            except Exception as e:
                log.warning(f"    Embed/cluster failed for article {article.id}: {e}")
                db.rollback()
        db.commit()
    finally:
        db.close()
    return embedded, clustered


# --- Groq quota probe ----------------------------------------------
def groq_quota_ok() -> bool:
    try:
        analyze_article(headline="Probe", body=GROQ_TEST_BODY)
        return True
    except Exception as e:
        err = type(e).__name__
        if "RateLimit" in err or "rate_limit" in str(e).lower():
            return False
        log.warning(f"  Groq probe error ({err}): {e}")
        return False


# --- BCS analysis phase --------------------------------------------
def bcs_priority_score(article: Article) -> int:
    if article.category in BCS_PRIORITY_CATEGORIES:
        return BCS_PRIORITY_CATEGORIES.index(article.category)
    return 99


def analyze_unclassified_articles() -> dict:
    db = SessionLocal()
    stats = {
        "processed": 0, "failed": 0,
        "by_relevance": {"high": 0, "medium": 0, "low": 0, "skip": 0},
        "stopped_on_quota": False,
    }
    try:
        # Only classify articles scraped in the last 24h.
        # Backlog (everything older) intentionally left unclassified — not worth burning Groq quota on stale news.
        cutoff = datetime.utcnow() - timedelta(hours=24)
        stmt = (
            select(Article)
            .where(Article.bcs_relevance.is_(None))
            .where(Article.scraped_at >= cutoff)
        ).where(Article.scraped_at >= datetime.utcnow() - timedelta(hours=24))
        articles = list(db.scalars(stmt).all())
        articles.sort(key=lambda a: (bcs_priority_score(a), -(a.scraped_at.timestamp() if a.scraped_at else 0)))

        total = len(articles)
        if total == 0:
            log.info("  No unclassified articles.")
            return stats

        log.info(f"  Analyzing {total} articles (BCS-priority order)...")

        for i, article in enumerate(articles, start=1):
            try:
                result = analyze_article(article.headline, article.body)
                article.bcs_relevance = result["bcs_relevance"]
                article.bcs_subject   = result["bcs_subject"]
                article.key_facts     = result["key_facts"]
                if result["summary_en"] and not article.summary_en:
                    article.summary_en = result["summary_en"]
                if result["summary_bn"] and not article.summary_bn:
                    article.summary_bn = result["summary_bn"]
                db.commit()

                rel = result["bcs_relevance"]
                stats["by_relevance"][rel] = stats["by_relevance"].get(rel, 0) + 1
                stats["processed"] += 1

                if i % 10 == 0 or i == total:
                    log.info(f"    [{i:3d}/{total}] {rel:6s} {result['bcs_subject']}")
            except Exception as e:
                err = type(e).__name__
                if "RateLimit" in err or "rate_limit" in str(e).lower():
                    log.warning(f"    Groq quota hit at {i}/{total}. Stopping.")
                    db.rollback()
                    stats["stopped_on_quota"] = True
                    break
                log.warning(f"    [{i}/{total}] FAIL: {err}: {e}")
                db.rollback()
                stats["failed"] += 1
            time.sleep(GROQ_CALL_DELAY)
    finally:
        db.close()
    return stats


# --- Cleanup phase -------------------------------------------------
def cleanup_old_articles() -> int:
    """
    Delete articles older than CLEANUP_AFTER_DAYS.
    NEVER deletes articles any user has bookmarked.
    """
    cutoff = datetime.utcnow() - timedelta(days=CLEANUP_AFTER_DAYS)
    db = SessionLocal()
    try:
        # Subquery: every article that has at least one bookmark
        bookmarked_ids = select(Bookmark.article_id).distinct()

        count_stmt = (
            select(func.count(Article.id))
            .where(Article.scraped_at < cutoff)
            .where(Article.id.notin_(bookmarked_ids))
        )
        old_count = db.scalar(count_stmt) or 0
        if old_count == 0:
            return 0

        del_stmt = (
            Article.__table__.delete()
            .where(Article.scraped_at < cutoff)
            .where(Article.id.notin_(bookmarked_ids))
        )
        db.execute(del_stmt)
        db.commit()
        return old_count
    finally:
        db.close()


# --- Main orchestrator ---------------------------------------------
def run_daily_brief() -> dict:
    started = datetime.utcnow()
    log.info("=" * 60)
    log.info(f"Daily Brief started at {started:%Y-%m-%d %H:%M:%S} UTC")
    log.info("=" * 60)

    report: dict = {
        "started_at_utc": started.isoformat(),
        "phases": {},
        "halted_reason": None,
    }

    if not has_internet():
        log.error("[Phase 1] No internet. Halting.")
        report["phases"]["internet"] = "fail"
        report["halted_reason"] = "no_internet"
        return _finalize(report, started)
    log.info("[Phase 1] Internet: OK")
    report["phases"]["internet"] = "ok"

    log.info("[Phase 2] Scraping sources in parallel...")
    success, total = scrape_all_sources()
    ratio = success / total if total else 0
    log.info(f"  Scraper ratio: {ratio:.0%} ({success}/{total})")
    report["phases"]["scrape"] = {
        "sources_succeeded": success, "sources_total": total,
        "success_ratio": round(ratio, 2),
    }
    if ratio < SCRAPER_HEALTHY_RATIO:
        log.error(f"[Phase 2] Below {SCRAPER_HEALTHY_RATIO:.0%} threshold. Halting.")
        report["halted_reason"] = "scraper_below_threshold"
        return _finalize(report, started)

    log.info("[Phase 3] Embeddings + clustering...")
    embedded, clustered = process_new_articles()
    log.info(f"  Embedded: {embedded}, Clustered: {clustered}")
    report["phases"]["embedding"] = {"embedded": embedded, "clustered": clustered}

    log.info("[Phase 4] Probing Groq quota...")
    if not groq_quota_ok():
        log.warning("  Groq quota unavailable. Skipping AI phase.")
        report["phases"]["groq_probe"] = "fail"
        report["halted_reason"] = "groq_quota_unavailable"
        # Still do cleanup even if Groq is out
        log.info(f"[Phase 6] Cleanup (>{CLEANUP_AFTER_DAYS} days old)...")
        deleted = cleanup_old_articles()
        log.info(f"  Deleted: {deleted} old articles (bookmarked excluded)")
        report["phases"]["cleanup"] = {"deleted": deleted, "after_days": CLEANUP_AFTER_DAYS}
        return _finalize(report, started)
    log.info("  Groq quota: OK")
    report["phases"]["groq_probe"] = "ok"

    log.info("[Phase 5] BCS analysis (priority order)...")
    ai_stats = analyze_unclassified_articles()
    report["phases"]["bcs_analysis"] = ai_stats
    log.info(
        f"  Done. Processed: {ai_stats['processed']}, "
        f"By relevance: {ai_stats['by_relevance']}, "
        f"Stopped on quota: {ai_stats['stopped_on_quota']}"
    )

    log.info(f"[Phase 6] Cleanup (>{CLEANUP_AFTER_DAYS} days old)...")
    deleted = cleanup_old_articles()
    log.info(f"  Deleted: {deleted} old articles (bookmarked excluded)")
    report["phases"]["cleanup"] = {"deleted": deleted, "after_days": CLEANUP_AFTER_DAYS}

    return _finalize(report, started)


def _finalize(report: dict, started: datetime) -> dict:
    elapsed_min = (datetime.utcnow() - started).total_seconds() / 60
    report["duration_minutes"] = round(elapsed_min, 1)
    log.info(f"Daily Brief finished in {elapsed_min:.1f} min")
    log.info("=" * 60)
    return report


if __name__ == "__main__":
    run_daily_brief()
