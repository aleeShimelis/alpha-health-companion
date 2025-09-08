from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from ..security import get_current_user


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


