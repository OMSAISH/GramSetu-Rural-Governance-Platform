from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class GovernanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    panchayat_id: str
    title: str
    description: str
    category: str # meeting, work, fund
    date: datetime
    status: str
    amount: Optional[float] = None

class GovernanceQueryRequest(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    language: Optional[str] = "en"
