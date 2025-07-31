"""
Pydantic schemas for post API endpoints.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PostResponse(BaseModel):
    """Response model for post data."""
    id: int = Field(..., description="Post ID")
    reddit_id: str = Field(..., description="Reddit post ID")
    title: str = Field(..., description="Post title")
    content: Optional[str] = Field(None, description="Post content")
    author: Optional[str] = Field(None, description="Post author")
    subreddit: Optional[str] = Field(None, description="Subreddit name")
    url: Optional[str] = Field(None, description="Post URL")
    score: int = Field(default=0, description="Post score (upvotes - downvotes)")
    num_comments: int = Field(default=0, description="Number of comments")
    created_utc: Optional[datetime] = Field(None, description="Post creation time")
    crawled_at: datetime = Field(..., description="Time when post was crawled")
    keyword_id: int = Field(..., description="Associated keyword ID")
    keyword: Optional[str] = Field(None, description="Associated keyword text")

    class Config:
        from_attributes = True


class PostSearchRequest(BaseModel):
    """Request model for post search."""
    query: Optional[str] = Field(None, description="Search query for title and content")
    keyword_ids: Optional[List[int]] = Field(None, description="Filter by keyword IDs")
    subreddits: Optional[List[str]] = Field(None, description="Filter by subreddit names")
    authors: Optional[List[str]] = Field(None, description="Filter by author names")
    date_from: Optional[datetime] = Field(None, description="Filter posts from this date")
    date_to: Optional[datetime] = Field(None, description="Filter posts until this date")
    min_score: Optional[int] = Field(None, description="Minimum post score")
    max_score: Optional[int] = Field(None, description="Maximum post score")
    min_comments: Optional[int] = Field(None, description="Minimum number of comments")
    max_comments: Optional[int] = Field(None, description="Maximum number of comments")
    sort_by: Optional[str] = Field("created_utc", description="Sort field: created_utc, score, num_comments, crawled_at")
    sort_order: Optional[str] = Field("desc", description="Sort order: asc, desc")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Number of items per page")


class PostSearchResponse(BaseModel):
    """Response model for post search results."""
    posts: List[PostResponse] = Field(..., description="List of posts")
    total_count: int = Field(..., description="Total number of matching posts")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_previous: bool = Field(..., description="Whether there are previous pages")


class PostDetailResponse(BaseModel):
    """Response model for detailed post information."""
    id: int = Field(..., description="Post ID")
    reddit_id: str = Field(..., description="Reddit post ID")
    title: str = Field(..., description="Post title")
    content: Optional[str] = Field(None, description="Post content")
    author: Optional[str] = Field(None, description="Post author")
    subreddit: Optional[str] = Field(None, description="Subreddit name")
    url: Optional[str] = Field(None, description="Post URL")
    score: int = Field(default=0, description="Post score (upvotes - downvotes)")
    num_comments: int = Field(default=0, description="Number of comments")
    created_utc: Optional[datetime] = Field(None, description="Post creation time")
    crawled_at: datetime = Field(..., description="Time when post was crawled")
    keyword_id: int = Field(..., description="Associated keyword ID")
    keyword: Optional[str] = Field(None, description="Associated keyword text")
    comments: List[Dict[str, Any]] = Field(default_factory=list, description="Post comments")

    class Config:
        from_attributes = True


class TrendingPostsRequest(BaseModel):
    """Request model for trending posts."""
    time_period: str = Field("24h", description="Time period: 1h, 6h, 24h, 7d, 30d")
    subreddits: Optional[List[str]] = Field(None, description="Filter by subreddit names")
    keyword_ids: Optional[List[int]] = Field(None, description="Filter by keyword IDs")
    min_score: Optional[int] = Field(10, description="Minimum post score")
    limit: int = Field(50, ge=1, le=200, description="Number of trending posts to return")


class TrendingPostsResponse(BaseModel):
    """Response model for trending posts."""
    posts: List[PostResponse] = Field(..., description="List of trending posts")
    time_period: str = Field(..., description="Time period used for trending calculation")
    generated_at: datetime = Field(..., description="When the trending data was generated")
    total_count: int = Field(..., description="Total number of trending posts found")


class PostStatsResponse(BaseModel):
    """Response model for post statistics."""
    total_posts: int = Field(..., description="Total number of posts")
    posts_by_subreddit: Dict[str, int] = Field(..., description="Post count by subreddit")
    posts_by_keyword: Dict[str, int] = Field(..., description="Post count by keyword")
    posts_by_date: Dict[str, int] = Field(..., description="Post count by date")
    average_score: float = Field(..., description="Average post score")
    average_comments: float = Field(..., description="Average number of comments")
    top_authors: List[Dict[str, Any]] = Field(..., description="Top authors by post count")
    generated_at: datetime = Field(..., description="When the statistics were generated")