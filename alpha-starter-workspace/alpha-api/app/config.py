import os
from pydantic import BaseModel


class Settings(BaseModel):
    # Database (Docker → Postgres; local fallback → SQLite)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./alpha.db")

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret")
    JWT_ALG: str = os.getenv("JWT_ALG", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


# IMPORTANT: this must exist and be spelled exactly "settings"
settings = Settings()
