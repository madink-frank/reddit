"""
Billing Integration Helper

Provides decorators and utilities to integrate point-based billing
into existing services and operations.
"""

import functools
from decimal import Decimal
from typing import Callable, Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.services.billing_service import BillingService, InsufficientPointsError
from app.core.database import get_db


class BillingIntegration:
    """Helper class for integrating billing into services"""
    
    @staticmethod
    def charge_for_operation(
        operation_type: str,
        amount: Optional[Decimal] = None,
        description: Optional[str] = None,
        check_limits: bool = True
    ):
        """
        Decorator to charge points for an operation.
        
        Args:
            operation_type: Type of operation (e.g., 'crawling_post', 'nlp_sentiment')
            amount: Optional custom amount (uses default if not provided)
            description: Optional description for the transaction
            check_limits: Whether to check spending limits before charging
        
        Usage:
            @BillingIntegration.charge_for_operation('crawling_post')
            def crawl_posts(user_id: int, ...):
                # Function implementation
                pass
        """
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Extract user_id from function arguments
                user_id = None
                
                # Try to find user_id in args or kwargs
                if 'user_id' in kwargs:
                    user_id = kwargs['user_id']
                elif len(args) > 0 and isinstance(args[0], int):
                    user_id = args[0]
                
                if user_id is None:
                    raise ValueError("user_id must be provided for billing integration")
                
                # Get database session
                db = next(get_db())
                billing_service = BillingService(db)
                
                try:
                    # Check spending limits if requested
                    if check_limits:
                        cost = amount or billing_service.OPERATION_COSTS.get(operation_type, Decimal('0.10'))
                        limit_check = billing_service.check_spending_limits(user_id, cost)
                        
                        if not limit_check['can_proceed']:
                            raise InsufficientPointsError(
                                f"Operation would exceed spending limits: {limit_check['limits_exceeded']}"
                            )
                    
                    # Execute the original function
                    result = func(*args, **kwargs)
                    
                    # Charge points after successful execution
                    transaction = billing_service.deduct_points(
                        user_id=user_id,
                        operation_type=operation_type,
                        amount=amount,
                        description=description or f"Charged for {operation_type}",
                        reference_id=f"{func.__name__}_{user_id}"
                    )
                    
                    # Add billing info to result if it's a dict
                    if isinstance(result, dict):
                        result['billing_info'] = {
                            'points_charged': float(abs(transaction.amount)),
                            'balance_after': float(transaction.balance_after),
                            'transaction_id': transaction.id
                        }
                    
                    return result
                    
                except InsufficientPointsError:
                    raise
                except Exception as e:
                    # If the operation failed, don't charge points
                    raise e
                finally:
                    db.close()
            
            return wrapper
        return decorator
    
    @staticmethod
    def check_balance_before_operation(min_balance: Decimal = Decimal('1.00')):
        """
        Decorator to check if user has sufficient balance before operation.
        
        Args:
            min_balance: Minimum balance required
        """
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Extract user_id
                user_id = kwargs.get('user_id') or (args[0] if args and isinstance(args[0], int) else None)
                
                if user_id is None:
                    raise ValueError("user_id must be provided for balance check")
                
                # Check balance
                db = next(get_db())
                billing_service = BillingService(db)
                
                try:
                    balance = billing_service.get_user_balance(user_id)
                    
                    if balance < min_balance:
                        raise InsufficientPointsError(
                            f"Insufficient balance. Required: {min_balance}, Available: {balance}"
                        )
                    
                    return func(*args, **kwargs)
                finally:
                    db.close()
            
            return wrapper
        return decorator
    
    @staticmethod
    def batch_charge_for_operations(
        user_id: int,
        operations: List[Dict[str, Any]],
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Charge for multiple operations in batch.
        
        Args:
            user_id: User ID
            operations: List of operations with 'type', 'amount', 'description', 'reference_id'
            db: Database session
        
        Returns:
            List of transaction results
        """
        billing_service = BillingService(db)
        results = []
        
        for operation in operations:
            try:
                transaction = billing_service.deduct_points(
                    user_id=user_id,
                    operation_type=operation['type'],
                    amount=operation.get('amount'),
                    description=operation.get('description'),
                    reference_id=operation.get('reference_id')
                )
                
                results.append({
                    'operation_type': operation['type'],
                    'success': True,
                    'transaction_id': transaction.id,
                    'points_charged': float(abs(transaction.amount)),
                    'balance_after': float(transaction.balance_after)
                })
                
            except InsufficientPointsError as e:
                results.append({
                    'operation_type': operation['type'],
                    'success': False,
                    'error': str(e)
                })
                break  # Stop processing if insufficient funds
        
        return results
    
    @staticmethod
    def get_operation_cost_estimate(
        operation_types: List[str],
        custom_amounts: Optional[Dict[str, Decimal]] = None
    ) -> Dict[str, Any]:
        """
        Get cost estimate for multiple operations.
        
        Args:
            operation_types: List of operation types
            custom_amounts: Optional custom amounts for specific operations
        
        Returns:
            Cost breakdown and total
        """
        billing_service = BillingService(None)  # No DB needed for costs
        custom_amounts = custom_amounts or {}
        
        breakdown = {}
        total_cost = Decimal('0.00')
        
        for operation_type in operation_types:
            cost = custom_amounts.get(
                operation_type,
                billing_service.OPERATION_COSTS.get(operation_type, Decimal('0.10'))
            )
            breakdown[operation_type] = float(cost)
            total_cost += cost
        
        return {
            'breakdown': breakdown,
            'total_cost': float(total_cost),
            'currency': 'points'
        }


# Convenience decorators for common operations
def charge_for_crawling(amount: Optional[Decimal] = None):
    """Decorator for crawling operations"""
    return BillingIntegration.charge_for_operation('crawling_post', amount)

def charge_for_nlp_analysis(operation_subtype: str, amount: Optional[Decimal] = None):
    """Decorator for NLP analysis operations"""
    return BillingIntegration.charge_for_operation(f'nlp_{operation_subtype}', amount)

def charge_for_image_analysis(operation_subtype: str, amount: Optional[Decimal] = None):
    """Decorator for image analysis operations"""
    return BillingIntegration.charge_for_operation(f'image_{operation_subtype}', amount)

def charge_for_export(format_type: str, amount: Optional[Decimal] = None):
    """Decorator for export operations"""
    return BillingIntegration.charge_for_operation(f'export_{format_type}', amount)

def require_minimum_balance(min_balance: Decimal = Decimal('1.00')):
    """Decorator to require minimum balance"""
    return BillingIntegration.check_balance_before_operation(min_balance)