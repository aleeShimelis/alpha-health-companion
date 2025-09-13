from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..models_vitals import VitalRecord
from ..security import get_current_user, new_uuid

router = APIRouter()


def flag_bp(sys: float | None, dia: float | None) -> str | None:
    if sys is None or dia is None:
        return None
    if sys >= 180 or dia >= 120:
        return "hypertensive-crisis"
    if sys >= 140 or dia >= 90:
        return "hypertension-stage2"
    if sys >= 130 or dia >= 80:
        return "hypertension-stage1"
    if sys >= 120 and dia < 80:
        return "elevated"
    return "normal"


def flag_hr(hr: float | None) -> str | None:
    if hr is None:
        return None
    if hr < 40:
        return "bradycardia-severe"
    if hr < 60:
        return "bradycardia"
    if hr > 120:
        return "tachycardia-severe"
    if hr > 100:
        return "tachycardia"
    return "normal"


def flag_temp(t: float | None) -> str | None:
    if t is None:
        return None
    if t >= 39.0:
        return "fever-high"
    if t >= 38.0:
        return "fever"
    if t < 35.0:
        return "hypothermia"
    return "normal"


def flag_glucose(g: float | None) -> str | None:
    if g is None:
        return None
    if g >= 240:
        return "hyperglycemia"
    if g < 70:
        return "hypoglycemia"
    return "normal"


@router.post("", response_model=schemas.VitalOut, status_code=201)
def create_vital(
    payload: schemas.VitalIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if (
        payload.systolic is None and payload.diastolic is None and
        payload.heart_rate is None and payload.temperature_c is None and
        payload.glucose_mgdl is None and payload.weight_kg is None
    ):
        raise HTTPException(
            status_code=400, detail="Provide at least one vital field")

    rec = VitalRecord(
        id=new_uuid(), user_id=user.id,
        systolic=payload.systolic, diastolic=payload.diastolic,
        heart_rate=payload.heart_rate, temperature_c=payload.temperature_c,
        glucose_mgdl=payload.glucose_mgdl, weight_kg=payload.weight_kg,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return schemas.VitalOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        systolic=rec.systolic, diastolic=rec.diastolic,
        heart_rate=rec.heart_rate, temperature_c=rec.temperature_c,
        glucose_mgdl=rec.glucose_mgdl, weight_kg=rec.weight_kg,
        bp_flag=flag_bp(rec.systolic, rec.diastolic),
        hr_flag=flag_hr(rec.heart_rate),
        temp_flag=flag_temp(rec.temperature_c),
        glucose_flag=flag_glucose(rec.glucose_mgdl),
    )


@router.get("", response_model=list[schemas.VitalOut])
def list_vitals(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(VitalRecord)
        .filter(VitalRecord.user_id == user.id)
        .order_by(VitalRecord.created_at.desc())
        .limit(200)
        .all()
    )
    out = []
    for rec in rows:
        out.append(schemas.VitalOut(
            id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
            systolic=rec.systolic, diastolic=rec.diastolic,
            heart_rate=rec.heart_rate, temperature_c=rec.temperature_c,
            glucose_mgdl=rec.glucose_mgdl, weight_kg=rec.weight_kg,
            bp_flag=flag_bp(rec.systolic, rec.diastolic),
            hr_flag=flag_hr(rec.heart_rate),
            temp_flag=flag_temp(rec.temperature_c),
            glucose_flag=flag_glucose(rec.glucose_mgdl),
        ))
    return out


@router.put("/{vital_id}", response_model=schemas.VitalOut)
def update_vital(
    vital_id: str,
    payload: schemas.VitalIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rec = (
        db.query(VitalRecord)
        .filter(VitalRecord.id == vital_id, VitalRecord.user_id == user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Vital not found")
    # Update only provided fields
    for field in ["systolic","diastolic","heart_rate","temperature_c","glucose_mgdl","weight_kg"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(rec, field, val)
    db.commit()
    db.refresh(rec)
    return schemas.VitalOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        systolic=rec.systolic, diastolic=rec.diastolic,
        heart_rate=rec.heart_rate, temperature_c=rec.temperature_c,
        glucose_mgdl=rec.glucose_mgdl, weight_kg=rec.weight_kg,
        bp_flag=flag_bp(rec.systolic, rec.diastolic),
        hr_flag=flag_hr(rec.heart_rate),
        temp_flag=flag_temp(rec.temperature_c),
        glucose_flag=flag_glucose(rec.glucose_mgdl),
    )


@router.delete("/{vital_id}", status_code=204)
def delete_vital(
    vital_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    deleted = (
        db.query(VitalRecord)
        .filter(VitalRecord.id == vital_id, VitalRecord.user_id == user.id)
        .delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Vital not found")
    db.commit()
    return
