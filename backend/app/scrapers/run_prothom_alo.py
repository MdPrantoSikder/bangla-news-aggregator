"""
Runner for the Prothom Alo scraper.
Run with:  python -m app.scrapers.run_prothom_alo
"""
import time
from app.services.categories import extract_category
from app.scrapers.prothom_alo import (
    fetch_homepage_html,
    parse_homepage_headlines,
    fetch_article_html,
    parse_article,
)
from app.core.database import SessionLocal
from app.repositories.article_repository import upsert_article
from app.schemas.article import ArticleCreate


PROTHOM_ALO_SOURCE_ID = 2
DELAY_BETWEEN_ARTICLES_SECONDS = 1.0


def run() -> None:
    print("=" * 60)
    print("Prothom Alo Scraper Run")
    print("=" * 60)

    print("\n[1/3] Fetching homepage...")
    homepage_html = fetch_homepage_html()
    headlines = parse_homepage_headlines(homepage_html)
    print(f"      Found {len(headlines)} unique headlines on homepage.")

    print(f"\n[2/3] Scraping {len(headlines)} article pages...")
    saved_count = 0
    skipped_count = 0
    failed_count = 0

    db = SessionLocal()
    try:
        for index, headline_info in enumerate(headlines, start=1):
            article_url = headline_info["url"]
            try:
                article_html = fetch_article_html(article_url)
                parsed = parse_article(article_html)

                if parsed is None:
                    print(f"      [{index}/{len(headlines)}] SKIP (no body): {article_url}")
                    failed_count += 1
                    continue

                article_in = ArticleCreate(
                    source_id=PROTHOM_ALO_SOURCE_ID,
                    url=article_url,
                    headline=parsed["headline"],
                    body=parsed["body"],
                    language="bn",
                    published_at=None,
                    category=extract_category(article_url),
                    image_url=parsed.get("image_url"),
                )

                article, created = upsert_article(db, article_in)
                if created:
                    print(f"      [{index}/{len(headlines)}] SAVED: {article_url}")
                    saved_count += 1
                else:
                    skipped_count += 1

            except Exception as e:
                print(f"      [{index}/{len(headlines)}] FAIL: {article_url}")
                print(f"            reason: {e}")
                failed_count += 1

            time.sleep(DELAY_BETWEEN_ARTICLES_SECONDS)

    finally:
        db.close()

    print("\n[3/3] Done.")
    print(f"      Saved:   {saved_count}")
    print(f"      Skipped: {skipped_count}  (already in DB)")
    print(f"      Failed:  {failed_count}")


if __name__ == "__main__":
    run()
