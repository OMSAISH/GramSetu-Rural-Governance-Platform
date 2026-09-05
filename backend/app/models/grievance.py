from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tracking_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String, nullable=False, index=True) # road, water, electricity, pension, sanitation, other
    description = Column(Text, nullable=False) # original citizen language
    description_english = Column(Text, nullable=False) # translated for back-office
    
    status = Column(String, default="submitted", nullable=False, index=True) # submitted, in_progress, escalated, resolved
    department_assigned = Column(String, nullable=False)
    
    sla_deadline = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="grievances")
