from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..models_goals import Goal, GoalProgress
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


@router.put("/{goal_id}", response_model=schemas.GoalOut)
def update_goal(
    goal_id: str,
    payload: schemas.GoalUpdateIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rec = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Goal not found")
    if payload.category is not None:
        rec.category = payload.category
    if payload.target_value is not None:
        rec.target_value = payload.target_value
    if payload.cadence is not None:
        rec.cadence = payload.cadence
    db.commit()
    db.refresh(rec)
    return schemas.GoalOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        category=rec.category, target_value=rec.target_value, cadence=rec.cadence,
    )


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    deleted = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user.id)
        .delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.commit()
    return


@router.post("/{goal_id}/progress", response_model=schemas.GoalProgressOut, status_code=status.HTTP_201_CREATED)
def add_progress(
    goal_id: str,
    payload: schemas.GoalProgressIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    rec = GoalProgress(id=new_uuid(), user_id=user.id, goal_id=goal.id, value=payload.value, note=payload.note)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return schemas.GoalProgressOut(
        id=rec.id, goal_id=rec.goal_id, user_id=rec.user_id, value=rec.value, note=rec.note, created_at=rec.created_at
    )


@router.get("/{goal_id}/progress", response_model=list[schemas.GoalProgressOut])
def list_progress(
    goal_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(GoalProgress)
        .filter(GoalProgress.goal_id == goal_id, GoalProgress.user_id == user.id)
        .order_by(GoalProgress.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        schemas.GoalProgressOut(id=r.id, goal_id=r.goal_id, user_id=r.user_id, value=r.value, note=r.note, created_at=r.created_at)
        for r in rows
    ]


