from datetime import datetime
from sqlalchemy import Column, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class EligibilityCheck(Base):
    __tablename__ = "eligibility_checks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    is_eligible = Column(Boolean, nullable=False)
    reason = Column(Text, nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="eligibility_checks")
    scheme = relationship("Scheme", back_populates="eligibility_checks")
