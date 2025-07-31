from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel


class ProcessLog(BaseModel):
    __tablename__ = "process_logs"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    process_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)  # 'running', 'completed', 'failed'
    details = Column(JSON)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="process_logs")