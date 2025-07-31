"""
Tests for Content Generation Service

Unit tests for content generation business logic.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from unittest.mock import Mock, patch

from app.services.content_generation_service import ContentGenerationService
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.generated_content import GeneratedContent


class TestContentGenerationService:
    """Test cases for ContentGenerationService."""
    
    @pytest.fixture
    def content_service(self, db_session: Session):
        return ContentGenerationService(db_session)
    
    @pytest.fixture
    def sample_user(self, db_session: Session):
        user = User(
            reddit_id="content_user_123",
            username="contentuser",
            email="content@example.com"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def sample_keywords(self, db_session: Session, sample_user: User):
        keywords = [
            Keyword(user_id=sample_user.id, keyword="ai", description="AI topics", is_active=True),
            Keyword(user_id=sample_user.id, keyword="blockchain", description="Blockchain tech", is_active=True),
        ]
        for keyword in keywords:
            db_session.add(keyword)
        db_session.commit()
        for keyword in keywords:
            db_session.refresh(keyword)
        return keywords
    
    @pytest.fixture
    def sample_posts(self, db_session: Session, sample_keywords):
        posts = []
        base_time = datetime.utcnow() - timedelta(days=3)
        
        for i, keyword in enumerate(sample_keywords):
            for j in range(5):
                post = Post(
                    keyword_id=keyword.id,
                    reddit_id=f"{keyword.keyword}_post_{j}",
                    title=f"{keyword.keyword.title()} Discussion {j}",
                    content=f"Content about {keyword.keyword} topic {j}",
                    author=f"author_{j}",
                    subreddit=f"{keyword.keyword}",
                    score=10 + j * 5,
                    num_comments=3 + j,
                    created_utc=base_time + timedelta(hours=j * 6)
                )
                posts.append(post)
                db_session.add(post)
        
        db_session.commit()
        return posts
    
    def test_generate_blog_content(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test blog content generation."""
        result = content_service.generate_content(
            user_id=sample_user.id,
            content_type="blog",
            keyword_ids=[sample_keywords[0].id],
            date_from=datetime.utcnow() - timedelta(days=7),
            date_to=datetime.utcnow()
        )
        
        assert "id" in result
        assert "title" in result
        assert "content" in result
        assert result["content_type"] == "blog"
        assert "metadata" in result
        
        # Verify content was saved to database
        db_content = content_service.db.query(GeneratedContent).filter(
            GeneratedContent.id == result["id"]
        ).first()
        assert db_content is not None
        assert db_content.user_id == sample_user.id
        assert db_content.content_type == "blog"
    
    def test_generate_product_intro_content(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test product introduction content generation."""
        result = content_service.generate_content(
            user_id=sample_user.id,
            content_type="product_intro",
            keyword_ids=[sample_keywords[1].id]
        )
        
        assert result["content_type"] == "product_intro"
        assert "marketing_points" in result["metadata"] or "template_used" in result
        
        # Verify metadata contains marketing-specific information
        metadata = result["metadata"]
        assert "source_keywords" in metadata
        assert sample_keywords[1].keyword in metadata["source_keywords"]
    
    def test_generate_trend_analysis_content(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test trend analysis content generation."""
        result = content_service.generate_content(
            user_id=sample_user.id,
            content_type="trend_analysis",
            keyword_ids=[kw.id for kw in sample_keywords]
        )
        
        assert result["content_type"] == "trend_analysis"
        
        # Verify analysis-specific metadata
        metadata = result["metadata"]
        assert "posts_analyzed" in metadata
        assert metadata["posts_analyzed"] > 0
        assert len(metadata["source_keywords"]) == 2
    
    def test_generate_content_with_custom_prompt(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test content generation with custom prompt."""
        custom_prompt = "Focus on technical aspects and include code examples"
        
        result = content_service.generate_content(
            user_id=sample_user.id,
            content_type="blog",
            keyword_ids=[sample_keywords[0].id],
            custom_prompt=custom_prompt
        )
        
        # Verify custom prompt is stored in metadata
        db_content = content_service.db.query(GeneratedContent).filter(
            GeneratedContent.id == result["id"]
        ).first()
        
        assert db_content.content_metadata is not None
        assert "generation_params" in db_content.content_metadata
        assert db_content.content_metadata["generation_params"]["custom_prompt"] == custom_prompt
    
    def test_generate_content_invalid_type(self, content_service, sample_user, sample_keywords):
        """Test content generation with invalid content type."""
        with pytest.raises(ValueError) as exc_info:
            content_service.generate_content(
                user_id=sample_user.id,
                content_type="invalid_type",
                keyword_ids=[sample_keywords[0].id]
            )
        
        assert "Invalid content type" in str(exc_info.value)
    
    def test_generate_content_no_keywords(self, content_service, sample_user):
        """Test content generation with no valid keywords."""
        with pytest.raises(ValueError) as exc_info:
            content_service.generate_content(
                user_id=sample_user.id,
                content_type="blog",
                keyword_ids=[999]  # Non-existent keyword ID
            )
        
        assert "No valid keywords found" in str(exc_info.value)
    
    def test_generate_content_inactive_keywords(self, content_service, sample_user, db_session):
        """Test content generation with inactive keywords."""
        # Create inactive keyword
        inactive_keyword = Keyword(
            user_id=sample_user.id,
            keyword="inactive",
            is_active=False
        )
        db_session.add(inactive_keyword)
        db_session.commit()
        db_session.refresh(inactive_keyword)
        
        with pytest.raises(ValueError) as exc_info:
            content_service.generate_content(
                user_id=sample_user.id,
                content_type="blog",
                keyword_ids=[inactive_keyword.id]
            )
        
        assert "No valid keywords found" in str(exc_info.value)
    
    def test_get_user_keywords(self, content_service, sample_user, sample_keywords):
        """Test getting user keywords."""
        keywords = content_service._get_user_keywords(
            sample_user.id, 
            [sample_keywords[0].id, sample_keywords[1].id]
        )
        
        assert len(keywords) == 2
        assert all(kw.user_id == sample_user.id for kw in keywords)
        assert all(kw.is_active for kw in keywords)
    
    def test_collect_content_data(self, content_service, sample_keywords, sample_posts):
        """Test content data collection."""
        date_from = datetime.utcnow() - timedelta(days=7)
        date_to = datetime.utcnow()
        
        content_data = content_service._collect_content_data(
            sample_keywords, date_from, date_to
        )
        
        assert len(content_data.keywords) == 2
        assert len(content_data.posts) > 0
        assert "keyword_frequency" in content_data.trends
        assert "popular_subreddits" in content_data.trends
        assert "engagement_stats" in content_data.trends
        
        # Verify metadata
        assert "generation_time" in content_data.metadata
        assert "keyword_count" in content_data.metadata
        assert "post_count" in content_data.metadata
        assert content_data.metadata["keyword_count"] == 2
    
    def test_get_trends_data(self, content_service, sample_keywords):
        """Test trend data analysis."""
        posts_data = [
            {
                "title": "AI breakthrough in 2024",
                "content": "Amazing AI developments",
                "subreddit": "MachineLearning",
                "score": 100,
                "num_comments": 25,
                "created_utc": datetime.utcnow() - timedelta(hours=2)
            },
            {
                "title": "Blockchain revolution",
                "content": "New blockchain technology",
                "subreddit": "cryptocurrency",
                "score": 80,
                "num_comments": 15,
                "created_utc": datetime.utcnow() - timedelta(hours=1)
            }
        ]
        
        trends_data = content_service._get_trends_data(sample_keywords, posts_data)
        
        assert "keyword_frequency" in trends_data
        assert "popular_subreddits" in trends_data
        assert "engagement_stats" in trends_data
        assert "growth_rate" in trends_data
        assert "time_trends" in trends_data
        
        # Verify engagement stats
        engagement_stats = trends_data["engagement_stats"]
        assert "avg_score" in engagement_stats
        assert "avg_comments" in engagement_stats
        assert "total_engagement" in engagement_stats
        assert engagement_stats["avg_score"] == 90.0  # (100 + 80) / 2
    
    def test_calculate_growth_rate(self, content_service):
        """Test growth rate calculation."""
        # Test with increasing engagement
        posts_data = [
            {"score": 10, "num_comments": 2, "created_utc": datetime.utcnow() - timedelta(hours=4)},
            {"score": 20, "num_comments": 4, "created_utc": datetime.utcnow() - timedelta(hours=3)},
            {"score": 30, "num_comments": 6, "created_utc": datetime.utcnow() - timedelta(hours=2)},
            {"score": 40, "num_comments": 8, "created_utc": datetime.utcnow() - timedelta(hours=1)},
        ]
        
        growth_rate = content_service._calculate_growth_rate(posts_data)
        assert growth_rate > 0  # Should show positive growth
        
        # Test with no posts
        growth_rate = content_service._calculate_growth_rate([])
        assert growth_rate == 0.0
        
        # Test with single post
        growth_rate = content_service._calculate_growth_rate([posts_data[0]])
        assert growth_rate == 0.0
    
    def test_get_generated_content(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test retrieving generated content."""
        # Generate some content first
        result1 = content_service.generate_content(
            user_id=sample_user.id,
            content_type="blog",
            keyword_ids=[sample_keywords[0].id]
        )
        
        result2 = content_service.generate_content(
            user_id=sample_user.id,
            content_type="product_intro",
            keyword_ids=[sample_keywords[1].id]
        )
        
        # Get all content
        all_content = content_service.get_generated_content(sample_user.id)
        assert len(all_content) == 2
        
        # Get specific content
        specific_content = content_service.get_generated_content(
            sample_user.id, content_id=result1["id"]
        )
        assert len(specific_content) == 1
        assert specific_content[0]["id"] == result1["id"]
        
        # Get by content type
        blog_content = content_service.get_generated_content(
            sample_user.id, content_type="blog"
        )
        assert len(blog_content) == 1
        assert blog_content[0]["content_type"] == "blog"
    
    def test_delete_generated_content(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test deleting generated content."""
        # Generate content first
        result = content_service.generate_content(
            user_id=sample_user.id,
            content_type="blog",
            keyword_ids=[sample_keywords[0].id]
        )
        
        # Delete content
        success = content_service.delete_generated_content(sample_user.id, result["id"])
        assert success is True
        
        # Verify it's deleted
        content = content_service.get_generated_content(sample_user.id, content_id=result["id"])
        assert len(content) == 0
        
        # Try to delete non-existent content
        success = content_service.delete_generated_content(sample_user.id, 999)
        assert success is False
    
    def test_get_content_statistics(self, content_service, sample_user, sample_keywords, sample_posts):
        """Test getting content generation statistics."""
        # Generate different types of content
        content_service.generate_content(
            user_id=sample_user.id,
            content_type="blog",
            keyword_ids=[sample_keywords[0].id]
        )
        
        content_service.generate_content(
            user_id=sample_user.id,
            content_type="blog",
            keyword_ids=[sample_keywords[1].id]
        )
        
        content_service.generate_content(
            user_id=sample_user.id,
            content_type="product_intro",
            keyword_ids=[sample_keywords[0].id]
        )
        
        # Get statistics
        stats = content_service.get_content_statistics(sample_user.id)
        
        assert "total_content" in stats
        assert "content_by_type" in stats
        assert "recent_activity" in stats
        assert "template_usage" in stats
        assert "available_templates" in stats
        
        assert stats["total_content"] == 3
        assert stats["content_by_type"]["blog"] == 2
        assert stats["content_by_type"]["product_intro"] == 1
        assert stats["recent_activity"] == 3  # All created within 30 days
    
    def test_analyze_time_trends(self, content_service):
        """Test time trend analysis."""
        posts_data = [
            {"created_utc": datetime(2024, 1, 1, 10, 0, 0)},
            {"created_utc": datetime(2024, 1, 1, 14, 0, 0)},
            {"created_utc": datetime(2024, 1, 1, 22, 0, 0)},
            {"created_utc": datetime(2024, 1, 2, 10, 0, 0)},
        ]
        
        time_trends = content_service._analyze_time_trends(posts_data)
        
        assert "peak_hour" in time_trends
        assert "hourly_distribution" in time_trends
        assert "total_timespan_hours" in time_trends
        
        # Verify peak hour calculation
        assert time_trends["peak_hour"] == 10  # Hour 10 appears twice
        
        # Verify timespan calculation
        assert time_trends["total_timespan_hours"] == 24.0  # 24 hours between first and last
    
    def test_calculate_timespan_hours(self, content_service):
        """Test timespan calculation."""
        posts_data = [
            {"created_utc": datetime(2024, 1, 1, 10, 0, 0)},
            {"created_utc": datetime(2024, 1, 1, 14, 0, 0)},
        ]
        
        timespan = content_service._calculate_timespan_hours(posts_data)
        assert timespan == 4.0  # 4 hours difference
        
        # Test with no timestamps
        posts_data_no_time = [{"created_utc": None}, {"created_utc": None}]
        timespan = content_service._calculate_timespan_hours(posts_data_no_time)
        assert timespan == 0.0
        
        # Test with single post
        single_post = [{"created_utc": datetime(2024, 1, 1, 10, 0, 0)}]
        timespan = content_service._calculate_timespan_hours(single_post)
        assert timespan == 0.0