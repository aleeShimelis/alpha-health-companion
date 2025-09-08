from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..models_goals import Goal
from ..security import get_current_user, new_uuid


router = APIRouter()


def is_unrealistic(goal: schemas.GoalIn) -> bool:
    text = (goal.target_value or "").lower()
    if "immediately" in text or "overnight" in text:
        return True
    return False


@router.post("", response_model=schemas.GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: schemas.GoalIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if is_unrealistic(payload):
        raise HTTPException(status_code=400, detail="Goal appears unrealistic. Try a smaller, safer target.")

    rec = Goal(
        id=new_uuid(), user_id=user.id,
        category=payload.category, target_value=payload.target_value,
        cadence=payload.cadence,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return schemas.GoalOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        category=rec.category, target_value=rec.target_value, cadence=rec.cadence,
    )


@router.get("", response_model=list[schemas.GoalOut])
def list_goals(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(Goal)
        .filter(Goal.user_id == user.id)
        .order_by(Goal.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        schemas.GoalOut(
            id=r.id, user_id=r.user_id, created_at=r.created_at,
            category=r.category, target_value=r.target_value, cadence=r.cadence,
        )
        for r in rows
    ]


