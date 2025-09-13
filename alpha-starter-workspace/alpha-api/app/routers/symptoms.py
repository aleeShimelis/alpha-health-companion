from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..models_symptoms import SymptomRecord
from ..security import get_current_user, new_uuid
from ..services.llm_client import llm_client
import json

router = APIRouter()


@router.post("", response_model=schemas.SymptomOut, status_code=201)
def create_symptom(
    payload: dict | str = Body(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    # Robust body handling: accept dict or JSON string
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    try:
        data = schemas.SymptomIn(**payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid request body")

    if not data.description or not data.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    rec = SymptomRecord(
        id=new_uuid(), user_id=user.id,
        description=data.description.strip(),
        severity=data.severity,
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


@router.put("/{symptom_id}", response_model=schemas.SymptomOut)
def update_symptom(
    symptom_id: str,
    payload: dict | str = Body(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    try:
        data = schemas.SymptomIn(**payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid request body")
    rec = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.id == symptom_id, SymptomRecord.user_id == user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Symptom not found")
    if data.description:
        rec.description = data.description.strip()
    rec.severity = data.severity
    db.commit()
    db.refresh(rec)
    return schemas.SymptomOut(id=rec.id, user_id=rec.user_id, created_at=rec.created_at, description=rec.description, severity=rec.severity)


@router.delete("/{symptom_id}", status_code=204)
def delete_symptom(
    symptom_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    deleted = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.id == symptom_id, SymptomRecord.user_id == user.id)
        .delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Symptom not found")
    db.commit()
    return


@router.post("/analyze", response_model=schemas.SymptomAnalysisOut)
def analyze_symptom(
    payload: dict | str = Body(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    try:
        data = schemas.SymptomIn(**payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid request body")

    description = (data.description or "").strip().lower()
    severity = (data.severity or "").strip().lower() if isinstance(data.severity, str) else None

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

    causes: list[str] = []
    implications: list[str] = []
    if llm_client.is_configured():
        try:
            llm = llm_client.analyzeSymptoms(data.description, data.severity if isinstance(data.severity, str) else None)
            for a in (llm.get("advice") or []):
                if a and a not in advice:
                    advice.append(a)
            for rf in (llm.get("risk_flags") or []):
                risk_flags.append(str(rf))
            causes = list(llm.get("causes") or [])
            implications = list(llm.get("implications") or [])
        except Exception:
            pass
    else:
        # basic heuristics
        if "fever" in description:
            causes.append("Possible viral or bacterial infection")
            implications.append("Monitor hydration and temperature; prolonged high fever warrants care")
        if "headache" in description:
            causes.append("Tension, migraine, or dehydration")
            implications.append("If sudden and severe, seek care")

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

    return schemas.SymptomAnalysisOut(advice=deduped, risk_flags=sorted(set(risk_flags)), causes=causes, implications=implications, disclaimer=disclaimer)
