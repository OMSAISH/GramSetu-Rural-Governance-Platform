from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.grievance import Grievance
from app.schemas.grievance import (
    GrievanceCreate,
    GrievanceUpdateStatus,
    GrievanceResponse,
    GrievanceTrackResponse
)
from app.services.auth_service import get_optional_user, get_current_official, get_current_user
from app.services.sla_service import sla_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/grievances", tags=["Grievances"])

@router.post("", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
async def submit_grievance(
    payload: GrievanceCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine user_id
    user_id = payload.user_id or (current_user.id if current_user else None)
    if not user_id:
        # Check if fallback demo user exists or create guest user
        stmt = select(User).where(User.role == "citizen").limit(1)
        res = await db.execute(stmt)
        citizen = res.scalar_one_or_none()
        if citizen:
            user_id = citizen.id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID required or please log in as citizen."
            )

    raw_description = payload.description.strip()
    lang = payload.language or "en"

    # Translate to English for backend processing & official audit
    description_english = raw_description
    if lang != "en":
        description_english = translation_service.translate_to_english(raw_description, source_lang=lang)

    # Auto-classify category, assign department & SLA deadline if not explicitly provided
    if payload.category:
        category = payload.category
        from app.services.sla_service import CATEGORY_DEPARTMENTS, CATEGORY_SLA_DAYS
        department = CATEGORY_DEPARTMENTS.get(category, "Panchayat Development Office (PDO)")
        sla_days = CATEGORY_SLA_DAYS.get(category, 10)
    else:
        category, department, sla_days = sla_service.classify_grievance(description_english)

    deadline = sla_service.calculate_deadline(sla_days)
    tracking_id = sla_service.generate_tracking_id()

    grievance = Grievance(
        tracking_id=tracking_id,
        user_id=user_id,
        category=category,
        description=raw_description,
        description_english=description_english,
        status="submitted",
        department_assigned=department,
        sla_deadline=deadline,
        created_at=datetime.utcnow()
    )

    db.add(grievance)
    await db.commit()
    await db.refresh(grievance)

    # Fetch citizen name/phone for response
    citizen_stmt = select(User).where(User.id == user_id)
    c_res = await db.execute(citizen_stmt)
    c_user = c_res.scalar_one_or_none()

    return GrievanceResponse(
        id=grievance.id,
        tracking_id=grievance.tracking_id,
        user_id=grievance.user_id,
        citizen_name=c_user.name if c_user else None,
        citizen_phone=c_user.phone_number if c_user else None,
        category=grievance.category,
        description=grievance.description,
        description_english=grievance.description_english,
        status=grievance.status,
        department_assigned=grievance.department_assigned,
        sla_deadline=grievance.sla_deadline,
        is_sla_breached=datetime.utcnow() > grievance.sla_deadline and grievance.status != "resolved",
        created_at=grievance.created_at,
        resolved_at=grievance.resolved_at,
        resolution_notes=grievance.resolution_notes
    )

@router.get("/track/{tracking_id}", response_model=GrievanceTrackResponse)
async def track_grievance_by_tracking_id(
    tracking_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Grievance).where(Grievance.tracking_id == tracking_id.strip().upper())
    result = await db.execute(stmt)
    g = result.scalar_one_or_none()
    if not g:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grievance with Tracking ID '{tracking_id}' not found."
        )

    is_breached = datetime.utcnow() > g.sla_deadline and g.status != "resolved"

    return GrievanceTrackResponse(
        tracking_id=g.tracking_id,
        category=g.category,
        status=g.status,
        department_assigned=g.department_assigned,
        sla_deadline=g.sla_deadline,
        created_at=g.created_at,
        resolved_at=g.resolved_at,
        resolution_notes=g.resolution_notes,
        is_sla_breached=is_breached,
        description=g.description
    )

@router.get("/my", response_model=list[GrievanceResponse])
async def get_my_grievances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Grievance).where(Grievance.user_id == current_user.id).order_by(Grievance.created_at.desc())
    result = await db.execute(stmt)
    grievances = result.scalars().all()

    now = datetime.utcnow()
    return [
        GrievanceResponse(
            id=g.id,
            tracking_id=g.tracking_id,
            user_id=g.user_id,
            citizen_name=current_user.name,
            citizen_phone=current_user.phone_number,
            category=g.category,
            description=g.description,
            description_english=g.description_english,
            status=g.status,
            department_assigned=g.department_assigned,
            sla_deadline=g.sla_deadline,
            is_sla_breached=now > g.sla_deadline and g.status != "resolved",
            created_at=g.created_at,
            resolved_at=g.resolved_at,
            resolution_notes=g.resolution_notes
        )
        for g in grievances
    ]

@router.get("", response_model=list[GrievanceResponse])
async def list_grievances_official(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    sla_breached_only: bool = False,
    current_official: User = Depends(get_current_official),
    db: AsyncSession = Depends(get_db)
):
    conditions = []
    if status_filter:
        conditions.append(Grievance.status == status_filter)
    if category_filter:
        conditions.append(Grievance.category == category_filter)
    if sla_breached_only:
        conditions.append(and_(Grievance.sla_deadline < datetime.utcnow(), Grievance.status != "resolved"))

    stmt = select(Grievance, User).join(User, Grievance.user_id == User.id)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    stmt = stmt.order_by(Grievance.created_at.desc())

    result = await db.execute(stmt)
    records = result.all()

    now = datetime.utcnow()
    responses = []
    for g, u in records:
        responses.append(GrievanceResponse(
            id=g.id,
            tracking_id=g.tracking_id,
            user_id=g.user_id,
            citizen_name=u.name,
            citizen_phone=u.phone_number,
            category=g.category,
            description=g.description,
            description_english=g.description_english,
            status=g.status,
            department_assigned=g.department_assigned,
            sla_deadline=g.sla_deadline,
            is_sla_breached=now > g.sla_deadline and g.status != "resolved",
            created_at=g.created_at,
            resolved_at=g.resolved_at,
            resolution_notes=g.resolution_notes
        ))
    return responses

@router.get("/{grievance_id}", response_model=GrievanceResponse)
async def get_grievance_by_id(grievance_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Grievance, User).join(User, Grievance.user_id == User.id).where(Grievance.id == grievance_id)
    result = await db.execute(stmt)
    record = result.first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    g, u = record
    now = datetime.utcnow()
    return GrievanceResponse(
        id=g.id,
        tracking_id=g.tracking_id,
        user_id=g.user_id,
        citizen_name=u.name,
        citizen_phone=u.phone_number,
        category=g.category,
        description=g.description,
        description_english=g.description_english,
        status=g.status,
        department_assigned=g.department_assigned,
        sla_deadline=g.sla_deadline,
        is_sla_breached=now > g.sla_deadline and g.status != "resolved",
        created_at=g.created_at,
        resolved_at=g.resolved_at,
        resolution_notes=g.resolution_notes
    )

@router.patch("/{grievance_id}", response_model=GrievanceResponse)
async def update_grievance_status(
    grievance_id: int,
    update_data: GrievanceUpdateStatus,
    current_official: User = Depends(get_current_official),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Grievance).where(Grievance.id == grievance_id)
    result = await db.execute(stmt)
    g = result.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    g.status = update_data.status
    if update_data.resolution_notes:
        g.resolution_notes = update_data.resolution_notes

    if update_data.status == "resolved":
        g.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(g)

    user_stmt = select(User).where(User.id == g.user_id)
    u_res = await db.execute(user_stmt)
    user = u_res.scalar_one_or_none()

    now = datetime.utcnow()
    return GrievanceResponse(
        id=g.id,
        tracking_id=g.tracking_id,
        user_id=g.user_id,
        citizen_name=user.name if user else None,
        citizen_phone=user.phone_number if user else None,
        category=g.category,
        description=g.description,
        description_english=g.description_english,
        status=g.status,
        department_assigned=g.department_assigned,
        sla_deadline=g.sla_deadline,
        is_sla_breached=now > g.sla_deadline and g.status != "resolved",
        created_at=g.created_at,
        resolved_at=g.resolved_at,
        resolution_notes=g.resolution_notes
    )
