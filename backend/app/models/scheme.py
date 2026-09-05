from sqlalchemy import Column, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.database import Base

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    name_hi = Column(String, nullable=True)
    name_mr = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    description_hi = Column(Text, nullable=True)
    description_mr = Column(Text, nullable=True)
    department = Column(String, nullable=False)
    
    # JSON structured conditions e.g.
    # {"age": {">=": 60}, "annual_income": {"<=": 120000}}
    eligibility_rules = Column(JSON, nullable=False)
    
    # List of required documents, e.g. ["Aadhaar Card", "Income Certificate", "Bank Passbook"]
    required_documents = Column(JSON, nullable=False)
    
    application_link = Column(String, nullable=True)

    eligibility_checks = relationship("EligibilityCheck", back_populates="scheme", cascade="all, delete-orphan")
