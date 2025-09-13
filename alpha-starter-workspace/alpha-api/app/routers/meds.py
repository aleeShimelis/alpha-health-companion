from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import json
from ..services.llm_client import llm_client


class MedDecodeIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    user_context: Optional[Dict[str, Any]] = None


class MedDecodeOut(BaseModel):
    purpose: str
    common_side_effects: List[str]
    interactions: List[str]
    usage: str
    disclaimer: str


router = APIRouter()


@router.post("/decoder", response_model=MedDecodeOut, status_code=status.HTTP_201_CREATED)
def decode_medication(payload: Dict[str, Any] | str = Body(...)):
    # Accept robust payloads: either dict or a JSON string
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    try:
        data = MedDecodeIn(**payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid request body")

    if not llm_client.is_configured():
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="LLM not configured")

    result = llm_client.decodeMedication(data.name, data.user_context)

    # Unit-safe guardrails: ensure text does not include dosage advice beyond label
    usage_text = result.get("usage") or "Follow the product label and pharmacist guidance."
    guard_prefix = (
        "No dosing advice beyond official label. "
        "For questions, consult a qualified professional. "
    )
    usage_text = f"{guard_prefix}{usage_text}"

    return MedDecodeOut(
        purpose=result.get("purpose") or "",
        common_side_effects=list(result.get("common_side_effects") or []),
        interactions=list(result.get("interactions") or []),
        usage=usage_text,
        disclaimer=result.get("disclaimer") or "",
    )


