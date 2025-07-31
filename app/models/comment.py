from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .base import BaseModel


class Comment(BaseModel):
    __tablename__ = "comments"
    
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    reddit_id = Column(String(50), unique=True, nullable=False, index=True)
    body = Column(Text)
    author = Column(String(100))
    score = Column(Integer, default=0)
    created_utc = Column(DateTime(timezone=True))
    crawled_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("Post", back_populates="comments")