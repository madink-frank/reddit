from sqlalchemy import Column, String, DateTime, JSON
from .base import BaseModel


class MetricsCache(BaseModel):
    __tablename__ = "metrics_cache"
    
    cache_key = Column(String(255), unique=True, nullable=False, index=True)
    data = Column(JSON, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)