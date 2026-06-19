import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Centralized application configuration loaded from environment variables."""

    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # Groq AI - used by summarization. Not required at boot; summarizer
    # checks for itself at call time.
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    # JWT auth - used by /auth endpoints.
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM:  str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

    def __init__(self):
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set in .env file")
        if not self.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY is not set in .env file. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )


settings = Settings()
