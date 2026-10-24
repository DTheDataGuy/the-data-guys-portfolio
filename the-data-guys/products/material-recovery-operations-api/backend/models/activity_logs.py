from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Activity_logs(Base):
    __tablename__ = "activity_logs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    record_type = Column(String, nullable=False)
    record_id = Column(String, nullable=False)
    material_type = Column(String, nullable=True)
    details = Column(String, nullable=True)
    timestamp = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)