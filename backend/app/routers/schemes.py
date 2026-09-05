from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.eligibility import EligibilityCheck
from app.schemas.scheme import (
    SchemeResponse,
    SchemeCheckRequest,
    SchemeCheckSummary,
    SchemeEligibilityItem
)
from app.services.auth_service import get_optional_user, get_current_user
from app.services.rule_engine import rule_evaluator
from app.services.pdf_service import pdf_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/schemes", tags=["Welfare Schemes"])

@router.get("", response_model=list[SchemeResponse])
async def list_schemes(
    language: str = Query("en", pattern="^(en|hi|mr)$"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Scheme).order_by(Scheme.id)
    result = await db.execute(stmt)
    schemes = result.scalars().all()
    
    localized_schemes = []
    for s in schemes:
        name = s.name
        description = s.description
        if language == "hi" and s.name_hi:
            name = s.name_hi
            description = s.description_hi or description
        elif language == "mr" and s.name_mr:
            name = s.name_mr
            description = s.description_mr or description
            
        localized_schemes.append(SchemeResponse(
            id=s.id,
            name=name,
            name_hi=s.name_hi,
            name_mr=s.name_mr,
            description=description,
            description_hi=s.description_hi,
            description_mr=s.description_mr,
            department=s.department,
            eligibility_rules=s.eligibility_rules,
            required_documents=s.required_documents,
            application_link=s.application_link
        ))
    return localized_schemes

@router.get("/{scheme_id}", response_model=SchemeResponse)
async def get_scheme(scheme_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Scheme).where(Scheme.id == scheme_id)
    result = await db.execute(stmt)
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
    return scheme

@router.post("/check-eligibility", response_model=SchemeCheckSummary)
async def check_eligibility(
    payload: SchemeCheckRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine target user or construct ad-hoc profile
    user_id = payload.user_id or (current_user.id if current_user else None)
    
    profile = {}
    if current_user:
        profile = {
            "age": current_user.age,
            "annual_income": current_user.annual_income,
            "category": current_user.category,
            "occupation": current_user.occupation,
            "land_owned_acres": current_user.land_owned_acres,
            "gender": current_user.gender,
            "has_disability": current_user.has_disability,
        }
    
    # Allow override from request payload
    if payload.age is not None:
        profile["age"] = payload.age
    if payload.annual_income is not None:
        profile["annual_income"] = payload.annual_income
    if payload.category is not None:
        profile["category"] = payload.category
    if payload.occupation is not None:
        profile["occupation"] = payload.occupation
    if payload.land_owned_acres is not None:
        profile["land_owned_acres"] = payload.land_owned_acres
    if payload.gender is not None:
        profile["gender"] = payload.gender
    if payload.has_disability is not None:
        profile["has_disability"] = payload.has_disability

    lang = payload.preferred_language or (current_user.preferred_language if current_user else "en")

    # Fetch all schemes
    stmt = select(Scheme).order_by(Scheme.id)
    result = await db.execute(stmt)
    all_schemes = result.scalars().all()

    items: list[SchemeEligibilityItem] = []
    eligible_count = 0

    for s in all_schemes:
        is_eligible, reason = rule_evaluator.evaluate(s.eligibility_rules, profile, lang=lang)
        if is_eligible:
            eligible_count += 1

        # Record check in database if we have an authenticated or identified user
        if user_id:
            check_record = EligibilityCheck(
                user_id=user_id,
                scheme_id=s.id,
                is_eligible=is_eligible,
                reason=reason
            )
            db.add(check_record)

        scheme_name = s.name
        if lang == "hi" and s.name_hi:
            scheme_name = s.name_hi
        elif lang == "mr" and s.name_mr:
            scheme_name = s.name_mr

        items.append(SchemeEligibilityItem(
            scheme_id=s.id,
            scheme_name=scheme_name,
            department=s.department,
            is_eligible=is_eligible,
            reason=reason,
            required_documents=s.required_documents,
            application_download_url=f"/api/schemes/{s.id}/application"
        ))

    if user_id:
        await db.commit()

    return SchemeCheckSummary(
        total_schemes=len(all_schemes),
        eligible_count=eligible_count,
        results=items
    )

@router.get("/{scheme_id}/application")
async def download_prefilled_application(
    scheme_id: int,
    user_id: Optional[int] = None,
    name: Optional[str] = "Demo Citizen",
    phone: Optional[str] = "9876543210",
    age: Optional[int] = 45,
    annual_income: Optional[float] = 95000.0,
    category: Optional[str] = "OBC",
    occupation: Optional[str] = "farmer",
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Scheme).where(Scheme.id == scheme_id)
    result = await db.execute(stmt)
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")

    # Build applicant profile
    profile = {
        "name": name,
        "phone_number": phone,
        "age": age,
        "annual_income": annual_income,
        "category": category,
        "occupation": occupation,
        "land_owned_acres": 1.5,
        "gender": "male",
        "has_disability": "no"
    }

    if current_user:
        profile["name"] = current_user.name
        profile["phone_number"] = current_user.phone_number
        profile["age"] = current_user.age or age
        profile["annual_income"] = current_user.annual_income or annual_income
        profile["category"] = current_user.category or category
        profile["occupation"] = current_user.occupation or occupation
        profile["land_owned_acres"] = current_user.land_owned_acres or 0.0
        profile["gender"] = current_user.gender or "male"
        profile["has_disability"] = current_user.has_disability or "no"

    scheme_dict = {
        "id": scheme.id,
        "name": scheme.name,
        "department": scheme.department,
        "description": scheme.description,
        "required_documents": scheme.required_documents
    }

    pdf_bytes = pdf_service.generate_application_pdf(scheme_dict, profile)

    sanitized_scheme_name = scheme.name.lower().replace(" ", "_").replace("-", "_")[:20]
    filename = f"application_{sanitized_scheme_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
