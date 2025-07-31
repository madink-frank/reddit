"""
Integration Tests for Content Generation API Endpoints

Tests for content generation API endpoints with database integration.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.generated_content import GeneratedContent


class TestContentEndpoints:
    """Integration test cases for content generation API endpoints."""
    
    @pytest.fixture
    def sample_posts_for_content(self, db_session: Session, test_keyword: Keyword):
        """Create sample posts for content generation testing."""
        posts = []
        base_time = datetime.utcnow() - timedelta(days=3)
        
        for i in range(5):
            post = Post(
                keyword_id=test_keyword.id,
                reddit_id=f"content_post_{i}",
                title=f"AI Development Trends {i}",
                content=f"Detailed content about AI development trends and innovations {i}",
                author=f"ai_expert_{i}",
                subreddit="MachineLearning",
                url=f"https://reddit.com/r/MachineLearning/post_{i}",
                score=20 + i * 10,
                num_comments=5 + i * 2,
                created_utc=base_time + timedelta(hours=i * 6)
            )
            posts.append(post)
            db_session.add(post)
        
        db_session.commit()
        for post in posts:
            db_session.refresh(post)
        
        return posts
    
    def test_generate_content_blog_success(self, client: TestClient, auth_headers: dict, test_keyword: Keyword, sample_posts_for_content: list):
        """Test successful blog content generation."""
        content_data = {
            "content_type": "blog",
            "keyword_ids": [test_keyword.id],
            "date_from": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "date_to": datetime.utcnow().isoformat()
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "id" in data
        assert data["content_type"] == "blog"
        assert "title" in data
        assert "content" in data
        assert "created_at" in data
        assert "metadata" in data
        
        # Verify metadata
        metadata = data["metadata"]
        assert "source_keywords" in metadata
        assert test_keyword.keyword in metadata["source_keywords"]
        assert "posts_analyzed" in metadata
        assert metadata["posts_analyzed"] == len(sample_posts_for_content)
        assert "data_period" in metadata
    
    def test_generate_content_product_intro_success(self, client: TestClient, auth_headers: dict, test_keyword: Keyword, sample_posts_for_content: list):
        """Test successful product introduction content generation."""
        content_data = {
            "content_type": "product_intro",
            "keyword_ids": [test_keyword.id]
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["content_type"] == "product_intro"
        assert "title" in data
        assert "content" in data
        
        # Product intro should have marketing-focused content
        content_text = data["content"].lower()
        assert any(word in content_text for word in ["product", "solution", "benefit", "feature"])
    
    def test_generate_content_trend_analysis_success(self, client: TestClient, auth_headers: dict, test_keyword: Keyword, sample_posts_for_content: list):
        """Test successful trend analysis content generation."""
        content_data = {
            "content_type": "trend_analysis",
            "keyword_ids": [test_keyword.id]
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["content_type"] == "trend_analysis"
        assert "title" in data
        assert "content" in data
        
        # Trend analysis should have analytical content
        content_text = data["content"].lower()
        assert any(word in content_text for word in ["trend", "analysis", "data", "insight"])
    
    def test_generate_content_with_custom_prompt(self, client: TestClient, auth_headers: dict, test_keyword: Keyword, sample_posts_for_content: list):
        """Test content generation with custom prompt."""
        content_data = {
            "content_type": "blog",
            "keyword_ids": [test_keyword.id],
            "custom_prompt": "Focus on technical aspects and include code examples"
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify custom prompt is stored in metadata
        assert "metadata" in data
        # Note: The exact metadata structure depends on implementation
        # This test verifies the endpoint accepts custom prompts
    
    def test_generate_content_invalid_type(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test content generation with invalid content type."""
        content_data = {
            "content_type": "invalid_type",
            "keyword_ids": [test_keyword.id]
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Invalid content type" in response.json()["detail"]
    
    def test_generate_content_no_keywords(self, client: TestClient, auth_headers: dict):
        """Test content generation without keywords."""
        content_data = {
            "content_type": "blog",
            "keyword_ids": []
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "keyword" in response.json()["detail"].lower()
    
    def test_generate_content_nonexistent_keywords(self, client: TestClient, auth_headers: dict):
        """Test content generation with non-existent keywords."""
        content_data = {
            "content_type": "blog",
            "keyword_ids": [999, 1000]
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "No valid keywords found" in response.json()["detail"]
    
    def test_generate_content_unauthorized(self, client: TestClient, test_keyword: Keyword):
        """Test content generation without authentication."""
        content_data = {
            "content_type": "blog",
            "keyword_ids": [test_keyword.id]
        }
        
        response = client.post("/api/v1/content/generate", json=content_data)
        
        assert response.status_code == 403
    
    def test_get_generated_content_success(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test getting user's generated content."""
        # Create some generated content first
        content1 = GeneratedContent(
            user_id=test_user.id,
            title="Test Blog Post",
            content_type="blog",
            content="This is a test blog post content.",
            source_keywords=[1, 2],
            content_metadata={"word_count": 50}
        )
        content2 = GeneratedContent(
            user_id=test_user.id,
            title="Test Product Intro",
            content_type="product_intro",
            content="This is a test product introduction.",
            source_keywords=[1],
            content_metadata={"word_count": 30}
        )
        
        db_session.add(content1)
        db_session.add(content2)
        db_session.commit()
        db_session.refresh(content1)
        db_session.refresh(content2)
        
        response = client.get("/api/v1/content", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "content" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        
        assert data["total"] == 2
        assert len(data["content"]) == 2
        
        # Verify content structure
        for content in data["content"]:
            assert "id" in content
            assert "title" in content
            assert "content_type" in content
            assert "content" in content
            assert "source_keywords" in content
            assert "metadata" in content
            assert "created_at" in content
    
    def test_get_generated_content_with_pagination(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test getting generated content with pagination."""
        # Create multiple content items
        for i in range(5):
            content = GeneratedContent(
                user_id=test_user.id,
                title=f"Test Content {i}",
                content_type="blog",
                content=f"Test content {i}",
                source_keywords=[1]
            )
            db_session.add(content)
        
        db_session.commit()
        
        response = client.get("/api/v1/content?page=1&page_size=3", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["page_size"] == 3
        assert len(data["content"]) == 3
        assert data["total"] == 5
        assert data["total_pages"] == 2
    
    def test_get_generated_content_by_type(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test filtering generated content by type."""
        # Create content of different types
        blog_content = GeneratedContent(
            user_id=test_user.id,
            title="Blog Content",
            content_type="blog",
            content="Blog content",
            source_keywords=[1]
        )
        product_content = GeneratedContent(
            user_id=test_user.id,
            title="Product Content",
            content_type="product_intro",
            content="Product content",
            source_keywords=[1]
        )
        
        db_session.add(blog_content)
        db_session.add(product_content)
        db_session.commit()
        
        # Filter by blog type
        response = client.get("/api/v1/content?content_type=blog", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 1
        assert data["content"][0]["content_type"] == "blog"
        assert data["content"][0]["title"] == "Blog Content"
    
    def test_get_generated_content_by_id_success(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test getting specific generated content by ID."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="Specific Content",
            content_type="trend_analysis",
            content="This is specific content for testing.",
            source_keywords=[1, 2, 3],
            content_metadata={
                "word_count": 100,
                "confidence_score": 0.85,
                "sections": ["intro", "analysis", "conclusion"]
            }
        )
        
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        response = client.get(f"/api/v1/content/{content.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == content.id
        assert data["title"] == "Specific Content"
        assert data["content_type"] == "trend_analysis"
        assert data["content"] == "This is specific content for testing."
        assert data["source_keywords"] == [1, 2, 3]
        assert data["metadata"]["word_count"] == 100
        assert data["metadata"]["confidence_score"] == 0.85
    
    def test_get_generated_content_by_id_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent generated content."""
        response = client.get("/api/v1/content/999", headers=auth_headers)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_delete_generated_content_success(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test deleting generated content."""
        content = GeneratedContent(
            user_id=test_user.id,
            title="Content to Delete",
            content_type="blog",
            content="This content will be deleted.",
            source_keywords=[1]
        )
        
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        response = client.delete(f"/api/v1/content/{content.id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify content is deleted
        get_response = client.get(f"/api/v1/content/{content.id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_generated_content_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent generated content."""
        response = client.delete("/api/v1/content/999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_get_content_statistics(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test getting content generation statistics."""
        # Create various types of content
        contents = [
            GeneratedContent(
                user_id=test_user.id,
                title="Blog 1",
                content_type="blog",
                content="Blog content 1",
                source_keywords=[1],
                template_used="blog_template_v1"
            ),
            GeneratedContent(
                user_id=test_user.id,
                title="Blog 2",
                content_type="blog",
                content="Blog content 2",
                source_keywords=[1],
                template_used="blog_template_v1"
            ),
            GeneratedContent(
                user_id=test_user.id,
                title="Product Intro",
                content_type="product_intro",
                content="Product content",
                source_keywords=[2],
                template_used="product_template_v1"
            )
        ]
        
        for content in contents:
            db_session.add(content)
        
        db_session.commit()
        
        response = client.get("/api/v1/content/statistics", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_content" in data
        assert "content_by_type" in data
        assert "recent_activity" in data
        assert "template_usage" in data
        assert "available_templates" in data
        
        assert data["total_content"] == 3
        assert data["content_by_type"]["blog"] == 2
        assert data["content_by_type"]["product_intro"] == 1
        assert data["recent_activity"] == 3  # All created within 30 days
        assert data["template_usage"]["blog_template_v1"] == 2
        assert data["template_usage"]["product_template_v1"] == 1
    
    def test_get_content_templates(self, client: TestClient, auth_headers: dict):
        """Test getting available content templates."""
        response = client.get("/api/v1/content/templates", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "templates" in data
        assert len(data["templates"]) > 0
        
        # Verify template structure
        for template in data["templates"]:
            assert "id" in template
            assert "name" in template
            assert "content_type" in template
            assert "description" in template
    
    def test_cross_user_content_access(self, client: TestClient, test_user_2: User, test_user: User, db_session: Session):
        """Test that users cannot access other users' generated content."""
        # Create content for first user
        content = GeneratedContent(
            user_id=test_user.id,
            title="Private Content",
            content_type="blog",
            content="This is private content",
            source_keywords=[1]
        )
        db_session.add(content)
        db_session.commit()
        db_session.refresh(content)
        
        # Create token for second user
        from app.core.auth import TokenManager
        token_data = {
            "sub": str(test_user_2.id),
            "reddit_id": test_user_2.reddit_id,
            "username": test_user_2.username
        }
        user2_token = TokenManager.create_access_token(token_data)
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User 2 should not see user 1's content
        response = client.get("/api/v1/content", headers=user2_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        
        # User 2 should not access user 1's specific content
        response = client.get(f"/api/v1/content/{content.id}", headers=user2_headers)
        assert response.status_code == 404
        
        # User 2 should not be able to delete user 1's content
        response = client.delete(f"/api/v1/content/{content.id}", headers=user2_headers)
        assert response.status_code == 404
    
    def test_generate_content_with_date_range(self, client: TestClient, auth_headers: dict, test_keyword: Keyword, sample_posts_for_content: list):
        """Test content generation with specific date range."""
        date_from = (datetime.utcnow() - timedelta(days=2)).isoformat()
        date_to = (datetime.utcnow() - timedelta(days=1)).isoformat()
        
        content_data = {
            "content_type": "trend_analysis",
            "keyword_ids": [test_keyword.id],
            "date_from": date_from,
            "date_to": date_to
        }
        
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify date range is reflected in metadata
        metadata = data["metadata"]
        assert "data_period" in metadata
        assert metadata["data_period"]["from"] == date_from
        assert metadata["data_period"]["to"] == date_to
    
    def test_content_generation_validation(self, client: TestClient, auth_headers: dict):
        """Test content generation request validation."""
        # Missing content_type
        response = client.post("/api/v1/content/generate", json={"keyword_ids": [1]}, headers=auth_headers)
        assert response.status_code == 422
        
        # Missing keyword_ids
        response = client.post("/api/v1/content/generate", json={"content_type": "blog"}, headers=auth_headers)
        assert response.status_code == 422
        
        # Invalid date format
        content_data = {
            "content_type": "blog",
            "keyword_ids": [1],
            "date_from": "invalid-date"
        }
        response = client.post("/api/v1/content/generate", json=content_data, headers=auth_headers)
        assert response.status_code == 422