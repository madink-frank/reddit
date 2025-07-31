"""
End-to-End Tests for Content Generation Workflow

Tests for complete content generation workflow from data collection to content creation.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, Mock

from app.main import app
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.generated_content import GeneratedContent


class TestContentGenerationWorkflowE2E:
    """End-to-end tests for the complete content generation workflow."""
    
    @pytest.fixture
    def sample_crawled_data(self, db_session: Session, test_user: User):
        """Create sample crawled data for content generation testing."""
        # Create keywords
        keywords = []
        keyword_names = ["artificial intelligence", "machine learning", "deep learning"]
        
        for name in keyword_names:
            keyword = Keyword(
                user_id=test_user.id,
                keyword=name,
                description=f"Content about {name}",
                is_active=True
            )
            keywords.append(keyword)
            db_session.add(keyword)
        
        db_session.commit()
        for keyword in keywords:
            db_session.refresh(keyword)
        
        # Create posts for each keyword
        posts = []
        base_time = datetime.utcnow() - timedelta(days=7)
        
        ai_posts = [
            {
                "title": "The Future of Artificial Intelligence in 2024",
                "content": "AI is revolutionizing industries with breakthrough innovations in natural language processing, computer vision, and autonomous systems. Companies are investing billions in AI research.",
                "author": "ai_researcher",
                "subreddit": "artificial",
                "score": 245,
                "num_comments": 67
            },
            {
                "title": "AI Ethics and Responsible Development",
                "content": "As AI becomes more powerful, we must consider ethical implications and ensure responsible development practices. Bias, privacy, and transparency are key concerns.",
                "author": "ethics_expert",
                "subreddit": "artificial",
                "score": 189,
                "num_comments": 43
            }
        ]
        
        ml_posts = [
            {
                "title": "Machine Learning Model Optimization Techniques",
                "content": "Advanced techniques for optimizing ML models including hyperparameter tuning, feature engineering, and ensemble methods. Performance improvements of 20-30% are achievable.",
                "author": "ml_engineer",
                "subreddit": "MachineLearning",
                "score": 156,
                "num_comments": 29
            },
            {
                "title": "AutoML: Democratizing Machine Learning",
                "content": "Automated machine learning tools are making ML accessible to non-experts. Platforms like AutoML can build models with minimal human intervention.",
                "author": "automl_dev",
                "subreddit": "MachineLearning",
                "score": 134,
                "num_comments": 22
            }
        ]
        
        dl_posts = [
            {
                "title": "Transformer Architecture Breakthroughs",
                "content": "New transformer architectures are achieving state-of-the-art results in NLP tasks. Attention mechanisms continue to evolve with improved efficiency.",
                "author": "dl_researcher",
                "subreddit": "deeplearning",
                "score": 198,
                "num_comments": 35
            }
        ]
        
        all_post_data = [
            (keywords[0], ai_posts),
            (keywords[1], ml_posts),
            (keywords[2], dl_posts)
        ]
        
        for keyword, post_list in all_post_data:
            for i, post_data in enumerate(post_list):
                post = Post(
                    keyword_id=keyword.id,
                    reddit_id=f"{keyword.keyword.replace(' ', '_')}_{i}",
                    title=post_data["title"],
                    content=post_data["content"],
                    author=post_data["author"],
                    subreddit=post_data["subreddit"],
                    score=post_data["score"],
                    num_comments=post_data["num_comments"],
                    created_utc=base_time + timedelta(hours=i * 12),
                    url=f"https://reddit.com/r/{post_data['subreddit']}/post_{i}"
                )
                posts.append(post)
                db_session.add(post)
        
        db_session.commit()
        for post in posts:
            db_session.refresh(post)
        
        return {"keywords": keywords, "posts": posts}
    
    def test_complete_blog_generation_workflow(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict):
        """Test complete workflow for blog content generation."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Step 1: Generate blog content
        content_request = {
            "content_type": "blog",
            "keyword_ids": [keywords[0].id, keywords[1].id],  # AI and ML keywords
            "date_from": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "date_to": datetime.utcnow().isoformat(),
            "custom_prompt": "Focus on practical applications and include recent developments"
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        content_response = response.json()
        assert content_response["content_type"] == "blog"
        assert "id" in content_response
        assert "title" in content_response
        assert "content" in content_response
        
        content_id = content_response["id"]
        
        # Verify content contains relevant information
        content_text = content_response["content"].lower()
        assert any(keyword in content_text for keyword in ["artificial intelligence", "machine learning", "ai", "ml"])
        
        # Step 2: Retrieve generated content
        response = client.get(f"/api/v1/content/{content_id}", headers=auth_headers)
        assert response.status_code == 200
        
        retrieved_content = response.json()
        assert retrieved_content["id"] == content_id
        assert retrieved_content["title"] == content_response["title"]
        assert retrieved_content["content"] == content_response["content"]
        
        # Verify metadata
        metadata = retrieved_content["metadata"]
        assert "source_keywords" in metadata
        assert "posts_analyzed" in metadata
        assert "data_period" in metadata
        assert metadata["posts_analyzed"] > 0
        
        # Step 3: List user's generated content
        response = client.get("/api/v1/content", headers=auth_headers)
        assert response.status_code == 200
        
        content_list = response.json()
        assert content_list["total"] >= 1
        
        # Find our generated content in the list
        our_content = next((c for c in content_list["content"] if c["id"] == content_id), None)
        assert our_content is not None
        assert our_content["content_type"] == "blog"
        
        # Step 4: Generate analytics on the content
        response = client.get("/api/v1/content/statistics", headers=auth_headers)
        assert response.status_code == 200
        
        stats = response.json()
        assert stats["total_content"] >= 1
        assert "blog" in stats["content_by_type"]
        assert stats["content_by_type"]["blog"] >= 1
        
        # Step 5: Update content (if endpoint exists)
        # This would be a future enhancement
        
        # Step 6: Export or share content (if endpoint exists)
        # This would be a future enhancement
    
    def test_product_introduction_generation_workflow(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict):
        """Test complete workflow for product introduction content generation."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Generate product introduction content
        content_request = {
            "content_type": "product_intro",
            "keyword_ids": [keywords[0].id],  # AI keyword
            "custom_prompt": "Create a compelling product introduction for an AI-powered analytics platform"
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        content_response = response.json()
        assert content_response["content_type"] == "product_intro"
        
        # Verify product introduction characteristics
        content_text = content_response["content"].lower()
        marketing_keywords = ["solution", "benefit", "feature", "advantage", "innovation", "transform"]
        assert any(keyword in content_text for keyword in marketing_keywords)
        
        # Verify metadata includes marketing-specific information
        metadata = content_response["metadata"]
        if "marketing_points" in metadata:
            assert len(metadata["marketing_points"]) > 0
    
    def test_trend_analysis_generation_workflow(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict):
        """Test complete workflow for trend analysis content generation."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Generate trend analysis content
        content_request = {
            "content_type": "trend_analysis",
            "keyword_ids": [kw.id for kw in keywords],  # All keywords
            "date_from": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "date_to": datetime.utcnow().isoformat()
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        content_response = response.json()
        assert content_response["content_type"] == "trend_analysis"
        
        # Verify trend analysis characteristics
        content_text = content_response["content"].lower()
        analysis_keywords = ["trend", "analysis", "data", "insight", "pattern", "growth", "increase", "decrease"]
        assert any(keyword in content_text for keyword in analysis_keywords)
        
        # Verify comprehensive analysis metadata
        metadata = content_response["metadata"]
        assert metadata["posts_analyzed"] >= 5  # Should analyze multiple posts
        assert len(metadata["source_keywords"]) == 3  # All three keywords
    
    def test_content_generation_with_insufficient_data(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test content generation workflow when there's insufficient data."""
        
        # Create keyword with no posts
        empty_keyword = Keyword(
            user_id=test_user.id,
            keyword="empty keyword",
            description="Keyword with no posts",
            is_active=True
        )
        db_session.add(empty_keyword)
        db_session.commit()
        db_session.refresh(empty_keyword)
        
        # Try to generate content
        content_request = {
            "content_type": "blog",
            "keyword_ids": [empty_keyword.id]
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        
        # Should still succeed but with limited content
        assert response.status_code == 201
        
        content_response = response.json()
        metadata = content_response["metadata"]
        assert metadata["posts_analyzed"] == 0
        
        # Content should acknowledge limited data
        content_text = content_response["content"].lower()
        assert any(phrase in content_text for phrase in ["limited data", "no recent posts", "insufficient information"])
    
    def test_bulk_content_generation_workflow(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict):
        """Test generating multiple pieces of content in sequence."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Generate multiple types of content
        content_requests = [
            {
                "content_type": "blog",
                "keyword_ids": [keywords[0].id],
                "custom_prompt": "Technical deep dive"
            },
            {
                "content_type": "product_intro",
                "keyword_ids": [keywords[1].id],
                "custom_prompt": "Marketing focused"
            },
            {
                "content_type": "trend_analysis",
                "keyword_ids": [keywords[2].id],
                "custom_prompt": "Data-driven insights"
            }
        ]
        
        generated_content_ids = []
        
        for content_request in content_requests:
            response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
            assert response.status_code == 201
            
            content_response = response.json()
            generated_content_ids.append(content_response["id"])
            
            # Verify each content type has appropriate characteristics
            content_type = content_response["content_type"]
            content_text = content_response["content"].lower()
            
            if content_type == "blog":
                assert any(word in content_text for word in ["tutorial", "guide", "how to", "technical"])
            elif content_type == "product_intro":
                assert any(word in content_text for word in ["solution", "product", "benefit"])
            elif content_type == "trend_analysis":
                assert any(word in content_text for word in ["trend", "analysis", "data"])
        
        # Verify all content was created
        response = client.get("/api/v1/content", headers=auth_headers)
        assert response.status_code == 200
        
        content_list = response.json()
        assert content_list["total"] >= 3
        
        # Verify content statistics
        response = client.get("/api/v1/content/statistics", headers=auth_headers)
        assert response.status_code == 200
        
        stats = response.json()
        assert stats["total_content"] >= 3
        assert stats["content_by_type"]["blog"] >= 1
        assert stats["content_by_type"]["product_intro"] >= 1
        assert stats["content_by_type"]["trend_analysis"] >= 1
    
    def test_content_generation_with_date_filtering(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict, db_session: Session):
        """Test content generation with specific date range filtering."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Add some older posts
        old_post = Post(
            keyword_id=keywords[0].id,
            reddit_id="old_post_123",
            title="Old AI Discussion",
            content="This is an old post about AI from last month",
            score=50,
            num_comments=5,
            created_utc=datetime.utcnow() - timedelta(days=30)
        )
        db_session.add(old_post)
        db_session.commit()
        
        # Generate content with recent date filter
        recent_date_from = (datetime.utcnow() - timedelta(days=3)).isoformat()
        recent_date_to = datetime.utcnow().isoformat()
        
        content_request = {
            "content_type": "trend_analysis",
            "keyword_ids": [keywords[0].id],
            "date_from": recent_date_from,
            "date_to": recent_date_to
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        content_response = response.json()
        metadata = content_response["metadata"]
        
        # Verify date filtering worked
        assert metadata["data_period"]["from"] == recent_date_from
        assert metadata["data_period"]["to"] == recent_date_to
        
        # Should analyze fewer posts due to date filtering
        recent_posts_count = metadata["posts_analyzed"]
        
        # Generate content with wider date range
        wide_date_from = (datetime.utcnow() - timedelta(days=35)).isoformat()
        
        content_request["date_from"] = wide_date_from
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        wide_content_response = response.json()
        wide_metadata = wide_content_response["metadata"]
        
        # Should analyze more posts with wider date range
        wide_posts_count = wide_metadata["posts_analyzed"]
        assert wide_posts_count > recent_posts_count
    
    def test_content_generation_error_recovery_workflow(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict):
        """Test content generation workflow with error handling and recovery."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Test with invalid content type
        invalid_request = {
            "content_type": "invalid_type",
            "keyword_ids": [keywords[0].id]
        }
        
        response = client.post("/api/v1/content/generate", json=invalid_request, headers=auth_headers)
        assert response.status_code == 400
        
        error_response = response.json()
        assert "Invalid content type" in error_response["detail"]
        
        # Test with non-existent keyword
        nonexistent_request = {
            "content_type": "blog",
            "keyword_ids": [99999]
        }
        
        response = client.post("/api/v1/content/generate", json=nonexistent_request, headers=auth_headers)
        assert response.status_code == 400
        
        error_response = response.json()
        assert "No valid keywords found" in error_response["detail"]
        
        # Test successful generation after errors
        valid_request = {
            "content_type": "blog",
            "keyword_ids": [keywords[0].id]
        }
        
        response = client.post("/api/v1/content/generate", json=valid_request, headers=auth_headers)
        assert response.status_code == 201
        
        # Verify the system recovered and generated content successfully
        content_response = response.json()
        assert "id" in content_response
        assert content_response["content_type"] == "blog"
    
    def test_content_management_workflow(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict, db_session: Session):
        """Test complete content management workflow including CRUD operations."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Step 1: Generate initial content
        content_request = {
            "content_type": "blog",
            "keyword_ids": [keywords[0].id],
            "custom_prompt": "Initial version"
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        content_id = response.json()["id"]
        
        # Step 2: Retrieve content
        response = client.get(f"/api/v1/content/{content_id}", headers=auth_headers)
        assert response.status_code == 200
        
        original_content = response.json()
        
        # Step 3: List all content
        response = client.get("/api/v1/content", headers=auth_headers)
        assert response.status_code == 200
        
        content_list = response.json()
        assert any(c["id"] == content_id for c in content_list["content"])
        
        # Step 4: Filter content by type
        response = client.get("/api/v1/content?content_type=blog", headers=auth_headers)
        assert response.status_code == 200
        
        filtered_content = response.json()
        assert all(c["content_type"] == "blog" for c in filtered_content["content"])
        
        # Step 5: Generate additional content for comparison
        comparison_request = {
            "content_type": "product_intro",
            "keyword_ids": [keywords[1].id]
        }
        
        response = client.post("/api/v1/content/generate", json=comparison_request, headers=auth_headers)
        assert response.status_code == 201
        
        comparison_id = response.json()["id"]
        
        # Step 6: Verify content statistics
        response = client.get("/api/v1/content/statistics", headers=auth_headers)
        assert response.status_code == 200
        
        stats = response.json()
        assert stats["total_content"] >= 2
        assert stats["content_by_type"]["blog"] >= 1
        assert stats["content_by_type"]["product_intro"] >= 1
        
        # Step 7: Delete content
        response = client.delete(f"/api/v1/content/{comparison_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Step 8: Verify deletion
        response = client.get(f"/api/v1/content/{comparison_id}", headers=auth_headers)
        assert response.status_code == 404
        
        # Step 9: Verify original content still exists
        response = client.get(f"/api/v1/content/{content_id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Step 10: Update statistics after deletion
        response = client.get("/api/v1/content/statistics", headers=auth_headers)
        assert response.status_code == 200
        
        updated_stats = response.json()
        assert updated_stats["total_content"] == stats["total_content"] - 1
    
    def test_content_generation_with_analytics_integration(self, client: TestClient, auth_headers: dict, test_user: User, sample_crawled_data: dict):
        """Test content generation workflow integrated with analytics data."""
        
        keywords = sample_crawled_data["keywords"]
        
        # Step 1: Get analytics data first
        response = client.get("/api/v1/analytics/trends", headers=auth_headers)
        assert response.status_code == 200
        
        trends_data = response.json()
        
        # Step 2: Generate content based on trending keywords
        trending_keyword_ids = [kw["keyword_id"] for kw in trends_data["keywords"][:2]]
        
        content_request = {
            "content_type": "trend_analysis",
            "keyword_ids": trending_keyword_ids,
            "custom_prompt": "Focus on the most trending topics and their implications"
        }
        
        response = client.post("/api/v1/content/generate", json=content_request, headers=auth_headers)
        assert response.status_code == 201
        
        content_response = response.json()
        
        # Step 3: Verify content incorporates trending data
        content_text = content_response["content"].lower()
        assert any(word in content_text for word in ["trending", "popular", "rising", "growth"])
        
        # Step 4: Get keyword-specific analytics
        for keyword_id in trending_keyword_ids:
            response = client.get(f"/api/v1/analytics/keywords/{keyword_id}/stats", headers=auth_headers)
            assert response.status_code == 200
            
            keyword_stats = response.json()
            
            # Generate keyword-specific content
            specific_request = {
                "content_type": "blog",
                "keyword_ids": [keyword_id],
                "custom_prompt": f"Deep dive into {keyword_stats['keyword']} with recent statistics"
            }
            
            response = client.post("/api/v1/content/generate", json=specific_request, headers=auth_headers)
            assert response.status_code == 201
            
            specific_content = response.json()
            
            # Verify content mentions the specific keyword
            specific_text = specific_content["content"].lower()
            assert keyword_stats["keyword"].lower() in specific_text
        
        # Step 5: Verify all generated content
        response = client.get("/api/v1/content", headers=auth_headers)
        assert response.status_code == 200
        
        all_content = response.json()
        assert all_content["total"] >= 3  # One trend analysis + at least 2 keyword-specific blogs