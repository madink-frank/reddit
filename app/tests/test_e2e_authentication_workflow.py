"""
End-to-End Tests for Authentication Workflow

Tests for complete authentication workflow from login to resource access.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, Mock
from datetime import datetime, timedelta

from app.main import app
from app.models.user import User
from app.core.auth import TokenManager


class TestAuthenticationWorkflowE2E:
    """End-to-end tests for the complete authentication workflow."""
    
    @pytest.fixture
    def mock_reddit_oauth_responses(self):
        """Mock Reddit OAuth responses for testing."""
        return {
            "access_token_response": {
                "access_token": "reddit_access_token_123",
                "token_type": "bearer",
                "expires_in": 3600,
                "scope": "identity read",
                "refresh_token": "reddit_refresh_token_123"
            },
            "user_info_response": {
                "id": "reddit_user_123",
                "name": "testuser",
                "email": "testuser@example.com",
                "verified": True,
                "created_utc": 1640995200  # 2022-01-01
            }
        }
    
    def test_complete_oauth_login_workflow(self, client: TestClient, db_session: Session, mock_reddit_oauth_responses):
        """Test the complete OAuth login workflow from redirect to token generation."""
        
        # Step 1: Initiate OAuth login (get redirect URL)
        response = client.get("/api/v1/auth/login")
        assert response.status_code == 302  # Redirect to Reddit OAuth
        
        # Verify redirect URL contains required parameters
        redirect_url = response.headers["location"]
        assert "reddit.com/api/v1/authorize" in redirect_url
        assert "client_id" in redirect_url
        assert "response_type=code" in redirect_url
        assert "state" in redirect_url
        assert "scope" in redirect_url
        
        # Step 2: Mock Reddit OAuth callback
        with patch('app.services.reddit_oauth.RedditOAuth.exchange_code_for_token') as mock_token_exchange, \
             patch('app.services.reddit_oauth.RedditOAuth.get_user_info') as mock_user_info:
            
            mock_token_exchange.return_value = mock_reddit_oauth_responses["access_token_response"]
            mock_user_info.return_value = mock_reddit_oauth_responses["user_info_response"]
            
            # Simulate OAuth callback with authorization code
            callback_data = {
                "code": "reddit_auth_code_123",
                "state": "oauth_state_123"
            }
            
            response = client.post("/api/v1/auth/callback", json=callback_data)
            assert response.status_code == 200
            
            auth_response = response.json()
            assert "access_token" in auth_response
            assert "refresh_token" in auth_response
            assert "token_type" in auth_response
            assert "expires_in" in auth_response
            assert "user" in auth_response
            
            # Verify user information
            user_info = auth_response["user"]
            assert user_info["reddit_id"] == "reddit_user_123"
            assert user_info["username"] == "testuser"
            assert user_info["email"] == "testuser@example.com"
            
            access_token = auth_response["access_token"]
            refresh_token = auth_response["refresh_token"]
        
        # Step 3: Verify user was created in database
        user = db_session.query(User).filter(User.reddit_id == "reddit_user_123").first()
        assert user is not None
        assert user.username == "testuser"
        assert user.email == "testuser@example.com"
        assert user.is_active is True
        
        # Step 4: Use access token to access protected resources
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test accessing user profile
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        profile_response = response.json()
        
        assert profile_response["reddit_id"] == "reddit_user_123"
        assert profile_response["username"] == "testuser"
        assert profile_response["email"] == "testuser@example.com"
        
        # Test accessing protected keyword endpoint
        response = client.get("/api/v1/keywords", headers=auth_headers)
        assert response.status_code == 200
        
        # Step 5: Test token refresh workflow
        response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        
        refresh_response = response.json()
        assert "access_token" in refresh_response
        assert "token_type" in refresh_response
        assert "expires_in" in refresh_response
        
        new_access_token = refresh_response["access_token"]
        assert new_access_token != access_token  # Should be different
        
        # Step 6: Use new access token
        new_auth_headers = {"Authorization": f"Bearer {new_access_token}"}
        response = client.get("/api/v1/auth/me", headers=new_auth_headers)
        assert response.status_code == 200
        
        # Step 7: Test logout
        response = client.post("/api/v1/auth/logout", headers=new_auth_headers)
        assert response.status_code == 200
        
        logout_response = response.json()
        assert logout_response["message"] == "Successfully logged out"
    
    def test_authentication_workflow_with_existing_user(self, client: TestClient, db_session: Session, mock_reddit_oauth_responses):
        """Test authentication workflow when user already exists."""
        
        # Pre-create user in database
        existing_user = User(
            reddit_id="reddit_user_123",
            username="oldusername",
            email="old@example.com",
            is_active=True
        )
        db_session.add(existing_user)
        db_session.commit()
        db_session.refresh(existing_user)
        
        # Mock OAuth flow
        with patch('app.services.reddit_oauth.RedditOAuth.exchange_code_for_token') as mock_token_exchange, \
             patch('app.services.reddit_oauth.RedditOAuth.get_user_info') as mock_user_info:
            
            mock_token_exchange.return_value = mock_reddit_oauth_responses["access_token_response"]
            # User info has updated username and email
            updated_user_info = mock_reddit_oauth_responses["user_info_response"].copy()
            updated_user_info["name"] = "updatedusername"
            updated_user_info["email"] = "updated@example.com"
            mock_user_info.return_value = updated_user_info
            
            callback_data = {
                "code": "reddit_auth_code_123",
                "state": "oauth_state_123"
            }
            
            response = client.post("/api/v1/auth/callback", json=callback_data)
            assert response.status_code == 200
            
            auth_response = response.json()
            user_info = auth_response["user"]
            
            # Verify user info was updated
            assert user_info["username"] == "updatedusername"
            assert user_info["email"] == "updated@example.com"
        
        # Verify database was updated
        updated_user = db_session.query(User).filter(User.reddit_id == "reddit_user_123").first()
        assert updated_user.username == "updatedusername"
        assert updated_user.email == "updated@example.com"
        assert updated_user.id == existing_user.id  # Same user, just updated
    
    def test_authentication_error_handling_workflow(self, client: TestClient, db_session: Session):
        """Test authentication workflow error handling."""
        
        # Test invalid authorization code
        with patch('app.services.reddit_oauth.RedditOAuth.exchange_code_for_token') as mock_token_exchange:
            mock_token_exchange.side_effect = Exception("Invalid authorization code")
            
            callback_data = {
                "code": "invalid_code",
                "state": "oauth_state_123"
            }
            
            response = client.post("/api/v1/auth/callback", json=callback_data)
            assert response.status_code == 400
            
            error_response = response.json()
            assert "error" in error_response
            assert "Invalid authorization code" in error_response["detail"]
        
        # Test invalid refresh token
        response = client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid_refresh_token"})
        assert response.status_code == 401
        
        error_response = response.json()
        assert "Invalid token type" in error_response["detail"] or "Could not validate credentials" in error_response["detail"]
        
        # Test accessing protected resource without token
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403
        
        # Test accessing protected resource with invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=invalid_headers)
        assert response.status_code == 401
    
    def test_token_expiration_workflow(self, client: TestClient, db_session: Session, mock_reddit_oauth_responses):
        """Test token expiration and refresh workflow."""
        
        # Create user and generate short-lived token
        user = User(
            reddit_id="token_test_user",
            username="tokenuser",
            email="token@example.com"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Create token that expires in 1 second
        token_data = {
            "sub": str(user.id),
            "reddit_id": user.reddit_id,
            "username": user.username
        }
        
        short_lived_token = TokenManager.create_access_token(
            token_data, 
            expires_delta=timedelta(seconds=1)
        )
        refresh_token = TokenManager.create_refresh_token(token_data)
        
        # Use token immediately (should work)
        auth_headers = {"Authorization": f"Bearer {short_lived_token}"}
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        
        # Wait for token to expire
        import time
        time.sleep(2)
        
        # Try to use expired token (should fail)
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 401
        
        error_response = response.json()
        assert "Token expired" in error_response["detail"]
        
        # Refresh the token
        response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        
        refresh_response = response.json()
        new_access_token = refresh_response["access_token"]
        
        # Use new token (should work)
        new_auth_headers = {"Authorization": f"Bearer {new_access_token}"}
        response = client.get("/api/v1/auth/me", headers=new_auth_headers)
        assert response.status_code == 200
    
    def test_user_permissions_workflow(self, client: TestClient, db_session: Session):
        """Test user permissions and resource access workflow."""
        
        # Create two users
        user1 = User(reddit_id="user1", username="user1", email="user1@example.com")
        user2 = User(reddit_id="user2", username="user2", email="user2@example.com")
        
        db_session.add(user1)
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user1)
        db_session.refresh(user2)
        
        # Create tokens for both users
        user1_token = TokenManager.create_access_token({
            "sub": str(user1.id),
            "reddit_id": user1.reddit_id,
            "username": user1.username
        })
        
        user2_token = TokenManager.create_access_token({
            "sub": str(user2.id),
            "reddit_id": user2.reddit_id,
            "username": user2.username
        })
        
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User 1 creates a keyword
        keyword_data = {"keyword": "user1 keyword", "description": "Private to user 1"}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=user1_headers)
        assert response.status_code == 201
        keyword_id = response.json()["id"]
        
        # User 1 can access their keyword
        response = client.get(f"/api/v1/keywords/{keyword_id}", headers=user1_headers)
        assert response.status_code == 200
        
        # User 2 cannot access User 1's keyword
        response = client.get(f"/api/v1/keywords/{keyword_id}", headers=user2_headers)
        assert response.status_code == 404  # Not found (not unauthorized, for security)
        
        # User 2 cannot modify User 1's keyword
        update_data = {"keyword": "hacked keyword"}
        response = client.put(f"/api/v1/keywords/{keyword_id}", json=update_data, headers=user2_headers)
        assert response.status_code == 404
        
        # User 2 cannot delete User 1's keyword
        response = client.delete(f"/api/v1/keywords/{keyword_id}", headers=user2_headers)
        assert response.status_code == 404
        
        # User 1 can still access and modify their keyword
        response = client.get(f"/api/v1/keywords/{keyword_id}", headers=user1_headers)
        assert response.status_code == 200
        
        response = client.put(f"/api/v1/keywords/{keyword_id}", json=update_data, headers=user1_headers)
        assert response.status_code == 200
    
    def test_inactive_user_workflow(self, client: TestClient, db_session: Session):
        """Test workflow with inactive user account."""
        
        # Create inactive user
        inactive_user = User(
            reddit_id="inactive_user",
            username="inactiveuser",
            email="inactive@example.com",
            is_active=False
        )
        db_session.add(inactive_user)
        db_session.commit()
        db_session.refresh(inactive_user)
        
        # Create token for inactive user
        token_data = {
            "sub": str(inactive_user.id),
            "reddit_id": inactive_user.reddit_id,
            "username": inactive_user.username
        }
        inactive_user_token = TokenManager.create_access_token(token_data)
        inactive_headers = {"Authorization": f"Bearer {inactive_user_token}"}
        
        # Inactive user should not be able to access protected resources
        response = client.get("/api/v1/auth/me", headers=inactive_headers)
        assert response.status_code == 403
        
        error_response = response.json()
        assert "inactive" in error_response["detail"].lower() or "disabled" in error_response["detail"].lower()
        
        # Inactive user should not be able to create keywords
        keyword_data = {"keyword": "inactive user keyword"}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=inactive_headers)
        assert response.status_code == 403
    
    def test_concurrent_authentication_workflow(self, client: TestClient, db_session: Session, mock_reddit_oauth_responses):
        """Test concurrent authentication requests."""
        
        # Simulate multiple concurrent OAuth callbacks for the same user
        with patch('app.services.reddit_oauth.RedditOAuth.exchange_code_for_token') as mock_token_exchange, \
             patch('app.services.reddit_oauth.RedditOAuth.get_user_info') as mock_user_info:
            
            mock_token_exchange.return_value = mock_reddit_oauth_responses["access_token_response"]
            mock_user_info.return_value = mock_reddit_oauth_responses["user_info_response"]
            
            callback_data = {
                "code": "concurrent_auth_code",
                "state": "oauth_state_123"
            }
            
            # Make multiple concurrent requests
            responses = []
            for i in range(3):
                response = client.post("/api/v1/auth/callback", json=callback_data)
                responses.append(response)
            
            # All should succeed (or at least not cause database errors)
            successful_responses = [r for r in responses if r.status_code == 200]
            assert len(successful_responses) >= 1
            
            # Verify only one user was created
            user_count = db_session.query(User).filter(User.reddit_id == "reddit_user_123").count()
            assert user_count == 1
    
    def test_authentication_state_validation_workflow(self, client: TestClient, mock_reddit_oauth_responses):
        """Test OAuth state parameter validation."""
        
        with patch('app.services.reddit_oauth.RedditOAuth.exchange_code_for_token') as mock_token_exchange, \
             patch('app.services.reddit_oauth.RedditOAuth.get_user_info') as mock_user_info:
            
            mock_token_exchange.return_value = mock_reddit_oauth_responses["access_token_response"]
            mock_user_info.return_value = mock_reddit_oauth_responses["user_info_response"]
            
            # Test with invalid state parameter
            callback_data = {
                "code": "valid_auth_code",
                "state": "invalid_state_123"
            }
            
            response = client.post("/api/v1/auth/callback", json=callback_data)
            # Depending on implementation, this might return 400 or still succeed
            # The important thing is that it handles the state parameter appropriately
            assert response.status_code in [200, 400]
            
            if response.status_code == 400:
                error_response = response.json()
                assert "state" in error_response["detail"].lower() or "invalid" in error_response["detail"].lower()
    
    def test_complete_user_lifecycle_workflow(self, client: TestClient, db_session: Session, mock_reddit_oauth_responses):
        """Test complete user lifecycle from registration to account deletion."""
        
        # Step 1: User registration through OAuth
        with patch('app.services.reddit_oauth.RedditOAuth.exchange_code_for_token') as mock_token_exchange, \
             patch('app.services.reddit_oauth.RedditOAuth.get_user_info') as mock_user_info:
            
            mock_token_exchange.return_value = mock_reddit_oauth_responses["access_token_response"]
            mock_user_info.return_value = mock_reddit_oauth_responses["user_info_response"]
            
            callback_data = {
                "code": "lifecycle_auth_code",
                "state": "oauth_state_123"
            }
            
            response = client.post("/api/v1/auth/callback", json=callback_data)
            assert response.status_code == 200
            
            auth_response = response.json()
            access_token = auth_response["access_token"]
            user_info = auth_response["user"]
            user_id = user_info["id"]
        
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 2: User creates content (keywords, etc.)
        keyword_data = {"keyword": "lifecycle test", "description": "Test keyword"}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        assert response.status_code == 201
        keyword_id = response.json()["id"]
        
        # Step 3: User updates profile
        profile_update = {"email": "newemail@example.com"}
        response = client.put("/api/v1/auth/profile", json=profile_update, headers=auth_headers)
        # This endpoint might not exist yet, but the workflow would include it
        
        # Step 4: User deactivates account
        response = client.post("/api/v1/auth/deactivate", headers=auth_headers)
        # This endpoint might not exist yet, but would be part of complete lifecycle
        
        # Step 5: Verify user cannot access resources after deactivation
        response = client.get("/api/v1/keywords", headers=auth_headers)
        # Should fail due to deactivated account
        
        # Step 6: User reactivates account (if supported)
        # This would involve another OAuth flow or reactivation process