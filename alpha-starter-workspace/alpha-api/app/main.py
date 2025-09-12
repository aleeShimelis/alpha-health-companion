# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
import os
from .routers import auth, profiles, vitals, symptoms, goals, reports, meds, account, reminders
from .routers import cycles, consent
from .config import settings
from . import models
from .db import SessionLocal
import jwt

app = FastAPI(title="ALPHA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    # Avoid logging docs and health
    path: str = request.url.path
    if path.startswith("/healthz") or path.startswith("/docs") or path.startswith("/openapi"):
        return await call_next(request)

    user_id = None
    try:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
            user_id = payload.get("sub")
    except Exception:
        user_id = None

    response = None
    success = True
    try:
        response = await call_next(request)
        success = 200 <= (response.status_code or 500) < 400
        return response
    finally:
        try:
            # Persist audit event (best-effort)
            db = SessionLocal()
            try:
                seg = path.strip("/").split("/", 1)[0] or "root"
                evt = models.AuditEvent(
                    user_id=user_id,
                    action=(request.method or "").lower(),
                    resource=seg,
                    success=bool(success),
                    ip=(request.client.host if request.client else None),
                )
                db.add(evt)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
app.include_router(vitals.router, prefix="/vitals", tags=["Vitals"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["Symptoms"])
app.include_router(goals.router, prefix="/goals", tags=["Goals"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(meds.router, prefix="/meds", tags=["Meds"])
app.include_router(account.router, prefix="/account", tags=["Account"])
app.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
app.include_router(cycles.router, prefix="/cycles", tags=["Cycles"])
app.include_router(consent.router, prefix="/consent", tags=["Consent"])

# Dev convenience: create tables if not disabled (for local SQLite/dev use)
if os.getenv("ALPHA_DISABLE_CREATE_ALL") != "1":
    Base.metadata.create_all(bind=engine)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Include routers below (when you have them)
# from .routers import auth, profiles, vitals, symptoms, goals, reports, meds, account
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# ...
