# alpha-api/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import Base, engine
# <-- import registers ALL tables (users, profiles, consents, audit, vitals)
from . import models

from .routers import auth, profiles
from .routers import vitals  # if you added it
from .routers import symptoms

app = FastAPI(title="ALPHA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only call create_all AFTER models are imported
Base.metadata.create_all(bind=engine)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(profiles.router, prefix="/profiles", tags=["Profile"])
app.include_router(vitals.router, prefix="/vitals",
                   tags=["Vitals"])  # if present
app.include_router(symptoms.router, prefix="/symptoms", tags=["Symptoms"]) 
