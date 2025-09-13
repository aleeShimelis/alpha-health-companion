"""Application settings only (no DB objects here).

Consolidated DB setup lives in app/db.py.
"""
from __future__ import annotations

import os
from typing import List, Optional, Any, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Optional: load .env if present (does nothing if file is missing)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass


class Settings(BaseSettings):
    # ---- Core ----
    DATABASE_URL: str
    # ---- Auth/JWT ----
    JWT_SECRET: str
    JWT_ALG: str
    JWT_EXPIRE_MINUTES: int
    REFRESH_EXPIRE_DAYS: int = 7
    # ---- LLM (optional) ----
    OPENAI_API_KEY: Optional[str] = None
    # ---- Web Push (optional) ----
    VAPID_PUBLIC_KEY: Optional[str] = None
    VAPID_PRIVATE_KEY: Optional[str] = None
    VAPID_EMAIL: Optional[str] = None  # used in VAPID 'sub' (mailto:...)
    # ---- Email (optional) ----
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    # ---- CORS (dev defaults) ----
    # Accept either JSON list string or comma-separated string for convenience
    CORS_ORIGINS: Union[List[str], str] = []

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            # Try JSON first (e.g., "[\"http://localhost:5173\"]")
            if s.startswith("["):
                try:
                    arr = json.loads(s)
                    if isinstance(arr, list):
                        return [str(i).strip() for i in arr if str(i).strip()]
                except Exception:
                    pass
            # Fallback: comma-separated string
            return [i.strip() for i in s.split(',') if i.strip()]
        return []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Export settings singleton
settings = Settings()
