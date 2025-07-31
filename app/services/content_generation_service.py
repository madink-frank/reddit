"""
Content generation service for creating various types of content based on Reddit data.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.models.post import Post
from app.models.comment import Comment
from app.models.keyword import Keyword
from app.models.generated_content import GeneratedContent
from app.services.content_templates import (
    TemplateManager, ContentData, ContentType
)
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)


class ContentGenerationService:
    """Service for generating content based on Reddit data"""
    
    def __init__(self, db: Session):
        self.db = db
        self.template_manager = TemplateManager()
        self.analytics_service = AnalyticsService(db)
    
    def generate_content(
        self,
        user_id: int,
        content_type: str,
        keyword_ids: List[int],
        template_id: Optional[int] = None,
        custom_prompt: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate content based on specified parameters
        
        Args:
            user_id: ID of the user requesting content generation
            content_type: Type of content to generate (blog, product_intro, trend_analysis)
            keyword_ids: List of keyword IDs to base content on
            template_id: Optional template ID (currently not used, defaults to standard templates)
            custom_prompt: Optional custom prompt for content generation
            date_from: Start date for data collection
            date_to: End date for data collection
        
        Returns:
            Dictionary containing generated content and metadata
        """
        try:
            # Validate content type
            try:
                content_type_enum = ContentType(content_type)
            except ValueError:
                raise ValueError(f"Invalid content type: {content_type}")
            
            # Validate keywords belong to user
            keywords = self._get_user_keywords(user_id, keyword_ids)
            if not keywords:
                raise ValueError("No valid keywords found for the user")
            
            # Set default date range if not provided
            if not date_to:
                date_to = datetime.utcnow()
            if not date_from:
                date_from = date_to - timedelta(days=7)  # Default to last 7 days
            
            # Collect data for content generation
            content_data = self._collect_content_data(keywords, date_from, date_to)
            
            # Apply custom prompt if provided
            if custom_prompt:
                content_data.metadata['custom_prompt'] = custom_prompt
            
            # Generate content using template
            generated_content = self.template_manager.generate_content(
                content_type_enum, content_data
            )
            
            # Save generated content to database
            db_content = self._save_generated_content(
                user_id=user_id,
                content_data=generated_content,
                source_keywords=keyword_ids,
                custom_prompt=custom_prompt
            )
            
            # Prepare response
            result = {
                "id": db_content.id,
                "title": generated_content["title"],
                "content": generated_content["content"],
                "content_type": content_type,
                "template_used": generated_content.get("template_used"),
                "created_at": db_content.created_at,
                "metadata": {
                    **generated_content,
                    "source_keywords": [kw.keyword for kw in keywords],
                    "data_period": {
                        "from": date_from.isoformat(),
                        "to": date_to.isoformat()
                    },
                    "posts_analyzed": len(content_data.posts)
                }
            }
            
            logger.info(f"Content generated successfully: ID={db_content.id}, Type={content_type}")
            return result
            
        except Exception as e:
            logger.error(f"Content generation failed: {str(e)}")
            raise
    
    def _get_user_keywords(self, user_id: int, keyword_ids: List[int]) -> List[Keyword]:
        """Get keywords that belong to the user"""
        return self.db.query(Keyword).filter(
            Keyword.user_id == user_id,
            Keyword.id.in_(keyword_ids),
            Keyword.is_active == True
        ).all()
    
    def _collect_content_data(
        self, 
        keywords: List[Keyword], 
        date_from: datetime, 
        date_to: datetime
    ) -> ContentData:
        """Collect data needed for content generation"""
        
        # Get posts for the keywords within date range
        posts_query = self.db.query(Post).filter(
            Post.keyword_id.in_([kw.id for kw in keywords]),
            Post.created_utc >= date_from,
            Post.created_utc <= date_to
        ).order_by(Post.score.desc())
        
        posts = posts_query.all()
        
        # Convert posts to dictionaries for template processing
        posts_data = []
        for post in posts:
            posts_data.append({
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "author": post.author,
                "subreddit": post.subreddit,
                "score": post.score,
                "num_comments": post.num_comments,
                "created_utc": post.created_utc,
                "url": post.url
            })
        
        # Get trend analysis data
        trends_data = self._get_trends_data(keywords, posts_data)
        
        # Prepare content data
        content_data = ContentData(
            keywords=[kw.keyword for kw in keywords],
            posts=posts_data,
            trends=trends_data,
            metadata={
                "generation_time": datetime.utcnow(),
                "keyword_count": len(keywords),
                "post_count": len(posts_data),
                "date_range": {
                    "from": date_from,
                    "to": date_to
                }
            }
        )
        
        return content_data
    
    def _get_trends_data(self, keywords: List[Keyword], posts_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get trend analysis data for content generation"""
        if not posts_data:
            return {}
        
        # Calculate keyword frequency
        keyword_frequency = {}
        for keyword in keywords:
            count = sum(1 for post in posts_data if keyword.keyword.lower() in post.get('title', '').lower())
            keyword_frequency[keyword.keyword] = count
        
        # Calculate subreddit popularity
        subreddit_counts = {}
        for post in posts_data:
            subreddit = post.get('subreddit', 'unknown')
            subreddit_counts[subreddit] = subreddit_counts.get(subreddit, 0) + 1
        
        # Sort by popularity
        popular_subreddits = dict(sorted(subreddit_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Calculate engagement statistics
        scores = [post.get('score', 0) for post in posts_data]
        comments = [post.get('num_comments', 0) for post in posts_data]
        
        engagement_stats = {
            "avg_score": sum(scores) / len(scores) if scores else 0,
            "avg_comments": sum(comments) / len(comments) if comments else 0,
            "total_engagement": sum(scores) + sum(comments),
            "engagement_rate": (sum(comments) / sum(scores)) * 100 if sum(scores) > 0 else 0
        }
        
        # Calculate growth rate (simplified - would need historical data for accurate calculation)
        growth_rate = self._calculate_growth_rate(posts_data)
        
        return {
            "keyword_frequency": keyword_frequency,
            "popular_subreddits": popular_subreddits,
            "engagement_stats": engagement_stats,
            "growth_rate": growth_rate,
            "time_trends": self._analyze_time_trends(posts_data)
        }
    
    def _calculate_growth_rate(self, posts_data: List[Dict[str, Any]]) -> float:
        """Calculate growth rate based on post timing (simplified)"""
        if len(posts_data) < 2:
            return 0.0
        
        # Sort posts by creation time
        sorted_posts = sorted(posts_data, key=lambda x: x.get('created_utc', datetime.min))
        
        # Split into two halves and compare
        mid_point = len(sorted_posts) // 2
        first_half = sorted_posts[:mid_point]
        second_half = sorted_posts[mid_point:]
        
        first_half_engagement = sum(p.get('score', 0) + p.get('num_comments', 0) for p in first_half)
        second_half_engagement = sum(p.get('score', 0) + p.get('num_comments', 0) for p in second_half)
        
        if first_half_engagement == 0:
            return 100.0 if second_half_engagement > 0 else 0.0
        
        growth_rate = ((second_half_engagement - first_half_engagement) / first_half_engagement) * 100
        return round(growth_rate, 2)
    
    def _analyze_time_trends(self, posts_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze time-based trends in posts"""
        if not posts_data:
            return {}
        
        # Analyze posting hours
        hour_counts = {}
        for post in posts_data:
            created_utc = post.get('created_utc')
            if created_utc:
                hour = created_utc.hour
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        # Find peak hour
        peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else None
        
        return {
            "peak_hour": peak_hour,
            "hourly_distribution": hour_counts,
            "total_timespan_hours": self._calculate_timespan_hours(posts_data)
        }
    
    def _calculate_timespan_hours(self, posts_data: List[Dict[str, Any]]) -> float:
        """Calculate the timespan of posts in hours"""
        timestamps = [p.get('created_utc') for p in posts_data if p.get('created_utc')]
        if len(timestamps) < 2:
            return 0.0
        
        earliest = min(timestamps)
        latest = max(timestamps)
        return (latest - earliest).total_seconds() / 3600
    
    def _save_generated_content(
        self,
        user_id: int,
        content_data: Dict[str, Any],
        source_keywords: List[int],
        custom_prompt: Optional[str] = None
    ) -> GeneratedContent:
        """Save generated content to database"""
        
        # Prepare metadata
        metadata = {
            "template_used": content_data.get("template_used"),
            "generation_params": {
                "source_keywords": source_keywords,
                "custom_prompt": custom_prompt
            },
            "content_stats": {
                "word_count": content_data.get("word_count", 0),
                "sections": content_data.get("sections", [])
            }
        }
        
        # Add content-type specific metadata
        if "marketing_points" in content_data:
            metadata["marketing_points"] = content_data["marketing_points"]
        if "analysis_metrics" in content_data:
            metadata["analysis_metrics"] = content_data["analysis_metrics"]
        if "confidence_score" in content_data:
            metadata["confidence_score"] = content_data["confidence_score"]
        
        # Create database record
        db_content = GeneratedContent(
            user_id=user_id,
            title=content_data["title"],
            content_type=content_data["content_type"],
            content=content_data["content"],
            template_used=content_data.get("template_used"),
            source_keywords=source_keywords,
            content_metadata=metadata
        )
        
        self.db.add(db_content)
        self.db.commit()
        self.db.refresh(db_content)
        
        return db_content
    
    def get_generated_content(
        self,
        user_id: int,
        content_id: Optional[int] = None,
        content_type: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get generated content for a user"""
        
        query = self.db.query(GeneratedContent).filter(
            GeneratedContent.user_id == user_id
        )
        
        if content_id:
            query = query.filter(GeneratedContent.id == content_id)
        
        if content_type:
            query = query.filter(GeneratedContent.content_type == content_type)
        
        contents = query.order_by(GeneratedContent.created_at.desc()).offset(offset).limit(limit).all()
        
        result = []
        for content in contents:
            result.append({
                "id": content.id,
                "title": content.title,
                "content_type": content.content_type,
                "content": content.content,
                "template_used": content.template_used,
                "source_keywords": content.source_keywords,
                "metadata": content.content_metadata,
                "created_at": content.created_at
            })
        
        return result
    
    def delete_generated_content(self, user_id: int, content_id: int) -> bool:
        """Delete generated content"""
        content = self.db.query(GeneratedContent).filter(
            GeneratedContent.id == content_id,
            GeneratedContent.user_id == user_id
        ).first()
        
        if not content:
            return False
        
        self.db.delete(content)
        self.db.commit()
        return True
    
    def get_content_statistics(self, user_id: int) -> Dict[str, Any]:
        """Get content generation statistics for a user"""
        
        # Total content count by type
        content_counts = self.db.query(
            GeneratedContent.content_type,
            self.db.func.count(GeneratedContent.id).label('count')
        ).filter(
            GeneratedContent.user_id == user_id
        ).group_by(GeneratedContent.content_type).all()
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_count = self.db.query(GeneratedContent).filter(
            GeneratedContent.user_id == user_id,
            GeneratedContent.created_at >= thirty_days_ago
        ).count()
        
        # Most used templates
        template_usage = self.db.query(
            GeneratedContent.template_used,
            self.db.func.count(GeneratedContent.id).label('count')
        ).filter(
            GeneratedContent.user_id == user_id
        ).group_by(GeneratedContent.template_used).all()
        
        return {
            "total_content": sum(count for _, count in content_counts),
            "content_by_type": {content_type: count for content_type, count in content_counts},
            "recent_activity": recent_count,
            "template_usage": {template: count for template, count in template_usage if template},
            "available_templates": self.template_manager.list_templates()
        }