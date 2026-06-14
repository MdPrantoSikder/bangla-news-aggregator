"""
Test the summarization service on 3 real articles from the DB.
Picks one article from each cluster that has multiple articles
(so we see how it handles the same story across sources).

Run with:
    python -m app.scripts.test_summarize_real
"""
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.article import Article
from app.services.summarization import summarize_text


def run() -> None:
    db = SessionLocal()
    try:
        # Get 3 articles with embeddings (= already processed by Phase 7).
        # We pick different sources to see how the summarizer handles both
        # English (Daily Star) and Bangla (Prothom Alo) inputs.
        stmt = (
            select(Article)
            .where(Article.embedding.is_not(None))
            .order_by(Article.id)
            .limit(3)
        )
        articles = db.scalars(stmt).all()

        for article in articles:
            print(f"\n{'=' * 70}")
            print(f"Article id={article.id}, source={article.source_id}, lang={article.language}")
            print(f"Headline: {article.headline[:100]}")
            print(f"{'=' * 70}")

            try:
                summary_en, summary_bn = summarize_text(article.headline, article.body)
                print(f"\nEN: {summary_en}")
                print(f"\nBN: {summary_bn}")
            except Exception as e:
                print(f"FAILED: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    run()