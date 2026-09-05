from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    preferred_language = Column(String, default="en", nullable=False)  # en, hi, mr
    role = Column(String, default="citizen", nullable=False)  # citizen, official
    
    # Citizen profile attributes for eligibility check
    age = Column(Integer, nullable=True)
    income_bracket = Column(String, nullable=True)  # e.g., "<100000", "100000-250000", ">250000"
    annual_income = Column(Float, nullable=True)    # numeric annual income for exact rule evaluation
    occupation = Column(String, nullable=True)      # farmer, daily_wage, artisan, unemployed, student, widow, senior_citizen
    land_owned_acres = Column(Float, default=0.0, nullable=True)
    category = Column(String, default="general", nullable=True)  # general, OBC, SC, ST
    gender = Column(String, nullable=True)          # male, female, other
    has_disability = Column(String, default="no", nullable=True) # yes, no
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    eligibility_checks = relationship("EligibilityCheck", back_populates="user", cascade="all, delete-orphan")
    grievances = relationship("Grievance", back_populates="user", cascade="all, delete-orphan")
