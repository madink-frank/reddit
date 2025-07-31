"""
Tests for Health Check Service

Unit tests for system health monitoring functionality.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.services.health_check_service import HealthCheckService


class TestHealthCheckService:
    """Test cases for HealthCheckService."""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        mock_session = Mock(spec=Session)
        return mock_session
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client."""
        mock_redis = Mock()
        mock_redis.ping = AsyncMock()
        return mock_redis
    
    @pytest.fixture
    def health_service(self, mock_db_session):
        """Health check service with mocked dependencies."""
        return HealthCheckService(mock_db_session)
    
    @pytest.mark.asyncio
    async def test_check_database_healthy(self, health_service, mock_db_session):
        """Test database health check when healthy."""
        mock_db_session.execute.return_value = Mock()
        
        result = await health_service.check_database()
        
        assert result["status"] == "healthy"
        assert result["service"] == "database"
        assert "response_time" in result
        assert result["response_time"] >= 0
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_database_unhealthy(self, health_service, mock_db_session):
        """Test database health check when unhealthy."""
        mock_db_session.execute.side_effect = SQLAlchemyError("Connection failed")
        
        result = await health_service.check_database()
        
        assert result["status"] == "unhealthy"
        assert result["service"] == "database"
        assert "error" in result
        assert "Connection failed" in result["error"]
        assert "response_time" in result
    
    @pytest.mark.asyncio
    async def test_check_redis_healthy(self, health_service, mock_redis):
        """Test Redis health check when healthy."""
        mock_redis.ping.return_value = True
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis):
            result = await health_service.check_redis()
        
        assert result["status"] == "healthy"
        assert result["service"] == "redis"
        assert "response_time" in result
        assert result["response_time"] >= 0
        mock_redis.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_redis_unhealthy(self, health_service, mock_redis):
        """Test Redis health check when unhealthy."""
        mock_redis.ping.side_effect = Exception("Redis connection failed")
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis):
            result = await health_service.check_redis()
        
        assert result["status"] == "unhealthy"
        assert result["service"] == "redis"
        assert "error" in result
        assert "Redis connection failed" in result["error"]
        assert "response_time" in result
    
    @pytest.mark.asyncio
    async def test_check_celery_healthy(self, health_service):
        """Test Celery health check when healthy."""
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.return_value = {"worker1": []}
        
        with patch('app.services.health_check_service.celery_app', mock_celery):
            result = await health_service.check_celery()
        
        assert result["status"] == "healthy"
        assert result["service"] == "celery"
        assert "response_time" in result
        assert "workers" in result
        assert result["workers"] == ["worker1"]
    
    @pytest.mark.asyncio
    async def test_check_celery_unhealthy(self, health_service):
        """Test Celery health check when unhealthy."""
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.side_effect = Exception("Celery connection failed")
        
        with patch('app.services.health_check_service.celery_app', mock_celery):
            result = await health_service.check_celery()
        
        assert result["status"] == "unhealthy"
        assert result["service"] == "celery"
        assert "error" in result
        assert "Celery connection failed" in result["error"]
        assert "response_time" in result
    
    @pytest.mark.asyncio
    async def test_check_celery_no_workers(self, health_service):
        """Test Celery health check when no workers are active."""
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.return_value = {}
        
        with patch('app.services.health_check_service.celery_app', mock_celery):
            result = await health_service.check_celery()
        
        assert result["status"] == "degraded"
        assert result["service"] == "celery"
        assert "warning" in result
        assert "No active workers" in result["warning"]
        assert result["workers"] == []
    
    @pytest.mark.asyncio
    async def test_get_overall_health_all_healthy(self, health_service, mock_db_session, mock_redis):
        """Test overall health check when all services are healthy."""
        # Mock all services as healthy
        mock_db_session.execute.return_value = Mock()
        mock_redis.ping.return_value = True
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.return_value = {"worker1": []}
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis), \
             patch('app.services.health_check_service.celery_app', mock_celery):
            
            result = await health_service.get_overall_health()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert "services" in result
        assert len(result["services"]) == 3
        
        # Check individual service statuses
        services = {svc["service"]: svc for svc in result["services"]}
        assert services["database"]["status"] == "healthy"
        assert services["redis"]["status"] == "healthy"
        assert services["celery"]["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_get_overall_health_some_unhealthy(self, health_service, mock_db_session, mock_redis):
        """Test overall health check when some services are unhealthy."""
        # Mock database as healthy, Redis as unhealthy
        mock_db_session.execute.return_value = Mock()
        mock_redis.ping.side_effect = Exception("Redis failed")
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.return_value = {"worker1": []}
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis), \
             patch('app.services.health_check_service.celery_app', mock_celery):
            
            result = await health_service.get_overall_health()
        
        assert result["status"] == "degraded"
        assert "timestamp" in result
        assert "services" in result
        
        # Check individual service statuses
        services = {svc["service"]: svc for svc in result["services"]}
        assert services["database"]["status"] == "healthy"
        assert services["redis"]["status"] == "unhealthy"
        assert services["celery"]["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_get_overall_health_all_unhealthy(self, health_service, mock_db_session, mock_redis):
        """Test overall health check when all services are unhealthy."""
        # Mock all services as unhealthy
        mock_db_session.execute.side_effect = SQLAlchemyError("DB failed")
        mock_redis.ping.side_effect = Exception("Redis failed")
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.side_effect = Exception("Celery failed")
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis), \
             patch('app.services.health_check_service.celery_app', mock_celery):
            
            result = await health_service.get_overall_health()
        
        assert result["status"] == "unhealthy"
        assert "timestamp" in result
        assert "services" in result
        
        # Check individual service statuses
        services = {svc["service"]: svc for svc in result["services"]}
        assert services["database"]["status"] == "unhealthy"
        assert services["redis"]["status"] == "unhealthy"
        assert services["celery"]["status"] == "unhealthy"
    
    @pytest.mark.asyncio
    async def test_get_detailed_health_info(self, health_service, mock_db_session, mock_redis):
        """Test getting detailed health information."""
        # Mock services
        mock_db_session.execute.return_value = Mock()
        mock_redis.ping.return_value = True
        mock_redis.info.return_value = {
            "redis_version": "6.2.0",
            "used_memory_human": "1.5M",
            "connected_clients": "5"
        }
        mock_celery = Mock()
        mock_celery.control.inspect.return_value.active.return_value = {"worker1": []}
        mock_celery.control.inspect.return_value.stats.return_value = {
            "worker1": {"total": {"tasks.received": 100}}
        }
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis), \
             patch('app.services.health_check_service.celery_app', mock_celery):
            
            result = await health_service.get_detailed_health_info()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert "services" in result
        assert "system_info" in result
        
        # Check system info
        system_info = result["system_info"]
        assert "uptime" in system_info
        assert "memory_usage" in system_info
        assert "cpu_usage" in system_info
        
        # Check detailed service info
        services = {svc["service"]: svc for svc in result["services"]}
        
        # Redis should have detailed info
        redis_service = services["redis"]
        assert "details" in redis_service
        assert "version" in redis_service["details"]
        assert "memory_usage" in redis_service["details"]
        assert "connected_clients" in redis_service["details"]
        
        # Celery should have worker stats
        celery_service = services["celery"]
        assert "details" in celery_service
        assert "worker_stats" in celery_service["details"]
    
    @pytest.mark.asyncio
    async def test_check_external_dependencies(self, health_service):
        """Test checking external dependencies."""
        with patch('aiohttp.ClientSession.get') as mock_get:
            # Mock successful Reddit API response
            mock_response = Mock()
            mock_response.status = 200
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock(return_value=None)
            mock_get.return_value = mock_response
            
            result = await health_service.check_external_dependencies()
        
        assert "reddit_api" in result
        assert result["reddit_api"]["status"] == "healthy"
        assert "response_time" in result["reddit_api"]
    
    @pytest.mark.asyncio
    async def test_check_external_dependencies_failed(self, health_service):
        """Test checking external dependencies when they fail."""
        with patch('aiohttp.ClientSession.get') as mock_get:
            # Mock failed Reddit API response
            mock_get.side_effect = Exception("Connection timeout")
            
            result = await health_service.check_external_dependencies()
        
        assert "reddit_api" in result
        assert result["reddit_api"]["status"] == "unhealthy"
        assert "error" in result["reddit_api"]
        assert "Connection timeout" in result["reddit_api"]["error"]
    
    def test_determine_overall_status(self, health_service):
        """Test overall status determination logic."""
        # All healthy
        services = [
            {"status": "healthy"},
            {"status": "healthy"},
            {"status": "healthy"}
        ]
        status = health_service._determine_overall_status(services)
        assert status == "healthy"
        
        # Some degraded
        services = [
            {"status": "healthy"},
            {"status": "degraded"},
            {"status": "healthy"}
        ]
        status = health_service._determine_overall_status(services)
        assert status == "degraded"
        
        # Some unhealthy
        services = [
            {"status": "healthy"},
            {"status": "unhealthy"},
            {"status": "healthy"}
        ]
        status = health_service._determine_overall_status(services)
        assert status == "degraded"
        
        # All unhealthy
        services = [
            {"status": "unhealthy"},
            {"status": "unhealthy"},
            {"status": "unhealthy"}
        ]
        status = health_service._determine_overall_status(services)
        assert status == "unhealthy"
        
        # Mixed statuses
        services = [
            {"status": "healthy"},
            {"status": "degraded"},
            {"status": "unhealthy"}
        ]
        status = health_service._determine_overall_status(services)
        assert status == "degraded"
    
    @pytest.mark.asyncio
    async def test_get_system_info(self, health_service):
        """Test getting system information."""
        with patch('psutil.virtual_memory') as mock_memory, \
             patch('psutil.cpu_percent') as mock_cpu, \
             patch('time.time') as mock_time:
            
            # Mock system info
            mock_memory.return_value = Mock(percent=75.5, available=1024*1024*1024)
            mock_cpu.return_value = 45.2
            mock_time.return_value = 1000000
            
            system_info = await health_service._get_system_info()
        
        assert "uptime" in system_info
        assert "memory_usage" in system_info
        assert "cpu_usage" in system_info
        assert system_info["memory_usage"]["percent"] == 75.5
        assert system_info["cpu_usage"] == 45.2
    
    @pytest.mark.asyncio
    async def test_response_time_measurement(self, health_service, mock_db_session):
        """Test that response times are properly measured."""
        # Mock a slow database operation
        def slow_execute(*args, **kwargs):
            import time
            time.sleep(0.1)  # 100ms delay
            return Mock()
        
        mock_db_session.execute.side_effect = slow_execute
        
        result = await health_service.check_database()
        
        assert result["response_time"] >= 0.1  # Should be at least 100ms
        assert result["response_time"] < 1.0   # But not too long for a test
    
    @pytest.mark.asyncio
    async def test_health_check_caching(self, health_service, mock_db_session, mock_redis):
        """Test that health check results can be cached."""
        # This test would verify caching behavior if implemented
        # For now, just ensure multiple calls work correctly
        mock_db_session.execute.return_value = Mock()
        mock_redis.ping.return_value = True
        
        with patch('app.services.health_check_service.get_redis_client', return_value=mock_redis):
            result1 = await health_service.check_database()
            result2 = await health_service.check_database()
        
        assert result1["status"] == "healthy"
        assert result2["status"] == "healthy"
        assert mock_db_session.execute.call_count == 2  # Called twice, no caching yet