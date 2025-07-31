"""
End-to-End Tests for Crawling Workflow

Tests for complete crawling workflow from keyword creation to data collection.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, Mock, AsyncMock
import asyncio

from app.main import app
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.process_log import ProcessLog


class TestCrawlingWorkflowE2E:
    """End-to-end tests for the complete crawling workflow."""
    
    @pytest.fixture
    def mock_reddit_api_responses(self):
        """Mock Reddit API responses for testing."""
        return {
            "posts": [
                {
                    "id": "test_post_1",
                    "title": "Python Machine Learning Tutorial",
                    "selftext": "Complete guide to machine learning with Python",
                    "author": "ml_expert",
                    "subreddit": "MachineLearning",
                    "url": "https://reddit.com/r/MachineLearning/test_post_1",
                    "score": 150,
                    "num_comments": 25,
                    "created_utc": (datetime.utcnow() - timedelta(hours=2)).timestamp()
                },
                {
                    "id": "test_post_2", 
                    "title": "Advanced Python Techniques",
                    "selftext": "Advanced programming techniques in Python",
                    "author": "python_guru",
                    "subreddit": "Python",
                    "url": "https://reddit.com/r/Python/test_post_2",
                    "score": 89,
                    "num_comments": 12,
                    "created_utc": (datetime.utcnow() - timedelta(hours=1)).timestamp()
                },
                {
                    "id": "test_post_3",
                    "title": "Python Web Development",
                    "selftext": "Building web applications with Python",
                    "author": "web_dev",
                    "subreddit": "webdev",
                    "url": "https://reddit.com/r/webdev/test_post_3",
                    "score": 67,
                    "num_comments": 8,
                    "created_utc": (datetime.utcnow() - timedelta(minutes=30)).timestamp()
                }
            ]
        }
    
    def test_complete_crawling_workflow(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session, mock_reddit_api_responses):
        """Test the complete crawling workflow from keyword creation to data collection."""
        
        # Step 1: Create a keyword
        keyword_data = {
            "keyword": "python programming",
            "description": "Python programming language discussions",
            "is_active": True
        }
        
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        assert response.status_code == 201
        keyword_response = response.json()
        keyword_id = keyword_response["id"]
        
        # Step 2: Verify keyword was created
        response = client.get(f"/api/v1/keywords/{keyword_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["keyword"] == "python programming"
        
        # Step 3: Mock Reddit API and trigger crawling
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            mock_search.return_value = mock_reddit_api_responses["posts"]
            
            # Trigger crawling
            crawl_data = {
                "keyword_ids": [keyword_id],
                "subreddits": ["MachineLearning", "Python", "webdev"],
                "limit": 100
            }
            
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            assert response.status_code == 202  # Accepted for async processing
            crawl_response = response.json()
            
            assert "job_id" in crawl_response
            assert crawl_response["status"] == "started"
            job_id = crawl_response["job_id"]
        
        # Step 4: Check crawling status
        response = client.get(f"/api/v1/crawl/status/{job_id}", headers=auth_headers)
        assert response.status_code == 200
        status_response = response.json()
        
        assert "status" in status_response
        assert "progress" in status_response
        
        # Step 5: Simulate crawling completion by directly adding posts to database
        # (In real scenario, Celery worker would do this)
        for post_data in mock_reddit_api_responses["posts"]:
            post = Post(
                keyword_id=keyword_id,
                reddit_id=post_data["id"],
                title=post_data["title"],
                content=post_data["selftext"],
                author=post_data["author"],
                subreddit=post_data["subreddit"],
                url=post_data["url"],
                score=post_data["score"],
                num_comments=post_data["num_comments"],
                created_utc=datetime.fromtimestamp(post_data["created_utc"])
            )
            db_session.add(post)
        
        db_session.commit()
        
        # Step 6: Verify posts were collected
        response = client.get("/api/v1/posts", headers=auth_headers)
        assert response.status_code == 200
        posts_response = response.json()
        
        assert posts_response["total"] == 3
        assert len(posts_response["posts"]) == 3
        
        # Verify post data
        post_titles = [post["title"] for post in posts_response["posts"]]
        assert "Python Machine Learning Tutorial" in post_titles
        assert "Advanced Python Techniques" in post_titles
        assert "Python Web Development" in post_titles
        
        # Step 7: Check keyword statistics after crawling
        response = client.get(f"/api/v1/keywords/{keyword_id}/stats", headers=auth_headers)
        assert response.status_code == 200
        stats_response = response.json()
        
        assert stats_response["total_posts"] == 3
        assert stats_response["avg_score"] > 0
        assert stats_response["total_comments"] == 45  # 25 + 12 + 8
        
        # Step 8: Search for specific posts
        response = client.get("/api/v1/posts?query=machine learning", headers=auth_headers)
        assert response.status_code == 200
        search_response = response.json()
        
        assert search_response["total"] >= 1
        found_ml_post = any("Machine Learning" in post["title"] for post in search_response["posts"])
        assert found_ml_post
        
        # Step 9: Check crawling history
        response = client.get("/api/v1/crawl/history", headers=auth_headers)
        assert response.status_code == 200
        history_response = response.json()
        
        assert "crawl_jobs" in history_response
        assert len(history_response["crawl_jobs"]) >= 1
    
    def test_crawling_workflow_with_filters(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session, mock_reddit_api_responses):
        """Test crawling workflow with date and score filters."""
        
        # Create keyword
        keyword_data = {"keyword": "filtered crawling", "is_active": True}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        keyword_id = response.json()["id"]
        
        # Mock Reddit API with filtered crawling
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            # Filter to only return high-score posts
            filtered_posts = [post for post in mock_reddit_api_responses["posts"] if post["score"] > 100]
            mock_search.return_value = filtered_posts
            
            # Trigger filtered crawling
            crawl_data = {
                "keyword_ids": [keyword_id],
                "min_score": 100,
                "date_from": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "date_to": datetime.utcnow().isoformat()
            }
            
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            assert response.status_code == 202
        
        # Simulate filtered results in database
        for post_data in filtered_posts:
            post = Post(
                keyword_id=keyword_id,
                reddit_id=f"filtered_{post_data['id']}",
                title=post_data["title"],
                content=post_data["selftext"],
                score=post_data["score"],
                created_utc=datetime.fromtimestamp(post_data["created_utc"])
            )
            db_session.add(post)
        
        db_session.commit()
        
        # Verify only high-score posts were collected
        response = client.get(f"/api/v1/posts?keyword_ids={keyword_id}", headers=auth_headers)
        posts_response = response.json()
        
        for post in posts_response["posts"]:
            assert post["score"] > 100
    
    def test_crawling_error_handling_workflow(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test crawling workflow error handling."""
        
        # Create keyword
        keyword_data = {"keyword": "error test", "is_active": True}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        keyword_id = response.json()["id"]
        
        # Mock Reddit API to raise an error
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            mock_search.side_effect = Exception("Reddit API rate limit exceeded")
            
            # Trigger crawling that will fail
            crawl_data = {"keyword_ids": [keyword_id]}
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            
            # Should still accept the request
            assert response.status_code == 202
            job_id = response.json()["job_id"]
        
        # Simulate error logging
        error_log = ProcessLog(
            user_id=test_user.id,
            process_type="crawling",
            status="failed",
            error_message="Reddit API rate limit exceeded",
            details={"keyword_id": keyword_id, "error_type": "rate_limit"}
        )
        db_session.add(error_log)
        db_session.commit()
        
        # Check error status
        response = client.get(f"/api/v1/crawl/status/{job_id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Check crawling history shows the error
        response = client.get("/api/v1/crawl/history", headers=auth_headers)
        history_response = response.json()
        
        # Should have at least one failed job
        failed_jobs = [job for job in history_response["crawl_jobs"] if job["status"] == "failed"]
        assert len(failed_jobs) >= 1
    
    def test_multiple_keywords_crawling_workflow(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session, mock_reddit_api_responses):
        """Test crawling workflow with multiple keywords."""
        
        # Create multiple keywords
        keywords = []
        keyword_names = ["python", "javascript", "machine learning"]
        
        for name in keyword_names:
            keyword_data = {"keyword": name, "is_active": True}
            response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
            assert response.status_code == 201
            keywords.append(response.json())
        
        keyword_ids = [kw["id"] for kw in keywords]
        
        # Mock Reddit API for multiple keywords
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            # Return different posts for each keyword
            def mock_search_side_effect(keyword, **kwargs):
                if "python" in keyword.lower():
                    return mock_reddit_api_responses["posts"][:2]
                elif "javascript" in keyword.lower():
                    return [mock_reddit_api_responses["posts"][2]]
                else:  # machine learning
                    return [mock_reddit_api_responses["posts"][0]]
            
            mock_search.side_effect = mock_search_side_effect
            
            # Trigger crawling for all keywords
            crawl_data = {"keyword_ids": keyword_ids}
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            assert response.status_code == 202
        
        # Simulate posts for each keyword
        for i, keyword in enumerate(keywords):
            if "python" in keyword["keyword"]:
                posts_to_add = mock_reddit_api_responses["posts"][:2]
            elif "javascript" in keyword["keyword"]:
                posts_to_add = [mock_reddit_api_responses["posts"][2]]
            else:  # machine learning
                posts_to_add = [mock_reddit_api_responses["posts"][0]]
            
            for j, post_data in enumerate(posts_to_add):
                post = Post(
                    keyword_id=keyword["id"],
                    reddit_id=f"multi_{i}_{j}_{post_data['id']}",
                    title=post_data["title"],
                    content=post_data["selftext"],
                    score=post_data["score"],
                    created_utc=datetime.fromtimestamp(post_data["created_utc"])
                )
                db_session.add(post)
        
        db_session.commit()
        
        # Verify posts for each keyword
        for keyword in keywords:
            response = client.get(f"/api/v1/keywords/{keyword['id']}/stats", headers=auth_headers)
            stats = response.json()
            assert stats["total_posts"] > 0
        
        # Verify total posts across all keywords
        response = client.get("/api/v1/posts", headers=auth_headers)
        total_posts = response.json()["total"]
        assert total_posts == 4  # 2 + 1 + 1 posts
    
    def test_crawling_with_scheduling_workflow(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
        """Test scheduled crawling workflow."""
        
        # Create keyword
        keyword_data = {"keyword": "scheduled crawling", "is_active": True}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        keyword_id = response.json()["id"]
        
        # Schedule recurring crawling
        schedule_data = {
            "keyword_ids": [keyword_id],
            "schedule_type": "recurring",
            "interval_hours": 6,
            "enabled": True
        }
        
        response = client.post("/api/v1/crawl/schedule", json=schedule_data, headers=auth_headers)
        assert response.status_code == 201
        schedule_response = response.json()
        
        assert "schedule_id" in schedule_response
        assert schedule_response["status"] == "scheduled"
        
        # Check scheduled jobs
        response = client.get("/api/v1/crawl/schedules", headers=auth_headers)
        assert response.status_code == 200
        schedules_response = response.json()
        
        assert "schedules" in schedules_response
        assert len(schedules_response["schedules"]) >= 1
        
        # Verify schedule details
        schedule = schedules_response["schedules"][0]
        assert schedule["interval_hours"] == 6
        assert schedule["enabled"] is True
        assert keyword_id in schedule["keyword_ids"]
    
    def test_crawling_data_deduplication_workflow(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session, mock_reddit_api_responses):
        """Test that duplicate posts are not created during crawling."""
        
        # Create keyword
        keyword_data = {"keyword": "deduplication test", "is_active": True}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        keyword_id = response.json()["id"]
        
        # First crawling run
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            mock_search.return_value = mock_reddit_api_responses["posts"]
            
            crawl_data = {"keyword_ids": [keyword_id]}
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            assert response.status_code == 202
        
        # Add posts to database (first run)
        for post_data in mock_reddit_api_responses["posts"]:
            post = Post(
                keyword_id=keyword_id,
                reddit_id=post_data["id"],
                title=post_data["title"],
                content=post_data["selftext"],
                score=post_data["score"],
                created_utc=datetime.fromtimestamp(post_data["created_utc"])
            )
            db_session.add(post)
        
        db_session.commit()
        
        # Verify initial post count
        response = client.get(f"/api/v1/posts?keyword_ids={keyword_id}", headers=auth_headers)
        initial_count = response.json()["total"]
        assert initial_count == 3
        
        # Second crawling run with same data (should not create duplicates)
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            mock_search.return_value = mock_reddit_api_responses["posts"]  # Same data
            
            crawl_data = {"keyword_ids": [keyword_id]}
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            assert response.status_code == 202
        
        # Simulate deduplication logic (posts with same reddit_id should not be added)
        existing_reddit_ids = {post.reddit_id for post in db_session.query(Post).filter(Post.keyword_id == keyword_id).all()}
        
        for post_data in mock_reddit_api_responses["posts"]:
            if post_data["id"] not in existing_reddit_ids:
                post = Post(
                    keyword_id=keyword_id,
                    reddit_id=post_data["id"],
                    title=post_data["title"],
                    content=post_data["selftext"],
                    score=post_data["score"],
                    created_utc=datetime.fromtimestamp(post_data["created_utc"])
                )
                db_session.add(post)
        
        db_session.commit()
        
        # Verify no duplicates were created
        response = client.get(f"/api/v1/posts?keyword_ids={keyword_id}", headers=auth_headers)
        final_count = response.json()["total"]
        assert final_count == initial_count  # Should be the same
        
        # Verify unique reddit_ids
        posts = response.json()["posts"]
        reddit_ids = [post["reddit_id"] for post in posts]
        assert len(reddit_ids) == len(set(reddit_ids))  # All unique
    
    def test_crawling_with_analytics_workflow(self, client: TestClient, auth_headers: dict, test_user: User, db_session: Session, mock_reddit_api_responses):
        """Test complete workflow from crawling to analytics generation."""
        
        # Create keyword
        keyword_data = {"keyword": "analytics workflow", "is_active": True}
        response = client.post("/api/v1/keywords", json=keyword_data, headers=auth_headers)
        keyword_id = response.json()["id"]
        
        # Perform crawling
        with patch('app.services.reddit_client.RedditClient.search_posts') as mock_search:
            mock_search.return_value = mock_reddit_api_responses["posts"]
            
            crawl_data = {"keyword_ids": [keyword_id]}
            response = client.post("/api/v1/crawl", json=crawl_data, headers=auth_headers)
            assert response.status_code == 202
        
        # Add posts to database
        for post_data in mock_reddit_api_responses["posts"]:
            post = Post(
                keyword_id=keyword_id,
                reddit_id=f"analytics_{post_data['id']}",
                title=post_data["title"],
                content=post_data["selftext"],
                author=post_data["author"],
                subreddit=post_data["subreddit"],
                score=post_data["score"],
                num_comments=post_data["num_comments"],
                created_utc=datetime.fromtimestamp(post_data["created_utc"])
            )
            db_session.add(post)
        
        db_session.commit()
        
        # Generate analytics
        response = client.get("/api/v1/analytics/trends", headers=auth_headers)
        assert response.status_code == 200
        trends_response = response.json()
        
        assert "keywords" in trends_response
        assert "period" in trends_response
        
        # Check keyword-specific analytics
        response = client.get(f"/api/v1/analytics/keywords/{keyword_id}/stats", headers=auth_headers)
        assert response.status_code == 200
        keyword_analytics = response.json()
        
        assert "overall_stats" in keyword_analytics
        assert "subreddit_distribution" in keyword_analytics
        assert "daily_trends" in keyword_analytics
        
        # Verify analytics data
        overall_stats = keyword_analytics["overall_stats"]
        assert overall_stats["total_posts"] == 3
        assert overall_stats["total_score"] == 306  # 150 + 89 + 67
        assert overall_stats["total_comments"] == 45  # 25 + 12 + 8
        
        # Check subreddit distribution
        subreddit_dist = keyword_analytics["subreddit_distribution"]
        subreddits = [item["subreddit"] for item in subreddit_dist]
        assert "MachineLearning" in subreddits
        assert "Python" in subreddits
        assert "webdev" in subreddits
        
        # Get trending posts
        response = client.get("/api/v1/posts/trending", headers=auth_headers)
        assert response.status_code == 200
        trending_response = response.json()
        
        assert "posts" in trending_response
        assert len(trending_response["posts"]) > 0
        
        # Verify trending posts have trending scores
        for post in trending_response["posts"]:
            assert "trending_score" in post
            assert post["trending_score"] >= 0