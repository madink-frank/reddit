"""
Keyword API Endpoints

FastAPI endpoints for keyword management operations.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.keyword_service import KeywordService
from app.schemas.keyword import (
    KeywordCreate, KeywordUpdate, KeywordResponse,
    KeywordListResponse, KeywordSearchRequest,
    KeywordStatsResponse, KeywordBulkCreateRequest,
    KeywordBulkCreateResponse, KeywordValidationResponse
)

router = APIRouter()


@router.post(
    "/", 
    response_model=KeywordResponse, 
    status_code=status.HTTP_201_CREATED,
    tags=["keywords"],
    summary="Create a new keyword",
    description="Create a new keyword for tracking Reddit content related to specific topics.",
    responses={
        201: {
            "description": "Keyword created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "keyword": "artificial intelligence",
                        "description": "Track AI-related discussions",
                        "is_active": True,
                        "created_at": "2024-01-01T00:00:00Z",
                        "post_count": 0
                    }
                }
            }
        },
        400: {"$ref": "#/components/responses/400"},
        401: {"$ref": "#/components/responses/401"},
        422: {"$ref": "#/components/responses/422"}
    }
)
async def create_keyword(
    keyword_data: KeywordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new keyword for the authenticated user.
    
    Creates a new keyword that will be used to track and crawl Reddit content.
    The keyword must be unique for the user and will be used in Reddit searches.
    
    - **keyword**: The keyword text (required, 1-255 characters)
    - **description**: Optional description for the keyword
    - **is_active**: Whether the keyword is active (default: true)
    
    Returns the created keyword with metadata including post count.
    """
    keyword_service = KeywordService(db)
    return keyword_service.create_keyword(current_user, keyword_data)


@router.get(
    "/", 
    response_model=KeywordListResponse,
    tags=["keywords"],
    summary="Get user keywords",
    description="Retrieve user's keywords with optional search and pagination support.",
    responses={
        200: {
            "description": "List of keywords with pagination metadata",
            "content": {
                "application/json": {
                    "example": {
                        "items": [
                            {
                                "id": 1,
                                "keyword": "artificial intelligence",
                                "description": "Track AI-related discussions",
                                "is_active": True,
                                "created_at": "2024-01-01T00:00:00Z",
                                "post_count": 42
                            }
                        ],
                        "pagination": {
                            "page": 1,
                            "page_size": 20,
                            "total_items": 1,
                            "total_pages": 1,
                            "has_next": False,
                            "has_previous": False
                        }
                    }
                }
            }
        },
        401: {"$ref": "#/components/responses/401"},
        422: {"$ref": "#/components/responses/422"}
    }
)
async def get_keywords(
    query: str = Query(None, description="Search query for keyword text or description"),
    is_active: bool = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's keywords with optional search and pagination.
    
    Retrieve all keywords belonging to the authenticated user with support for
    text search, filtering by active status, and pagination.
    
    - **query**: Optional search term to filter keywords by text or description
    - **is_active**: Optional filter by active status
    - **page**: Page number for pagination (default: 1)
    - **page_size**: Number of items per page (default: 20, max: 100)
    
    Returns paginated list of keywords with metadata including post counts.
    """
    search_params = KeywordSearchRequest(
        query=query,
        is_active=is_active,
        page=page,
        page_size=page_size
    )
    
    keyword_service = KeywordService(db)
    return keyword_service.get_keywords(current_user, search_params)


@router.get(
    "/{keyword_id}", 
    response_model=KeywordResponse,
    tags=["keywords"],
    summary="Get keyword by ID",
    description="Retrieve a specific keyword by its ID with detailed information.",
    responses={
        200: {
            "description": "Keyword details with post count",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "keyword": "artificial intelligence",
                        "description": "Track AI-related discussions",
                        "is_active": True,
                        "created_at": "2024-01-01T00:00:00Z",
                        "post_count": 42
                    }
                }
            }
        },
        401: {"$ref": "#/components/responses/401"},
        404: {"$ref": "#/components/responses/404"}
    }
)
async def get_keyword(
    keyword_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific keyword by ID.
    
    Retrieve detailed information about a specific keyword including
    its current post count and metadata.
    
    - **keyword_id**: The ID of the keyword to retrieve
    
    Returns the keyword details with post count.
    """
    keyword_service = KeywordService(db)
    return keyword_service.get_keyword(current_user, keyword_id)


@router.put("/{keyword_id}", response_model=KeywordResponse)
async def update_keyword(
    keyword_id: int,
    keyword_data: KeywordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing keyword.
    
    - **keyword_id**: The ID of the keyword to update
    - **keyword**: Updated keyword text (optional)
    - **description**: Updated description (optional)
    - **is_active**: Updated active status (optional)
    
    Returns the updated keyword with metadata.
    """
    keyword_service = KeywordService(db)
    return keyword_service.update_keyword(current_user, keyword_id, keyword_data)


@router.delete("/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_keyword(
    keyword_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a keyword and all associated data.
    
    - **keyword_id**: The ID of the keyword to delete
    
    This will permanently delete the keyword and all associated posts and comments.
    """
    keyword_service = KeywordService(db)
    keyword_service.delete_keyword(current_user, keyword_id)


@router.post("/validate", response_model=KeywordValidationResponse)
async def validate_keyword(
    keyword_text: str = Query(..., description="Keyword text to validate"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Validate a keyword before creation.
    
    - **keyword_text**: The keyword text to validate
    
    Returns validation result with suggestions if applicable.
    """
    keyword_service = KeywordService(db)
    return keyword_service.validate_keyword(current_user, keyword_text)


@router.post("/bulk", response_model=KeywordBulkCreateResponse, status_code=status.HTTP_201_CREATED)
async def bulk_create_keywords(
    bulk_request: KeywordBulkCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create multiple keywords in bulk.
    
    - **keywords**: List of keywords to create (max 50 per request)
    
    Returns details of successful and failed creations.
    """
    keyword_service = KeywordService(db)
    return keyword_service.bulk_create_keywords(current_user, bulk_request)


@router.get("/{keyword_id}/stats", response_model=KeywordStatsResponse)
async def get_keyword_stats(
    keyword_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed statistics for a keyword.
    
    - **keyword_id**: The ID of the keyword to get stats for
    
    Returns comprehensive statistics including post count, average score, and trending metrics.
    """
    keyword_service = KeywordService(db)
    return keyword_service.get_keyword_stats(current_user, keyword_id)


@router.get("/me/count")
async def get_user_keyword_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get total number of keywords for the current user.
    
    Returns the total count of keywords owned by the authenticated user.
    """
    keyword_service = KeywordService(db)
    count = keyword_service.get_user_keyword_count(current_user)
    return {"total_keywords": count}


@router.get("/me/active", response_model=List[KeywordResponse])
async def get_active_keywords(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all active keywords for the current user.
    
    Returns a list of all active keywords without pagination.
    """
    keyword_service = KeywordService(db)
    active_keywords = keyword_service.get_active_keywords(current_user)
    
    # Convert to response models with post counts
    keyword_responses = []
    for keyword in active_keywords:
        keyword_response = KeywordResponse.from_orm(keyword)
        # Get post count (this could be optimized with a single query)
        from sqlalchemy import func
        from app.models.post import Post
        post_count = db.query(func.count(Post.id)).filter(
            Post.keyword_id == keyword.id
        ).scalar() or 0
        keyword_response.post_count = post_count
        keyword_responses.append(keyword_response)
    
    return keyword_responses