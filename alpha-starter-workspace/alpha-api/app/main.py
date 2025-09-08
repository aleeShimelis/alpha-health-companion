# alpha-api/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import Base, engine
from . import models
# <-- import registers ALL tables (users, profiles, consents, audit, vitals)


from .routers import auth, profiles
from .routers import vitals  # if you added it
from .routers import symptoms
from .routers import meds
from .routers import goals as goals_router
from .routers import reminders as reminders_router
from .routers import reports as reports_router
from .routers import account as account_router

app = FastAPI(title="ALPHA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
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
app.include_router(meds.router, prefix="/meds", tags=["Medications"]) 
app.include_router(goals_router.router, prefix="/goals", tags=["Goals"]) 
app.include_router(reminders_router.router, prefix="/reminders", tags=["Reminders"]) 
app.include_router(reports_router.router, prefix="/reports", tags=["Reports"]) 
app.include_router(account_router.router, prefix="/account", tags=["Account"]) 
