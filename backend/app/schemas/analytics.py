from typing import Any
from pydantic import BaseModel

class CategoryGrievanceCount(BaseModel):
    category: str
    count: int

class StatusGrievanceCount(BaseModel):
    status: str
    count: int

class SchemeUptakeStat(BaseModel):
    scheme_id: int
    scheme_name: str
    total_checks: int
    eligible_count: int
    eligibility_rate_percent: float

class GrievanceTimeTrend(BaseModel):
    date: str
    count: int

class DashboardAnalyticsResponse(BaseModel):
    total_grievances: int
    open_grievances: int
    escalated_grievances: int
    resolved_grievances: int
    sla_breached_grievances: int
    resolution_rate_percent: float
    total_citizens: int
    total_scheme_checks: int
    
    grievances_by_category: list[CategoryGrievanceCount]
    grievances_by_status: list[StatusGrievanceCount]
    grievance_trends: list[GrievanceTimeTrend]
    scheme_uptake: list[SchemeUptakeStat]
