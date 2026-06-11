from sqlalchemy.orm import Session

# Import the repository module under a short alias.
# Calls look like: source_repo.get_all_sources(db) — clear where it comes from.
from app.repositories import source_repository as source_repo

# Schemas and model for type hints.
from app.schemas.source import SourceCreate
from app.models.source import Source


def list_sources(db: Session) -> list[Source]:
    """Return all sources. No filtering for now."""
    return source_repo.get_all_sources(db)


def get_source(db: Session, source_id: int) -> Source | None:
    """Return one source by id."""
    return source_repo.get_source_by_id(db, source_id)


def create_source(db: Session, source_in: SourceCreate) -> Source:
    """Create a new source. Business rules go here later."""
    # Example of future business logic (commented out — don't add yet):
    # if source_in.language not in ("bn", "en"):
    #     raise ValueError("language must be 'bn' or 'en'")
    return source_repo.create_source(db, source_in)