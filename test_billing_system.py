#!/usr/bin/env python3
"""
Test script for the billing system implementation
"""

import sys
import os
from decimal import Decimal
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.models import User, UserBilling, PointTransaction, UsageHistory
from app.services.billing_service import BillingService, InsufficientPointsError

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_billing_system():
    """Test the billing system functionality"""
    db = SessionLocal()
    billing_service = BillingService(db)
    
    try:
        print("🧪 Testing Billing System Implementation")
        print("=" * 50)
        
        # Create a test user
        test_user = User(
            reddit_id="test_user_123",
            username="test_user",
            email="test@example.com",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Created test user: {test_user.username} (ID: {test_user.id})")
        
        # Test 1: Get or create billing record
        billing = billing_service.get_or_create_user_billing(test_user.id)
        print(f"✅ Created billing record for user {test_user.id}")
        print(f"   Initial balance: {billing.current_points} points")
        
        # Test 2: Add points
        transaction = billing_service.add_points(
            user_id=test_user.id,
            amount=Decimal('100.00'),
            description="Initial credit"
        )
        print(f"✅ Added 100 points. Transaction ID: {transaction.id}")
        
        # Check balance
        balance = billing_service.get_user_balance(test_user.id)
        print(f"   Current balance: {balance} points")
        
        # Test 3: Deduct points for operations
        operations_to_test = [
            ('crawling_post', None),
            ('nlp_sentiment', None),
            ('image_ocr', None),
            ('export_excel', None)
        ]
        
        for operation, amount in operations_to_test:
            try:
                transaction = billing_service.deduct_points(
                    user_id=test_user.id,
                    operation_type=operation,
                    amount=amount,
                    reference_id=f"test_{operation}_{datetime.now().timestamp()}"
                )
                print(f"✅ Deducted points for {operation}: {abs(transaction.amount)} points")
                print(f"   Balance after: {transaction.balance_after} points")
            except InsufficientPointsError as e:
                print(f"❌ Insufficient points for {operation}: {e}")
        
        # Test 4: Check spending limits
        limit_check = billing_service.check_spending_limits(
            user_id=test_user.id,
            amount=Decimal('50.00')
        )
        print(f"✅ Spending limit check: Can proceed = {limit_check['can_proceed']}")
        if limit_check['warnings']:
            print(f"   Warnings: {limit_check['warnings']}")
        
        # Test 5: Get transaction history
        history = billing_service.get_transaction_history(test_user.id, limit=10)
        print(f"✅ Retrieved {len(history)} transactions from history")
        for i, tx in enumerate(history[:3], 1):
            print(f"   {i}. {tx.transaction_type}: {tx.amount} points ({tx.description})")
        
        # Test 6: Get usage analytics
        analytics = billing_service.get_usage_analytics(test_user.id, days=7)
        print(f"✅ Usage analytics for last 7 days:")
        print(f"   Total operations: {analytics['total_operations']}")
        print(f"   Total points used: {analytics['total_points_used']}")
        print(f"   Average daily operations: {analytics['avg_daily_operations']:.2f}")
        
        # Test 7: Update spending limits
        updated_billing = billing_service.update_spending_limits(
            user_id=test_user.id,
            daily_limit=Decimal('20.00'),
            monthly_limit=Decimal('500.00')
        )
        print(f"✅ Updated spending limits:")
        print(f"   Daily limit: {updated_billing.daily_limit}")
        print(f"   Monthly limit: {updated_billing.monthly_limit}")
        
        # Test 8: Test insufficient points scenario
        try:
            billing_service.deduct_points(
                user_id=test_user.id,
                operation_type='image_object_detection',
                amount=Decimal('1000.00')  # More than available balance
            )
        except InsufficientPointsError as e:
            print(f"✅ Correctly caught insufficient points error: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 All billing system tests completed successfully!")
        
        # Final balance check
        final_balance = billing_service.get_user_balance(test_user.id)
        print(f"📊 Final balance: {final_balance} points")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test data
        try:
            db.query(UsageHistory).filter(UsageHistory.user_billing_id == billing.id).delete()
            db.query(PointTransaction).filter(PointTransaction.user_billing_id == billing.id).delete()
            db.query(UserBilling).filter(UserBilling.user_id == test_user.id).delete()
            db.query(User).filter(User.id == test_user.id).delete()
            db.commit()
            print("🧹 Cleaned up test data")
        except:
            pass
        
        db.close()

if __name__ == "__main__":
    test_billing_system()