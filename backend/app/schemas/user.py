from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class UserRegister(BaseModel):
    name: str
    phone_number: str
    password: str
    preferred_language: str = "en"
    role: str = "citizen"
    age: Optional[int] = None
    annual_income: Optional[float] = None
    income_bracket: Optional[str] = None
    occupation: Optional[str] = None
    land_owned_acres: Optional[float] = 0.0
    category: Optional[str] = "general"
    gender: Optional[str] = None
    has_disability: Optional[str] = "no"

class UserLogin(BaseModel):
    phone_number: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None
    age: Optional[int] = None
    annual_income: Optional[float] = None
    income_bracket: Optional[str] = None
    occupation: Optional[str] = None
    land_owned_acres: Optional[float] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    has_disability: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone_number: str
    preferred_language: str
    role: str
    age: Optional[int] = None
    annual_income: Optional[float] = None
    income_bracket: Optional[str] = None
    occupation: Optional[str] = None
    land_owned_acres: Optional[float] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    has_disability: Optional[str] = None
    created_at: datetime

Token.model_rebuild()
