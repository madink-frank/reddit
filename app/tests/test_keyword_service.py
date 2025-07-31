"""
Tests for Keyword Service

Unit tests for keyword business logic operations.
"""

import pytest
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.keyword_service import KeywordService
from app.schemas.keyword import KeywordCreate, KeywordUpdate, KeywordSearchRequest
from app.models.user import User
from app.models.keyword import Keyword


class TestKeywordService:
    """Test cases for KeywordService."""
    
    def test_create_keyword_success(self, db_session: Session, test_user: User):
        """Test successful keyword creation."""
        service = KeywordService(db_session)
        keyword_data = KeywordCreate(
            keyword="test keyword",
            description="Test description",
            is_active=True
        )
        
        result = service.create_keyword(test_user, keyword_data)
        
        assert result.keyword == "test keyword"
        assert result.description == "Test description"
        assert result.is_active is True
        assert result.user_id == test_user.id
        assert result.post_count == 0
    
    def test_create_keyword_duplicate(self, db_session: Session, test_user: User):
        """Test creating duplicate keyword raises exception."""
        service = KeywordService(db_session)
        keyword_data = KeywordCreate(keyword="duplicate", description="Test")
        
        # Create first keyword
        service.create_keyword(test_user, keyword_data)
        
        # Try to create duplicate
        with pytest.raises(HTTPException) as exc_info:
            service.create_keyword(test_user, keyword_data)
        
        assert exc_info.value.status_code == 409
        assert "already exists" in str(exc_info.value.detail)
    
    def test_get_keyword_success(self, db_session: Session, test_user: User):
        """Test successful keyword retrieval."""
        service = KeywordService(db_session)
        
        # Create keyword first
        keyword_data = KeywordCreate(keyword="get test", description="Test")
        created = service.create_keyword(test_user, keyword_data)
        
        # Retrieve keyword
        result = service.get_keyword(test_user, created.id)
        
        assert result.id == created.id
        assert result.keyword == "get test"
        assert result.user_id == test_user.id
    
    def test_get_keyword_not_found(self, db_session: Session, test_user: User):
        """Test getting non-existent keyword raises exception."""
        service = KeywordService(db_session)
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_keyword(test_user, 999)
        
        assert exc_info.value.status_code == 404
        assert "not found" in str(exc_info.value.detail)
    
    def test_get_keywords_with_search(self, db_session: Session, test_user: User):
        """Test keyword listing with search parameters."""
        service = KeywordService(db_session)
        
        # Create test keywords
        keywords = [
            KeywordCreate(keyword="python", description="Programming language"),
            KeywordCreate(keyword="javascript", description="Web programming"),
            KeywordCreate(keyword="data science", description="Analytics"),
        ]
        
        for kw in keywords:
            service.create_keyword(test_user, kw)
        
        # Search for programming keywords
        search_params = KeywordSearchRequest(query="programming", page=1, page_size=10)
        result = service.get_keywords(test_user, search_params)
        
        assert result.total == 2
        assert len(result.keywords) == 2
        assert result.page == 1
        assert result.total_pages == 1
    
    def test_update_keyword_success(self, db_session: Session, test_user: User):
        """Test successful keyword update."""
        service = KeywordService(db_session)
        
        # Create keyword
        keyword_data = KeywordCreate(keyword="original", description="Original desc")
        created = service.create_keyword(test_user, keyword_data)
        
        # Update keyword
        update_data = KeywordUpdate(
            keyword="updated",
            description="Updated description",
            is_active=False
        )
        result = service.update_keyword(test_user, created.id, update_data)
        
        assert result.keyword == "updated"
        assert result.description == "Updated description"
        assert result.is_active is False
    
    def test_update_keyword_duplicate(self, db_session: Session, test_user: User):
        """Test updating keyword to duplicate name raises exception."""
        service = KeywordService(db_session)
        
        # Create two keywords
        kw1 = service.create_keyword(test_user, KeywordCreate(keyword="first"))
        kw2 = service.create_keyword(test_user, KeywordCreate(keyword="second"))
        
        # Try to update second to first's name
        update_data = KeywordUpdate(keyword="first")
        with pytest.raises(HTTPException) as exc_info:
            service.update_keyword(test_user, kw2.id, update_data)
        
        assert exc_info.value.status_code == 409
    
    def test_delete_keyword_success(self, db_session: Session, test_user: User):
        """Test successful keyword deletion."""
        service = KeywordService(db_session)
        
        # Create keyword
        keyword_data = KeywordCreate(keyword="to delete")
        created = service.create_keyword(test_user, keyword_data)
        
        # Delete keyword
        result = service.delete_keyword(test_user, created.id)
        assert result is True
        
        # Verify it's deleted
        with pytest.raises(HTTPException):
            service.get_keyword(test_user, created.id)
    
    def test_validate_keyword_valid(self, db_session: Session, test_user: User):
        """Test keyword validation for valid keyword."""
        service = KeywordService(db_session)
        
        result = service.validate_keyword(test_user, "valid keyword")
        
        assert result.valid is True
        assert result.exists is False
        assert "valid" in result.message.lower()
    
    def test_validate_keyword_empty(self, db_session: Session, test_user: User):
        """Test keyword validation for empty keyword."""
        service = KeywordService(db_session)
        
        result = service.validate_keyword(test_user, "")
        
        assert result.valid is False
        assert result.exists is False
        assert "empty" in result.message.lower()
    
    def test_validate_keyword_existing(self, db_session: Session, test_user: User):
        """Test keyword validation for existing keyword."""
        service = KeywordService(db_session)
        
        # Create keyword first
        service.create_keyword(test_user, KeywordCreate(keyword="existing"))
        
        # Validate same keyword
        result = service.validate_keyword(test_user, "existing")
        
        assert result.valid is False
        assert result.exists is True
        assert "already exists" in result.message.lower()
    
    def test_get_user_keyword_count(self, db_session: Session, test_user: User):
        """Test getting user keyword count."""
        service = KeywordService(db_session)
        
        # Initially should be 0
        count = service.get_user_keyword_count(test_user)
        assert count == 0
        
        # Create some keywords
        for i in range(3):
            service.create_keyword(test_user, KeywordCreate(keyword=f"keyword{i}"))
        
        # Count should be 3
        count = service.get_user_keyword_count(test_user)
        assert count == 3
    
    def test_get_active_keywords(self, db_session: Session, test_user: User):
        """Test getting only active keywords."""
        service = KeywordService(db_session)
        
        # Create active and inactive keywords
        service.create_keyword(test_user, KeywordCreate(keyword="active1", is_active=True))
        service.create_keyword(test_user, KeywordCreate(keyword="active2", is_active=True))
        service.create_keyword(test_user, KeywordCreate(keyword="inactive", is_active=False))
        
        # Get active keywords
        active_keywords = service.get_active_keywords(test_user)
        
        assert len(active_keywords) == 2
        for keyword in active_keywords:
            assert keyword.is_active is True