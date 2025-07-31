"""
Reddit OAuth2 Service

Handles Reddit OAuth2 authentication flow and user data management.
"""

import httpx
import secrets
import urllib.parse
from typing import Dict, Any, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.auth import TokenManager
from app.models.user import User


class RedditOAuthService:
    """Service for handling Reddit OAuth2 authentication."""
    
    def __init__(self):
        self.client_id = settings.REDDIT_CLIENT_ID
        self.client_secret = settings.REDDIT_CLIENT_SECRET
        self.redirect_uri = settings.REDDIT_REDIRECT_URI
        self.user_agent = settings.REDDIT_USER_AGENT
        
        # Reddit OAuth2 endpoints
        self.auth_url = "https://www.reddit.com/api/v1/authorize"
        self.token_url = "https://www.reddit.com/api/v1/access_token"
        self.user_info_url = "https://oauth.reddit.com/api/v1/me"
    
    def generate_auth_url(self) -> Tuple[str, str]:
        """
        Generate Reddit OAuth2 authorization URL.
        
        Returns:
            Tuple of (auth_url, state) where state is used for CSRF protection
        """
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # OAuth2 parameters
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "state": state,
            "redirect_uri": self.redirect_uri,
            "duration": "permanent",  # Request permanent access
            "scope": "identity read"  # Minimal required scopes
        }
        
        # Build authorization URL
        auth_url = f"{self.auth_url}?{urllib.parse.urlencode(params)}"
        
        return auth_url, state
    
    async def exchange_code_for_token(self, code: str, state: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from Reddit
            state: State parameter for CSRF protection
            
        Returns:
            Reddit access token response
            
        Raises:
            HTTPException: If token exchange fails
        """
        # Prepare token request
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri
        }
        
        headers = {
            "User-Agent": self.user_agent,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        # Make token request with basic auth
        auth = (self.client_id, self.client_secret)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data=data,
                    headers=headers,
                    auth=auth,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to exchange code for token: {response.text}"
                    )
                
                return response.json()
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Reddit API: {str(e)}"
            )
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information from Reddit API.
        
        Args:
            access_token: Reddit access token
            
        Returns:
            User information from Reddit
            
        Raises:
            HTTPException: If user info request fails
        """
        headers = {
            "User-Agent": self.user_agent,
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.user_info_url,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to get user info: {response.text}"
                    )
                
                return response.json()
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Reddit API: {str(e)}"
            )
    
    async def authenticate_user(self, code: str, state: str, db: Session) -> Dict[str, Any]:
        """
        Complete OAuth2 authentication flow and return JWT tokens.
        
        Args:
            code: Authorization code from Reddit
            state: State parameter for CSRF protection
            db: Database session
            
        Returns:
            Dictionary containing JWT tokens and user info
            
        Raises:
            HTTPException: If authentication fails
        """
        # Exchange code for Reddit access token
        token_response = await self.exchange_code_for_token(code, state)
        reddit_access_token = token_response.get("access_token")
        
        if not reddit_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received from Reddit"
            )
        
        # Get user information from Reddit
        user_info = await self.get_user_info(reddit_access_token)
        
        # Extract user data
        reddit_id = user_info.get("id")
        username = user_info.get("name")
        
        if not reddit_id or not username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user information received from Reddit"
            )
        
        # Find or create user in database
        user = db.query(User).filter(User.reddit_id == reddit_id).first()
        
        if not user:
            # Create new user
            user = User(
                reddit_id=reddit_id,
                username=username,
                email=user_info.get("email"),  # May be None
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user information
            user.username = username
            user.email = user_info.get("email")
            user.is_active = True
            db.commit()
            db.refresh(user)
        
        # Generate JWT tokens
        token_data = {
            "sub": str(user.id),
            "reddit_id": user.reddit_id,
            "username": user.username
        }
        
        access_token = TokenManager.create_access_token(token_data)
        refresh_token = TokenManager.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "reddit_id": user.reddit_id,
                "username": user.username,
                "email": user.email,
                "is_active": user.is_active
            }
        }
    
    def validate_state(self, received_state: str, expected_state: str) -> bool:
        """
        Validate state parameter for CSRF protection.
        
        Args:
            received_state: State received from OAuth callback
            expected_state: Expected state value
            
        Returns:
            True if state is valid, False otherwise
        """
        return received_state == expected_state
    
    async def revoke_token(self, access_token: str) -> bool:
        """
        Revoke Reddit access token.
        
        Args:
            access_token: Reddit access token to revoke
            
        Returns:
            True if revocation was successful, False otherwise
        """
        headers = {
            "User-Agent": self.user_agent,
            "Authorization": f"Bearer {access_token}"
        }
        
        data = {
            "token": access_token,
            "token_type_hint": "access_token"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://www.reddit.com/api/v1/revoke_token",
                    data=data,
                    headers=headers,
                    auth=(self.client_id, self.client_secret),
                    timeout=30.0
                )
                
                return response.status_code == 200
                
        except httpx.RequestError:
            return False


# Global service instance
reddit_oauth_service = RedditOAuthService()


def get_reddit_oauth_service() -> RedditOAuthService:
    """Get Reddit OAuth service instance."""
    return reddit_oauth_service