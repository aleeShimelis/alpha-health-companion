from datetime import datetime, timedelta
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..models_vitals import VitalRecord
from ..models_symptoms import SymptomRecord
from ..security import get_current_user


# Minimal flag helpers (kept consistent with vitals router thresholds)
def flag_bp(sys: Optional[float], dia: Optional[float]) -> Optional[str]:
    if sys is None or dia is None:
        return None
    if sys >= 180 or dia >= 120:
        return "hypertensive-crisis"
    if sys >= 140 or dia >= 90:
        return "hypertension-stage2"
    if sys >= 130 or dia >= 80:
        return "hypertension-stage1"
    if sys >= 120 and dia < 80:
        return "elevated"
    return "normal"


def flag_hr(hr: Optional[float]) -> Optional[str]:
    if hr is None:
        return None
    if hr < 40:
        return "bradycardia-severe"
    if hr < 60:
        return "bradycardia"
    if hr > 120:
        return "tachycardia-severe"
    if hr > 100:
        return "tachycardia"
    return "normal"


def flag_temp(t: Optional[float]) -> Optional[str]:
    if t is None:
        return None
    if t >= 39.0:
        return "fever-high"
    if t >= 38.0:
        return "fever"
    if t < 35.0:
        return "hypothermia"
    return "normal"


def flag_glucose(g: Optional[float]) -> Optional[str]:
    if g is None:
        return None
    if g >= 240:
        return "hyperglycemia"
    if g < 70:
        return "hypoglycemia"
    return "normal"


class VitalsSummary(BaseModel):
    total: int
    bp: Dict[str, int]
    hr: Dict[str, int]
    temp: Dict[str, int]
    glucose: Dict[str, int]


class SymptomSummary(BaseModel):
    total: int
    by_severity: Dict[str, int]


class ReportSummaryOut(BaseModel):
    period: Literal["week", "month"]
    vitals_summary: VitalsSummary
    symptom_summary: SymptomSummary
    markdown: str


router = APIRouter()


@router.get("/summary", response_model=ReportSummaryOut)
def get_summary(
    period: Literal["week", "month"] = Query("week"),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    now = datetime.utcnow()
    start = now - timedelta(days=7 if period == "week" else 30)

    # Vitals aggregation
    vitals_rows: List[VitalRecord] = (
        db.query(VitalRecord)
        .filter(VitalRecord.user_id == user.id)
        .filter(VitalRecord.created_at >= start)
        .order_by(VitalRecord.created_at.desc())
        .all()
    )

    bp_counts: Dict[str, int] = {k: 0 for k in [
        "normal", "elevated", "hypertension-stage1", "hypertension-stage2", "hypertensive-crisis"
    ]}
    hr_counts: Dict[str, int] = {k: 0 for k in [
        "normal", "bradycardia", "bradycardia-severe", "tachycardia", "tachycardia-severe"
    ]}
    temp_counts: Dict[str, int] = {k: 0 for k in [
        "normal", "fever", "fever-high", "hypothermia"
    ]}
    glucose_counts: Dict[str, int] = {k: 0 for k in [
        "normal", "hypoglycemia", "hyperglycemia"
    ]}

    for r in vitals_rows:
        bpf = flag_bp(r.systolic, r.diastolic)
        if bpf:
            bp_counts[bpf] = bp_counts.get(bpf, 0) + 1
        hrf = flag_hr(r.heart_rate)
        if hrf:
            hr_counts[hrf] = hr_counts.get(hrf, 0) + 1
        tf = flag_temp(r.temperature_c)
        if tf:
            temp_counts[tf] = temp_counts.get(tf, 0) + 1
        gf = flag_glucose(r.glucose_mgdl)
        if gf:
            glucose_counts[gf] = glucose_counts.get(gf, 0) + 1

    vitals_summary = VitalsSummary(
        total=len(vitals_rows),
        bp=bp_counts,
        hr=hr_counts,
        temp=temp_counts,
        glucose=glucose_counts,
    )

    # Symptoms aggregation
    sym_rows: List[SymptomRecord] = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.user_id == user.id)
        .filter(SymptomRecord.created_at >= start)
        .order_by(SymptomRecord.created_at.desc())
        .all()
    )
    by_severity: Dict[str, int] = {}
    for s in sym_rows:
        sev = (s.severity or "unspecified").strip().lower()
        by_severity[sev] = by_severity.get(sev, 0) + 1

    symptom_summary = SymptomSummary(total=len(sym_rows), by_severity=by_severity)

    # Markdown summary
    lines: List[str] = []
    lines.append(f"# ALPHA Summary ({period})")
    lines.append("")
    lines.append("## Vitals")
    lines.append(f"Total entries: {vitals_summary.total}")
    lines.append(
        f"BP flags: normal {bp_counts['normal']}, elevated {bp_counts['elevated']}, "
        f"stage1 {bp_counts['hypertension-stage1']}, stage2 {bp_counts['hypertension-stage2']}, "
        f"crisis {bp_counts['hypertensive-crisis']}"
    )
    lines.append(
        f"HR flags: normal {hr_counts['normal']}, brady {hr_counts['bradycardia']}/{hr_counts['bradycardia-severe']}, "
        f"tachy {hr_counts['tachycardia']}/{hr_counts['tachycardia-severe']}"
    )
    lines.append(
        f"Temp flags: normal {temp_counts['normal']}, fever {temp_counts['fever']}, "
        f"fever-high {temp_counts['fever-high']}, hypothermia {temp_counts['hypothermia']}"
    )
    lines.append(
        f"Glucose flags: normal {glucose_counts['normal']}, hypo {glucose_counts['hypoglycemia']}, "
        f"hyper {glucose_counts['hyperglycemia']}"
    )
    lines.append("")
    lines.append("## Symptoms")
    lines.append(f"Total reports: {symptom_summary.total}")
    if by_severity:
        sev_str = ", ".join(f"{k}: {v}" for k, v in by_severity.items())
        lines.append(f"By severity: {sev_str}")
    else:
        lines.append("By severity: none")
    lines.append("")
    lines.append(
        "Note: This summary is informational and non-clinical. For medical concerns, consult a professional."
    )

    markdown = "\n".join(lines)

    return ReportSummaryOut(
        period=period,
        vitals_summary=vitals_summary,
        symptom_summary=symptom_summary,
        markdown=markdown,
    )


