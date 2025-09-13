from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..security import get_current_user, new_uuid

router = APIRouter()


def _split_csv(value: str | None) -> list[str] | None:
    if value is None or not value.strip():
        return []
    return [x.strip() for x in value.split(",") if x.strip()]


def _join_csv(items: list[str] | None) -> str | None:
    if not items:
        return None
    return ", ".join([s.strip() for s in items if s and s.strip()]) or None


@router.get("/me", response_model=schemas.ProfileOut)
def get_me(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    prof = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == user.id)
        .first()
    )
    if not prof:
        prof = models.HealthProfile(id=new_uuid(), user_id=user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)

    return schemas.ProfileOut(
        id=prof.id,
        user_id=prof.user_id,
        created_at=prof.created_at,
        updated_at=prof.updated_at,
        age=prof.age,
        sex=prof.sex,
        height_cm=prof.height_cm,
        weight_kg=prof.weight_kg,
        allergies=_split_csv(prof.allergies),
        conditions=_split_csv(prof.conditions),
        sleep_pref=prof.sleep_pref,
        blood_type=prof.blood_type,
        activity_level=prof.activity_level,
        smoking_status=prof.smoking_status,
        alcohol_use=prof.alcohol_use,
        medications=_split_csv(prof.medications),
        surgeries=_split_csv(prof.surgeries),
        family_history=prof.family_history,
        emergency_contact_name=prof.emergency_contact_name,
        emergency_contact_phone=prof.emergency_contact_phone,
        preferred_units=prof.preferred_units,
    )


@router.put("/me", response_model=schemas.ProfileOut)
def update_me(
    payload: schemas.ProfileIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    prof = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == user.id)
        .first()
    )
    if not prof:
        prof = models.HealthProfile(id=new_uuid(), user_id=user.id)
        db.add(prof)

    prof.age = payload.age
    prof.sex = payload.sex
    prof.height_cm = payload.height_cm
    prof.weight_kg = payload.weight_kg
    prof.allergies = _join_csv(payload.allergies)
    prof.conditions = _join_csv(payload.conditions)
    prof.sleep_pref = payload.sleep_pref
    prof.blood_type = payload.blood_type
    prof.activity_level = payload.activity_level
    prof.smoking_status = payload.smoking_status
    prof.alcohol_use = payload.alcohol_use
    prof.medications = _join_csv(payload.medications)
    prof.surgeries = _join_csv(payload.surgeries)
    prof.family_history = payload.family_history
    prof.emergency_contact_name = payload.emergency_contact_name
    prof.emergency_contact_phone = payload.emergency_contact_phone
    prof.preferred_units = payload.preferred_units

    db.commit()
    db.refresh(prof)

    return schemas.ProfileOut(
        id=prof.id,
        user_id=prof.user_id,
        created_at=prof.created_at,
        updated_at=prof.updated_at,
        age=prof.age,
        sex=prof.sex,
        height_cm=prof.height_cm,
        weight_kg=prof.weight_kg,
        allergies=_split_csv(prof.allergies),
        conditions=_split_csv(prof.conditions),
        sleep_pref=prof.sleep_pref,
        blood_type=prof.blood_type,
        activity_level=prof.activity_level,
        smoking_status=prof.smoking_status,
        alcohol_use=prof.alcohol_use,
        medications=_split_csv(prof.medications),
        surgeries=_split_csv(prof.surgeries),
        family_history=prof.family_history,
        emergency_contact_name=prof.emergency_contact_name,
        emergency_contact_phone=prof.emergency_contact_phone,
        preferred_units=prof.preferred_units,
    )
