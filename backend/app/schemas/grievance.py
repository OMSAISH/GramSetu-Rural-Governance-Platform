from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class GrievanceCreate(BaseModel):
    user_id: Optional[int] = None
    description: str
    language: str = "en"
    category: Optional[str] = None # if user manually picked, else auto-classified

class GrievanceUpdateStatus(BaseModel):
    status: str # submitted, in_progress, escalated, resolved
    resolution_notes: Optional[str] = None

class GrievanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tracking_id: str
    user_id: int
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    category: str
    description: str
    description_english: str
    status: str
    department_assigned: str
    sla_deadline: datetime
    is_sla_breached: bool = False
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

class GrievanceTrackResponse(BaseModel):
    tracking_id: str
    category: str
    status: str
    department_assigned: str
    sla_deadline: datetime
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    is_sla_breached: bool
    description: str
