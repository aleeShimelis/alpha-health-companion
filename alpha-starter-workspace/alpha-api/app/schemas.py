from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class VitalIn(BaseModel):
    systolic: float | None = None
    diastolic: float | None = None
    heart_rate: float | None = None
    temperature_c: float | None = None
    glucose_mgdl: float | None = None
    weight_kg: float | None = None


class VitalOut(VitalIn):
    id: str
    user_id: str
    created_at: datetime
    # basic flags for quick UI badges
    bp_flag: str | None = None
    hr_flag: str | None = None
    temp_flag: str | None = None
    glucose_flag: str | None = None

class SymptomIn(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    severity: int | None = Field(default=None, ge=0, le=10)
    onset_at: datetime | None = None


class SymptomOut(SymptomIn):
    id: str
    user_id: str
    created_at: datetime