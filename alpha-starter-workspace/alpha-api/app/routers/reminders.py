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
from ..models_reminders import Reminder
import json
from ..config import settings

try:
    from pywebpush import webpush, WebPushException  # type: ignore
except Exception:
    webpush = None  # type: ignore
    WebPushException = Exception  # type: ignore


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


class PushSubscriptionListItem(BaseModel):
    endpoint: str
    created_at: datetime


@router.get("/subscriptions", response_model=List[PushSubscriptionListItem])
def list_subscriptions(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user.id)
        .order_by(PushSubscription.created_at.desc())
        .limit(100)
        .all()
    )
    return [PushSubscriptionListItem(endpoint=r.endpoint, created_at=r.created_at) for r in rows]


class PushSubscriptionDeleteIn(BaseModel):
    endpoint: str


@router.delete("/subscriptions", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    payload: PushSubscriptionDeleteIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if not payload.endpoint:
        raise HTTPException(status_code=400, detail="endpoint required")
    (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user.id)
        .filter(PushSubscription.endpoint == payload.endpoint)
        .delete(synchronize_session=False)
    )
    db.commit()
    return


class SendTestIn(BaseModel):
    title: str | None = None
    body: str | None = None


class SendTestOut(BaseModel):
    queued: int


@router.post("/send-test", response_model=SendTestOut)
def send_test(
    payload: SendTestIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    # Stub: In future, deliver Web Push using VAPID keys
    count = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user.id)
        .count()
    )
    return SendTestOut(queued=int(count))


class SendNowIn(BaseModel):
    title: str = "ALPHA Reminder"
    body: str = "You have a reminder"


class SendNowOut(BaseModel):
    sent: int
    failed: int


@router.post("/send", response_model=SendNowOut)
def send_now(
    payload: SendNowIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if not (settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY and settings.VAPID_EMAIL):
        raise HTTPException(status_code=501, detail="Web Push not configured")
    if webpush is None:
        raise HTTPException(status_code=501, detail="pywebpush not installed")

    rows = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user.id)
        .all()
    )
    sent = 0
    failed = 0
    for r in rows:
        try:
            keys = json.loads(r.keys_json) if r.keys_json else {}
            webpush(
                subscription_info={
                    "endpoint": r.endpoint,
                    "keys": keys,
                },
                data=json.dumps({"title": payload.title, "body": payload.body}),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_EMAIL}"},
            )
            sent += 1
        except WebPushException:
            failed += 1
        except Exception:
            failed += 1
    return SendNowOut(sent=sent, failed=failed)


class ReminderIn(BaseModel):
    message: str
    scheduled_at: datetime
    recurrence: str | None = None  # none|daily|weekly


class ReminderOut(ReminderIn):
    id: str
    user_id: str
    sent_at: datetime | None


@router.post("", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def schedule_reminder(
    payload: ReminderIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rec = Reminder(id=new_uuid(), user_id=user.id, message=payload.message, scheduled_at=payload.scheduled_at, recurrence=payload.recurrence)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return ReminderOut(id=rec.id, user_id=rec.user_id, message=rec.message, scheduled_at=rec.scheduled_at, sent_at=rec.sent_at)


@router.get("", response_model=List[ReminderOut])
def list_reminders(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(Reminder)
        .filter(Reminder.user_id == user.id)
        .order_by(Reminder.scheduled_at.desc())
        .limit(200)
        .all()
    )
    return [ReminderOut(id=r.id, user_id=r.user_id, message=r.message, scheduled_at=r.scheduled_at, sent_at=r.sent_at) for r in rows]


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    deleted = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return


@router.put("/{reminder_id}", response_model=ReminderOut)
def update_reminder(
    reminder_id: str,
    payload: ReminderIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rec = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Reminder not found")
    rec.message = payload.message
    rec.scheduled_at = payload.scheduled_at
    rec.recurrence = payload.recurrence
    db.commit()
    db.refresh(rec)
    return ReminderOut(id=rec.id, user_id=rec.user_id, message=rec.message, scheduled_at=rec.scheduled_at, sent_at=rec.sent_at, recurrence=rec.recurrence)


