from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..models_symptoms import SymptomRecord
from ..security import get_current_user, new_uuid
from ..services.llm_client import llm_client

router = APIRouter()


@router.post("", response_model=schemas.SymptomOut, status_code=201)
def create_symptom(
    payload: schemas.SymptomIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    rec = SymptomRecord(
        id=new_uuid(), user_id=user.id,
        description=payload.description.strip(),
        severity=payload.severity,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return schemas.SymptomOut(
        id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
        description=rec.description, severity=rec.severity,
    )


@router.get("", response_model=list[schemas.SymptomOut])
def list_symptoms(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.user_id == user.id)
        .order_by(SymptomRecord.created_at.desc())
        .limit(50)
        .all()
    )
    out: list[schemas.SymptomOut] = []
    for rec in rows:
        out.append(schemas.SymptomOut(
            id=rec.id, user_id=rec.user_id, created_at=rec.created_at,
            description=rec.description, severity=rec.severity,
        ))
    return out


@router.post("/analyze", response_model=schemas.SymptomAnalysisOut)
def analyze_symptom(
    payload: schemas.SymptomIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    description = (payload.description or "").strip().lower()
    severity = (payload.severity or "").strip().lower() if isinstance(payload.severity, str) else None

    advice: list[str] = []
    risk_flags: list[str] = []

    # Simple rule-based hints
    if severity == "severe":
        risk_flags.append("seek-care")
        advice.append("If symptoms worsen or persist, seek medical care.")
    if any(k in description for k in ["chest pain", "shortness of breath", "fainting"]):
        risk_flags.append("urgent")
        advice.append("These could indicate urgent issues; consider immediate care.")
    if "fever" in description:
        advice.append("Hydrate and rest; monitor temperature.")
    if "headache" in description:
        advice.append("Consider rest, hydration, and a calm environment.")

    if llm_client.is_configured():
        # Optionally enrich with LLM while keeping guardrails
        llm = llm_client.decodeMedication("general symptom guidance", None)
        extra = llm.get("usage")
        if extra:
            advice.append(extra)

    disclaimer = (
        "General, non-clinical guidance only. Not a diagnosis. "
        "If in doubt or symptoms are severe, consult a qualified professional."
    )
    # Deduplicate advice
    seen = set()
    deduped = []
    for a in advice:
        if a and a not in seen:
            seen.add(a)
            deduped.append(a)

    return schemas.SymptomAnalysisOut(advice=deduped, risk_flags=sorted(set(risk_flags)), disclaimer=disclaimer)
