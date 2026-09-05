from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Date

from app.database import Base

class GovernanceRecord(Base):
    __tablename__ = "governance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    panchayat_id = Column(String, default="GP-MAHA-042", nullable=False, index=True)
    title = Column(String, nullable=False)
    title_hi = Column(String, nullable=True)
    title_mr = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    description_hi = Column(Text, nullable=True)
    description_mr = Column(Text, nullable=True)
    
    category = Column(String, nullable=False, index=True) # meeting, work, fund
    date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    status = Column(String, nullable=False) # completed, ongoing, upcoming, approved
    amount = Column(Float, nullable=True)   # for fund/work records in INR
