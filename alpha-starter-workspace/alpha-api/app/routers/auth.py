from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..security import create_access_token, hash_password, verify_password


router = APIRouter()


class RegisterIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# very simple in-memory limiter for dev
_login_attempts: dict[str, list[float]] = {}
_LOGIN_WINDOW_SEC = 60
_LOGIN_MAX = 10


def _rate_limit_login(ip: str):
    now = datetime.now(tz=timezone.utc).timestamp()
    arr = _login_attempts.get(ip, [])
    arr = [t for t in arr if now - t < _LOGIN_WINDOW_SEC]
    if len(arr) >= _LOGIN_MAX:
        raise HTTPException(status_code=429, detail="Too many login attempts, try again later")
    arr.append(now)
    _login_attempts[ip] = arr


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    token = create_access_token(user.id)
    return TokenOut(access_token=token)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/login", response_model=TokenOut)
def login(req: Request, payload: LoginIn, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "?"
    _rate_limit_login(ip)

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    return TokenOut(access_token=token)


@router.get("/me")
def me(user: models.User = Depends(lambda: None), db: Session = Depends(get_db)):
    # In a real setup, use get_current_user; placeholder provided here if it's wired elsewhere
    # Try to import runtime to avoid circulars
    try:
        from ..security import get_current_user  # type: ignore
        user = get_current_user  # type: ignore
    except Exception:
        pass
    if callable(user):
        # Resolve dependency style
        return {"ok": True}
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"id": user.id, "email": user.email}

