"""
Authentication API Endpoints

FastAPI endpoints for user authentication using Reddit OAuth2 and JWT tokens.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import (
    get_current_user, 
    verify_refresh_token,
    get_current_user_token,
    verify_token_not_blacklisted
)
from app.core.auth import TokenManager, TokenBlacklist
from app.core.config import settings
from app.schemas.auth import (
    TokenResponse, 
    TokenRefreshRequest, 
    TokenRefreshResponse,
    LoginRequest,
    UserResponse,
    LogoutRequest,
    AuthStatusResponse,
    TokenValidationResponse
)
from app.services.reddit_oauth import get_reddit_oauth_service, RedditOAuthService
from app.models.user import User
from app.utils.redis_client import get_redis_client


router = APIRouter()


@router.get(
    "/login", 
    response_class=RedirectResponse,
    tags=["authentication"],
    summary="Initiate Reddit OAuth2 login",
    description="Start the Reddit OAuth2 authentication flow by redirecting to Reddit's authorization page.",
    responses={
        302: {
            "description": "Redirect to Reddit OAuth2 authorization page",
            "headers": {
                "Location": {
                    "description": "Reddit OAuth2 authorization URL",
                    "schema": {"type": "string"}
                }
            }
        },
        500: {"$ref": "#/components/responses/500"}
    }
)
async def initiate_login(
    request: Request,
    reddit_service: RedditOAuthService = Depends(get_reddit_oauth_service)
):
    """
    Initiate Reddit OAuth2 login flow.
    
    This endpoint starts the OAuth2 authentication process by generating a secure
    authorization URL and redirecting the user to Reddit's authorization page.
    
    The user will be prompted to authorize the application and will be redirected
    back to the callback endpoint with an authorization code.
    """
    auth_url, state = reddit_service.generate_auth_url()
    
    # Store state in session for CSRF protection
    # In production, you might want to store this in Redis with expiration
    request.session["oauth_state"] = state
    
    return RedirectResponse(url=auth_url)


@router.get(
    "/callback",
    response_model=TokenResponse,
    tags=["authentication"],
    summary="Handle Reddit OAuth2 callback",
    description="Process the OAuth2 callback from Reddit and exchange authorization code for JWT tokens.",
    responses={
        200: {
            "description": "Successfully authenticated and tokens issued",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 900
                    }
                }
            }
        },
        400: {"$ref": "#/components/responses/400"},
        500: {"$ref": "#/components/responses/500"}
    }
)
async def oauth_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db),
    reddit_service: RedditOAuthService = Depends(get_reddit_oauth_service)
) -> TokenResponse:
    """
    Handle Reddit OAuth2 callback.
    
    This endpoint is called by Reddit after the user authorizes the application.
    It validates the state parameter for CSRF protection and exchanges the
    authorization code for JWT access and refresh tokens.
    """
    # Validate state parameter for CSRF protection
    stored_state = request.session.get("oauth_state")
    if not stored_state or not reddit_service.validate_state(state, stored_state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )
    
    # Clear stored state
    request.session.pop("oauth_state", None)
    
    # Complete authentication
    auth_result = await reddit_service.authenticate_user(code, state, db)
    
    return TokenResponse(
        access_token=auth_result["access_token"],
        refresh_token=auth_result["refresh_token"],
        token_type=auth_result["token_type"],
        expires_in=auth_result["expires_in"]
    )


@router.post(
    "/login", 
    response_model=TokenResponse,
    tags=["authentication"],
    summary="Login with authorization code",
    description="Alternative login endpoint for frontend applications that handle OAuth flow directly.",
    responses={
        200: {
            "description": "Successfully authenticated and tokens issued",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 900
                    }
                }
            }
        },
        400: {"$ref": "#/components/responses/400"},
        422: {"$ref": "#/components/responses/422"},
        500: {"$ref": "#/components/responses/500"}
    }
)
async def login_with_code(
    login_request: LoginRequest,
    db: Session = Depends(get_db),
    reddit_service: RedditOAuthService = Depends(get_reddit_oauth_service)
):
    """
    Login with authorization code (alternative to callback endpoint).
    
    This endpoint is useful for frontend applications that handle the OAuth flow
    directly and need to exchange the authorization code for JWT tokens via API call
    instead of using the callback redirect flow.
    """
    auth_result = await reddit_service.authenticate_user(
        login_request.code, 
        login_request.state, 
        db
    )
    
    return TokenResponse(
        access_token=auth_result["access_token"],
        refresh_token=auth_result["refresh_token"],
        token_type=auth_result["token_type"],
        expires_in=auth_result["expires_in"]
    )


@router.post(
    "/refresh", 
    response_model=TokenRefreshResponse,
    tags=["authentication"],
    summary="Refresh access token",
    description="Generate a new access token using a valid refresh token.",
    responses={
        200: {
            "description": "New access token generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 900
                    }
                }
            }
        },
        401: {"$ref": "#/components/responses/401"},
        422: {"$ref": "#/components/responses/422"}
    }
)
async def refresh_token(
    refresh_payload: dict = Depends(verify_refresh_token)
):
    """
    Refresh access token using refresh token.
    
    When an access token expires, use this endpoint with a valid refresh token
    to obtain a new access token without requiring the user to log in again.
    """
    # Extract user data from refresh token payload
    user_data = {
        "sub": refresh_payload.get("sub"),
        "reddit_id": refresh_payload.get("reddit_id"),
        "username": refresh_payload.get("username")
    }
    
    # Create new access token
    new_access_token = TokenManager.create_access_token(user_data)
    
    return TokenRefreshResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post(
    "/logout",
    tags=["authentication"],
    summary="Logout user",
    description="Logout the current user by blacklisting their access token.",
    responses={
        200: {
            "description": "Successfully logged out",
            "content": {
                "application/json": {
                    "example": {"message": "Successfully logged out"}
                }
            }
        },
        401: {"$ref": "#/components/responses/401"}
    }
)
async def logout(
    logout_request: LogoutRequest = LogoutRequest(),
    token: str = Depends(verify_token_not_blacklisted),
    current_user: User = Depends(get_current_user)
):
    """
    Logout user by blacklisting current tokens.
    
    This endpoint invalidates the current access token by adding it to a blacklist.
    The token will no longer be accepted for API requests.
    """
    try:
        redis_client = await get_redis_client()
        blacklist = TokenBlacklist(redis_client)
        
        # Blacklist current access token
        await blacklist.add_token(token)
        
        # If requested, also blacklist refresh token
        # Note: In a real implementation, you'd need to track refresh tokens
        # or implement a more sophisticated token management system
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        # If Redis is unavailable, still return success
        # In production, you might want to handle this differently
        return {"message": "Logged out (token blacklisting unavailable)"}


@router.get(
    "/me", 
    response_model=UserResponse,
    tags=["authentication"],
    summary="Get current user information",
    description="Retrieve information about the currently authenticated user.",
    responses={
        200: {
            "description": "Current user information",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "reddit_id": "abc123",
                        "username": "example_user",
                        "email": "user@example.com",
                        "is_active": True
                    }
                }
            }
        },
        401: {"$ref": "#/components/responses/401"}
    }
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Returns detailed information about the currently authenticated user
    including their Reddit ID, username, and account status.
    """
    return UserResponse(
        id=current_user.id,
        reddit_id=current_user.reddit_id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active
    )


@router.get(
    "/status", 
    response_model=AuthStatusResponse,
    tags=["authentication"],
    summary="Get authentication status",
    description="Check if the current user is authenticated and get their basic information.",
    responses={
        200: {
            "description": "Authentication status and user information",
            "content": {
                "application/json": {
                    "example": {
                        "authenticated": True,
                        "user": {
                            "id": 1,
                            "reddit_id": "abc123",
                            "username": "example_user",
                            "email": "user@example.com",
                            "is_active": True
                        }
                    }
                }
            }
        },
        401: {"$ref": "#/components/responses/401"}
    }
)
async def get_auth_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get authentication status.
    
    Returns the current authentication status along with basic user information.
    Useful for frontend applications to check if a user is logged in.
    """
    return AuthStatusResponse(
        authenticated=True,
        user=UserResponse(
            id=current_user.id,
            reddit_id=current_user.reddit_id,
            username=current_user.username,
            email=current_user.email,
            is_active=current_user.is_active
        )
    )


@router.post(
    "/validate", 
    response_model=TokenValidationResponse,
    tags=["authentication"],
    summary="Validate JWT token",
    description="Validate a JWT token and return token information including expiration and user details.",
    responses={
        200: {
            "description": "Token validation result",
            "content": {
                "application/json": {
                    "examples": {
                        "valid_token": {
                            "summary": "Valid token",
                            "value": {
                                "valid": True,
                                "expires_at": 1640995200,
                                "user_id": "1",
                                "reddit_id": "abc123"
                            }
                        },
                        "invalid_token": {
                            "summary": "Invalid token",
                            "value": {
                                "valid": False,
                                "expires_at": None,
                                "user_id": None,
                                "reddit_id": None
                            }
                        }
                    }
                }
            }
        },
        401: {"$ref": "#/components/responses/401"}
    }
)
async def validate_token(
    token: str = Depends(get_current_user_token)
):
    """
    Validate JWT token and return token information.
    
    This endpoint validates a JWT token and returns information about its validity,
    expiration time, and associated user. Useful for token introspection and debugging.
    """
    try:
        payload = TokenManager.verify_token(token, "access")
        
        return TokenValidationResponse(
            valid=True,
            expires_at=payload.get("exp"),
            user_id=payload.get("sub"),
            reddit_id=payload.get("reddit_id")
        )
        
    except HTTPException:
        return TokenValidationResponse(
            valid=False,
            expires_at=None,
            user_id=None,
            reddit_id=None
        )