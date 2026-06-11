from sqlalchemy.orm import Session
from app.repositories import article_repository as article_repo
from app.schemas.article import ArticleCreate
from app.models.article import Article


def list_articles(
    db: Session,
    source_id: int | None = None,
    language: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Article]:
    """List articles. Optional filters: source_id, language, category."""
    return article_repo.get_all_articles(
        db,
        source_id=source_id,
        language=language,
        category=category,
        limit=limit,
        offset=offset,
    )


def get_article(db: Session, article_id: int) -> Article | None:
    return article_repo.get_article_by_id(db, article_id)


def create_article(db: Session, article_in: ArticleCreate) -> Article:
    return article_repo.create_article(db, article_in)
