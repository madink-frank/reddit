#!/usr/bin/env python3
"""
Test script for the billing integration helper
"""

import sys
import os
from decimal import Decimal

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.models import User
from app.services.billing_service import BillingService, InsufficientPointsError
from app.services.billing_integration import (
    BillingIntegration,
    charge_for_crawling,
    charge_for_nlp_analysis,
    require_minimum_balance
)

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_billing_integration():
    """Test the billing integration functionality"""
    db = SessionLocal()
    
    try:
        print("🧪 Testing Billing Integration")
        print("=" * 50)
        
        # Create a test user
        test_user = User(
            reddit_id="integration_test_user_123",
            username="integration_test_user",
            email="integration@example.com",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Created test user: {test_user.username} (ID: {test_user.id})")
        
        # Add initial points
        billing_service = BillingService(db)
        billing_service.add_points(test_user.id, Decimal('50.00'), "Initial credit for testing")
        print("✅ Added 50 points to user account")
        
        # Test 1: Decorator for charging operations
        @charge_for_crawling()
        def mock_crawl_posts(user_id: int, subreddit: str):
            """Mock function that simulates crawling posts"""
            return {
                'posts_crawled': 10,
                'subreddit': subreddit,
                'status': 'success'
            }
        
        result = mock_crawl_posts(test_user.id, 'python')
        print(f"✅ Crawling operation completed:")
        print(f"   Posts crawled: {result['posts_crawled']}")
        print(f"   Points charged: {result['billing_info']['points_charged']}")
        print(f"   Balance after: {result['billing_info']['balance_after']}")
        
        # Test 2: NLP analysis decorator
        @charge_for_nlp_analysis('sentiment')
        def mock_sentiment_analysis(user_id: int, text: str):
            """Mock function that simulates sentiment analysis"""
            return {
                'text': text,
                'sentiment': 'positive',
                'confidence': 0.85
            }
        
        result = mock_sentiment_analysis(test_user.id, "This is a great post!")
        print(f"✅ Sentiment analysis completed:")
        print(f"   Sentiment: {result['sentiment']}")
        print(f"   Points charged: {result['billing_info']['points_charged']}")
        print(f"   Balance after: {result['billing_info']['balance_after']}")
        
        # Test 3: Minimum balance requirement
        @require_minimum_balance(Decimal('5.00'))
        def mock_expensive_operation(user_id: int):
            """Mock function that requires minimum balance"""
            return {'status': 'completed'}
        
        result = mock_expensive_operation(test_user.id)
        print(f"✅ Expensive operation completed: {result['status']}")
        
        # Test 4: Batch operations
        operations = [
            {'type': 'nlp_keywords', 'description': 'Keyword extraction'},
            {'type': 'image_ocr', 'description': 'OCR processing'},
            {'type': 'export_csv', 'description': 'CSV export'}
        ]
        
        batch_results = BillingIntegration.batch_charge_for_operations(
            user_id=test_user.id,
            operations=operations,
            db=db
        )
        
        print("✅ Batch operations completed:")
        for result in batch_results:
            if result['success']:
                print(f"   {result['operation_type']}: {result['points_charged']} points")
            else:
                print(f"   {result['operation_type']}: Failed - {result['error']}")
        
        # Test 5: Cost estimation
        cost_estimate = BillingIntegration.get_operation_cost_estimate([
            'crawling_post',
            'nlp_sentiment',
            'image_object_detection',
            'export_excel'
        ])
        
        print("✅ Cost estimation:")
        print(f"   Total cost: {cost_estimate['total_cost']} points")
        for operation, cost in cost_estimate['breakdown'].items():
            print(f"   {operation}: {cost} points")
        
        # Test 6: Insufficient funds scenario
        try:
            @charge_for_nlp_analysis('morphological', Decimal('100.00'))  # Expensive operation
            def mock_expensive_nlp(user_id: int):
                return {'status': 'completed'}
            
            mock_expensive_nlp(test_user.id)
        except InsufficientPointsError as e:
            print(f"✅ Correctly caught insufficient funds: {e}")
        
        # Final balance check
        final_balance = billing_service.get_user_balance(test_user.id)
        print(f"\n📊 Final balance: {final_balance} points")
        
        print("\n" + "=" * 50)
        print("🎉 All billing integration tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test data
        try:
            billing = db.query(billing_service.get_or_create_user_billing(test_user.id).__class__).filter_by(user_id=test_user.id).first()
            if billing:
                # Clean up related records
                from app.models import PointTransaction, UsageHistory
                db.query(UsageHistory).filter(UsageHistory.user_billing_id == billing.id).delete()
                db.query(PointTransaction).filter(PointTransaction.user_billing_id == billing.id).delete()
                db.query(billing.__class__).filter(billing.__class__.id == billing.id).delete()
            
            db.query(User).filter(User.id == test_user.id).delete()
            db.commit()
            print("🧹 Cleaned up test data")
        except:
            pass
        
        db.close()

if __name__ == "__main__":
    test_billing_integration()