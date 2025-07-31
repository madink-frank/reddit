"""
Posts API Endpoints

Provides endpoints for searching, filtering, and retrieving Reddit posts.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, and_, or_, func, text

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.post import Post
from app.models.keyword import Keyword
from app.models.comment import Comment
from app.schemas.post import (
    PostResponse,
    PostSearchRequest,
    PostSearchResponse,
    PostDetailResponse,
    TrendingPostsRequest,
    TrendingPostsResponse,
    PostStatsResponse
)


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/search", response_model=PostSearchResponse)
async def search_posts(
    request: PostSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search posts with advanced filtering and pagination.
    
    Supports full-text search on title and content, filtering by various criteria,
    and sorting by different fields.
    """
    try:
        # Base query - only posts from user's keywords
        query = db.query(Post).join(Keyword).filter(
            Keyword.user_id == current_user.id
        ).options(joinedload(Post.keyword))
        
        # Apply text search filter
        if request.query:
            search_filter = or_(
                Post.title.ilike(f"%{request.query}%"),
                Post.content.ilike(f"%{request.query}%")
            )
            query = query.filter(search_filter)
        
        # Apply keyword filter
        if request.keyword_ids:
            query = query.filter(Post.keyword_id.in_(request.keyword_ids))
        
        # Apply subreddit filter
        if request.subreddits:
            query = query.filter(Post.subreddit.in_(request.subreddits))
        
        # Apply author filter
        if request.authors:
            query = query.filter(Post.author.in_(request.authors))
        
        # Apply date filters
        if request.date_from:
            query = query.filter(Post.created_utc >= request.date_from)
        
        if request.date_to:
            query = query.filter(Post.created_utc <= request.date_to)
        
        # Apply score filters
        if request.min_score is not None:
            query = query.filter(Post.score >= request.min_score)
        
        if request.max_score is not None:
            query = query.filter(Post.score <= request.max_score)
        
        # Apply comment count filters
        if request.min_comments is not None:
            query = query.filter(Post.num_comments >= request.min_comments)
        
        if request.max_comments is not None:
            query = query.filter(Post.num_comments <= request.max_comments)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_field = getattr(Post, request.sort_by, Post.created_utc)
        if request.sort_order.lower() == "asc":
            query = query.order_by(asc(sort_field))
        else:
            query = query.order_by(desc(sort_field))
        
        # Apply pagination
        offset = (request.page - 1) * request.page_size
        posts = query.offset(offset).limit(request.page_size).all()
        
        # Calculate pagination info
        total_pages = (total_count + request.page_size - 1) // request.page_size
        has_next = request.page < total_pages
        has_previous = request.page > 1
        
        # Convert to response format
        post_responses = []
        for post in posts:
            post_response = PostResponse(
                id=post.id,
                reddit_id=post.reddit_id,
                title=post.title,
                content=post.content,
                author=post.author,
                subreddit=post.subreddit,
                url=post.url,
                score=post.score,
                num_comments=post.num_comments,
                created_utc=post.created_utc,
                crawled_at=post.crawled_at,
                keyword_id=post.keyword_id,
                keyword=post.keyword.keyword if post.keyword else None
            )
            post_responses.append(post_response)
        
        return PostSearchResponse(
            posts=post_responses,
            total_count=total_count,
            page=request.page,
            page_size=request.page_size,
            total_pages=total_pages,
            has_next=has_next,
            has_previous=has_previous
        )
        
    except Exception as e:
        logger.error(f"Error searching posts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/", response_model=PostSearchResponse)
async def get_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    query: Optional[str] = Query(None, description="Search query"),
    keyword_ids: Optional[str] = Query(None, description="Comma-separated keyword IDs"),
    subreddits: Optional[str] = Query(None, description="Comma-separated subreddit names"),
    authors: Optional[str] = Query(None, description="Comma-separated author names"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    min_score: Optional[int] = Query(None, description="Minimum score"),
    max_score: Optional[int] = Query(None, description="Maximum score"),
    min_comments: Optional[int] = Query(None, description="Minimum comments"),
    max_comments: Optional[int] = Query(None, description="Maximum comments"),
    sort_by: str = Query("created_utc", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """
    Get posts with optional filtering and pagination (GET version).
    
    This endpoint provides the same functionality as the POST search endpoint
    but uses query parameters for simpler integration.
    """
    # Parse comma-separated values
    keyword_ids_list = None
    if keyword_ids:
        try:
            keyword_ids_list = [int(x.strip()) for x in keyword_ids.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid keyword_ids format")
    
    subreddits_list = None
    if subreddits:
        subreddits_list = [x.strip() for x in subreddits.split(",") if x.strip()]
    
    authors_list = None
    if authors:
        authors_list = [x.strip() for x in authors.split(",") if x.strip()]
    
    # Create search request
    search_request = PostSearchRequest(
        query=query,
        keyword_ids=keyword_ids_list,
        subreddits=subreddits_list,
        authors=authors_list,
        date_from=date_from,
        date_to=date_to,
        min_score=min_score,
        max_score=max_score,
        min_comments=min_comments,
        max_comments=max_comments,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    
    return await search_posts(search_request, current_user, db)


@router.post("/trending", response_model=TrendingPostsResponse)
async def get_trending_posts(
    request: TrendingPostsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get trending posts based on score and engagement metrics.
    
    Trending posts are determined by a combination of score, comment count,
    and recency within the specified time period.
    """
    try:
        # Calculate time threshold based on period
        now = datetime.now(timezone.utc)
        time_deltas = {
            "1h": timedelta(hours=1),
            "6h": timedelta(hours=6),
            "24h": timedelta(days=1),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30)
        }
        
        if request.time_period not in time_deltas:
            raise HTTPException(
                status_code=400,
                detail="Invalid time_period. Must be one of: 1h, 6h, 24h, 7d, 30d"
            )
        
        time_threshold = now - time_deltas[request.time_period]
        
        # Base query - only posts from user's keywords within time period
        query = db.query(Post).join(Keyword).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= time_threshold
            )
        ).options(joinedload(Post.keyword))
        
        # Apply filters
        if request.subreddits:
            query = query.filter(Post.subreddit.in_(request.subreddits))
        
        if request.keyword_ids:
            query = query.filter(Post.keyword_id.in_(request.keyword_ids))
        
        if request.min_score:
            query = query.filter(Post.score >= request.min_score)
        
        # Calculate trending score: weighted combination of score, comments, and recency
        # More recent posts get higher weight
        # Use CASE WHEN for SQLite compatibility instead of greatest()
        from sqlalchemy import case
        
        # Calculate hours since creation (SQLite compatible)
        hours_since_created = (func.julianday(func.datetime('now')) - func.julianday(Post.created_utc)) * 24
        
        # Use CASE WHEN instead of greatest for SQLite compatibility
        recency_bonus = case(
            (hours_since_created < 24, 24 - hours_since_created),
            else_=0
        )
        
        trending_score = (
            Post.score * 1.0 +
            Post.num_comments * 0.5 +
            recency_bonus * 0.1
        )
        
        # Order by trending score and apply limit
        posts = query.order_by(desc(trending_score)).limit(request.limit).all()
        
        # Convert to response format
        post_responses = []
        for post in posts:
            post_response = PostResponse(
                id=post.id,
                reddit_id=post.reddit_id,
                title=post.title,
                content=post.content,
                author=post.author,
                subreddit=post.subreddit,
                url=post.url,
                score=post.score,
                num_comments=post.num_comments,
                created_utc=post.created_utc,
                crawled_at=post.crawled_at,
                keyword_id=post.keyword_id,
                keyword=post.keyword.keyword if post.keyword else None
            )
            post_responses.append(post_response)
        
        return TrendingPostsResponse(
            posts=post_responses,
            time_period=request.time_period,
            generated_at=now,
            total_count=len(post_responses)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trending posts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/trending", response_model=TrendingPostsResponse)
async def get_trending_posts_simple(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    time_period: str = Query("24h", description="Time period for trending"),
    subreddits: Optional[str] = Query(None, description="Comma-separated subreddit names"),
    keyword_ids: Optional[str] = Query(None, description="Comma-separated keyword IDs"),
    min_score: int = Query(10, description="Minimum score"),
    limit: int = Query(50, ge=1, le=200, description="Number of posts to return")
):
    """
    Get trending posts (GET version with query parameters).
    """
    # Parse comma-separated values
    keyword_ids_list = None
    if keyword_ids:
        try:
            keyword_ids_list = [int(x.strip()) for x in keyword_ids.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid keyword_ids format")
    
    subreddits_list = None
    if subreddits:
        subreddits_list = [x.strip() for x in subreddits.split(",") if x.strip()]
    
    # Create trending request
    trending_request = TrendingPostsRequest(
        time_period=time_period,
        subreddits=subreddits_list,
        keyword_ids=keyword_ids_list,
        min_score=min_score,
        limit=limit
    )
    
    return await get_trending_posts(trending_request, current_user, db)


@router.get("/stats", response_model=PostStatsResponse)
async def get_post_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365, description="Number of days to include in statistics")
):
    """
    Get comprehensive statistics about posts.
    
    - **days**: Number of days to include in the statistics (1-365)
    """
    try:
        # Calculate date threshold
        date_threshold = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Base query for user's posts within time period
        base_query = db.query(Post).join(Keyword).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= date_threshold
            )
        )
        
        # Total posts count
        total_posts = base_query.count()
        
        # Posts by subreddit
        subreddit_stats = db.query(
            Post.subreddit,
            func.count(Post.id).label('count')
        ).join(Keyword).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= date_threshold,
                Post.subreddit.isnot(None)
            )
        ).group_by(Post.subreddit).order_by(desc('count')).limit(20).all()
        
        posts_by_subreddit = {stat.subreddit: stat.count for stat in subreddit_stats}
        
        # Posts by keyword
        keyword_stats = db.query(
            Keyword.keyword,
            func.count(Post.id).label('count')
        ).join(Post).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= date_threshold
            )
        ).group_by(Keyword.keyword).order_by(desc('count')).all()
        
        posts_by_keyword = {stat.keyword: stat.count for stat in keyword_stats}
        
        # Posts by date (daily counts)
        date_stats = db.query(
            func.date(Post.created_utc).label('date'),
            func.count(Post.id).label('count')
        ).join(Keyword).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= date_threshold
            )
        ).group_by(func.date(Post.created_utc)).order_by('date').all()
        
        posts_by_date = {str(stat.date): stat.count for stat in date_stats}
        
        # Average score and comments
        avg_stats = db.query(
            func.avg(Post.score).label('avg_score'),
            func.avg(Post.num_comments).label('avg_comments')
        ).join(Keyword).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= date_threshold
            )
        ).first()
        
        average_score = float(avg_stats.avg_score) if avg_stats.avg_score else 0.0
        average_comments = float(avg_stats.avg_comments) if avg_stats.avg_comments else 0.0
        
        # Top authors by post count
        author_stats = db.query(
            Post.author,
            func.count(Post.id).label('post_count'),
            func.avg(Post.score).label('avg_score'),
            func.sum(Post.num_comments).label('total_comments')
        ).join(Keyword).filter(
            and_(
                Keyword.user_id == current_user.id,
                Post.created_utc >= date_threshold,
                Post.author.isnot(None)
            )
        ).group_by(Post.author).order_by(desc('post_count')).limit(10).all()
        
        top_authors = []
        for stat in author_stats:
            top_authors.append({
                "author": stat.author,
                "post_count": stat.post_count,
                "average_score": float(stat.avg_score) if stat.avg_score else 0.0,
                "total_comments": stat.total_comments or 0
            })
        
        return PostStatsResponse(
            total_posts=total_posts,
            posts_by_subreddit=posts_by_subreddit,
            posts_by_keyword=posts_by_keyword,
            posts_by_date=posts_by_date,
            average_score=average_score,
            average_comments=average_comments,
            top_authors=top_authors,
            generated_at=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logger.error(f"Error getting post statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_post_detail(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    include_comments: bool = Query(True, description="Include post comments")
):
    """
    Get detailed information about a specific post.
    
    - **post_id**: ID of the post to retrieve
    - **include_comments**: Whether to include comments in the response
    """
    try:
        # Get post with keyword relationship
        post = db.query(Post).join(Keyword).filter(
            and_(
                Post.id == post_id,
                Keyword.user_id == current_user.id
            )
        ).options(joinedload(Post.keyword)).first()
        
        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found or access denied"
            )
        
        # Get comments if requested
        comments = []
        if include_comments:
            post_comments = db.query(Comment).filter(
                Comment.post_id == post_id
            ).order_by(desc(Comment.score)).all()
            
            for comment in post_comments:
                comments.append({
                    "id": comment.id,
                    "reddit_id": comment.reddit_id,
                    "body": comment.body,
                    "author": comment.author,
                    "score": comment.score,
                    "created_utc": comment.created_utc,
                    "crawled_at": comment.crawled_at
                })
        
        return PostDetailResponse(
            id=post.id,
            reddit_id=post.reddit_id,
            title=post.title,
            content=post.content,
            author=post.author,
            subreddit=post.subreddit,
            url=post.url,
            score=post.score,
            num_comments=post.num_comments,
            created_utc=post.created_utc,
            crawled_at=post.crawled_at,
            keyword_id=post.keyword_id,
            keyword=post.keyword.keyword if post.keyword else None,
            comments=comments
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post detail: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )