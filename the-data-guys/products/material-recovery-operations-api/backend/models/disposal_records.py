from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Disposal_records(Base):
    __tablename__ = "disposal_records"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    material_type = Column(String, nullable=False)
    disposal_method = Column(String, nullable=False)
    weight_tons = Column(Float, nullable=False)
    cost = Column(Float, nullable=True)
    disposal_date = Column(String, nullable=False)
    hauler = Column(String, nullable=True)
    manifest_number = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)