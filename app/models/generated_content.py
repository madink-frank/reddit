from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel


class GeneratedContent(BaseModel):
    __tablename__ = "generated_content"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(500), nullable=False)
    content_type = Column(String(50), nullable=False)  # 'blog', 'product_intro', 'trend_analysis'
    content = Column(Text, nullable=False)
    template_used = Column(String(100))
    source_keywords = Column(Text)  # JSON string for SQLite compatibility
    content_metadata = Column(JSON)
    
    # Relationships
    user = relationship("User", back_populates="generated_content")