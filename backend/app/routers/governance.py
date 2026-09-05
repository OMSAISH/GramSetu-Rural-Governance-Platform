from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.governance import GovernanceRecord
from app.schemas.governance import GovernanceRecordResponse

router = APIRouter(prefix="/governance", tags=["Governance & Panchayat Records"])

@router.get("/records", response_model=list[GovernanceRecordResponse])
async def list_governance_records(
    category: Optional[str] = Query(None, pattern="^(meeting|work|fund)$"),
    search: Optional[str] = None,
    language: str = Query("en", pattern="^(en|hi|mr)$"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GovernanceRecord)
    conditions = []
    
    if category:
        conditions.append(GovernanceRecord.category == category)
    if search:
        search_pattern = f"%{search.strip()}%"
        conditions.append(
            (GovernanceRecord.title.ilike(search_pattern)) | 
            (GovernanceRecord.description.ilike(search_pattern))
        )
        
    if conditions:
        stmt = stmt.where(and_(*conditions))
        
    stmt = stmt.order_by(GovernanceRecord.date.desc())
    result = await db.execute(stmt)
    records = result.scalars().all()

    localized = []
    for r in records:
        title = r.title
        description = r.description
        if language == "hi" and r.title_hi:
            title = r.title_hi
            description = r.description_hi or description
        elif language == "mr" and r.title_mr:
            title = r.title_mr
            description = r.description_mr or description

        localized.append(GovernanceRecordResponse(
            id=r.id,
            panchayat_id=r.panchayat_id,
            title=title,
            description=description,
            category=r.category,
            date=r.date,
            status=r.status,
            amount=r.amount
        ))

    return localized
