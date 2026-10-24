from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Recent_searches(Base):
    __tablename__ = "recent_searches"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    query = Column(String, nullable=False)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)