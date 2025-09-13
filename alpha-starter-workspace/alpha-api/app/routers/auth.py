from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..security import create_access_token, hash_password, verify_password, get_current_user
from ..security import new_uuid
from datetime import datetime, timedelta, timezone
import secrets
from ..services import emailer
from ..models_email_verification import EmailVerification


router = APIRouter()


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    consent_privacy: bool = False
    consent_marketing: bool = False


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
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
    db.flush()
    # Store consent at registration
    try:
        consent = models.Consent(
            user_id=user.id,
            privacy_accepted=bool(payload.consent_privacy),
            marketing_opt_in=bool(payload.consent_marketing),
        )
        db.add(consent)
    except Exception:
        pass
    db.commit()
    token = create_access_token(user.id)
    # create refresh token
    rt = _issue_refresh_token(db, user.id)
    return TokenOut(access_token=token, refresh_token=rt)


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
    rt = _issue_refresh_token(db, user.id)
    return TokenOut(access_token=token, refresh_token=rt)


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email}


class PasswordResetRequestIn(BaseModel):
    email: EmailStr


@router.post("/password/request", status_code=status.HTTP_204_NO_CONTENT)
def password_request(payload: PasswordResetRequestIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Always return 204 to avoid account enumeration
    if not user:
        return
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    rec = models.PasswordReset(
        id=new_uuid(), user_id=user.id, token=token, expires_at=expires, used=False
    )
    db.add(rec)
    db.commit()
    # Email the token if configured (non-revealing message)
    reset_url = f"https://example.com/reset?token={token}"
    emailer.send_text(
        to=user.email,
        subject="ALPHA password reset",
        body=(
            "You (or someone) requested a password reset for your ALPHA account.\n\n"
            f"Use this token in the app to reset your password: {token}\n"
            f"Or open: {reset_url}\n\n"
            "If you didn't request this, you can ignore this email."
        ),
    )
    return


class PasswordResetConfirmIn(BaseModel):
    token: str
    new_password: str


@router.post("/password/reset", status_code=status.HTTP_204_NO_CONTENT)
def password_reset(payload: PasswordResetConfirmIn, db: Session = Depends(get_db)):
    rec = (
        db.query(models.PasswordReset)
        .filter(models.PasswordReset.token == payload.token)
        .first()
    )
    if not rec or rec.used:
        raise HTTPException(status_code=400, detail="Invalid or used token")
    now = datetime.now(timezone.utc)
    if rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Token expired")
    user = db.get(models.User, rec.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.password_hash = hash_password(payload.new_password)
    rec.used = True
    db.commit()
    return


class EmailVerifyRequestIn(BaseModel):
    email: EmailStr


@router.post("/email/verify/request", status_code=status.HTTP_204_NO_CONTENT)
def email_verify_request(payload: EmailVerifyRequestIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        return
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    rec = EmailVerification(id=new_uuid(), user_id=user.id, token=token, expires_at=expires, used=False)
    db.add(rec)
    db.commit()
    verify_url = f"https://example.com/verify?token={token}"
    emailer.send_text(to=user.email, subject="Verify your ALPHA email", body=(
        "Thanks for signing up for ALPHA.\n\n"
        f"Use this token to verify your email: {token}\n"
        f"Or open: {verify_url}\n\n"
        "If you didn't request this, you can ignore this email."
    ))
    return


class EmailVerifyConfirmIn(BaseModel):
    token: str


@router.post("/email/verify/confirm", status_code=status.HTTP_204_NO_CONTENT)
def email_verify_confirm(payload: EmailVerifyConfirmIn, db: Session = Depends(get_db)):
    rec = (
        db.query(EmailVerification)
        .filter(EmailVerification.token == payload.token)
        .first()
    )
    if not rec or rec.used:
        raise HTTPException(status_code=400, detail="Invalid token")
    now = datetime.now(timezone.utc)
    if rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Token expired")
    user = db.get(models.User, rec.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.email_verified = True
    rec.used = True
    db.commit()
    return

def _issue_refresh_token(db: Session, user_id: str) -> str:
    from ..config import settings
    from datetime import datetime, timedelta, timezone
    import secrets
    expires = datetime.now(timezone.utc) + timedelta(days=int(settings.REFRESH_EXPIRE_DAYS))
    token = secrets.token_urlsafe(32)
    rec = models.RefreshToken(id=new_uuid(), user_id=user_id, token=token, expires_at=expires, revoked=False)
    db.add(rec)
    db.commit()
    return token


class RefreshIn(BaseModel):
    refresh_token: str


class RefreshOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/refresh", response_model=RefreshOut)
def refresh_token(payload: RefreshIn, db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    rec = (
        db.query(models.RefreshToken)
        .filter(models.RefreshToken.token == payload.refresh_token)
        .first()
    )
    if not rec or rec.revoked:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    now = datetime.now(timezone.utc)
    if rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    user = db.get(models.User, rec.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    at = create_access_token(user.id)
    return RefreshOut(access_token=at)


class LogoutIn(BaseModel):
    refresh_token: str


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutIn, db: Session = Depends(get_db)):
    rec = (
        db.query(models.RefreshToken)
        .filter(models.RefreshToken.token == payload.refresh_token)
        .first()
    )
    if rec:
        rec.revoked = True
        db.commit()
    return


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str


@router.post("/password/change", status_code=status.HTTP_204_NO_CONTENT)
def password_change(
    payload: PasswordChangeIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return
