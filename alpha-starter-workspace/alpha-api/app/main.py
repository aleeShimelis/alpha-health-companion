# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import auth, profiles, vitals, symptoms, goals, reports, meds, account, reminders

app = FastAPI(title="ALPHA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or use settings.CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
app.include_router(vitals.router, prefix="/vitals", tags=["Vitals"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["Symptoms"])
app.include_router(goals.router, prefix="/goals", tags=["Goals"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(meds.router, prefix="/meds", tags=["Meds"])
app.include_router(account.router, prefix="/account", tags=["Account"])
app.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])

# Create tables after models are imported
Base.metadata.create_all(bind=engine)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Include routers below (when you have them)
# from .routers import auth, profiles, vitals, symptoms, goals, reports, meds, account
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# ...
