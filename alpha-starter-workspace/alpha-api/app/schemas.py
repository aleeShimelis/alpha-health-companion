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
    severity: str | None = Field(default=None, max_length=32)


class SymptomOut(SymptomIn):
    id: str
    user_id: str
    created_at: datetime


class GoalIn(BaseModel):
    category: str = Field(pattern=r"^(fitness|sleep|nutrition|meds)$")
    target_value: str = Field(min_length=1, max_length=2000)
    cadence: str = Field(min_length=1, max_length=64)


class GoalOut(GoalIn):
    id: str
    user_id: str
    created_at: datetime

class GoalUpdateIn(BaseModel):
    category: str | None = None
    target_value: str | None = None
    cadence: str | None = None


class GoalProgressIn(BaseModel):
    value: str = Field(min_length=1, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)


class GoalProgressOut(BaseModel):
    id: str
    goal_id: str
    user_id: str
    value: str
    note: str | None = None
    created_at: datetime


# Profile schemas
class ProfileIn(BaseModel):
    age: int | None = None
    sex: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    allergies: list[str] | None = None
    conditions: list[str] | None = None
    sleep_pref: str | None = None


class ProfileOut(ProfileIn):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# Symptom analysis schemas
class SymptomAnalysisOut(BaseModel):
    advice: list[str]
    risk_flags: list[str]
    causes: list[str] = []
    implications: list[str] = []
    disclaimer: str


# Consent schemas
class ConsentIn(BaseModel):
    privacy_accepted: bool
    marketing_opt_in: bool = False


class ConsentOut(ConsentIn):
    id: str
    user_id: str
    created_at: datetime
