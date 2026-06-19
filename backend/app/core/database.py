# create_engine builds the connection to the database.
# It manages a pool of connections internally so multiple parts of your app
# can talk to the database efficiently.
from sqlalchemy import create_engine

# sessionmaker creates a "factory" for database sessions.
# A session is a temporary workspace where you stage changes before saving.
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Import our settings object so we can read the DATABASE_URL.
from app.core.config import settings


# The engine is the lowest-level connection to the database.
# echo=False logs every SQL statement to the terminal â€” great for learning,
# we'll turn it off later in production.
engine = create_engine(settings.DATABASE_URL, echo=False)


# SessionLocal is a factory. Calling SessionLocal() gives you a new session.
# autocommit=False means we control when changes are saved (we call .commit()).
# autoflush=False means changes don't auto-sync until we say so.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base is the parent class that all our database models will inherit from.
# SQLAlchemy uses this to know which classes are database tables.
class Base(DeclarativeBase):
    pass


# Dependency function used by FastAPI endpoints to get a database session.
# It yields a session, then makes sure it's closed even if something errors.
# We'll use this in router files later. Don't worry about it yet.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
