"""
Tests for crawling status API endpoints.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.keyword import Keyword
from app.models.process_log import ProcessLog
from app.core.dependencies import get_current_user, get_db
from app.services.scheduler_service import get_scheduler_service


client = TestClient(app)


@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    user = Mock(spec=User)
    user.id = 1
    user.username = "testuser"
    user.reddit_id = "reddit123"
    return user


@pytest.fixture
def mock_db():
    """Mock database session."""
    return Mock(spec=Session)


@pytest.fixture
def mock_keyword(mock_user):
    """Mock keyword."""
    keyword = Mock(spec=Keyword)
    keyword.id = 1
    keyword.user_id = mock_user.id
    keyword.keyword = "test_keyword"
    keyword.is_active = True
    return keyword


@pytest.fixture
def mock_process_log(mock_user):
    """Mock process log."""
    log = Mock(spec=ProcessLog)
    log.id = 1
    log.user_id = mock_user.id
    log.process_type = "keyword_crawl"
    log.status = "completed"
    log.started_at = datetime.now(timezone.utc)
    log.completed_at = datetime.now(timezone.utc)
    log.details = {"posts_saved": 10, "keyword_id": 1}
    log.error_message = None
    return log


class TestStartCrawl:
    """Test crawl start endpoint."""
    
    def test_start_keyword_crawl_success(self, mock_user, mock_db, mock_keyword):
        """Test successful keyword crawl start."""
        # Mock scheduler service
        mock_scheduler_service = Mock()
        mock_scheduler_service.start_keyword_crawl.return_value = {
            'task_id': 'test-task-123',
            'status': 'started',
            'started_at': '2024-01-01T00:00:00Z',
            'keyword_id': 1,
            'limit': 100
        }
        
        # Mock dependencies
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_scheduler_service] = lambda: mock_scheduler_service
        
        # Mock database query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_keyword
        
        response = client.post(
            "/api/v1/crawling/start",
            json={
                "crawl_type": "keyword",
                "keyword_id": 1,
                "limit": 100
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "test-task-123"
        assert data["status"] == "started"
        assert data["keyword_id"] == 1
        
        # Clean up
        app.dependency_overrides.clear()
    
    def test_start_keyword_crawl_missing_keyword_id(self, mock_user, mock_db):
        """Test keyword crawl start without keyword_id."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        response = client.post(
            "/api/v1/crawling/start",
            json={
                "crawl_type": "keyword",
                "limit": 100
            }
        )
        
        assert response.status_code == 400
        assert "keyword_id is required" in response.json()["detail"]
        
        app.dependency_overrides.clear()
    
    def test_start_keyword_crawl_keyword_not_found(self, mock_user, mock_db):
        """Test keyword crawl start with non-existent keyword."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        # Mock database query returning None
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.post(
            "/api/v1/crawling/start",
            json={
                "crawl_type": "keyword",
                "keyword_id": 999,
                "limit": 100
            }
        )
        
        assert response.status_code == 404
        assert "Keyword not found" in response.json()["detail"]
        
        app.dependency_overrides.clear()
    
    def test_start_trending_crawl_success(self, mock_user, mock_db):
        """Test successful trending crawl start."""
        # Mock scheduler service
        mock_scheduler_service = Mock()
        mock_scheduler_service.start_trending_crawl.return_value = {
            'task_id': 'trending-task-123',
            'status': 'started',
            'started_at': '2024-01-01T00:00:00Z',
            'limit': 100
        }
        
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_scheduler_service] = lambda: mock_scheduler_service
        
        response = client.post(
            "/api/v1/crawling/start",
            json={
                "crawl_type": "trending",
                "limit": 100
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "trending-task-123"
        assert data["status"] == "started"
        
        app.dependency_overrides.clear()
    
    def test_start_all_keywords_crawl_success(self, mock_user, mock_db):
        """Test successful all keywords crawl start."""
        # Mock scheduler service
        mock_scheduler_service = Mock()
        mock_scheduler_service.start_all_keywords_crawl.return_value = {
            'task_id': 'all-keywords-task-123',
            'status': 'started',
            'started_at': '2024-01-01T00:00:00Z'
        }
        
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_scheduler_service] = lambda: mock_scheduler_service
        
        response = client.post(
            "/api/v1/crawling/start",
            json={
                "crawl_type": "all_keywords"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "all-keywords-task-123"
        assert data["status"] == "started"
        
        app.dependency_overrides.clear()
    
    def test_start_crawl_invalid_type(self, mock_user, mock_db):
        """Test crawl start with invalid crawl type."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        response = client.post(
            "/api/v1/crawling/start",
            json={
                "crawl_type": "invalid_type",
                "limit": 100
            }
        )
        
        assert response.status_code == 400
        assert "Invalid crawl_type" in response.json()["detail"]
        
        app.dependency_overrides.clear()


class TestTaskStatus:
    """Test task status endpoint."""
    
    def test_get_task_status_success(self, mock_user):
        """Test successful task status retrieval."""
        # Mock scheduler service
        mock_scheduler_service = Mock()
        mock_scheduler_service.get_task_status.return_value = {
            'task_id': 'test-task-123',
            'status': 'SUCCESS',
            'ready': True,
            'successful': True,
            'failed': False,
            'result': {'posts_saved': 10}
        }
        
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_scheduler_service] = lambda: mock_scheduler_service
        
        response = client.get("/api/v1/crawling/status/test-task-123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "test-task-123"
        assert data["status"] == "SUCCESS"
        assert data["ready"] is True
        assert data["result"]["posts_saved"] == 10
        
        app.dependency_overrides.clear()
    
    def test_get_task_status_not_found(self, mock_user):
        """Test task status retrieval for non-existent task."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.get_task_status.return_value = {
                'task_id': 'non-existent-task',
                'error': 'Task not found'
            }
            
            response = client.get("/api/v1/crawling/status/non-existent-task")
        
        assert response.status_code == 404
        assert "Task not found" in response.json()["detail"]
        
        app.dependency_overrides.clear()


class TestCrawlHistory:
    """Test crawl history endpoint."""
    
    def test_get_crawl_history_success(self, mock_user, mock_db, mock_process_log):
        """Test successful crawl history retrieval."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        # Mock database query
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 1
        mock_query.order_by.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value.all.return_value = [mock_process_log]
        mock_db.query.return_value = mock_query
        
        response = client.get("/api/v1/crawling/history")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == 1
        assert data[0]["process_type"] == "keyword_crawl"
        assert data[0]["status"] == "completed"
        
        app.dependency_overrides.clear()
    
    def test_get_crawl_history_with_filters(self, mock_user, mock_db, mock_process_log):
        """Test crawl history retrieval with filters."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        # Mock database query
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 1
        mock_query.order_by.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value.all.return_value = [mock_process_log]
        mock_db.query.return_value = mock_query
        
        response = client.get(
            "/api/v1/crawling/history?process_type=keyword_crawl&status=completed&limit=10&offset=0"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        
        app.dependency_overrides.clear()


class TestCrawlStatus:
    """Test overall crawl status endpoint."""
    
    def test_get_crawl_status_success(self, mock_user, mock_db, mock_process_log):
        """Test successful crawl status retrieval."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        # Mock database query
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value.all.return_value = [mock_process_log]
        mock_db.query.return_value = mock_query
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.get_active_tasks.return_value = []
            mock_scheduler.return_value.get_crawling_statistics.return_value = {
                'total_processes': 10,
                'completed_processes': 8,
                'failed_processes': 1,
                'running_processes': 1
            }
            mock_scheduler.return_value.get_worker_status.return_value = {
                'workers': [],
                'total_workers': 0,
                'online_workers': 0
            }
            
            response = client.get("/api/v1/crawling/status")
        
        assert response.status_code == 200
        data = response.json()
        assert "active_tasks" in data
        assert "statistics" in data
        assert "worker_status" in data
        assert "last_updated" in data
        
        app.dependency_overrides.clear()


class TestCrawlStatistics:
    """Test crawl statistics endpoint."""
    
    def test_get_crawl_statistics_success(self, mock_user, mock_db, mock_keyword):
        """Test successful crawl statistics retrieval."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        # Mock database queries
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 10
        mock_query.all.return_value = [mock_keyword]
        mock_db.query.return_value = mock_query
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.get_crawling_statistics.return_value = {
                'total_processes': 100,
                'completed_processes': 80,
                'failed_processes': 10,
                'running_processes': 10
            }
            
            response = client.get("/api/v1/crawling/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert "user_statistics" in data
        assert "keyword_statistics" in data
        assert "overall_statistics" in data
        assert "generated_at" in data
        
        app.dependency_overrides.clear()


class TestActiveTasks:
    """Test active tasks endpoint."""
    
    def test_get_active_tasks_success(self, mock_user):
        """Test successful active tasks retrieval."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.get_active_tasks.return_value = [
                {
                    'task_id': 'active-task-1',
                    'name': 'crawl_keyword_posts',
                    'worker': 'worker1',
                    'args': [1, 100],
                    'kwargs': {},
                    'time_start': 1640995200.0
                }
            ]
            mock_scheduler.return_value.get_scheduled_tasks.return_value = []
            
            response = client.get("/api/v1/crawling/active")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_active"] == 1
        assert data["total_scheduled"] == 0
        assert len(data["active_tasks"]) == 1
        assert data["active_tasks"][0]["task_id"] == "active-task-1"
        
        app.dependency_overrides.clear()


class TestWorkerStatus:
    """Test worker status endpoint."""
    
    def test_get_worker_status_success(self, mock_user):
        """Test successful worker status retrieval."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.get_worker_status.return_value = {
                'workers': [
                    {
                        'name': 'worker1',
                        'status': 'online',
                        'pool': {'max-concurrency': 4},
                        'total_tasks': {'total': 100},
                        'active_tasks': 2,
                        'registered_tasks': 10
                    }
                ],
                'total_workers': 1,
                'online_workers': 1
            }
            
            response = client.get("/api/v1/crawling/workers")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_workers"] == 1
        assert data["online_workers"] == 1
        assert len(data["workers"]) == 1
        assert data["workers"][0]["name"] == "worker1"
        
        app.dependency_overrides.clear()


class TestCancelTask:
    """Test task cancellation endpoint."""
    
    def test_cancel_task_success(self, mock_user):
        """Test successful task cancellation."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.cancel_task.return_value = {
                'task_id': 'test-task-123',
                'status': 'cancelled',
                'cancelled_at': '2024-01-01T00:00:00Z'
            }
            
            response = client.delete("/api/v1/crawling/cancel/test-task-123")
        
        assert response.status_code == 200
        data = response.json()
        assert "cancelled successfully" in data["message"]
        assert data["result"]["status"] == "cancelled"
        
        app.dependency_overrides.clear()
    
    def test_cancel_task_failure(self, mock_user):
        """Test task cancellation failure."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        
        with patch('app.api.v1.endpoints.crawling.get_scheduler_service') as mock_scheduler:
            mock_scheduler.return_value.cancel_task.return_value = {
                'task_id': 'test-task-123',
                'error': 'Task not found or already completed'
            }
            
            response = client.delete("/api/v1/crawling/cancel/test-task-123")
        
        assert response.status_code == 500
        assert "Failed to cancel task" in response.json()["detail"]
        
        app.dependency_overrides.clear()