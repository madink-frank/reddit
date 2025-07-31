"""
Integration Tests for Keyword API Endpoints

Tests for keyword management API endpoints with database integration.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.keyword import Keyword


class TestKeywordEndpoints:
    """Integration test cases for keyword API endpoints."""
    
    def test_create_keyword_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test successful keyword creation via API."""
        keyword_data = {
            "keyword": "integration test",
            "description": "Test keyword for integration testing",
            "is_active": True
        }
        
        response = client.post(
            "/api/v1/keywords",
            json=keyword_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["keyword"] == "integration test"
        assert data["description"] == "Test keyword for integration testing"
        assert data["is_active"] is True
        assert data["user_id"] == test_user.id
        assert data["post_count"] == 0
        assert "id" in data
        assert "created_at" in data
    
    def test_create_keyword_unauthorized(self, client: TestClient):
        """Test keyword creation without authentication."""
        keyword_data = {
            "keyword": "unauthorized test",
            "description": "Should fail"
        }
        
        response = client.post("/api/v1/keywords", json=keyword_data)
        
        assert response.status_code == 403
    
    def test_create_keyword_duplicate(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test creating duplicate keyword."""
        keyword_data = {
            "keyword": test_keyword.keyword,
            "description": "Duplicate keyword"
        }
        
        response = client.post(
            "/api/v1/keywords",
            json=keyword_data,
            headers=auth_headers
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    
    def test_create_keyword_invalid_data(self, client: TestClient, auth_headers: dict):
        """Test keyword creation with invalid data."""
        # Empty keyword
        response = client.post(
            "/api/v1/keywords",
            json={"keyword": "", "description": "Empty keyword"},
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Missing keyword field
        response = client.post(
            "/api/v1/keywords",
            json={"description": "Missing keyword field"},
            headers=auth_headers
        )
        assert response.status_code == 422
    
    def test_get_keywords_success(self, client: TestClient, auth_headers: dict, multiple_test_keywords: list):
        """Test getting user's keywords."""
        response = client.get("/api/v1/keywords", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "keywords" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        
        assert data["total"] == len(multiple_test_keywords)
        assert len(data["keywords"]) == len(multiple_test_keywords)
        
        # Verify keyword data structure
        for keyword in data["keywords"]:
            assert "id" in keyword
            assert "keyword" in keyword
            assert "description" in keyword
            assert "is_active" in keyword
            assert "post_count" in keyword
            assert "created_at" in keyword
    
    def test_get_keywords_with_search(self, client: TestClient, auth_headers: dict, multiple_test_keywords: list):
        """Test getting keywords with search query."""
        response = client.get(
            "/api/v1/keywords?query=programming",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find keywords containing "programming"
        assert data["total"] >= 1
        for keyword in data["keywords"]:
            assert "programming" in keyword["keyword"].lower() or \
                   "programming" in (keyword["description"] or "").lower()
    
    def test_get_keywords_with_pagination(self, client: TestClient, auth_headers: dict, multiple_test_keywords: list):
        """Test keyword pagination."""
        # Get first page
        response = client.get(
            "/api/v1/keywords?page=1&page_size=2",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["keywords"]) <= 2
        assert data["total_pages"] >= 1
    
    def test_get_keywords_filter_active(self, client: TestClient, auth_headers: dict, multiple_test_keywords: list):
        """Test filtering keywords by active status."""
        # Get only active keywords
        response = client.get(
            "/api/v1/keywords?is_active=true",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for keyword in data["keywords"]:
            assert keyword["is_active"] is True
        
        # Get only inactive keywords
        response = client.get(
            "/api/v1/keywords?is_active=false",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for keyword in data["keywords"]:
            assert keyword["is_active"] is False
    
    def test_get_keyword_by_id_success(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test getting specific keyword by ID."""
        response = client.get(f"/api/v1/keywords/{test_keyword.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_keyword.id
        assert data["keyword"] == test_keyword.keyword
        assert data["description"] == test_keyword.description
        assert data["is_active"] == test_keyword.is_active
        assert "post_count" in data
    
    def test_get_keyword_by_id_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent keyword."""
        response = client.get("/api/v1/keywords/999", headers=auth_headers)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_get_keyword_unauthorized(self, client: TestClient, test_keyword: Keyword):
        """Test getting keyword without authentication."""
        response = client.get(f"/api/v1/keywords/{test_keyword.id}")
        
        assert response.status_code == 403
    
    def test_update_keyword_success(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test successful keyword update."""
        update_data = {
            "keyword": "updated keyword",
            "description": "Updated description",
            "is_active": False
        }
        
        response = client.put(
            f"/api/v1/keywords/{test_keyword.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_keyword.id
        assert data["keyword"] == "updated keyword"
        assert data["description"] == "Updated description"
        assert data["is_active"] is False
    
    def test_update_keyword_partial(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test partial keyword update."""
        update_data = {"description": "Only description updated"}
        
        response = client.put(
            f"/api/v1/keywords/{test_keyword.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_keyword.id
        assert data["keyword"] == test_keyword.keyword  # Unchanged
        assert data["description"] == "Only description updated"
        assert data["is_active"] == test_keyword.is_active  # Unchanged
    
    def test_update_keyword_not_found(self, client: TestClient, auth_headers: dict):
        """Test updating non-existent keyword."""
        update_data = {"keyword": "not found"}
        
        response = client.put(
            "/api/v1/keywords/999",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_update_keyword_duplicate(self, client: TestClient, auth_headers: dict, multiple_test_keywords: list):
        """Test updating keyword to duplicate name."""
        keyword1, keyword2 = multiple_test_keywords[:2]
        
        update_data = {"keyword": keyword2.keyword}
        
        response = client.put(
            f"/api/v1/keywords/{keyword1.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    
    def test_delete_keyword_success(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test successful keyword deletion."""
        response = client.delete(f"/api/v1/keywords/{test_keyword.id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify keyword is deleted
        get_response = client.get(f"/api/v1/keywords/{test_keyword.id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_keyword_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent keyword."""
        response = client.delete("/api/v1/keywords/999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_delete_keyword_unauthorized(self, client: TestClient, test_keyword: Keyword):
        """Test deleting keyword without authentication."""
        response = client.delete(f"/api/v1/keywords/{test_keyword.id}")
        
        assert response.status_code == 403
    
    def test_validate_keyword_success(self, client: TestClient, auth_headers: dict):
        """Test keyword validation endpoint."""
        response = client.post(
            "/api/v1/keywords/validate",
            json={"keyword": "valid new keyword"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] is True
        assert data["exists"] is False
        assert "valid" in data["message"].lower()
    
    def test_validate_keyword_existing(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test validating existing keyword."""
        response = client.post(
            "/api/v1/keywords/validate",
            json={"keyword": test_keyword.keyword},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] is False
        assert data["exists"] is True
        assert "already exists" in data["message"].lower()
    
    def test_validate_keyword_empty(self, client: TestClient, auth_headers: dict):
        """Test validating empty keyword."""
        response = client.post(
            "/api/v1/keywords/validate",
            json={"keyword": ""},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] is False
        assert data["exists"] is False
        assert "empty" in data["message"].lower()
    
    def test_bulk_create_keywords_success(self, client: TestClient, auth_headers: dict):
        """Test bulk keyword creation."""
        bulk_data = {
            "keywords": [
                {"keyword": "bulk1", "description": "Bulk keyword 1"},
                {"keyword": "bulk2", "description": "Bulk keyword 2"},
                {"keyword": "bulk3", "description": "Bulk keyword 3", "is_active": False}
            ]
        }
        
        response = client.post(
            "/api/v1/keywords/bulk",
            json=bulk_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert "created" in data
        assert "failed" in data
        assert "total_created" in data
        assert "total_failed" in data
        
        assert data["total_created"] == 3
        assert data["total_failed"] == 0
        assert len(data["created"]) == 3
        assert len(data["failed"]) == 0
    
    def test_bulk_create_keywords_partial_failure(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test bulk keyword creation with some failures."""
        bulk_data = {
            "keywords": [
                {"keyword": "bulk_success", "description": "Should succeed"},
                {"keyword": test_keyword.keyword, "description": "Should fail - duplicate"},
                {"keyword": "bulk_success2", "description": "Should succeed"}
            ]
        }
        
        response = client.post(
            "/api/v1/keywords/bulk",
            json=bulk_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["total_created"] == 2
        assert data["total_failed"] == 1
        assert len(data["created"]) == 2
        assert len(data["failed"]) == 1
        
        # Check failed keyword details
        failed_keyword = data["failed"][0]
        assert failed_keyword["keyword"] == test_keyword.keyword
        assert "already exists" in failed_keyword["error"]
    
    def test_get_keyword_stats(self, client: TestClient, auth_headers: dict, test_keyword: Keyword):
        """Test getting keyword statistics."""
        response = client.get(f"/api/v1/keywords/{test_keyword.id}/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "keyword_id" in data
        assert "keyword" in data
        assert "total_posts" in data
        assert "total_comments" in data
        assert "avg_score" in data
        assert "last_crawled" in data
        assert "trending_score" in data
        
        assert data["keyword_id"] == test_keyword.id
        assert data["keyword"] == test_keyword.keyword
    
    def test_cross_user_keyword_access(self, client: TestClient, test_user_2: User, test_keyword: Keyword, db_session: Session):
        """Test that users cannot access other users' keywords."""
        # Create token for second user
        from app.core.auth import TokenManager
        token_data = {
            "sub": str(test_user_2.id),
            "reddit_id": test_user_2.reddit_id,
            "username": test_user_2.username
        }
        user2_token = TokenManager.create_access_token(token_data)
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # Try to access first user's keyword
        response = client.get(f"/api/v1/keywords/{test_keyword.id}", headers=user2_headers)
        assert response.status_code == 404  # Should not find keyword belonging to other user
        
        # Try to update first user's keyword
        response = client.put(
            f"/api/v1/keywords/{test_keyword.id}",
            json={"keyword": "hacked"},
            headers=user2_headers
        )
        assert response.status_code == 404
        
        # Try to delete first user's keyword
        response = client.delete(f"/api/v1/keywords/{test_keyword.id}", headers=user2_headers)
        assert response.status_code == 404