from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.grievance import Grievance
from app.models.eligibility import EligibilityCheck
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    CategoryGrievanceCount,
    StatusGrievanceCount,
    SchemeUptakeStat,
    GrievanceTimeTrend
)
from app.services.auth_service import get_current_official
from app.services.sla_service import sla_service

router = APIRouter(prefix="/analytics", tags=["Official Analytics & Insights"])

@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
async def get_dashboard_metrics(
    current_official: User = Depends(get_current_official),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()

    # 1. Total grievances
    total_g_res = await db.execute(select(func.count(Grievance.id)))
    total_grievances = total_g_res.scalar() or 0

    # 2. Status counts
    status_stmt = select(Grievance.status, func.count(Grievance.id)).group_by(Grievance.status)
    status_res = await db.execute(status_stmt)
    status_map = dict(status_res.all())

    open_grievances = status_map.get("submitted", 0) + status_map.get("in_progress", 0)
    escalated_grievances = status_map.get("escalated", 0)
    resolved_grievances = status_map.get("resolved", 0)

    # 3. SLA Breached count
    breach_stmt = select(func.count(Grievance.id)).where(
        Grievance.sla_deadline < now,
        Grievance.status != "resolved"
    )
    breach_res = await db.execute(breach_stmt)
    sla_breached = breach_res.scalar() or 0

    resolution_rate = round((resolved_grievances / total_grievances * 100), 1) if total_grievances > 0 else 0.0

    # 4. Total registered citizens
    cit_stmt = select(func.count(User.id)).where(User.role == "citizen")
    cit_res = await db.execute(cit_stmt)
    total_citizens = cit_res.scalar() or 0

    # 5. Grievances by category
    cat_stmt = select(Grievance.category, func.count(Grievance.id)).group_by(Grievance.category)
    cat_res = await db.execute(cat_stmt)
    grievances_by_category = [
        CategoryGrievanceCount(category=cat, count=cnt)
        for cat, cnt in cat_res.all()
    ]

    grievances_by_status = [
        StatusGrievanceCount(status=st, count=cnt)
        for st, cnt in status_map.items()
    ]

    # 6. Scheme Uptake Stats
    schemes_stmt = select(Scheme).order_by(Scheme.id)
    s_res = await db.execute(schemes_stmt)
    all_schemes = s_res.scalars().all()

    scheme_uptake = []
    total_scheme_checks = 0

    for s in all_schemes:
        total_s_stmt = select(func.count(EligibilityCheck.id)).where(EligibilityCheck.scheme_id == s.id)
        el_s_stmt = select(func.count(EligibilityCheck.id)).where(
            EligibilityCheck.scheme_id == s.id,
            EligibilityCheck.is_eligible.is_(True)
        )
        t_res = await db.execute(total_s_stmt)
        e_res = await db.execute(el_s_stmt)
        total_checks = t_res.scalar() or 0
        eligible_count = e_res.scalar() or 0
        total_scheme_checks += total_checks

        rate = round((eligible_count / total_checks * 100), 1) if total_checks > 0 else 0.0
        scheme_uptake.append(SchemeUptakeStat(
            scheme_id=s.id,
            scheme_name=s.name,
            total_checks=total_checks,
            eligible_count=eligible_count,
            eligibility_rate_percent=rate
        ))

    # 7. Grievance Time Trends (past 7 days)
    trends = []
    for i in range(6, -1, -1):
        target_day = now.date() - timedelta(days=i)
        day_start = datetime.combine(target_day, datetime.min.time())
        day_end = datetime.combine(target_day, datetime.max.time())

        cnt_stmt = select(func.count(Grievance.id)).where(
            Grievance.created_at >= day_start,
            Grievance.created_at <= day_end
        )
        cnt_res = await db.execute(cnt_stmt)
        day_count = cnt_res.scalar() or 0
        trends.append(GrievanceTimeTrend(
            date=target_day.strftime("%d %b"),
            count=day_count
        ))

    return DashboardAnalyticsResponse(
        total_grievances=total_grievances,
        open_grievances=open_grievances,
        escalated_grievances=escalated_grievances,
        resolved_grievances=resolved_grievances,
        sla_breached_grievances=sla_breached,
        resolution_rate_percent=resolution_rate,
        total_citizens=total_citizens,
        total_scheme_checks=total_scheme_checks,
        grievances_by_category=grievances_by_category,
        grievances_by_status=grievances_by_status,
        grievance_trends=trends,
        scheme_uptake=scheme_uptake
    )

@router.post("/trigger-sla-escalation")
async def trigger_sla_escalation(
    current_official: User = Depends(get_current_official),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually triggers background SLA check and marks overdue grievances as escalated.
    """
    count = await sla_service.check_and_escalate_overdue_grievances(db)
    return {"message": f"SLA check completed. {count} overdue grievances escalated.", "escalated_count": count}
