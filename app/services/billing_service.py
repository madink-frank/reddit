import json
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from sqlalchemy.exc import IntegrityError

from app.models import User, UserBilling, PointTransaction, UsageHistory
from app.core.database import get_db


class InsufficientPointsError(Exception):
    """Raised when user doesn't have enough points for an operation"""
    pass


class BillingService:
    """Service for managing user billing, points, and usage tracking"""
    
    # Point costs for different operations
    OPERATION_COSTS = {
        'crawling_post': Decimal('0.10'),
        'crawling_comment': Decimal('0.05'),
        'nlp_sentiment': Decimal('0.20'),
        'nlp_morphological': Decimal('0.30'),
        'nlp_similarity': Decimal('0.25'),
        'nlp_keywords': Decimal('0.15'),
        'image_object_detection': Decimal('0.50'),
        'image_ocr': Decimal('0.40'),
        'image_classification': Decimal('0.35'),
        'export_excel': Decimal('0.10'),
        'export_csv': Decimal('0.05'),
        'export_pdf': Decimal('0.15'),
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_user_billing(self, user_id: int) -> UserBilling:
        """Get or create billing record for a user"""
        billing = self.db.query(UserBilling).filter(UserBilling.user_id == user_id).first()
        
        if not billing:
            billing = UserBilling(
                user_id=user_id,
                current_points=Decimal('0.00'),
                total_spent=Decimal('0.00'),
                total_purchased=Decimal('0.00')
            )
            self.db.add(billing)
            self.db.commit()
            self.db.refresh(billing)
        
        return billing
    
    def get_user_balance(self, user_id: int) -> Decimal:
        """Get current point balance for a user"""
        billing = self.get_or_create_user_billing(user_id)
        return billing.current_points
    
    def add_points(self, user_id: int, amount: Decimal, description: str = None, 
                   reference_id: str = None, transaction_metadata: Dict[str, Any] = None) -> PointTransaction:
        """Add points to user's account (purchase, bonus, refund)"""
        billing = self.get_or_create_user_billing(user_id)
        
        # Update balance
        billing.current_points += amount
        billing.total_purchased += amount
        
        # Create transaction record
        transaction = PointTransaction(
            user_billing_id=billing.id,
            transaction_type='purchase',
            amount=amount,
            balance_after=billing.current_points,
            description=description or f"Added {amount} points",
            reference_id=reference_id,
            transaction_metadata=json.dumps(transaction_metadata) if transaction_metadata else None,
            status='completed',
            processed_at=datetime.utcnow()
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def deduct_points(self, user_id: int, operation_type: str, amount: Optional[Decimal] = None,
                     description: str = None, reference_id: str = None, 
                     transaction_metadata: Dict[str, Any] = None) -> PointTransaction:
        """Deduct points for an operation"""
        billing = self.get_or_create_user_billing(user_id)
        
        # Determine cost if not provided
        if amount is None:
            amount = self.OPERATION_COSTS.get(operation_type, Decimal('0.10'))
        
        # Check if user has sufficient points
        if billing.current_points < amount:
            raise InsufficientPointsError(
                f"Insufficient points. Required: {amount}, Available: {billing.current_points}"
            )
        
        # Update balance
        billing.current_points -= amount
        billing.total_spent += amount
        
        # Create transaction record
        transaction = PointTransaction(
            user_billing_id=billing.id,
            transaction_type='deduction',
            operation_type=operation_type,
            amount=-amount,  # Negative for deductions
            balance_after=billing.current_points,
            description=description or f"Used {amount} points for {operation_type}",
            reference_id=reference_id,
            transaction_metadata=json.dumps(transaction_metadata) if transaction_metadata else None,
            status='completed',
            processed_at=datetime.utcnow()
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        # Update usage history
        self._update_usage_history(billing.id, operation_type, amount)
        
        return transaction
    
    def check_spending_limits(self, user_id: int, amount: Decimal) -> Dict[str, Any]:
        """Check if operation would exceed spending limits"""
        billing = self.get_or_create_user_billing(user_id)
        
        result = {
            'can_proceed': True,
            'warnings': [],
            'limits_exceeded': []
        }
        
        # Check daily limit
        if billing.daily_limit:
            today = datetime.utcnow().date()
            daily_spent = self.db.query(func.sum(PointTransaction.amount * -1)).filter(
                and_(
                    PointTransaction.user_billing_id == billing.id,
                    PointTransaction.transaction_type == 'deduction',
                    func.date(PointTransaction.created_at) == today
                )
            ).scalar() or Decimal('0.00')
            
            if daily_spent + amount > billing.daily_limit:
                result['can_proceed'] = False
                result['limits_exceeded'].append({
                    'type': 'daily',
                    'limit': billing.daily_limit,
                    'current': daily_spent,
                    'would_be': daily_spent + amount
                })
        
        # Check monthly limit
        if billing.monthly_limit:
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_spent = self.db.query(func.sum(PointTransaction.amount * -1)).filter(
                and_(
                    PointTransaction.user_billing_id == billing.id,
                    PointTransaction.transaction_type == 'deduction',
                    PointTransaction.created_at >= month_start
                )
            ).scalar() or Decimal('0.00')
            
            if monthly_spent + amount > billing.monthly_limit:
                result['can_proceed'] = False
                result['limits_exceeded'].append({
                    'type': 'monthly',
                    'limit': billing.monthly_limit,
                    'current': monthly_spent,
                    'would_be': monthly_spent + amount
                })
        
        # Check low balance warning
        if billing.current_points - amount <= billing.low_balance_threshold:
            result['warnings'].append({
                'type': 'low_balance',
                'threshold': billing.low_balance_threshold,
                'balance_after': billing.current_points - amount
            })
        
        return result
    
    def get_transaction_history(self, user_id: int, limit: int = 50, 
                              offset: int = 0, transaction_type: str = None) -> List[PointTransaction]:
        """Get transaction history for a user"""
        billing = self.get_or_create_user_billing(user_id)
        
        query = self.db.query(PointTransaction).filter(
            PointTransaction.user_billing_id == billing.id
        )
        
        if transaction_type:
            query = query.filter(PointTransaction.transaction_type == transaction_type)
        
        return query.order_by(PointTransaction.created_at.desc()).offset(offset).limit(limit).all()
    
    def get_usage_analytics(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get usage analytics for a user"""
        billing = self.get_or_create_user_billing(user_id)
        
        # Get usage history for the specified period
        start_date = datetime.utcnow() - timedelta(days=days)
        usage_records = self.db.query(UsageHistory).filter(
            and_(
                UsageHistory.user_billing_id == billing.id,
                UsageHistory.date >= start_date,
                UsageHistory.period_type == 'daily'
            )
        ).order_by(UsageHistory.date).all()
        
        # Calculate totals (handle None values)
        total_operations = sum(record.total_operations or 0 for record in usage_records)
        total_points = sum(record.total_points_used or Decimal('0.00') for record in usage_records)
        
        # Calculate averages
        avg_daily_operations = total_operations / days if days > 0 else 0
        avg_daily_points = total_points / days if days > 0 else 0
        
        # Operation breakdown (handle None values)
        operation_breakdown = {
            'crawling': {
                'operations': sum(record.crawling_operations or 0 for record in usage_records),
                'points': sum(record.crawling_points or Decimal('0.00') for record in usage_records)
            },
            'nlp': {
                'operations': sum(record.nlp_operations or 0 for record in usage_records),
                'points': sum(record.nlp_points or Decimal('0.00') for record in usage_records)
            },
            'image': {
                'operations': sum(record.image_operations or 0 for record in usage_records),
                'points': sum(record.image_points or Decimal('0.00') for record in usage_records)
            },
            'export': {
                'operations': sum(record.export_operations or 0 for record in usage_records),
                'points': sum(record.export_points or Decimal('0.00') for record in usage_records)
            }
        }
        
        return {
            'period_days': days,
            'total_operations': total_operations,
            'total_points_used': float(total_points),
            'avg_daily_operations': avg_daily_operations,
            'avg_daily_points': float(avg_daily_points),
            'operation_breakdown': operation_breakdown,
            'daily_usage': [
                {
                    'date': record.date.isoformat(),
                    'operations': record.total_operations or 0,
                    'points': float(record.total_points_used or Decimal('0.00'))
                }
                for record in usage_records
            ]
        }
    
    def update_spending_limits(self, user_id: int, daily_limit: Optional[Decimal] = None,
                             monthly_limit: Optional[Decimal] = None) -> UserBilling:
        """Update spending limits for a user"""
        billing = self.get_or_create_user_billing(user_id)
        
        if daily_limit is not None:
            billing.daily_limit = daily_limit
        
        if monthly_limit is not None:
            billing.monthly_limit = monthly_limit
        
        self.db.commit()
        self.db.refresh(billing)
        
        return billing
    
    def _update_usage_history(self, billing_id: int, operation_type: str, points_used: Decimal):
        """Update daily usage history"""
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get or create today's usage record
        usage = self.db.query(UsageHistory).filter(
            and_(
                UsageHistory.user_billing_id == billing_id,
                UsageHistory.date == today,
                UsageHistory.period_type == 'daily'
            )
        ).first()
        
        if not usage:
            usage = UsageHistory(
                user_billing_id=billing_id,
                date=today,
                period_type='daily',
                total_operations=0,
                total_points_used=Decimal('0.00'),
                crawling_operations=0,
                crawling_points=Decimal('0.00'),
                nlp_operations=0,
                nlp_points=Decimal('0.00'),
                image_operations=0,
                image_points=Decimal('0.00'),
                export_operations=0,
                export_points=Decimal('0.00')
            )
            self.db.add(usage)
        
        # Update totals (handle None values)
        usage.total_operations = (usage.total_operations or 0) + 1
        usage.total_points_used = (usage.total_points_used or Decimal('0.00')) + points_used
        
        # Update operation-specific counters (handle None values)
        if operation_type.startswith('crawling'):
            usage.crawling_operations = (usage.crawling_operations or 0) + 1
            usage.crawling_points = (usage.crawling_points or Decimal('0.00')) + points_used
        elif operation_type.startswith('nlp'):
            usage.nlp_operations = (usage.nlp_operations or 0) + 1
            usage.nlp_points = (usage.nlp_points or Decimal('0.00')) + points_used
        elif operation_type.startswith('image'):
            usage.image_operations = (usage.image_operations or 0) + 1
            usage.image_points = (usage.image_points or Decimal('0.00')) + points_used
        elif operation_type.startswith('export'):
            usage.export_operations = (usage.export_operations or 0) + 1
            usage.export_points = (usage.export_points or Decimal('0.00')) + points_used
        
        # Update peak usage hour
        current_hour = datetime.utcnow().hour
        if usage.peak_usage_hour is None:
            usage.peak_usage_hour = current_hour
        
        self.db.commit()


def get_billing_service(db: Session = None) -> BillingService:
    """Get billing service instance"""
    if db is None:
        db = next(get_db())
    return BillingService(db)