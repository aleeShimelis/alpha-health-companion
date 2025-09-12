from datetime import datetime, date, timedelta
from sqlalchemy import String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


def utcnow() -> datetime: return datetime.utcnow()


class CycleEntry(Base):
    __tablename__ = "cycle_entries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

