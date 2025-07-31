from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel


class UserBilling(BaseModel):
    """User billing information and point balance tracking"""
    __tablename__ = "user_billing"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    current_points = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_spent = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_purchased = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Spending limits
    daily_limit = Column(Numeric(10, 2), nullable=True)
    monthly_limit = Column(Numeric(10, 2), nullable=True)
    
    # Notification preferences
    low_balance_threshold = Column(Numeric(10, 2), nullable=False, default=10.00)
    notifications_enabled = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    user = relationship("User", back_populates="billing")
    transactions = relationship("PointTransaction", back_populates="user_billing", cascade="all, delete-orphan")


class PointTransaction(BaseModel):
    """Individual point transactions for tracking usage and purchases"""
    __tablename__ = "point_transactions"
    
    user_billing_id = Column(Integer, ForeignKey("user_billing.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # 'purchase', 'deduction', 'refund', 'bonus'
    operation_type = Column(String(100), nullable=True)  # 'crawling', 'nlp_analysis', 'image_analysis', etc.
    amount = Column(Numeric(10, 2), nullable=False)  # Positive for credits, negative for debits
    balance_after = Column(Numeric(10, 2), nullable=False)
    
    # Transaction details
    description = Column(Text, nullable=True)
    reference_id = Column(String(255), nullable=True)  # Reference to related operation/job
    transaction_metadata = Column(Text, nullable=True)  # Additional transaction details (JSON string)
    
    # Status tracking
    status = Column(String(20), nullable=False, default='completed')  # 'pending', 'completed', 'failed', 'cancelled'
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user_billing = relationship("UserBilling", back_populates="transactions")


class UsageHistory(BaseModel):
    """Aggregated usage history for analytics and reporting"""
    __tablename__ = "usage_history"
    
    user_billing_id = Column(Integer, ForeignKey("user_billing.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)  # Date for aggregation (daily/hourly)
    period_type = Column(String(20), nullable=False, default='daily')  # 'hourly', 'daily', 'monthly'
    
    # Usage metrics
    total_operations = Column(Integer, nullable=False, default=0)
    total_points_used = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Operation breakdown
    crawling_operations = Column(Integer, nullable=False, default=0)
    crawling_points = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    nlp_operations = Column(Integer, nullable=False, default=0)
    nlp_points = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    image_operations = Column(Integer, nullable=False, default=0)
    image_points = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    export_operations = Column(Integer, nullable=False, default=0)
    export_points = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Additional metrics
    peak_usage_hour = Column(Integer, nullable=True)  # Hour of day with peak usage (0-23)
    usage_metadata = Column(Text, nullable=True)  # Additional usage analytics (JSON string)
    
    # Relationships
    user_billing = relationship("UserBilling")