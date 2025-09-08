from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


def utcnow() -> datetime: return datetime.utcnow()


class VitalRecord(Base):
    __tablename__ = "vital_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    systolic: Mapped[float | None] = mapped_column(Float, nullable=True)
    diastolic: Mapped[float | None] = mapped_column(Float, nullable=True)
    heart_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    glucose_mgdl: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False)
