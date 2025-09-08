# ALPHA – Project Brief (Source of Truth)

## Vision
Personal health companion PWA (no clinicians). Core: registration/login, build health profile, record daily vitals/symptoms/sleep, goals & reminders, non-clinical insights, reports.

## Actors
- End User (no healthcare provider)
- System Scheduler (background reminders)

## MVP Features (Chapter 2 consistency)
- UC1 Register, UC2 Login, UC3 Profile
- UC4 Menstrual cycle (for female users)
- UC5 Medication decoder (LLM-based)
- UC6 Record vitals
- UC7 Report/analyze symptoms (non-clinical guidance)
- UC8 Generate health reports
- UC9 Manage health goals + reminders
- UC10 Medication reminders
- UC11 Export/Delete data (privacy)
- UC12 (Deferred/Removed caregiver) – not implemented now

## Tech decisions
- PWA: React + Vite + TS, react-router
- API: FastAPI, SQLAlchemy, Pydantic
- DB: Postgres (Docker) or SQLite (local dev fallback)
- LLM: OpenAI API for *decoder* & *insight narration* (local ML deferred)
- Ports: API on 8001 when GeoServer uses 8000

## Conventions
- One shared SQLAlchemy Base from `app/db.py`
- Import `from . import models` before `Base.metadata.create_all(...)`
- Keep `users` table present before `vital_records` (FK)
- Env: `alpha-pwa/.env -> VITE_API_BASE`
