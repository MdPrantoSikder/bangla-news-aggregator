"""Celery tasks for the Bangla News Aggregator."""
from sqlalchemy import select, func

from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.article import Article
from app.scrapers.run_daily_star import run as run_daily_star_scraper
from app.scrapers.run_prothom_alo import run as run_prothom_alo_scraper
from app.scrapers.run_tbs import run as run_tbs_scraper
from app.services.embeddings import compute_embedding
from app.services.dedup import find_or_create_cluster_for
from app.services.summarization import summarize_text


def _process_new_articles() -> tuple[int, int]:
    """
    For each article without embedding: compute embedding, cluster it.
    Then, for any article in a multi-article cluster without a summary,
    call Gemini to generate bilingual summaries.

    Returns (embedded_count, summarized_count).
    """
    db = SessionLocal()
    embedded = 0
    summarized = 0
    try:
        # Step 1: embed + cluster any article without embedding.
        stmt = select(Article).where(Article.embedding.is_(None))
        for article in db.scalars(stmt).all():
            text = f"{article.headline}\n\n{(article.body or '')[:500]}"
            article.embedding = compute_embedding(text)
            db.flush()
            find_or_create_cluster_for(db, article)
            embedded += 1
        db.commit()

        # Step 2: find multi-article clusters and summarize their articles.
        multi_clusters_stmt = (
            select(Article.story_cluster_id)
            .where(Article.story_cluster_id.is_not(None))
            .group_by(Article.story_cluster_id)
            .having(func.count(Article.id) > 1)
        )
        multi_cluster_ids = list(db.scalars(multi_clusters_stmt).all())

        if multi_cluster_ids:
            to_summarize_stmt = (
                select(Article)
                .where(Article.story_cluster_id.in_(multi_cluster_ids))
                .where(Article.summary_en.is_(None))
            )
            for article in db.scalars(to_summarize_stmt).all():
                try:
                    en, bn = summarize_text(article.headline, article.body)
                    article.summary_en = en
                    article.summary_bn = bn
                    db.commit()
                    summarized += 1
                except Exception as e:
                    print(f"  Summarization failed for article {article.id}: {e}")
                    db.rollback()

        return embedded, summarized
    finally:
        db.close()


@celery_app.task(name="scrapers.daily_star")
def scrape_daily_star() -> str:
    print("[Celery task] Starting Daily Star scrape...")
    run_daily_star_scraper()
    embedded, summarized = _process_new_articles()
    msg = f"daily_star: done, embedded={embedded}, summarized={summarized}"
    print(f"[Celery task] {msg}")
    return msg


@celery_app.task(name="scrapers.prothom_alo")
def scrape_prothom_alo() -> str:
    print("[Celery task] Starting Prothom Alo scrape...")
    run_prothom_alo_scraper()
    embedded, summarized = _process_new_articles()
    msg = f"prothom_alo: done, embedded={embedded}, summarized={summarized}"
    print(f"[Celery task] {msg}")
    return msg


@celery_app.task(name="scrapers.tbs")
def scrape_tbs() -> str:
    print("[Celery task] Starting TBS scrape...")
    run_tbs_scraper()
    embedded, summarized = _process_new_articles()
    msg = f"tbs: done, embedded={embedded}, summarized={summarized}"
    print(f"[Celery task] {msg}")
    return msg
