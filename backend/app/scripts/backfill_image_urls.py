"""
Backfill image_url for all articles by re-fetching each article page
and extracting the og:image meta tag.

Run with:
    python -m app.scripts.backfill_image_urls

Safe to re-run: only updates articles where image_url is NULL.

Routes each article to the correct scraper based on source_id:
    source_id = 1 -> Daily Star
    source_id = 2 -> Prothom Alo
"""
import time
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.article import Article
from app.scrapers.daily_star import (
    fetch_article_html as fetch_ds,
    parse_article as parse_ds,
)
from app.scrapers.prothom_alo import (
    fetch_article_html as fetch_pa,
    parse_article as parse_pa,
)


# Politeness delay between requests (don't hammer the news sites).
DELAY_SECONDS = 1.0


# Map source_id -> (fetch_function, parse_function)
SCRAPER_MAP = {
    1: (fetch_ds, parse_ds),   # Daily Star
    2: (fetch_pa, parse_pa),   # Prothom Alo
}


def run() -> None:
    db = SessionLocal()
    try:
        # Find all articles without an image_url.
        stmt = select(Article).where(Article.image_url.is_(None))
        articles = list(db.scalars(stmt).all())
        total = len(articles)

        print(f"Found {total} articles without image_url.")
        if total == 0:
            print("Nothing to do. Exiting.")
            return

        # Counters for the final summary.
        success_count = 0
        no_image_count = 0
        failed_count = 0
        unknown_source_count = 0

        for index, article in enumerate(articles, start=1):
            # Look up the right scraper for this article's source.
            scraper = SCRAPER_MAP.get(article.source_id)
            if scraper is None:
                print(f"  [{index}/{total}] UNKNOWN source_id={article.source_id} for {article.url}")
                unknown_source_count += 1
                continue

            fetch_func, parse_func = scraper

            try:
                # Re-fetch the article page and extract og:image.
                html = fetch_func(article.url)
                parsed = parse_func(html)

                if parsed is None:
                    print(f"  [{index}/{total}] FAIL (parse) {article.url}")
                    failed_count += 1
                    continue

                image_url = parsed.get("image_url")
                if not image_url:
                    print(f"  [{index}/{total}] NO IMG {article.url}")
                    no_image_count += 1
                else:
                    article.image_url = image_url
                    success_count += 1
                    print(f"  [{index}/{total}] OK     {image_url[:80]}")

            except Exception as e:
                print(f"  [{index}/{total}] FAIL   {article.url}")
                print(f"            reason: {e}")
                failed_count += 1

            # Politeness delay before the next request.
            time.sleep(DELAY_SECONDS)

        # Commit all updates at once (faster than per-article commits).
        db.commit()

        print()
        print("=" * 60)
        print("Backfill complete.")
        print(f"  Updated with image:  {success_count}")
        print(f"  Article had no img:  {no_image_count}")
        print(f"  Failed (network):    {failed_count}")
        print(f"  Unknown source:      {unknown_source_count}")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    run()
