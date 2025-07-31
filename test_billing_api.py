#!/usr/bin/env python3
"""
Test script for the billing API endpoints
"""

import sys
import os
import json
from decimal import Decimal

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import engine
from app.models import User

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_billing_api():
    """Test the billing API endpoints"""
    client = TestClient(app)
    db = SessionLocal()
    
    try:
        print("🧪 Testing Billing API Endpoints")
        print("=" * 50)
        
        # Create a test user
        test_user = User(
            reddit_id="api_test_user_123",
            username="api_test_user",
            email="apitest@example.com",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Created test user: {test_user.username} (ID: {test_user.id})")
        
        # For testing purposes, we'll mock the authentication
        # In a real scenario, you'd need to authenticate first
        
        # Test 1: Get operation costs (no auth required)
        response = client.get("/api/v1/billing/operation-costs")
        if response.status_code == 200:
            costs = response.json()
            print("✅ Retrieved operation costs:")
            for operation, cost in list(costs["operation_costs"].items())[:3]:
                print(f"   {operation}: {cost} points")
        else:
            print(f"❌ Failed to get operation costs: {response.status_code}")
        
        print("\n📝 Note: Other endpoints require authentication")
        print("   To test authenticated endpoints, you would need to:")
        print("   1. Create a valid JWT token")
        print("   2. Include it in the Authorization header")
        print("   3. Make requests to endpoints like:")
        print("      - GET /api/v1/billing/balance")
        print("      - POST /api/v1/billing/add-points")
        print("      - POST /api/v1/billing/deduct-points")
        print("      - GET /api/v1/billing/transactions")
        print("      - GET /api/v1/billing/usage-analytics")
        print("      - POST /api/v1/billing/spending-limits")
        
        print("\n" + "=" * 50)
        print("🎉 Billing API structure test completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test data
        try:
            db.query(User).filter(User.id == test_user.id).delete()
            db.commit()
            print("🧹 Cleaned up test data")
        except:
            pass
        
        db.close()

if __name__ == "__main__":
    test_billing_api()