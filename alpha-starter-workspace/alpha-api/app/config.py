# app/config.py
from __future__ import annotations
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

import os
from typing import List, Optional

try:
    # If you have pydantic-settings installed (recommended)
    from pydantic_settings import BaseSettings  # type: ignore
    _USE_PYDANTIC_SETTINGS = True
except Exception:
    # Fallback if pydantic-settings isn't available
    from pydantic import BaseModel as BaseSettings  # type: ignore
    _USE_PYDANTIC_SETTINGS = False

# Optional: load .env if present (does nothing if file is missing)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass


class Settings(BaseSettings):
    # ---- Core ----
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./alpha.db")

    # ---- Auth/JWT ----
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret")
    JWT_ALG: str = os.getenv("JWT_ALG", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    # ---- LLM (optional) ----
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

    # ---- CORS (dev defaults) ----
    CORS_ORIGINS: List[str] = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]

    # pydantic-settings will read .env automatically if we configure it
    if _USE_PYDANTIC_SETTINGS:
        class Config:
            env_file = ".env"
            env_file_encoding = "utf-8"


# THIS is what main.py imports
settings = Settings()


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
