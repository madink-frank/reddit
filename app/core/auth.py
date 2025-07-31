"""
JWT Token Management System

This module provides JWT token creation, validation, and refresh functionality
for the Reddit Content Platform authentication system.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import time
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenManager:
    """Manages JWT token operations including creation, validation, and refresh."""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: The payload data to encode in the token
            expires_delta: Optional custom expiration time
            
        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()
        current_time = time.time()
        
        if expires_delta:
            expire_time = current_time + expires_delta.total_seconds()
        else:
            expire_time = current_time + (settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        
        to_encode.update({
            "exp": int(expire_time),
            "iat": int(current_time),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """
        Create a JWT refresh token.
        
        Args:
            data: The payload data to encode in the token
            
        Returns:
            Encoded JWT refresh token string
        """
        to_encode = data.copy()
        current_time = time.time()
        expire_time = current_time + (settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)
        
        to_encode.update({
            "exp": int(expire_time),
            "iat": int(current_time),
            "type": "refresh"
        })
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: The JWT token to verify
            token_type: Expected token type ("access" or "refresh")
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # First decode without expiration check to get better error messages
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False}
            )
            
            # Verify token type
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Check if token is expired
            exp = payload.get("exp")
            if exp is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing expiration",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            current_time = time.time()
            if current_time >= exp:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return payload
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> str:
        """
        Create a new access token using a valid refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New access token
            
        Raises:
            HTTPException: If refresh token is invalid
        """
        payload = TokenManager.verify_token(refresh_token, "refresh")
        
        # Extract user data from refresh token
        user_data = {
            "sub": payload.get("sub"),
            "reddit_id": payload.get("reddit_id"),
            "username": payload.get("username")
        }
        
        # Create new access token
        return TokenManager.create_access_token(user_data)
    
    @staticmethod
    def get_token_payload(token: str) -> Dict[str, Any]:
        """
        Get token payload without verification (for debugging/logging).
        
        Args:
            token: JWT token
            
        Returns:
            Token payload or empty dict if invalid
        """
        try:
            return jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False}
            )
        except Exception:
            return {}


class TokenBlacklist:
    """
    Manages token blacklisting for logout functionality.
    Uses Redis for storage with automatic expiration.
    """
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.blacklist_prefix = "blacklisted_token:"
    
    async def add_token(self, token: str) -> None:
        """
        Add a token to the blacklist.
        
        Args:
            token: JWT token to blacklist
        """
        try:
            # Get token expiration to set Redis TTL
            payload = TokenManager.get_token_payload(token)
            exp = payload.get("exp")
            
            if exp:
                # Calculate TTL (time until token naturally expires)
                ttl = max(0, int(exp - time.time()))
                
                # Store in Redis with TTL
                await self.redis_client.setex(
                    f"{self.blacklist_prefix}{token}",
                    ttl,
                    "blacklisted"
                )
        except Exception:
            # If we can't parse the token, blacklist it for default duration
            await self.redis_client.setex(
                f"{self.blacklist_prefix}{token}",
                settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "blacklisted"
            )
    
    async def is_blacklisted(self, token: str) -> bool:
        """
        Check if a token is blacklisted.
        
        Args:
            token: JWT token to check
            
        Returns:
            True if token is blacklisted, False otherwise
        """
        try:
            result = await self.redis_client.get(f"{self.blacklist_prefix}{token}")
            return result is not None
        except Exception:
            # If Redis is unavailable, assume token is not blacklisted
            return False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)