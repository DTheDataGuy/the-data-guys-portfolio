from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Email_preferences(Base):
    __tablename__ = "email_preferences"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    email = Column(String, nullable=True)
    digest_enabled = Column(Boolean, nullable=True)
    include_recovery = Column(Boolean, nullable=True)
    include_opportunities = Column(Boolean, nullable=True)
    include_financial = Column(Boolean, nullable=True)
    frequency = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)