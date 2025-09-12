import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from . import models


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: str, minutes: Optional[int] = None, extra: Optional[Dict[str, Any]] = None) -> str:
    expire_minutes = minutes if minutes is not None else settings.JWT_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {"sub": subject, "iat": int(now.timestamp())}
    if expire_minutes and expire_minutes > 0:
        exp = now + timedelta(minutes=expire_minutes)
        payload["exp"] = int(exp.timestamp())
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, settings.JWT_SECRET,
                       algorithm=settings.JWT_ALG)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def new_uuid() -> str:
    return str(uuid.uuid4())


def _get_token_from_header(request: Request) -> str:
    auth = request.headers.get(
        "authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return auth.split(" ", 1)[1].strip()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    token = _get_token_from_header(request)
    try:
        payload = jwt.decode(token, settings.JWT_SECRET,
                             algorithms=[settings.JWT_ALG])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # SQLAlchemy 2.0: use Session.get(Model, pk)
    user = db.get(models.User, sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
