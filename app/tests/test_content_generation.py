"""
Tests for content generation functionality.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.content_generation_service import ContentGenerationService
from app.services.content_templates import (
    TemplateManager, ContentData, ContentType,
    BlogTemplate, ProductIntroTemplate, TrendAnalysisTemplate
)
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.generated_content import GeneratedContent


class TestContentTemplates:
    """Test content template functionality"""
    
    def test_blog_template_generation(self):
        """Test blog template content generation"""
        template = BlogTemplate()
        
        # Create test data
        content_data = ContentData(
            keywords=["AI", "machine learning"],
            posts=[
                {
                    "id": 1,
                    "title": "AI breakthrough in 2024",
                    "content": "Amazing AI developments",
                    "author": "test_user",
                    "subreddit": "MachineLearning",
                    "score": 150,
                    "num_comments": 25,
                    "created_utc": datetime.utcnow(),
                    "url": "https://reddit.com/test"
                }
            ],
            trends={
                "keyword_frequency": {"AI": 10, "machine learning": 8},
                "popular_subreddits": {"MachineLearning": 5, "artificial": 3}
            },
            metadata={}
        )
        
        result = template.generate(content_data)
        
        assert result["content_type"] == "blog"
        assert result["template_used"] == "default_blog"
        assert "AI, machine learning" in result["title"]
        assert "# " in result["content"]  # Markdown header
        assert "## 📈 트렌드 분석" in result["content"]
        assert "## 🔥 주목할 만한 포스트들" in result["content"]
        assert result["word_count"] > 0
        assert "sections" in result
    
    def test_product_intro_template_generation(self):
        """Test product introduction template content generation"""
        template = ProductIntroTemplate()
        
        content_data = ContentData(
            keywords=["smartphone", "technology"],
            posts=[
                {
                    "id": 1,
                    "title": "New smartphone features",
                    "content": "Latest tech innovations",
                    "author": "tech_reviewer",
                    "subreddit": "technology",
                    "score": 200,
                    "num_comments": 50,
                    "created_utc": datetime.utcnow(),
                    "url": "https://reddit.com/test"
                }
            ],
            trends={
                "keyword_frequency": {"smartphone": 15, "technology": 12},
                "popular_subreddits": {"technology": 8, "gadgets": 4}
            },
            metadata={}
        )
        
        result = template.generate(content_data)
        
        assert result["content_type"] == "product_intro"
        assert result["template_used"] == "default_product_intro"
        assert "smartphone, technology" in result["title"]
        assert "## 🎯 시장 분석" in result["content"]
        assert "## 🚀 핵심 마케팅 포인트" in result["content"]
        assert "marketing_points" in result
        assert "target_keywords" in result
    
    def test_trend_analysis_template_generation(self):
        """Test trend analysis template content generation"""
        template = TrendAnalysisTemplate()
        
        content_data = ContentData(
            keywords=["crypto", "bitcoin"],
            posts=[
                {
                    "id": 1,
                    "title": "Bitcoin price analysis",
                    "content": "Market trends discussion",
                    "author": "crypto_analyst",
                    "subreddit": "cryptocurrency",
                    "score": 300,
                    "num_comments": 75,
                    "created_utc": datetime.utcnow(),
                    "url": "https://reddit.com/test"
                }
            ],
            trends={
                "keyword_frequency": {"crypto": 20, "bitcoin": 18},
                "popular_subreddits": {"cryptocurrency": 10, "Bitcoin": 8},
                "engagement_stats": {
                    "avg_score": 250,
                    "avg_comments": 60,
                    "engagement_rate": 24.0
                }
            },
            metadata={}
        )
        
        result = template.generate(content_data)
        
        assert result["content_type"] == "trend_analysis"
        assert result["template_used"] == "default_trend_analysis"
        assert "crypto, bitcoin" in result["title"]
        assert "## 📋 Executive Summary" in result["content"]
        assert "## 📊 트렌드 메트릭스" in result["content"]
        assert "analysis_metrics" in result
        assert "confidence_score" in result
    
    def test_template_manager(self):
        """Test template manager functionality"""
        manager = TemplateManager()
        
        # Test getting templates
        blog_template = manager.get_template(ContentType.BLOG)
        assert isinstance(blog_template, BlogTemplate)
        
        product_template = manager.get_template(ContentType.PRODUCT_INTRO)
        assert isinstance(product_template, ProductIntroTemplate)
        
        trend_template = manager.get_template(ContentType.TREND_ANALYSIS)
        assert isinstance(trend_template, TrendAnalysisTemplate)
        
        # Test listing templates
        templates = manager.list_templates()
        assert len(templates) == 3
        assert all("content_type" in t for t in templates)
        assert all("template_name" in t for t in templates)
        assert all("description" in t for t in templates)


class TestContentGenerationService:
    """Test content generation service"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def mock_user(self):
        """Mock user"""
        user = Mock(spec=User)
        user.id = 1
        user.username = "test_user"
        return user
    
    @pytest.fixture
    def mock_keywords(self):
        """Mock keywords"""
        keyword1 = Mock(spec=Keyword)
        keyword1.id = 1
        keyword1.keyword = "AI"
        keyword1.user_id = 1
        keyword1.is_active = True
        
        keyword2 = Mock(spec=Keyword)
        keyword2.id = 2
        keyword2.keyword = "machine learning"
        keyword2.user_id = 1
        keyword2.is_active = True
        
        return [keyword1, keyword2]
    
    @pytest.fixture
    def mock_posts(self):
        """Mock posts"""
        post1 = Mock(spec=Post)
        post1.id = 1
        post1.title = "AI breakthrough"
        post1.content = "Amazing AI developments"
        post1.author = "researcher"
        post1.subreddit = "MachineLearning"
        post1.score = 150
        post1.num_comments = 25
        post1.created_utc = datetime.utcnow()
        post1.url = "https://reddit.com/test1"
        
        post2 = Mock(spec=Post)
        post2.id = 2
        post2.title = "ML applications"
        post2.content = "Practical ML use cases"
        post2.author = "developer"
        post2.subreddit = "artificial"
        post2.score = 200
        post2.num_comments = 40
        post2.created_utc = datetime.utcnow()
        post2.url = "https://reddit.com/test2"
        
        return [post1, post2]
    
    def test_generate_content_success(self, mock_db, mock_user, mock_keywords, mock_posts):
        """Test successful content generation"""
        # Setup mocks
        mock_db.query.return_value.filter.return_value.all.return_value = mock_keywords
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_posts
        
        # Mock the generated content save
        mock_generated_content = Mock(spec=GeneratedContent)
        mock_generated_content.id = 1
        mock_generated_content.created_at = datetime.utcnow()
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        # Create service
        service = ContentGenerationService(mock_db)
        
        # Mock the analytics service
        with patch.object(service, 'analytics_service'):
            # Mock the save method to return our mock object
            with patch.object(service, '_save_generated_content', return_value=mock_generated_content):
                result = service.generate_content(
                    user_id=1,
                    content_type="blog",
                    keyword_ids=[1, 2]
                )
        
        assert result["id"] == 1
        assert result["content_type"] == "blog"
        assert "title" in result
        assert "content" in result
        assert "metadata" in result
    
    def test_generate_content_invalid_type(self, mock_db):
        """Test content generation with invalid content type"""
        service = ContentGenerationService(mock_db)
        
        with pytest.raises(ValueError, match="Invalid content type"):
            service.generate_content(
                user_id=1,
                content_type="invalid_type",
                keyword_ids=[1]
            )
    
    def test_generate_content_no_keywords(self, mock_db):
        """Test content generation with no valid keywords"""
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        service = ContentGenerationService(mock_db)
        
        with pytest.raises(ValueError, match="No valid keywords found"):
            service.generate_content(
                user_id=1,
                content_type="blog",
                keyword_ids=[1, 2]
            )
    
    def test_get_generated_content(self, mock_db):
        """Test retrieving generated content"""
        # Mock generated content
        mock_content = Mock(spec=GeneratedContent)
        mock_content.id = 1
        mock_content.title = "Test Content"
        mock_content.content_type = "blog"
        mock_content.content = "Test content body"
        mock_content.template_used = "default_blog"
        mock_content.source_keywords = [1, 2]
        mock_content.metadata = {"test": "data"}
        mock_content.created_at = datetime.utcnow()
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_content]
        
        service = ContentGenerationService(mock_db)
        result = service.get_generated_content(user_id=1)
        
        assert len(result) == 1
        assert result[0]["id"] == 1
        assert result[0]["title"] == "Test Content"
        assert result[0]["content_type"] == "blog"
    
    def test_delete_generated_content(self, mock_db):
        """Test deleting generated content"""
        mock_content = Mock(spec=GeneratedContent)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_content
        
        service = ContentGenerationService(mock_db)
        result = service.delete_generated_content(user_id=1, content_id=1)
        
        assert result is True
        mock_db.delete.assert_called_once_with(mock_content)
        mock_db.commit.assert_called_once()
    
    def test_delete_nonexistent_content(self, mock_db):
        """Test deleting non-existent content"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        service = ContentGenerationService(mock_db)
        result = service.delete_generated_content(user_id=1, content_id=999)
        
        assert result is False
    
    def test_get_content_statistics(self, mock_db):
        """Test getting content statistics"""
        # Mock statistics queries
        mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = [
            ("blog", 5),
            ("product_intro", 3)
        ]
        mock_db.query.return_value.filter.return_value.count.return_value = 2
        
        service = ContentGenerationService(mock_db)
        stats = service.get_content_statistics(user_id=1)
        
        assert "total_content" in stats
        assert "content_by_type" in stats
        assert "recent_activity" in stats
        assert "available_templates" in stats


@pytest.mark.asyncio
class TestContentAPI:
    """Test content API endpoints"""
    
    def test_content_templates_integration(self):
        """Integration test for content templates"""
        # Test that all templates can generate content without errors
        manager = TemplateManager()
        
        test_data = ContentData(
            keywords=["test"],
            posts=[{
                "id": 1,
                "title": "Test post",
                "content": "Test content",
                "author": "test_user",
                "subreddit": "test",
                "score": 100,
                "num_comments": 10,
                "created_utc": datetime.utcnow(),
                "url": "https://reddit.com/test"
            }],
            trends={"keyword_frequency": {"test": 1}},
            metadata={}
        )
        
        for content_type in [ContentType.BLOG, ContentType.PRODUCT_INTRO, ContentType.TREND_ANALYSIS]:
            result = manager.generate_content(content_type, test_data)
            
            assert "title" in result
            assert "content" in result
            assert "content_type" in result
            assert result["content_type"] == content_type.value
            assert len(result["content"]) > 0