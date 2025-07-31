"""
Keyword Service

Business logic for keyword management operations.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from fastapi import HTTPException, status

from app.models.keyword import Keyword
from app.models.post import Post
from app.models.user import User
from app.schemas.keyword import (
    KeywordCreate, KeywordUpdate, KeywordResponse, 
    KeywordListResponse, KeywordSearchRequest,
    KeywordStatsResponse, KeywordBulkCreateRequest,
    KeywordBulkCreateResponse, KeywordValidationResponse
)


class KeywordService:
    """Service class for keyword management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_keyword(self, user: User, keyword_data: KeywordCreate) -> KeywordResponse:
        """
        Create a new keyword for the user.
        
        Args:
            user: User creating the keyword
            keyword_data: Keyword creation data
            
        Returns:
            Created keyword response
            
        Raises:
            HTTPException: If keyword already exists or validation fails
        """
        # Check if keyword already exists for this user
        existing_keyword = self.db.query(Keyword).filter(
            and_(
                Keyword.user_id == user.id,
                Keyword.keyword == keyword_data.keyword
            )
        ).first()
        
        if existing_keyword:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Keyword '{keyword_data.keyword}' already exists"
            )
        
        # Create new keyword
        db_keyword = Keyword(
            user_id=user.id,
            keyword=keyword_data.keyword,
            description=keyword_data.description,
            is_active=keyword_data.is_active
        )
        
        self.db.add(db_keyword)
        self.db.commit()
        self.db.refresh(db_keyword)
        
        # Get post count for response
        post_count = self.db.query(func.count(Post.id)).filter(
            Post.keyword_id == db_keyword.id
        ).scalar() or 0
        
        # Convert to response model
        keyword_response = KeywordResponse.from_orm(db_keyword)
        keyword_response.post_count = post_count
        
        return keyword_response
    
    def get_keyword(self, user: User, keyword_id: int) -> KeywordResponse:
        """
        Get a specific keyword by ID.
        
        Args:
            user: User requesting the keyword
            keyword_id: ID of the keyword to retrieve
            
        Returns:
            Keyword response
            
        Raises:
            HTTPException: If keyword not found or access denied
        """
        keyword = self.db.query(Keyword).filter(
            and_(
                Keyword.id == keyword_id,
                Keyword.user_id == user.id
            )
        ).first()
        
        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )
        
        # Get post count
        post_count = self.db.query(func.count(Post.id)).filter(
            Post.keyword_id == keyword.id
        ).scalar() or 0
        
        # Convert to response model
        keyword_response = KeywordResponse.from_orm(keyword)
        keyword_response.post_count = post_count
        
        return keyword_response
    
    def get_keywords(self, user: User, search_params: KeywordSearchRequest) -> KeywordListResponse:
        """
        Get user's keywords with optional search and pagination.
        
        Args:
            user: User requesting keywords
            search_params: Search and pagination parameters
            
        Returns:
            Paginated keyword list response
        """
        # Build base query
        query = self.db.query(Keyword).filter(Keyword.user_id == user.id)
        
        # Apply search filters
        if search_params.query:
            search_term = f"%{search_params.query.lower()}%"
            query = query.filter(
                Keyword.keyword.ilike(search_term) |
                Keyword.description.ilike(search_term)
            )
        
        if search_params.is_active is not None:
            query = query.filter(Keyword.is_active == search_params.is_active)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        keywords = query.order_by(desc(Keyword.updated_at)).offset(
            (search_params.page - 1) * search_params.page_size
        ).limit(search_params.page_size).all()
        
        # Get post counts for each keyword
        keyword_responses = []
        for keyword in keywords:
            post_count = self.db.query(func.count(Post.id)).filter(
                Post.keyword_id == keyword.id
            ).scalar() or 0
            
            keyword_response = KeywordResponse.from_orm(keyword)
            keyword_response.post_count = post_count
            keyword_responses.append(keyword_response)
        
        # Calculate pagination info
        total_pages = (total + search_params.page_size - 1) // search_params.page_size
        
        return KeywordListResponse(
            keywords=keyword_responses,
            total=total,
            page=search_params.page,
            page_size=search_params.page_size,
            total_pages=total_pages
        )
    
    def update_keyword(self, user: User, keyword_id: int, keyword_data: KeywordUpdate) -> KeywordResponse:
        """
        Update an existing keyword.
        
        Args:
            user: User updating the keyword
            keyword_id: ID of the keyword to update
            keyword_data: Updated keyword data
            
        Returns:
            Updated keyword response
            
        Raises:
            HTTPException: If keyword not found, access denied, or validation fails
        """
        # Get existing keyword
        keyword = self.db.query(Keyword).filter(
            and_(
                Keyword.id == keyword_id,
                Keyword.user_id == user.id
            )
        ).first()
        
        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )
        
        # Check for duplicate if keyword text is being updated
        if keyword_data.keyword and keyword_data.keyword != keyword.keyword:
            existing_keyword = self.db.query(Keyword).filter(
                and_(
                    Keyword.user_id == user.id,
                    Keyword.keyword == keyword_data.keyword,
                    Keyword.id != keyword_id
                )
            ).first()
            
            if existing_keyword:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Keyword '{keyword_data.keyword}' already exists"
                )
        
        # Update keyword fields
        update_data = keyword_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(keyword, field, value)
        
        self.db.commit()
        self.db.refresh(keyword)
        
        # Get post count for response
        post_count = self.db.query(func.count(Post.id)).filter(
            Post.keyword_id == keyword.id
        ).scalar() or 0
        
        # Convert to response model
        keyword_response = KeywordResponse.from_orm(keyword)
        keyword_response.post_count = post_count
        
        return keyword_response
    
    def delete_keyword(self, user: User, keyword_id: int) -> bool:
        """
        Delete a keyword and all associated data.
        
        Args:
            user: User deleting the keyword
            keyword_id: ID of the keyword to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If keyword not found or access denied
        """
        keyword = self.db.query(Keyword).filter(
            and_(
                Keyword.id == keyword_id,
                Keyword.user_id == user.id
            )
        ).first()
        
        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )
        
        # Delete keyword (cascade will handle related posts)
        self.db.delete(keyword)
        self.db.commit()
        
        return True
    
    def validate_keyword(self, user: User, keyword_text: str) -> KeywordValidationResponse:
        """
        Validate a keyword for the user.
        
        Args:
            user: User validating the keyword
            keyword_text: Keyword text to validate
            
        Returns:
            Keyword validation response
        """
        # Basic validation
        if not keyword_text or not keyword_text.strip():
            return KeywordValidationResponse(
                valid=False,
                exists=False,
                message="Keyword cannot be empty",
                suggestions=None
            )
        
        # Normalize keyword
        normalized_keyword = keyword_text.strip().lower()
        
        # Check if keyword already exists
        existing_keyword = self.db.query(Keyword).filter(
            and_(
                Keyword.user_id == user.id,
                Keyword.keyword == normalized_keyword
            )
        ).first()
        
        if existing_keyword:
            return KeywordValidationResponse(
                valid=False,
                exists=True,
                message=f"Keyword '{normalized_keyword}' already exists",
                suggestions=None
            )
        
        # Generate suggestions for similar keywords
        similar_keywords = self.db.query(Keyword.keyword).filter(
            and_(
                Keyword.user_id == user.id,
                Keyword.keyword.ilike(f"%{normalized_keyword[:3]}%")
            )
        ).limit(5).all()
        
        suggestions = [kw[0] for kw in similar_keywords] if similar_keywords else None
        
        return KeywordValidationResponse(
            valid=True,
            exists=False,
            message="Keyword is valid",
            suggestions=suggestions
        )
    
    def bulk_create_keywords(self, user: User, bulk_request: KeywordBulkCreateRequest) -> KeywordBulkCreateResponse:
        """
        Create multiple keywords in bulk.
        
        Args:
            user: User creating the keywords
            bulk_request: Bulk creation request
            
        Returns:
            Bulk creation response with success and failure details
        """
        created_keywords = []
        failed_keywords = []
        
        for keyword_data in bulk_request.keywords:
            try:
                # Check if keyword already exists
                existing_keyword = self.db.query(Keyword).filter(
                    and_(
                        Keyword.user_id == user.id,
                        Keyword.keyword == keyword_data.keyword
                    )
                ).first()
                
                if existing_keyword:
                    failed_keywords.append({
                        "keyword": keyword_data.keyword,
                        "error": f"Keyword '{keyword_data.keyword}' already exists"
                    })
                    continue
                
                # Create keyword
                db_keyword = Keyword(
                    user_id=user.id,
                    keyword=keyword_data.keyword,
                    description=keyword_data.description,
                    is_active=keyword_data.is_active
                )
                
                self.db.add(db_keyword)
                self.db.flush()  # Flush to get ID without committing
                
                # Convert to response model
                keyword_response = KeywordResponse.from_orm(db_keyword)
                keyword_response.post_count = 0  # New keyword has no posts
                created_keywords.append(keyword_response)
                
            except Exception as e:
                failed_keywords.append({
                    "keyword": keyword_data.keyword,
                    "error": str(e)
                })
        
        # Commit all successful creations
        if created_keywords:
            self.db.commit()
        else:
            self.db.rollback()
        
        return KeywordBulkCreateResponse(
            created=created_keywords,
            failed=failed_keywords,
            total_created=len(created_keywords),
            total_failed=len(failed_keywords)
        )
    
    def get_keyword_stats(self, user: User, keyword_id: int) -> KeywordStatsResponse:
        """
        Get detailed statistics for a keyword.
        
        Args:
            user: User requesting the stats
            keyword_id: ID of the keyword
            
        Returns:
            Keyword statistics response
            
        Raises:
            HTTPException: If keyword not found or access denied
        """
        keyword = self.db.query(Keyword).filter(
            and_(
                Keyword.id == keyword_id,
                Keyword.user_id == user.id
            )
        ).first()
        
        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )
        
        # Get post statistics
        post_stats = self.db.query(
            func.count(Post.id).label('total_posts'),
            func.coalesce(func.avg(Post.score), 0).label('avg_score'),
            func.max(Post.crawled_at).label('last_crawled')
        ).filter(Post.keyword_id == keyword_id).first()
        
        # Get comment count
        total_comments = self.db.query(func.count(Post.num_comments)).filter(
            Post.keyword_id == keyword_id
        ).scalar() or 0
        
        # Calculate trending score (simplified algorithm)
        # This could be enhanced with more sophisticated trending calculations
        trending_score = 0.0
        if post_stats.total_posts > 0:
            trending_score = min(post_stats.avg_score / 10.0, 10.0)  # Normalize to 0-10 scale
        
        return KeywordStatsResponse(
            keyword_id=keyword.id,
            keyword=keyword.keyword,
            total_posts=post_stats.total_posts or 0,
            total_comments=total_comments,
            avg_score=float(post_stats.avg_score or 0),
            last_crawled=post_stats.last_crawled,
            trending_score=trending_score
        )
    
    def get_user_keyword_count(self, user: User) -> int:
        """
        Get total number of keywords for a user.
        
        Args:
            user: User to count keywords for
            
        Returns:
            Total keyword count
        """
        return self.db.query(func.count(Keyword.id)).filter(
            Keyword.user_id == user.id
        ).scalar() or 0
    
    def get_active_keywords(self, user: User) -> List[Keyword]:
        """
        Get all active keywords for a user.
        
        Args:
            user: User to get keywords for
            
        Returns:
            List of active keywords
        """
        return self.db.query(Keyword).filter(
            and_(
                Keyword.user_id == user.id,
                Keyword.is_active == True
            )
        ).all()