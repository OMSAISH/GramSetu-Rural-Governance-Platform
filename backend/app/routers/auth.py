from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, Token, UserResponse, UserProfileUpdate
from app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(User).where(User.phone_number == user_in.phone_number)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number is already registered."
        )

    # Convert income bracket to approximate annual_income if not explicitly passed
    annual_inc = user_in.annual_income
    if annual_inc is None and user_in.income_bracket:
        if "<" in user_in.income_bracket:
            annual_inc = 80000.0
        elif ">" in user_in.income_bracket:
            annual_inc = 300000.0
        else:
            annual_inc = 150000.0

    new_user = User(
        name=user_in.name,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        preferred_language=user_in.preferred_language,
        role=user_in.role,
        age=user_in.age,
        annual_income=annual_inc,
        income_bracket=user_in.income_bracket,
        occupation=user_in.occupation,
        land_owned_acres=user_in.land_owned_acres,
        category=user_in.category,
        gender=user_in.gender,
        has_disability=user_in.has_disability,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.phone_number, "role": new_user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.phone_number == credentials.phone_number)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password"
        )

    access_token = create_access_token(data={"sub": user.phone_number, "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user
