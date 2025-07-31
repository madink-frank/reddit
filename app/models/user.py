from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel


class User(BaseModel):
    __tablename__ = "users"
    
    reddit_id = Column(String(50), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(255))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    keywords = relationship("Keyword", back_populates="user", cascade="all, delete-orphan")
    process_logs = relationship("ProcessLog", back_populates="user")
    generated_content = relationship("GeneratedContent", back_populates="user")
    billing = relationship("UserBilling", back_populates="user", uselist=False, cascade="all, delete-orphan")