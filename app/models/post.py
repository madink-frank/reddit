from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, Index, func
from sqlalchemy.orm import relationship
from .base import BaseModel


class Post(BaseModel):
    __tablename__ = "posts"
    
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False)
    reddit_id = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(Text, nullable=False)
    content = Column(Text)
    author = Column(String(100))
    subreddit = Column(String(100))
    url = Column(Text)
    score = Column(Integer, default=0)
    num_comments = Column(Integer, default=0)
    created_utc = Column(DateTime(timezone=True))
    crawled_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    keyword = relationship("Keyword", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_posts_keyword_created', 'keyword_id', 'created_utc'),
        Index('ix_posts_subreddit_created', 'subreddit', 'created_utc'),
    )