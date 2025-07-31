"""
Tests for Reddit OAuth2 Service
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.reddit_oauth import RedditOAuthService
from app.core.config import settings


class TestRedditOAuthService:
    """Test cases for RedditOAuthService class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.service = RedditOAuthService()
    
    def test_generate_auth_url(self):
        """Test OAuth2 authorization URL generation."""
        auth_url, state = self.service.generate_auth_url()
        
        # Check that URL is generated
        assert isinstance(auth_url, str)
        assert auth_url.startswith("https://www.reddit.com/api/v1/authorize")
        
        # Check that state is generated
        assert isinstance(state, str)
        assert len(state) > 0
        
        # Check that URL contains required parameters
        assert "client_id=" in auth_url
        assert "response_type=code" in auth_url
        assert f"state={state}" in auth_url
        assert "redirect_uri=" in auth_url
        assert "duration=permanent" in auth_url
        assert "scope=identity+read" in auth_url
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_token_success(self):
        """Test successful code to token exchange."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "test_access_token",
            "token_type": "bearer",
            "expires_in": 3600,
            "scope": "identity read"
        }
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            
            result = await self.service.exchange_code_for_token("test_code", "test_state")
            
            assert result["access_token"] == "test_access_token"
            assert result["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_token_failure(self):
        """Test failed code to token exchange."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid authorization code"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            
            with pytest.raises(Exception):  # Should raise HTTPException
                await self.service.exchange_code_for_token("invalid_code", "test_state")
    
    @pytest.mark.asyncio
    async def test_get_user_info_success(self):
        """Test successful user info retrieval."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "test_reddit_id",
            "name": "test_username",
            "email": "test@example.com"
        }
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            result = await self.service.get_user_info("test_access_token")
            
            assert result["id"] == "test_reddit_id"
            assert result["name"] == "test_username"
            assert result["email"] == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_get_user_info_failure(self):
        """Test failed user info retrieval."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Invalid access token"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            with pytest.raises(Exception):  # Should raise HTTPException
                await self.service.get_user_info("invalid_token")
    
    def test_validate_state_success(self):
        """Test successful state validation."""
        state = "test_state_123"
        assert self.service.validate_state(state, state) is True
    
    def test_validate_state_failure(self):
        """Test failed state validation."""
        assert self.service.validate_state("state1", "state2") is False
        assert self.service.validate_state("", "state") is False
        assert self.service.validate_state("state", "") is False
    
    @pytest.mark.asyncio
    async def test_revoke_token_success(self):
        """Test successful token revocation."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            
            result = await self.service.revoke_token("test_access_token")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_revoke_token_failure(self):
        """Test failed token revocation."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            
            result = await self.service.revoke_token("invalid_token")
            
            assert result is False


if __name__ == "__main__":
    pytest.main([__file__])