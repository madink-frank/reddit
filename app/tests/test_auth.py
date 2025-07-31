"""
Tests for JWT Token Management System
"""

import pytest
from datetime import datetime, timedelta
from app.core.auth import TokenManager
from app.core.config import settings
from fastapi import HTTPException


class TestTokenManager:
    """Test cases for TokenManager class."""
    
    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        token = TokenManager.create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token payload
        payload = TokenManager.get_token_payload(token)
        assert payload["sub"] == "test_user"
        assert payload["reddit_id"] == "test123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "iat" in payload
    
    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        token = TokenManager.create_refresh_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token payload
        payload = TokenManager.get_token_payload(token)
        assert payload["sub"] == "test_user"
        assert payload["reddit_id"] == "test123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "refresh"
        assert "exp" in payload
        assert "iat" in payload
    
    def test_verify_valid_access_token(self):
        """Test verification of valid access token."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        token = TokenManager.create_access_token(data)
        
        payload = TokenManager.verify_token(token, "access")
        
        assert payload["sub"] == "test_user"
        assert payload["reddit_id"] == "test123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "access"
    
    def test_verify_valid_refresh_token(self):
        """Test verification of valid refresh token."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        token = TokenManager.create_refresh_token(data)
        
        payload = TokenManager.verify_token(token, "refresh")
        
        assert payload["sub"] == "test_user"
        assert payload["reddit_id"] == "test123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "refresh"
    
    def test_verify_wrong_token_type(self):
        """Test verification fails with wrong token type."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        access_token = TokenManager.create_access_token(data)
        
        with pytest.raises(HTTPException) as exc_info:
            TokenManager.verify_token(access_token, "refresh")
        
        assert exc_info.value.status_code == 401
        assert "Invalid token type" in exc_info.value.detail
    
    def test_verify_expired_token(self):
        """Test verification fails with expired token."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        # Create token that expires immediately
        expired_delta = timedelta(seconds=-1)
        token = TokenManager.create_access_token(data, expired_delta)
        
        with pytest.raises(HTTPException) as exc_info:
            TokenManager.verify_token(token, "access")
        
        assert exc_info.value.status_code == 401
        assert "Token expired" in exc_info.value.detail
    
    def test_verify_invalid_token(self):
        """Test verification fails with invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(HTTPException) as exc_info:
            TokenManager.verify_token(invalid_token, "access")
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail
    
    def test_refresh_access_token(self):
        """Test creating new access token from refresh token."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        refresh_token = TokenManager.create_refresh_token(data)
        
        new_access_token = TokenManager.refresh_access_token(refresh_token)
        
        assert isinstance(new_access_token, str)
        assert len(new_access_token) > 0
        
        # Verify new access token
        payload = TokenManager.verify_token(new_access_token, "access")
        assert payload["sub"] == "test_user"
        assert payload["reddit_id"] == "test123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "access"
    
    def test_refresh_with_access_token_fails(self):
        """Test refresh fails when using access token instead of refresh token."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        access_token = TokenManager.create_access_token(data)
        
        with pytest.raises(HTTPException) as exc_info:
            TokenManager.refresh_access_token(access_token)
        
        assert exc_info.value.status_code == 401
        assert "Invalid token type" in exc_info.value.detail
    
    def test_get_token_payload_without_verification(self):
        """Test getting token payload without verification."""
        data = {"sub": "test_user", "reddit_id": "test123", "username": "testuser"}
        token = TokenManager.create_access_token(data)
        
        payload = TokenManager.get_token_payload(token)
        
        assert payload["sub"] == "test_user"
        assert payload["reddit_id"] == "test123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "access"
    
    def test_get_token_payload_invalid_token(self):
        """Test getting payload from invalid token returns empty dict."""
        invalid_token = "invalid.token.here"
        
        payload = TokenManager.get_token_payload(invalid_token)
        
        assert payload == {}


if __name__ == "__main__":
    pytest.main([__file__])