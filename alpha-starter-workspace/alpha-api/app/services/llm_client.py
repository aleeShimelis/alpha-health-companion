import os
from typing import Any, Dict, List


class LlmClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def decodeMedication(self, name: str, user_context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        # NOTE: Keep tone non-clinical and informational. No diagnosis or dosing advice beyond label.
        # In a future iteration, integrate OpenAI client here. For now, return a minimal structured
        # response using simple heuristics to avoid blocking development when the key exists.
        context_bits: List[str] = []
        if user_context:
            if user_context.get("age") is not None:
                context_bits.append(f"age {user_context['age']}")
            if user_context.get("sex"):
                context_bits.append(f"sex {user_context['sex']}")
            if user_context.get("allergies"):
                context_bits.append("has allergies")
        context_text = ("; ".join(context_bits)) if context_bits else "no specific context"

        disclaimer = (
            "This is general, non-clinical information for awareness only. "
            "No diagnosis or personalized medical advice. Avoid dosage guidance beyond "
            "official labeling. Consult a qualified healthcare professional for any decisions."
        )

        # Placeholder content; replace with actual LLM call using system prompt guardrails
        return {
            "purpose": f"General information about {name} in a non-clinical tone.",
            "common_side_effects": ["nausea", "headache", "drowsiness"],
            "interactions": ["may interact with alcohol", "check other prescriptions"],
            "usage": "Follow the product label and pharmacist guidance. Do not exceed labeled instructions.",
            "disclaimer": disclaimer,
            "_context": context_text,  # optional debug field; router can omit if desired
        }


llm_client = LlmClient()


