from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..security import get_current_user, new_uuid


router = APIRouter()


@router.get("", response_model=list[schemas.ConsentOut])
def list_consents(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(models.Consent)
        .filter(models.Consent.user_id == user.id)
        .order_by(models.Consent.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        schemas.ConsentOut(
            id=r.id, user_id=r.user_id, created_at=r.created_at,
            privacy_accepted=r.privacy_accepted, marketing_opt_in=r.marketing_opt_in,
        ) for r in rows
    ]


@router.put("", response_model=schemas.ConsentOut, status_code=status.HTTP_201_CREATED)
def upsert_consent(
    payload: schemas.ConsentIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rec = models.Consent(
        id=new_uuid(), user_id=user.id,
        privacy_accepted=bool(payload.privacy_accepted),
        marketing_opt_in=bool(payload.marketing_opt_in),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return schemas.ConsentOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        privacy_accepted=rec.privacy_accepted, marketing_opt_in=rec.marketing_opt_in,
    )

