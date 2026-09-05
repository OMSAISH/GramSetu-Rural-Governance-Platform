from typing import Any, Optional
from pydantic import BaseModel, ConfigDict

class SchemeBase(BaseModel):
    name: str
    name_hi: Optional[str] = None
    name_mr: Optional[str] = None
    description: str
    description_hi: Optional[str] = None
    description_mr: Optional[str] = None
    department: str
    eligibility_rules: dict[str, Any]
    required_documents: list[str]
    application_link: Optional[str] = None

class SchemeResponse(SchemeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

class SchemeCheckRequest(BaseModel):
    user_id: Optional[int] = None
    # If user provides custom one-off answers in chat or form:
    age: Optional[int] = None
    annual_income: Optional[float] = None
    category: Optional[str] = None
    land_owned_acres: Optional[float] = None
    occupation: Optional[str] = None
    gender: Optional[str] = None
    has_disability: Optional[str] = None
    preferred_language: Optional[str] = "en"

class SchemeEligibilityItem(BaseModel):
    scheme_id: int
    scheme_name: str
    department: str
    is_eligible: bool
    reason: str
    required_documents: list[str]
    application_download_url: str

class SchemeCheckSummary(BaseModel):
    total_schemes: int
    eligible_count: int
    results: list[SchemeEligibilityItem]
