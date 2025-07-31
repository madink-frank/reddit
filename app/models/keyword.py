from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import BaseModel


class Keyword(BaseModel):
    __tablename__ = "keywords"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    keyword = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="keywords")
    posts = relationship("Post", back_populates="keyword", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'keyword', name='uq_user_keyword'),
    )