from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from ..models_cycles import CycleEntry
from ..security import get_current_user, new_uuid


router = APIRouter()


class CycleIn(BaseModel):
    start_date: date = Field(...)
    notes: str | None = None


class CycleOut(CycleIn):
    id: str
    user_id: str


@router.post("", response_model=CycleOut, status_code=status.HTTP_201_CREATED)
def add_cycle(
    payload: CycleIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rec = CycleEntry(id=new_uuid(), user_id=user.id, start_date=payload.start_date, notes=payload.notes)
    db.add(rec)
    db.commit()
    return CycleOut(id=rec.id, user_id=rec.user_id, start_date=rec.start_date, notes=rec.notes)


@router.get("", response_model=List[CycleOut])
def list_cycles(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(CycleEntry)
        .filter(CycleEntry.user_id == user.id)
        .order_by(CycleEntry.start_date.desc())
        .limit(24)
        .all()
    )
    return [CycleOut(id=r.id, user_id=r.user_id, start_date=r.start_date, notes=r.notes) for r in rows]


class CyclePredictOut(BaseModel):
    average_cycle_days: int
    predicted_next_start: date
    fertile_window_start: date
    fertile_window_end: date


@router.get("/predict", response_model=CyclePredictOut)
def predict_cycle(
    lookback: int = Query(6, ge=1, le=24),
    default_cycle_days: int = Query(28, ge=20, le=40),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(CycleEntry)
        .filter(CycleEntry.user_id == user.id)
        .order_by(CycleEntry.start_date.desc())
        .limit(lookback)
        .all()
    )
    if len(rows) < 2:
        avg = default_cycle_days
        last_start = rows[0].start_date if rows else date.today()
    else:
        # compute average diff in days between consecutive starts
        diffs: list[int] = []
        for i in range(len(rows) - 1):
            diffs.append((rows[i].start_date - rows[i+1].start_date).days)
        avg = max(1, int(round(sum(diffs) / len(diffs))))
        last_start = rows[0].start_date

    predicted = last_start + timedelta(days=avg)
    fertile_start = predicted - timedelta(days=14+2)
    fertile_end = predicted - timedelta(days=14-2)
    return CyclePredictOut(
        average_cycle_days=avg,
        predicted_next_start=predicted,
        fertile_window_start=fertile_start,
        fertile_window_end=fertile_end,
    )

