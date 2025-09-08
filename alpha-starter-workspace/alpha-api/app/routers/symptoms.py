from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..models_symptoms import SymptomRecord
from ..security import get_current_user, new_uuid

router = APIRouter()


@router.post("", response_model=schemas.SymptomOut, status_code=201)
def create_symptom(
    payload: schemas.SymptomIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    rec = SymptomRecord(
        id=new_uuid(), user_id=user.id,
        description=payload.description.strip(),
        severity=payload.severity,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return schemas.SymptomOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        description=rec.description, severity=rec.severity,
    )


@router.get("", response_model=list[schemas.SymptomOut])
def list_symptoms(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.user_id == user.id)
        .order_by(SymptomRecord.created_at.desc())
        .limit(50)
        .all()
    )
    out: list[schemas.SymptomOut] = []
    for rec in rows:
        out.append(schemas.SymptomOut(
            id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
            description=rec.description, severity=rec.severity,
        ))
    return out


