from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Material_records(Base):
    __tablename__ = "material_records"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    material_type = Column(String, nullable=False)
    category = Column(String, nullable=True)
    weight_tons = Column(Float, nullable=False)
    source_project = Column(String, nullable=True)
    date_received = Column(String, nullable=False)
    condition = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)