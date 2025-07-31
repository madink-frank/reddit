from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.services.billing_service import BillingService, InsufficientPointsError
from app.schemas.billing import (
    UserBillingResponse,
    PointTransactionResponse,
    AddPointsRequest,
    DeductPointsRequest,
    UsageAnalyticsResponse,
    SpendingLimitsRequest,
    SpendingLimitsResponse,
    TransactionHistoryResponse
)

router = APIRouter()


@router.get("/balance", response_model=UserBillingResponse)
async def get_user_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's point balance and billing information"""
    billing_service = BillingService(db)
    billing = billing_service.get_or_create_user_billing(current_user.id)
    
    return UserBillingResponse(
        user_id=billing.user_id,
        current_points=billing.current_points,
        total_spent=billing.total_spent,
        total_purchased=billing.total_purchased,
        daily_limit=billing.daily_limit,
        monthly_limit=billing.monthly_limit,
        low_balance_threshold=billing.low_balance_threshold,
        notifications_enabled=billing.notifications_enabled
    )


@router.post("/add-points", response_model=PointTransactionResponse)
async def add_points(
    request: AddPointsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add points to user's account (purchase, bonus, refund)"""
    billing_service = BillingService(db)
    
    try:
        transaction = billing_service.add_points(
            user_id=current_user.id,
            amount=request.amount,
            description=request.description,
            reference_id=request.reference_id,
            transaction_metadata=request.metadata
        )
        
        return PointTransactionResponse(
            id=transaction.id,
            user_billing_id=transaction.user_billing_id,
            transaction_type=transaction.transaction_type,
            operation_type=transaction.operation_type,
            amount=transaction.amount,
            balance_after=transaction.balance_after,
            description=transaction.description,
            reference_id=transaction.reference_id,
            status=transaction.status,
            created_at=transaction.created_at,
            processed_at=transaction.processed_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add points: {str(e)}"
        )


@router.post("/deduct-points", response_model=PointTransactionResponse)
async def deduct_points(
    request: DeductPointsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deduct points for an operation"""
    billing_service = BillingService(db)
    
    try:
        transaction = billing_service.deduct_points(
            user_id=current_user.id,
            operation_type=request.operation_type,
            amount=request.amount,
            description=request.description,
            reference_id=request.reference_id,
            transaction_metadata=request.metadata
        )
        
        return PointTransactionResponse(
            id=transaction.id,
            user_billing_id=transaction.user_billing_id,
            transaction_type=transaction.transaction_type,
            operation_type=transaction.operation_type,
            amount=transaction.amount,
            balance_after=transaction.balance_after,
            description=transaction.description,
            reference_id=transaction.reference_id,
            status=transaction.status,
            created_at=transaction.created_at,
            processed_at=transaction.processed_at
        )
    except InsufficientPointsError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to deduct points: {str(e)}"
        )


@router.get("/transactions", response_model=TransactionHistoryResponse)
async def get_transaction_history(
    limit: int = 50,
    offset: int = 0,
    transaction_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's transaction history"""
    billing_service = BillingService(db)
    
    transactions = billing_service.get_transaction_history(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        transaction_type=transaction_type
    )
    
    transaction_responses = [
        PointTransactionResponse(
            id=tx.id,
            user_billing_id=tx.user_billing_id,
            transaction_type=tx.transaction_type,
            operation_type=tx.operation_type,
            amount=tx.amount,
            balance_after=tx.balance_after,
            description=tx.description,
            reference_id=tx.reference_id,
            status=tx.status,
            created_at=tx.created_at,
            processed_at=tx.processed_at
        )
        for tx in transactions
    ]
    
    return TransactionHistoryResponse(
        transactions=transaction_responses,
        total_count=len(transaction_responses),
        limit=limit,
        offset=offset
    )


@router.get("/usage-analytics", response_model=UsageAnalyticsResponse)
async def get_usage_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage analytics for the user"""
    billing_service = BillingService(db)
    
    analytics = billing_service.get_usage_analytics(
        user_id=current_user.id,
        days=days
    )
    
    return UsageAnalyticsResponse(**analytics)


@router.post("/spending-limits", response_model=SpendingLimitsResponse)
async def update_spending_limits(
    request: SpendingLimitsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's spending limits"""
    billing_service = BillingService(db)
    
    try:
        billing = billing_service.update_spending_limits(
            user_id=current_user.id,
            daily_limit=request.daily_limit,
            monthly_limit=request.monthly_limit
        )
        
        return SpendingLimitsResponse(
            daily_limit=billing.daily_limit,
            monthly_limit=billing.monthly_limit,
            low_balance_threshold=billing.low_balance_threshold,
            notifications_enabled=billing.notifications_enabled
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update spending limits: {str(e)}"
        )


@router.post("/check-spending-limits")
async def check_spending_limits(
    amount: Decimal,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if an operation would exceed spending limits"""
    billing_service = BillingService(db)
    
    result = billing_service.check_spending_limits(
        user_id=current_user.id,
        amount=amount
    )
    
    return result


@router.get("/operation-costs")
async def get_operation_costs():
    """Get the cost of different operations"""
    billing_service = BillingService(None)  # No DB needed for static costs
    
    return {
        "operation_costs": {
            operation: float(cost) 
            for operation, cost in billing_service.OPERATION_COSTS.items()
        },
        "currency": "points",
        "description": "Cost per operation in points (1 point = 1 unit of currency)"
    }