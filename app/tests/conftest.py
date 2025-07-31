"""
Test Configuration and Fixtures

Pytest configuration and shared fixtures for testing.
"""

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.core.auth import TokenManager
from app.models.base import Base
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post
from app.models.comment import Comment
from app.models.process_log import ProcessLog
from app.models.generated_content import GeneratedContent

# Create a test metadata that excludes problematic tables
test_metadata = MetaData()

# Import only the models we need for keyword testing
User.__table__.tometadata(test_metadata)
Keyword.__table__.tometadata(test_metadata)
Post.__table__.tometadata(test_metadata)
Comment.__table__.tometadata(test_metadata)
ProcessLog.__table__.tometadata(test_metadata)
GeneratedContent.__table__.tometadata(test_metadata)


# Test database URL (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a fresh database session for each test.
    """
    # Create only the tables we need for testing (excluding metrics_cache with JSONB)
    tables_to_create = [
        User.__table__,
        Keyword.__table__,
        Post.__table__,
        Comment.__table__,
        ProcessLog.__table__,
        GeneratedContent.__table__
    ]
    
    for table in tables_to_create:
        try:
            table.create(bind=engine, checkfirst=True)
        except Exception as e:
            print(f"Warning: Could not create table {table.name}: {e}")
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        for table in reversed(tables_to_create):
            try:
                table.drop(bind=engine, checkfirst=True)
            except Exception:
                pass


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """
    Create a test client with database dependency override.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    """
    Create a test user in the database.
    """
    user = User(
        reddit_id="test_reddit_123",
        username="testuser",
        email="test@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_user_2(db_session: Session) -> User:
    """
    Create a second test user for multi-user tests.
    """
    user = User(
        reddit_id="test_reddit_456",
        username="testuser2",
        email="test2@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_token(test_user: User) -> str:
    """
    Create a valid JWT access token for the test user.
    """
    token_data = {
        "sub": str(test_user.id),
        "reddit_id": test_user.reddit_id,
        "username": test_user.username
    }
    return TokenManager.create_access_token(token_data)


@pytest.fixture(scope="function")
def auth_headers(auth_token: str) -> dict:
    """
    Create authorization headers with JWT token.
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="function")
def refresh_token(test_user: User) -> str:
    """
    Create a valid JWT refresh token for the test user.
    """
    token_data = {
        "sub": str(test_user.id),
        "reddit_id": test_user.reddit_id,
        "username": test_user.username
    }
    return TokenManager.create_refresh_token(token_data)


@pytest.fixture(scope="function")
def test_keyword(db_session: Session, test_user: User) -> Keyword:
    """
    Create a test keyword in the database.
    """
    keyword = Keyword(
        user_id=test_user.id,
        keyword="test keyword",
        description="Test keyword description",
        is_active=True
    )
    db_session.add(keyword)
    db_session.commit()
    db_session.refresh(keyword)
    return keyword


@pytest.fixture(scope="function")
def multiple_test_keywords(db_session: Session, test_user: User) -> list[Keyword]:
    """
    Create multiple test keywords for testing pagination and search.
    """
    keywords = [
        Keyword(
            user_id=test_user.id,
            keyword="python programming",
            description="Python programming language",
            is_active=True
        ),
        Keyword(
            user_id=test_user.id,
            keyword="javascript development",
            description="JavaScript web development",
            is_active=True
        ),
        Keyword(
            user_id=test_user.id,
            keyword="data science",
            description="Data science and analytics",
            is_active=False
        ),
        Keyword(
            user_id=test_user.id,
            keyword="machine learning",
            description="ML and AI topics",
            is_active=True
        ),
    ]
    
    for keyword in keywords:
        db_session.add(keyword)
    
    db_session.commit()
    
    for keyword in keywords:
        db_session.refresh(keyword)
    
    return keywords


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    """
    Automatically clear FastAPI dependency overrides after each test.
    """
    yield
    app.dependency_overrides.clear()


# Mock fixtures for external services
@pytest.fixture
def mock_redis():
    """
    Mock Redis client for testing.
    """
    from unittest.mock import MagicMock
    mock_redis = MagicMock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.delete.return_value = True
    mock_redis.exists.return_value = False
    return mock_redis


@pytest.fixture
def mock_reddit_api():
    """
    Mock Reddit API responses for testing.
    """
    from unittest.mock import MagicMock
    mock_api = MagicMock()
    mock_api.get_user_info.return_value = {
        "id": "test_reddit_123",
        "name": "testuser",
        "email": "test@example.com"
    }
    return mock_api