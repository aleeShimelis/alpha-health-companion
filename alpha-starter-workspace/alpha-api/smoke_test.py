import os
import json
from typing import Dict

# Configure environment before importing the app
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_smoke.db")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("JWT_ALG", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
# Use JSON array form to satisfy pydantic-settings parsing for List[str]
os.environ.setdefault("CORS_ORIGINS", "[]")

from fastapi.testclient import TestClient  # type: ignore

from app.main import app  # type: ignore


client = TestClient(app)


def must_ok(resp, code=200):
    assert resp.status_code == code, f"Unexpected {resp.status_code}: {resp.text}"


def auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def run():
    # 1) Health check
    r = client.get("/healthz")
    must_ok(r)

    # 2) Register
    email = "user@example.com"
    password = "pass1234"
    r = client.post("/auth/register", json={"email": email, "password": password})
    if r.status_code == 201:
        resp = r.json()
        token = resp["access_token"]
        refresh = resp.get("refresh_token")
    elif r.status_code == 400 and "already registered" in r.text:
        pass
    else:
        must_ok(r, 201)

    # 3) Login
    r = client.post("/auth/login", json={"email": email, "password": password})
    must_ok(r)
    resp = r.json()
    token = resp["access_token"]
    refresh = resp.get("refresh_token")

    # 4) /auth/me
    r = client.get("/auth/me", headers=auth_headers(token))
    must_ok(r)
    assert r.json().get("email") == email

    # 4a) refresh token flow
    if refresh:
        r = client.post("/auth/refresh", json={"refresh_token": refresh})
        must_ok(r)
        new_access = r.json()["access_token"]
        assert isinstance(new_access, str)

    # 5) Profiles GET/PUT
    r = client.get("/profiles/me", headers=auth_headers(token))
    must_ok(r)
    prof = r.json()
    r = client.put(
        "/profiles/me",
        headers=auth_headers(token),
        json={
            "age": 30,
            "sex": "male",
            "height_cm": 180,
            "weight_kg": 80,
            "allergies": ["pollen"],
            "conditions": ["hypertension"],
            "sleep_pref": "night",
        },
    )
    must_ok(r)

    # 6) Vitals create/list
    r = client.post(
        "/vitals",
        headers=auth_headers(token),
        json={"systolic": 130, "diastolic": 85, "heart_rate": 72, "temperature_c": 36.8},
    )
    must_ok(r, 201)
    r = client.get("/vitals", headers=auth_headers(token))
    must_ok(r)
    assert isinstance(r.json(), list)

    # 7) Symptoms create/list
    r = client.post(
        "/symptoms",
        headers=auth_headers(token),
        json={"description": "headache", "severity": "mild"},
    )
    must_ok(r, 201)
    r = client.get("/symptoms", headers=auth_headers(token))
    must_ok(r)

    # 8) Goals create/list
    r = client.post(
        "/goals",
        headers=auth_headers(token),
        json={"category": "fitness", "target_value": "8k steps/day", "cadence": "daily"},
    )
    must_ok(r, 201)
    r = client.get("/goals", headers=auth_headers(token))
    must_ok(r)

    # 9) Reports summary
    r = client.get("/reports/summary?period=week", headers=auth_headers(token))
    must_ok(r)

    # 10) Meds decoder (expect 501 if no OPENAI_API_KEY)
    r = client.post(
        "/meds/decoder",
        headers=auth_headers(token),
        json={"name": "ibuprofen"},
    )
    assert r.status_code in (201, 501)

    # 11) Reminders preview
    r = client.get("/reminders/preview", headers=auth_headers(token))
    must_ok(r)

    # 12) Account export/delete
    r = client.get("/account/export", headers=auth_headers(token))
    must_ok(r)
    r = client.post(
        "/account/delete",
        headers=auth_headers(token),
        json={"password": password},
    )
    must_ok(r, 204)

    print("SMOKE TESTS PASSED")


if __name__ == "__main__":
    run()
