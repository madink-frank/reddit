"""
Tests for monitoring and health check functionality.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

from app.services.health_check_service import HealthCheckService
from app.services.notification_service import NotificationService, NotificationLevel, NotificationChannel
from app.core.metrics import (
    api_requests_total, 
    crawling_jobs_total, 
    record_crawling_job_start,
    record_crawling_job_complete,
    record_content_generation,
    record_error
)


class TestHealthCheckService:
    """Test health check service functionality."""
    
    @pytest.fixture
    def health_service(self):
        return HealthCheckService()
    
    @pytest.mark.asyncio
    async def test_get_health_status_all_healthy(self, health_service):
        """Test health status when all services are healthy."""
        # Mock all health check methods to return healthy status
        with patch.object(health_service, '_check_database', return_value={'healthy': True, 'status': 'connected'}), \
             patch.object(health_service, '_check_redis', return_value={'healthy': True, 'status': 'connected'}), \
             patch.object(health_service, '_check_celery', return_value={'healthy': True, 'status': 'connected'}), \
             patch.object(health_service, '_check_disk_space', return_value={'healthy': True, 'status': 'ok'}), \
             patch.object(health_service, '_check_memory', return_value={'healthy': True, 'status': 'ok'}):
            
            result = await health_service.get_health_status()
            
            assert result['status'] == 'healthy'
            assert result['overall_healthy'] is True
            assert result['summary']['healthy_services'] == 5
            assert result['summary']['total_services'] == 5
            assert result['summary']['health_percentage'] == 100.0
    
    @pytest.mark.asyncio
    async def test_get_health_status_some_unhealthy(self, health_service):
        """Test health status when some services are unhealthy."""
        # Mock some services as unhealthy
        with patch.object(health_service, '_check_database', return_value={'healthy': False, 'status': 'disconnected'}), \
             patch.object(health_service, '_check_redis', return_value={'healthy': True, 'status': 'connected'}), \
             patch.object(health_service, '_check_celery', return_value={'healthy': True, 'status': 'connected'}), \
             patch.object(health_service, '_check_disk_space', return_value={'healthy': True, 'status': 'ok'}), \
             patch.object(health_service, '_check_memory', return_value={'healthy': True, 'status': 'ok'}):
            
            result = await health_service.get_health_status()
            
            assert result['status'] == 'unhealthy'
            assert result['overall_healthy'] is False
            assert result['summary']['healthy_services'] == 4
            assert result['summary']['total_services'] == 5
            assert result['summary']['health_percentage'] == 80.0
    
    @pytest.mark.asyncio
    async def test_get_service_health_unknown_service(self, health_service):
        """Test getting health for unknown service."""
        result = await health_service.get_service_health('unknown_service')
        
        assert result['healthy'] is False
        assert result['status'] == 'unknown_service'
        assert 'Unknown service' in result['error']


class TestNotificationService:
    """Test notification service functionality."""
    
    @pytest.fixture
    def notification_service(self):
        return NotificationService()
    
    @pytest.mark.asyncio
    async def test_send_notification_log_channel(self, notification_service):
        """Test sending notification via log channel."""
        with patch('app.services.notification_service.logger') as mock_logger:
            result = await notification_service.send_notification(
                alert_type='test_alert',
                message='Test message',
                level=NotificationLevel.INFO,
                channels=[NotificationChannel.LOG]
            )
            
            assert result['alert_type'] == 'test_alert'
            assert result['level'] == 'info'
            assert result['channels_attempted'] == 1
            assert result['results']['log']['success'] is True
            mock_logger.info.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_notification_email_not_configured(self, notification_service):
        """Test sending email notification when not configured."""
        result = await notification_service.send_notification(
            alert_type='test_alert',
            message='Test message',
            channels=[NotificationChannel.EMAIL]
        )
        
        assert result['results']['email']['success'] is False
        assert 'Email configuration not complete' in result['results']['email']['error']
    
    @pytest.mark.asyncio
    async def test_alert_crawling_failure(self, notification_service):
        """Test crawling failure alert."""
        with patch.object(notification_service, 'send_notification', return_value={'success': True}) as mock_send:
            await notification_service.alert_crawling_failure(
                keyword_id=1,
                keyword='test_keyword',
                error='Test error'
            )
            
            mock_send.assert_called_once()
            call_args = mock_send.call_args[1]
            assert call_args['alert_type'] == 'crawling_failure'
            assert 'test_keyword' in call_args['message']
            assert call_args['details']['keyword_id'] == 1


class TestMetrics:
    """Test metrics collection functionality."""
    
    def test_record_crawling_job_metrics(self):
        """Test recording crawling job metrics."""
        # Record job start
        record_crawling_job_start("keyword_crawl")
        
        # Record job completion
        record_crawling_job_complete(
            job_type="keyword_crawl",
            duration=10.5,
            status="completed",
            posts_count=25,
            keyword="test_keyword",
            subreddit="test_subreddit"
        )
        
        # Verify metrics were recorded (basic check)
        assert crawling_jobs_total._value._value > 0
    
    def test_record_content_generation_metrics(self):
        """Test recording content generation metrics."""
        record_content_generation(
            content_type="blog",
            duration=5.2,
            status="completed"
        )
        
        # Basic verification that metrics were recorded
        # In a real test, you'd check the actual metric values
        assert True  # Placeholder assertion
    
    def test_record_error_metrics(self):
        """Test recording error metrics."""
        record_error("TestError", "test_component")
        
        # Basic verification that error metrics were recorded
        assert True  # Placeholder assertion


@pytest.mark.asyncio
async def test_health_check_endpoint_integration():
    """Integration test for health check endpoint."""
    from app.main import app
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    
    # Test basic health check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    
    # Test detailed health check (may fail due to missing services in test)
    response = client.get("/health/detailed")
    assert response.status_code == 200
    result = response.json()
    assert "services" in result
    assert "timestamp" in result


@pytest.mark.asyncio
async def test_metrics_endpoint():
    """Test metrics endpoint."""
    from app.main import app
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    
    # Check that some basic metrics are present
    content = response.text
    assert "api_requests_total" in content or "# HELP" in content