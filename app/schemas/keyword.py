"""
Keyword Schemas

Pydantic models for keyword requests and responses.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator


class KeywordBase(BaseModel):
    """Base keyword model with common fields."""
    keyword: str = Field(..., min_length=1, max_length=255, description="Keyword text")
    description: Optional[str] = Field(None, max_length=1000, description="Optional keyword description")
    is_active: bool = Field(default=True, description="Whether keyword is active")

    @validator('keyword')
    def validate_keyword(cls, v):
        """Validate keyword format."""
        if not v or not v.strip():
            raise ValueError('Keyword cannot be empty or whitespace only')
        # Remove extra whitespace and convert to lowercase for consistency
        return v.strip().lower()


class KeywordCreate(KeywordBase):
    """Schema for creating a new keyword."""
    pass


class KeywordUpdate(BaseModel):
    """Schema for updating an existing keyword."""
    keyword: Optional[str] = Field(None, min_length=1, max_length=255, description="Updated keyword text")
    description: Optional[str] = Field(None, max_length=1000, description="Updated keyword description")
    is_active: Optional[bool] = Field(None, description="Updated active status")

    @validator('keyword')
    def validate_keyword(cls, v):
        """Validate keyword format if provided."""
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Keyword cannot be empty or whitespace only')
            return v.strip().lower()
        return v


class KeywordResponse(KeywordBase):
    """Schema for keyword response."""
    id: int = Field(..., description="Keyword ID")
    user_id: int = Field(..., description="Owner user ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    post_count: int = Field(default=0, description="Number of posts associated with this keyword")

    class Config:
        from_attributes = True


class KeywordListResponse(BaseModel):
    """Schema for keyword list response with pagination."""
    keywords: List[KeywordResponse] = Field(..., description="List of keywords")
    total: int = Field(..., description="Total number of keywords")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")


class KeywordSearchRequest(BaseModel):
    """Schema for keyword search request."""
    query: Optional[str] = Field(None, description="Search query for keyword text or description")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Number of items per page")


class KeywordStatsResponse(BaseModel):
    """Schema for keyword statistics response."""
    keyword_id: int = Field(..., description="Keyword ID")
    keyword: str = Field(..., description="Keyword text")
    total_posts: int = Field(..., description="Total number of posts")
    total_comments: int = Field(..., description="Total number of comments")
    avg_score: float = Field(..., description="Average post score")
    last_crawled: Optional[datetime] = Field(None, description="Last crawl timestamp")
    trending_score: float = Field(default=0.0, description="Trending score based on recent activity")


class KeywordBulkCreateRequest(BaseModel):
    """Schema for bulk keyword creation."""
    keywords: List[KeywordCreate] = Field(..., min_items=1, max_items=50, description="List of keywords to create")


class KeywordBulkCreateResponse(BaseModel):
    """Schema for bulk keyword creation response."""
    created: List[KeywordResponse] = Field(..., description="Successfully created keywords")
    failed: List[dict] = Field(..., description="Failed keyword creations with error messages")
    total_created: int = Field(..., description="Number of successfully created keywords")
    total_failed: int = Field(..., description="Number of failed keyword creations")


class KeywordValidationResponse(BaseModel):
    """Schema for keyword validation response."""
    valid: bool = Field(..., description="Whether keyword is valid")
    exists: bool = Field(..., description="Whether keyword already exists for user")
    message: str = Field(..., description="Validation message")
    suggestions: Optional[List[str]] = Field(None, description="Alternative keyword suggestions")