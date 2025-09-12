from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Any, Dict
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from ..security import get_current_user
from ..security import new_uuid
from ..models_push import PushSubscription
import json


class ReminderPreview(BaseModel):
    times: List[datetime]


router = APIRouter()


@router.get("/preview", response_model=ReminderPreview)
def preview_reminders(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    now = datetime.utcnow()
    # stub: show three upcoming daily reminders at 24h cadence
    return ReminderPreview(
        times=[now + timedelta(days=i) for i in range(1, 4)]
    )


class PushSubscriptionIn(BaseModel):
    endpoint: str
    keys: Dict[str, str] | None = None


class PushSubscriptionOut(BaseModel):
    status: str


@router.post("/subscriptions", response_model=PushSubscriptionOut, status_code=status.HTTP_201_CREATED)
def add_subscription(
    payload: PushSubscriptionIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if not payload.endpoint:
        raise HTTPException(status_code=400, detail="endpoint required")
    # Upsert by (user_id, endpoint)
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user.id)
        .filter(PushSubscription.endpoint == payload.endpoint)
        .first()
    )
    if not existing:
        rec = PushSubscription(
            id=new_uuid(), user_id=user.id,
            endpoint=payload.endpoint,
            keys_json=(None if not payload.keys else json.dumps(payload.keys)),
        )
        db.add(rec)
        db.commit()
    return PushSubscriptionOut(status="stored")


