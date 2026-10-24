from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Recovery_events(Base):
    __tablename__ = "recovery_events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    material_type = Column(String, nullable=False)
    recovery_method = Column(String, nullable=False)
    quantity_tons = Column(Float, nullable=False)
    estimated_value = Column(Float, nullable=True)
    recovery_date = Column(String, nullable=False)
    destination = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)