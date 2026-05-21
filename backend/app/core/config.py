# Import os to access environment variables from the operating system.
import os

# load_dotenv reads the .env file and loads its contents into os.environ
# so we can access them through os.getenv() below.
from dotenv import load_dotenv

# This actually performs the loading. Must be called before we read any env var.
load_dotenv()


# A simple class that holds all our config values in one place.
# The rest of the app imports "settings" from this file instead of reading
# environment variables directly. This way config is centralized.
class Settings:
    # Read DATABASE_URL from the environment. If it's missing, default to None
    # so we can raise a clear error below instead of a confusing one later.
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # Read GEMINI_API_KEY from the environment. Used by the summarization service.
    # We don't fail-fast on this one because parts of the app (e.g., scrapers,
    # API endpoints) don't need it — only the summarizer does. The summarizer
    # checks for itself at call time.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    def __init__(self):
        # Fail fast: if DATABASE_URL is missing, crash immediately with a
        # clear message. This is better than crashing later with a vague error.
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set in .env file")


# Create a single instance that the rest of the app will import.
# Convention: lowercase name for the instance, capital name for the class.
settings = Settings()