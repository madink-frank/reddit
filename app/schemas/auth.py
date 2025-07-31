"""
Authentication Schemas

Pydantic models for authentication requests and responses.
"""

from typing import Optional
from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    """Response model for token endpoints."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")


class TokenRefreshRequest(BaseModel):
    """Request model for token refresh."""
    refresh_token: str = Field(..., description="Valid refresh token")


class TokenRefreshResponse(BaseModel):
    """Response model for token refresh."""
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")


class LoginRequest(BaseModel):
    """Request model for Reddit OAuth2 login."""
    code: str = Field(..., description="Authorization code from Reddit OAuth2")
    state: str = Field(..., description="State parameter for CSRF protection")


class UserResponse(BaseModel):
    """Response model for user information."""
    id: int = Field(..., description="User ID")
    reddit_id: str = Field(..., description="Reddit user ID")
    username: str = Field(..., description="Reddit username")
    email: Optional[str] = Field(None, description="User email")
    is_active: bool = Field(..., description="Whether user account is active")
    
    class Config:
        from_attributes = True


class LogoutRequest(BaseModel):
    """Request model for logout (optional body)."""
    revoke_refresh_token: bool = Field(default=True, description="Whether to revoke refresh token")


class AuthStatusResponse(BaseModel):
    """Response model for authentication status."""
    authenticated: bool = Field(..., description="Whether user is authenticated")
    user: Optional[UserResponse] = Field(None, description="User information if authenticated")


class TokenValidationResponse(BaseModel):
    """Response model for token validation."""
    valid: bool = Field(..., description="Whether token is valid")
    expires_at: Optional[int] = Field(None, description="Token expiration timestamp")
    user_id: Optional[int] = Field(None, description="User ID if token is valid")
    reddit_id: Optional[str] = Field(None, description="Reddit ID if token is valid")