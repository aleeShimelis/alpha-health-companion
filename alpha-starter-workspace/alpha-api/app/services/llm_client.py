import os
from typing import Any, Dict, List, Optional

try:
    import openai  # type: ignore
except Exception:
    openai = None  # type: ignore


class LlmClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _ensure_client(self):
        if not (self.api_key and openai):
            return None
        try:
            client = openai.OpenAI(api_key=self.api_key)
            return client
        except Exception:
            return None

    def decodeMedication(self, name: str, user_context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        # Always return non-clinical, non-diagnostic guidance
        client = self._ensure_client()
        disclaimer = (
            "This is general, non-clinical information for awareness only. "
            "No diagnosis or personalized medical advice. Avoid dosage guidance beyond "
            "official labeling. Consult a qualified healthcare professional for any decisions."
        )
        if not client:
            return {
                "purpose": f"General information about {name} in a non-clinical tone.",
                "common_side_effects": ["nausea", "headache", "drowsiness"],
                "interactions": ["may interact with alcohol", "check other prescriptions"],
                "usage": "Follow the product label and pharmacist guidance. Do not exceed labeled instructions.",
                "disclaimer": disclaimer,
            }

        prompt = (
            "You are a health information assistant. Provide non-clinical, plain-language info about the medication. "
            "Do NOT give dosing advice beyond the official label; avoid diagnosis. Return JSON with keys: purpose, "
            "common_side_effects (array), interactions (array), usage, disclaimer."
        )
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Medication: {name}. Context: {user_context or {}}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            text = resp.choices[0].message.content or "{}"
            import json as _json
            data = _json.loads(text)
            data.setdefault("disclaimer", disclaimer)
            return data
        except Exception:
            return {
                "purpose": f"General information about {name} in a non-clinical tone.",
                "common_side_effects": ["nausea", "headache", "drowsiness"],
                "interactions": ["may interact with alcohol", "check other prescriptions"],
                "usage": "Follow the product label and pharmacist guidance. Do not exceed labeled instructions.",
                "disclaimer": disclaimer,
            }

    def analyzeSymptoms(self, description: str, severity: Optional[str] = None) -> Dict[str, Any]:
        client = self._ensure_client()
        disclaimer = (
            "General, non-clinical guidance only. Not a diagnosis. "
            "If in doubt or symptoms are severe, consult a qualified professional."
        )
        if not client:
            tips: List[str] = []
            d = description.lower()
            if "fever" in d:
                tips.append("Hydrate and rest; monitor temperature.")
            if "headache" in d:
                tips.append("Consider rest, hydration, and a calm environment.")
            if (severity or "").lower() == "severe":
                tips.append("If symptoms worsen or persist, seek medical care.")
            return {"advice": tips or ["Monitor symptoms and seek care if they worsen."], "risk_flags": [], "disclaimer": disclaimer}
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": (
                        "You are a non-clinical symptom assistant. Provide general wellness advice and potential risk flags. "
                        "DO NOT diagnose. Avoid clinical instructions. Return JSON with keys: advice (array), risk_flags (array), disclaimer."
                    )},
                    {"role": "user", "content": f"Description: {description}. Severity: {severity or ''}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            text = resp.choices[0].message.content or "{}"
            import json as _json
            data = _json.loads(text)
            data.setdefault("disclaimer", disclaimer)
            # Normalize shapes
            data["advice"] = list(data.get("advice") or [])
            data["risk_flags"] = list(data.get("risk_flags") or [])
            return data
        except Exception:
            return {"advice": ["Monitor symptoms and seek care if they worsen."], "risk_flags": [], "disclaimer": disclaimer}


llm_client = LlmClient()


