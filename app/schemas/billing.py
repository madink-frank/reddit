from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class UserBillingResponse(BaseModel):
    """Response model for user billing information"""
    user_id: int
    current_points: Decimal
    total_spent: Decimal
    total_purchased: Decimal
    daily_limit: Optional[Decimal] = None
    monthly_limit: Optional[Decimal] = None
    low_balance_threshold: Decimal
    notifications_enabled: bool

    class Config:
        from_attributes = True


class AddPointsRequest(BaseModel):
    """Request model for adding points to user account"""
    amount: Decimal = Field(..., gt=0, description="Amount of points to add")
    description: Optional[str] = Field(None, max_length=500, description="Description of the transaction")
    reference_id: Optional[str] = Field(None, max_length=255, description="Reference ID for the transaction")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata for the transaction")


class DeductPointsRequest(BaseModel):
    """Request model for deducting points from user account"""
    operation_type: str = Field(..., description="Type of operation (e.g., 'crawling_post', 'nlp_sentiment')")
    amount: Optional[Decimal] = Field(None, gt=0, description="Amount of points to deduct (if not provided, uses default cost)")
    description: Optional[str] = Field(None, max_length=500, description="Description of the transaction")
    reference_id: Optional[str] = Field(None, max_length=255, description="Reference ID for the operation")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata for the transaction")


class PointTransactionResponse(BaseModel):
    """Response model for point transactions"""
    id: int
    user_billing_id: int
    transaction_type: str
    operation_type: Optional[str] = None
    amount: Decimal
    balance_after: Decimal
    description: Optional[str] = None
    reference_id: Optional[str] = None
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionHistoryResponse(BaseModel):
    """Response model for transaction history"""
    transactions: List[PointTransactionResponse]
    total_count: int
    limit: int
    offset: int


class OperationBreakdown(BaseModel):
    """Model for operation breakdown in usage analytics"""
    operations: int
    points: Decimal


class DailyUsage(BaseModel):
    """Model for daily usage data"""
    date: str
    operations: int
    points: float


class UsageAnalyticsResponse(BaseModel):
    """Response model for usage analytics"""
    period_days: int
    total_operations: int
    total_points_used: float
    avg_daily_operations: float
    avg_daily_points: float
    operation_breakdown: Dict[str, OperationBreakdown]
    daily_usage: List[DailyUsage]


class SpendingLimitsRequest(BaseModel):
    """Request model for updating spending limits"""
    daily_limit: Optional[Decimal] = Field(None, ge=0, description="Daily spending limit in points")
    monthly_limit: Optional[Decimal] = Field(None, ge=0, description="Monthly spending limit in points")


class SpendingLimitsResponse(BaseModel):
    """Response model for spending limits"""
    daily_limit: Optional[Decimal] = None
    monthly_limit: Optional[Decimal] = None
    low_balance_threshold: Decimal
    notifications_enabled: bool

    class Config:
        from_attributes = True


class SpendingLimitCheck(BaseModel):
    """Model for spending limit check result"""
    can_proceed: bool
    warnings: List[Dict[str, Any]]
    limits_exceeded: List[Dict[str, Any]]