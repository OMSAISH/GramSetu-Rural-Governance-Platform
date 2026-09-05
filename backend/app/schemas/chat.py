from typing import Any, Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    user_id: Optional[int] = None
    message: str
    language: str = "en"  # en, hi, mr
    context: Optional[dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    language: str
    intent_detected: str  # scheme_check, grievance, governance_query, general
    suggested_actions: list[str] = []
    metadata: Optional[dict[str, Any]] = None
