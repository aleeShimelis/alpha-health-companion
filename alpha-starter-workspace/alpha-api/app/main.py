# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine

# IMPORTANT: import models BEFORE create_all so all tables register
from . import models  # noqa: F401

app = FastAPI(title="ALPHA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables after models are imported
Base.metadata.create_all(bind=engine)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Include routers below (when you have them)
# from .routers import auth, profiles, vitals, symptoms, goals, reports, meds, account
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# ...
