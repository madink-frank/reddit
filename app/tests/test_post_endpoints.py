"""
Integration Tests for Post API Endpoints

Tests for post search and retrieval API endpoints with database integration.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.comment import Comment


class TestPostEndpoints:
    """Integration test cases for post API endpoints."""
    
    @pytest.fixture
    def sample_posts(self, db_session: Session, test_keyword: Keyword):
        """Create sample posts for testing."""
        posts = []
        base_time = datetime.utcnow() - timedelta(days=5)
        
        for i in range(10):
            post = Post(
                keyword_id=test_keyword.id,
                reddit_id=f"test_post_{i}",
                title=f"Test Post {i}",
                content=f"This is test post content {i}",
                author=f"author_{i}",
                subreddit="testsubreddit",
                url=f"https://reddit.com/r/test/post_{i}",
                score=10 + i * 5,
                num_comments=2 + i,
                created_utc=base_time + timedelta(hours=i * 2)
            )
            posts.append(post)
            db_session.add(post)
        
        db_session.commit()
        for post in posts:
            db_session.refresh(post)
        
        return posts
    
    @pytest.fixture
    def sample_comments(self, db_session: Session, sample_posts: list):
        """Create sample comments for testing."""
        comments = []
        
        for i, post in enumerate(sample_posts[:3]):  # Add comments to first 3 posts
            for j in range(3):
                comment = Comment(
                    post_id=post.id,
                    reddit_id=f"comment_{i}_{j}",
                    body=f"This is comment {j} on post {i}",
                    author=f"commenter_{j}",
                    score=1 + j,
                    created_utc=post.created_utc + timedelta(minutes=j * 10)
                )
                comments.append(comment)
                db_session.add(comment)
        
        db_session.commit()
        return comments
    
    def test_get_posts_success(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test getting posts with default parameters."""
        response = client.get("/api/v1/posts", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "posts" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        
        assert data["total"] == len(sample_posts)
        assert len(data["posts"]) <= 20  # Default page size
        
        # Verify post data structure
        for post in data["posts"]:
            assert "id" in post
            assert "title" in post
            assert "content" in post
            assert "author" in post
            assert "subreddit" in post
            assert "score" in post
            assert "num_comments" in post
            assert "created_utc" in post
            assert "url" in post
            assert "keyword" in post
    
    def test_get_posts_with_pagination(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test post pagination."""
        # Get first page
        response = client.get("/api/v1/posts?page=1&page_size=5", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["page_size"] == 5
        assert len(data["posts"]) == 5
        assert data["total"] == len(sample_posts)
        assert data["total_pages"] == 2  # 10 posts / 5 per page = 2 pages
        
        # Get second page
        response = client.get("/api/v1/posts?page=2&page_size=5", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 2
        assert len(data["posts"]) == 5
    
    def test_get_posts_with_search_query(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test searching posts by query."""
        response = client.get("/api/v1/posts?query=Test Post 5", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find the post with "Test Post 5" in title
        assert data["total"] >= 1
        found_post = next((p for p in data["posts"] if "Test Post 5" in p["title"]), None)
        assert found_post is not None
    
    def test_get_posts_with_keyword_filter(self, client: TestClient, auth_headers: dict, sample_posts: list, test_keyword: Keyword):
        """Test filtering posts by keyword."""
        response = client.get(f"/api/v1/posts?keyword_ids={test_keyword.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == len(sample_posts)
        for post in data["posts"]:
            assert post["keyword"]["id"] == test_keyword.id
    
    def test_get_posts_with_subreddit_filter(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test filtering posts by subreddit."""
        response = client.get("/api/v1/posts?subreddits=testsubreddit", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == len(sample_posts)
        for post in data["posts"]:
            assert post["subreddit"] == "testsubreddit"
    
    def test_get_posts_with_date_filter(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test filtering posts by date range."""
        # Filter for posts from last 3 days
        date_from = (datetime.utcnow() - timedelta(days=3)).isoformat()
        date_to = datetime.utcnow().isoformat()
        
        response = client.get(
            f"/api/v1/posts?date_from={date_from}&date_to={date_to}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find posts created within the date range
        assert data["total"] > 0
        for post in data["posts"]:
            post_date = datetime.fromisoformat(post["created_utc"].replace("Z", "+00:00"))
            assert post_date >= datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            assert post_date <= datetime.fromisoformat(date_to.replace("Z", "+00:00"))
    
    def test_get_posts_with_score_filter(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test filtering posts by minimum score."""
        response = client.get("/api/v1/posts?min_score=30", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find posts with score >= 30
        for post in data["posts"]:
            assert post["score"] >= 30
    
    def test_get_posts_with_sorting(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test sorting posts."""
        # Sort by score descending (default)
        response = client.get("/api/v1/posts?sort_by=score&sort_order=desc", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        posts = data["posts"]
        if len(posts) > 1:
            # Verify posts are sorted by score in descending order
            for i in range(len(posts) - 1):
                assert posts[i]["score"] >= posts[i + 1]["score"]
        
        # Sort by created_utc ascending
        response = client.get("/api/v1/posts?sort_by=created_utc&sort_order=asc", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        posts = data["posts"]
        if len(posts) > 1:
            # Verify posts are sorted by date in ascending order
            for i in range(len(posts) - 1):
                date1 = datetime.fromisoformat(posts[i]["created_utc"].replace("Z", "+00:00"))
                date2 = datetime.fromisoformat(posts[i + 1]["created_utc"].replace("Z", "+00:00"))
                assert date1 <= date2
    
    def test_get_post_by_id_success(self, client: TestClient, auth_headers: dict, sample_posts: list, sample_comments: list):
        """Test getting specific post by ID with comments."""
        post = sample_posts[0]
        response = client.get(f"/api/v1/posts/{post.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == post.id
        assert data["title"] == post.title
        assert data["content"] == post.content
        assert data["author"] == post.author
        assert data["subreddit"] == post.subreddit
        assert data["score"] == post.score
        assert data["num_comments"] == post.num_comments
        assert data["url"] == post.url
        
        # Should include comments
        assert "comments" in data
        assert len(data["comments"]) > 0
        
        # Verify comment structure
        for comment in data["comments"]:
            assert "id" in comment
            assert "body" in comment
            assert "author" in comment
            assert "score" in comment
            assert "created_utc" in comment
    
    def test_get_post_by_id_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent post."""
        response = client.get("/api/v1/posts/999", headers=auth_headers)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_get_post_unauthorized(self, client: TestClient, sample_posts: list):
        """Test getting post without authentication."""
        post = sample_posts[0]
        response = client.get(f"/api/v1/posts/{post.id}")
        
        assert response.status_code == 403
    
    def test_get_trending_posts(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test getting trending posts."""
        response = client.get("/api/v1/posts/trending", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "posts" in data
        assert "period" in data
        assert "total_analyzed" in data
        
        # Verify trending posts are sorted by trending score
        posts = data["posts"]
        if len(posts) > 1:
            for i in range(len(posts) - 1):
                assert posts[i]["trending_score"] >= posts[i + 1]["trending_score"]
        
        # Verify trending post structure
        for post in posts:
            assert "trending_score" in post
            assert "age_hours" in post
            assert post["age_hours"] <= 24  # Default trending period
    
    def test_get_trending_posts_with_params(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test getting trending posts with custom parameters."""
        response = client.get(
            "/api/v1/posts/trending?hours=48&limit=5",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["period"]["hours"] == 48
        assert len(data["posts"]) <= 5
        
        for post in data["posts"]:
            assert post["age_hours"] <= 48
    
    def test_get_posts_analytics(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test getting post analytics."""
        response = client.get("/api/v1/posts/analytics", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_posts" in data
        assert "avg_score" in data
        assert "avg_comments" in data
        assert "subreddit_distribution" in data
        assert "daily_trends" in data
        assert "engagement_stats" in data
        
        assert data["total_posts"] == len(sample_posts)
        assert data["avg_score"] > 0
        assert len(data["subreddit_distribution"]) > 0
    
    def test_get_posts_analytics_with_filters(self, client: TestClient, auth_headers: dict, sample_posts: list, test_keyword: Keyword):
        """Test getting post analytics with filters."""
        response = client.get(
            f"/api/v1/posts/analytics?keyword_ids={test_keyword.id}&days=7",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "period" in data
        assert data["period"]["days"] == 7
        assert data["total_posts"] == len(sample_posts)
    
    def test_search_posts_advanced(self, client: TestClient, auth_headers: dict, sample_posts: list):
        """Test advanced post search functionality."""
        search_data = {
            "query": "test",
            "keyword_ids": [],
            "subreddits": ["testsubreddit"],
            "min_score": 15,
            "max_score": 35,
            "date_from": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "date_to": datetime.utcnow().isoformat(),
            "sort_by": "score",
            "sort_order": "desc",
            "page": 1,
            "page_size": 10
        }
        
        response = client.post("/api/v1/posts/search", json=search_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "posts" in data
        assert "total" in data
        assert "search_params" in data
        
        # Verify search results match criteria
        for post in data["posts"]:
            assert post["subreddit"] == "testsubreddit"
            assert 15 <= post["score"] <= 35
            assert "test" in post["title"].lower() or "test" in (post["content"] or "").lower()
    
    def test_get_post_comments(self, client: TestClient, auth_headers: dict, sample_posts: list, sample_comments: list):
        """Test getting comments for a specific post."""
        post = sample_posts[0]
        response = client.get(f"/api/v1/posts/{post.id}/comments", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "comments" in data
        assert "total" in data
        assert "post_id" in data
        
        assert data["post_id"] == post.id
        assert data["total"] > 0
        
        # Verify comment structure
        for comment in data["comments"]:
            assert "id" in comment
            assert "body" in comment
            assert "author" in comment
            assert "score" in comment
            assert "created_utc" in comment
    
    def test_get_post_comments_with_pagination(self, client: TestClient, auth_headers: dict, sample_posts: list, sample_comments: list):
        """Test paginated comment retrieval."""
        post = sample_posts[0]
        response = client.get(
            f"/api/v1/posts/{post.id}/comments?page=1&page_size=2",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["comments"]) <= 2
    
    def test_cross_user_post_access(self, client: TestClient, test_user_2: User, sample_posts: list, db_session: Session):
        """Test that users can access posts from other users' keywords (posts are public)."""
        # Create token for second user
        from app.core.auth import TokenManager
        token_data = {
            "sub": str(test_user_2.id),
            "reddit_id": test_user_2.reddit_id,
            "username": test_user_2.username
        }
        user2_token = TokenManager.create_access_token(token_data)
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User 2 should be able to see posts (posts are public)
        response = client.get("/api/v1/posts", headers=user2_headers)
        assert response.status_code == 200
        
        # User 2 should be able to see specific post
        post = sample_posts[0]
        response = client.get(f"/api/v1/posts/{post.id}", headers=user2_headers)
        assert response.status_code == 200
    
    def test_get_posts_empty_result(self, client: TestClient, auth_headers: dict):
        """Test getting posts when no posts exist."""
        # Search for non-existent content
        response = client.get("/api/v1/posts?query=nonexistentcontent12345", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 0
        assert len(data["posts"]) == 0
        assert data["page"] == 1
        assert data["total_pages"] == 0
    
    def test_get_posts_invalid_parameters(self, client: TestClient, auth_headers: dict):
        """Test getting posts with invalid parameters."""
        # Invalid page number
        response = client.get("/api/v1/posts?page=0", headers=auth_headers)
        assert response.status_code == 422
        
        # Invalid page size
        response = client.get("/api/v1/posts?page_size=0", headers=auth_headers)
        assert response.status_code == 422
        
        # Invalid date format
        response = client.get("/api/v1/posts?date_from=invalid-date", headers=auth_headers)
        assert response.status_code == 422