# APIRouter lets us group related endpoints in one file.
# Depends is FastAPI's dependency injection helper.
# HTTPException is how we send error responses to the client.
# status holds named HTTP status codes (more readable than raw numbers).
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

# get_db gives us a fresh database session per request and closes it after.
from app.core.database import get_db

# Schemas for the request and response shapes.
from app.schemas.source import SourceCreate, SourceRead

# The service layer — the router never calls the repository directly.
from app.services import source_service


# Create a router with a common URL prefix and a tag for the /docs page.
# Every endpoint defined below will be at /sources/...
router = APIRouter(prefix="/sources", tags=["sources"])


# GET /sources — list all sources.
# response_model=list[SourceRead] tells FastAPI:
#   1. Validate the response matches this schema.
#   2. Strip out any fields not in the schema (security/clean output).
#   3. Show this schema in /docs.
@router.get("/", response_model=list[SourceRead])
def list_sources(db: Session = Depends(get_db)):
    """Return all sources."""
    return source_service.list_sources(db)


# GET /sources/{source_id} — fetch a single source by id.
# {source_id} in the path becomes a function argument with type int.
# FastAPI auto-validates that source_id is an integer.
@router.get("/{source_id}", response_model=SourceRead)
def get_source(source_id: int, db: Session = Depends(get_db)):
    """Return one source by id, or 404 if not found."""
    source = source_service.get_source(db, source_id)
    if source is None:
        # raise HTTPException to send an HTTP error response.
        # FastAPI catches it and produces a clean JSON error.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with id {source_id} not found",
        )
    return source


# POST /sources — create a new source.
# Body is parsed into SourceCreate; FastAPI validates types automatically.
# status_code=201 because "Created" is the right HTTP code for a new resource.
@router.post("/", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
def create_source(source_in: SourceCreate, db: Session = Depends(get_db)):
    """Create a new source."""
    return source_service.create_source(db, source_in)