"""
Authentication Dependencies

FastAPI dependencies for JWT token validation and user authentication.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.auth import TokenManager, TokenBlacklist
from app.core.database import get_db
from app.models.user import User
from app.utils.redis_client import get_redis_client


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and validate JWT token from Authorization header.
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        JWT token string
        
    Raises:
        HTTPException: If token is missing or invalid format
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return credentials.credentials


async def verify_token_not_blacklisted(
    token: str = Depends(get_current_user_token)
) -> str:
    """
    Verify that the token is not blacklisted.
    
    Args:
        token: JWT token
        
    Returns:
        JWT token if not blacklisted
        
    Raises:
        HTTPException: If token is blacklisted
    """
    try:
        redis_client = await get_redis_client()
        blacklist = TokenBlacklist(redis_client)
        
        if await blacklist.is_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return token
    except Exception as e:
        # If Redis is unavailable, log the error but don't block authentication
        # In production, you might want to handle this differently
        print(f"Warning: Could not check token blacklist: {e}")
        return token


async def get_current_user(
    token: str = Depends(verify_token_not_blacklisted),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        token: Validated JWT token
        db: Database session
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Verify and decode token
    payload = TokenManager.verify_token(token, "access")
    
    # Extract user identifier
    reddit_id: str = payload.get("reddit_id")
    if reddit_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.reddit_id == reddit_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user (alias for get_current_user with explicit active check).
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        Current active user
    """
    return current_user


def get_optional_current_user(
    token: Optional[str] = Depends(get_current_user_token),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if token is provided, otherwise return None.
    Useful for endpoints that work with or without authentication.
    
    Args:
        token: Optional JWT token
        db: Database session
        
    Returns:
        User object if authenticated, None otherwise
    """
    if not token:
        return None
    
    try:
        payload = TokenManager.verify_token(token, "access")
        reddit_id = payload.get("reddit_id")
        
        if reddit_id:
            user = db.query(User).filter(User.reddit_id == reddit_id).first()
            if user and user.is_active:
                return user
    except Exception:
        # If token is invalid, just return None instead of raising exception
        pass
    
    return None


async def verify_refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify refresh token and return payload.
    
    Args:
        credentials: HTTP Authorization credentials containing refresh token
        
    Returns:
        Token payload
        
    Raises:
        HTTPException: If refresh token is invalid
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Check if token is blacklisted
    try:
        redis_client = await get_redis_client()
        blacklist = TokenBlacklist(redis_client)
        
        if await blacklist.is_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        print(f"Warning: Could not check refresh token blacklist: {e}")
    
    # Verify refresh token
    payload = TokenManager.verify_token(token, "refresh")
    return payload