## ALPHA Health Companion — Developer Runbook

This runbook helps you run the ALPHA stack locally (API + PWA), validate it’s healthy, and troubleshoot common issues.

### Stack Overview
- API (FastAPI): `http://127.0.0.1:8001`
- PWA (Vite dev): `http://127.0.0.1:5173`
- Postgres: `localhost:5432` (via Docker)
- Redis: `localhost:6379` (via Docker)
- MinIO: Console `http://127.0.0.1:9001` (via Docker)

---

## 1) Start / Stop the Docker stack

From repo root, the compose file lives in `alpha-starter-workspace/docker-compose.yml`.

Start (build + detached):
```bash
docker compose -f alpha-starter-workspace/docker-compose.yml up --build -d
```

Stop and remove containers:
```bash
docker compose -f alpha-starter-workspace/docker-compose.yml down
```

Ports in use (mapped):
- API: host `8001` → container `8000`
- Postgres: `5432`
- Redis: `6379`
- MinIO: `9000` (S3), `9001` (console)

---

## 2) Health probes

API:
- Liveness: `curl -s http://127.0.0.1:8001/healthz`
- OpenAPI docs: `http://127.0.0.1:8001/docs`

PWA (Vite):
1. In a new terminal: `cd alpha-starter-workspace/alpha-pwa && npm install && npm run dev`
2. Open `http://127.0.0.1:5173`

CORS (dev): API allows `http://127.0.0.1:5173` and `http://localhost:5173`.

---

## 3) Environment variables

API (`alpha-starter-workspace/alpha-api/.env`):
```env
DATABASE_URL=sqlite:///./alpha.db
JWT_SECRET=dev-secret
JWT_ALG=HS256
JWT_EXPIRE_MINUTES=60
OPENAI_API_KEY=
```

PWA (`alpha-starter-workspace/alpha-pwa/.env`):
```env
VITE_API_BASE=http://127.0.0.1:8001
```

Notes:
- The PWA reads `VITE_API_BASE` at build-time. Restart `npm run dev` after changes.
- If `OPENAI_API_KEY` is unset, `/meds/decoder` returns 501 (LLM not configured).

---

## 4) Common commands

Run PWA:
```bash
cd alpha-starter-workspace/alpha-pwa
npm install
npm run dev
```

Run API locally (without Docker) — optional:
```bash
cd alpha-starter-workspace/alpha-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

---

## 5) Troubleshooting

### a) Foreign key errors / missing tables
- Ensure a single SQLAlchemy `Base` is used from `app/db.py` by all models.
- Confirm `from . import models` executes before `Base.metadata.create_all(bind=engine)` inside `app/main.py`.
- Verify vitals FK: `vital_records.user_id → users.id` with `ondelete="CASCADE"`.

### b) Import order issues
- In `app/models.py`, keep cross-module model imports (e.g., `VitalRecord`, `SymptomRecord`, `Goal`) at the end of the file to register tables on the shared Base before `create_all`.
- In `app/main.py`, import routers and run `from . import models` before calling `create_all`.

### c) Port collisions
- If `8001` is in use, stop other services or remap the API port in `alpha-starter-workspace/docker-compose.yml` under `api.ports`.
- Vite uses `5173` by default; use `npm run dev -- --port 5174` if needed and update CORS/`VITE_API_BASE` accordingly.

### d) Windows casing pitfalls
- Keep page component filenames in PascalCase (e.g., `VitalsPage.tsx`) to avoid case-only rename issues on Windows.
- Router imports should match filename casing exactly: `import VitalsPage from './pages/VitalsPage'`.

### e) CORS / 401 errors from PWA
- Confirm `VITE_API_BASE` matches the API origin (default `http://127.0.0.1:8001`).
- Ensure the PWA includes the bearer token from `AuthContext` when calling protected endpoints.

### f) LLM not configured
- If `/meds/decoder` returns 501, set `OPENAI_API_KEY` in API `.env` and restart the API.

---

## 6) Quick validation checklist
- API `GET /healthz` returns `{ "status": "ok" }`.
- PWA loads at `http://127.0.0.1:5173` and can register/login.
- `/vitals` and `/symptoms` pages submit and list recent entries.
- `/goals` creates and lists goals.
- `/reports` loads weekly or monthly summary.
- “Test Notification” button on Dashboard shows a local notification (after granting permission).


