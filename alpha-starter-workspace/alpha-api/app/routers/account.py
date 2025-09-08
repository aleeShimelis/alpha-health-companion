from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..models_vitals import VitalRecord
from ..models_symptoms import SymptomRecord
from ..models_goals import Goal
from ..security import get_current_user, verify_password


router = APIRouter()


@router.get("/export")
def export_account(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    # Sensible limits to keep response small
    LIMIT = 500

    profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == user.id)
        .first()
    )
    vitals = (
        db.query(VitalRecord)
        .filter(VitalRecord.user_id == user.id)
        .order_by(VitalRecord.created_at.desc())
        .limit(LIMIT)
        .all()
    )
    symptoms = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.user_id == user.id)
        .order_by(SymptomRecord.created_at.desc())
        .limit(LIMIT)
        .all()
    )
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user.id)
        .order_by(Goal.created_at.desc())
        .limit(LIMIT)
        .all()
    )

    def serialize_model(obj: Any) -> Dict[str, Any]:
        if obj is None:
            return {}
        d = {}
        for k in obj.__mapper__.c.keys():
            d[k] = getattr(obj, k)
        return d

    payload = {
        "user": {k: getattr(user, k) for k in ["id", "email", "phone", "created_at", "updated_at"]},
        "profile": serialize_model(profile) if profile else None,
        "vitals": [serialize_model(v) for v in vitals],
        "symptoms": [serialize_model(s) for s in symptoms],
        "goals": [serialize_model(g) for g in goals],
    }
    return JSONResponse(content=payload, media_type="application/json")


class DeleteAccountIn(models.BaseModel if hasattr(models, 'BaseModel') else object):  # fallback if not using pydantic here
    pass


@router.post("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    body: Dict[str, str],
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    password = (body or {}).get("password")
    if not password:
        raise HTTPException(status_code=400, detail="Password required")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Delete dependent records first to be safe, then the user
    db.query(VitalRecord).filter(VitalRecord.user_id == user.id).delete(synchronize_session=False)
    db.query(SymptomRecord).filter(SymptomRecord.user_id == user.id).delete(synchronize_session=False)
    db.query(Goal).filter(Goal.user_id == user.id).delete(synchronize_session=False)
    db.query(models.HealthProfile).filter(models.HealthProfile.user_id == user.id).delete(synchronize_session=False)
    db.query(models.Consent).filter(models.Consent.user_id == user.id).delete(synchronize_session=False)
    db.query(models.AuditEvent).filter(models.AuditEvent.user_id == user.id).delete(synchronize_session=False)
    db.query(models.User).filter(models.User.id == user.id).delete(synchronize_session=False)
    db.commit()
    # 204 No Content
    return


