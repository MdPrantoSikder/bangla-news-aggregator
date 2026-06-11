# Session is the type hint for an active database session.
from sqlalchemy.orm import Session

# select() builds SELECT queries in modern SQLAlchemy 2.0 style.
from sqlalchemy import select

# Our Source model — the SQLAlchemy ORM class for the sources table.
from app.models.source import Source

# Our input schema — used to validate data when creating.
from app.schemas.source import SourceCreate


# Each function takes a db session as the first argument.
# The session is provided by FastAPI's dependency injection (get_db).


def get_all_sources(db: Session) -> list[Source]:
    """Return every row in the sources table."""
    # select(Source) builds: SELECT * FROM sources
    # db.scalars(...) runs it and returns model instances (not raw tuples).
    # .all() collects them into a list.
    return db.scalars(select(Source)).all()


def get_source_by_id(db: Session, source_id: int) -> Source | None:
    """Return one source by id, or None if it doesn't exist."""
    # db.get is the simplest way to fetch by primary key — internally:
    # SELECT * FROM sources WHERE id = :source_id LIMIT 1
    return db.get(Source, source_id)


def create_source(db: Session, source_in: SourceCreate) -> Source:
    """Insert a new source and return the saved row."""
    # Build a Source model instance from the incoming schema.
    # model_dump() turns a Pydantic schema into a dict.
    # The ** unpacks the dict as keyword arguments.
    new_source = Source(**source_in.model_dump())

    # Stage the INSERT (not actually sent to DB yet).
    db.add(new_source)

    # commit() actually runs the INSERT and saves the change.
    db.commit()

    # After commit, the database has assigned an id and created_at.
    # refresh() reloads the object from the DB so we see those values.
    db.refresh(new_source)

    return new_source