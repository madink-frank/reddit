"""
Tests for Redis connection resilience and error handling.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.utils.redis_client import RedisClient
from app.services.cache_service import CacheService
from app.services.health_check_service import HealthCheckService


class TestRedisResilience:
    """Test Redis client resilience and error handling."""
    
    @pytest.fixture
    async def redis_client(self):
        """Create a Redis client for testing."""
        client = RedisClient()
        yield client
        await client.close()
    
    @pytest.fixture
    def cache_service(self, redis_client):
        """Create a cache service for testing."""
        return CacheService(redis_client)
    
    @pytest.fixture
    def health_service(self):
        """Create a health check service for testing."""
        return HealthCheckService()
    
    @pytest.mark.asyncio
    async def test_redis_connection_retry_logic(self, redis_client):
        """Test Redis connection retry logic with exponential backoff."""
        # Mock Redis connection to fail initially then succeed
        with patch('redis.asyncio.from_url') as mock_from_url:
            mock_redis = AsyncMock()
            mock_from_url.return_value = mock_redis
            
            # First two calls fail, third succeeds
            mock_redis.ping.side_effect = [
                ConnectionError("Connection failed"),
                ConnectionError("Connection failed"),
                True
            ]
            
            # Should eventually succeed after retries
            await redis_client.initialize()
            assert redis_client.is_healthy()
            assert mock_redis.ping.call_count == 3
    
    @pytest.mark.asyncio
    async def test_redis_graceful_degradation_on_connection_failure(self, redis_client):
        """Test graceful degradation when Redis is unavailable."""
        # Mock Redis connection to always fail
        with patch('redis.asyncio.from_url') as mock_from_url:
            mock_redis = AsyncMock()
            mock_from_url.return_value = mock_redis
            mock_redis.ping.side_effect = ConnectionError("Connection failed")
            
            # Connection should fail gracefully
            connection_ok = await redis_client.ensure_connection()
            assert not connection_ok
            assert not redis_client.is_healthy()
    
    @pytest.mark.asyncio
    async def test_redis_operations_with_unavailable_redis(self, redis_client):
        """Test Redis operations when Redis is unavailable."""
        # Mock Redis to be unhealthy
        redis_client._connection_healthy = False
        redis_client._initialized = False
        
        with patch.object(redis_client, 'ensure_connection', return_value=False):
            # All operations should return None/False gracefully
            result = await redis_client.get("test_key")
            assert result is None
            
            result = await redis_client.set("test_key", "test_value")
            assert result is False
            
            result = await redis_client.delete("test_key")
            assert result is False
            
            result = await redis_client.exists("test_key")
            assert result is False
    
    @pytest.mark.asyncio
    async def test_cache_service_graceful_degradation(self, cache_service):
        """Test cache service graceful degradation when Redis is unavailable."""
        # Mock Redis client to be unhealthy
        cache_service.redis._connection_healthy = False
        
        with patch.object(cache_service.redis, 'is_healthy', return_value=False):
            # Cache operations should return None/False gracefully
            result = await cache_service.get_cached_result("test_key")
            assert result is None
            
            result = await cache_service.set_cached_result("test_key", {"data": "test"})
            assert result is False
            
            result = await cache_service.invalidate_cache("test_pattern")
            assert result == 0
    
    @pytest.mark.asyncio
    async def test_cache_service_with_working_redis(self, cache_service):
        """Test cache service with working Redis connection."""
        # Mock Redis client to be healthy
        cache_service.redis._connection_healthy = True
        
        with patch.object(cache_service.redis, 'is_healthy', return_value=True), \
             patch.object(cache_service.redis, 'get', return_value={"data": "cached_value"}), \
             patch.object(cache_service.redis, 'set', return_value=True):
            
            # Cache operations should work normally
            result = await cache_service.get_cached_result("test_key")
            assert result == {"data": "cached_value"}
            
            result = await cache_service.set_cached_result("test_key", {"data": "test"})
            assert result is True
    
    @pytest.mark.asyncio
    async def test_health_check_redis_degraded_mode(self, health_service):
        """Test health check service reports degraded mode for Redis issues."""
        with patch('app.services.health_check_service.get_redis_client') as mock_get_client:
            mock_client = AsyncMock()
            mock_get_client.return_value = mock_client
            
            # Mock Redis client to be unhealthy
            mock_client.is_healthy.return_value = False
            mock_client.reconnect.return_value = False
            
            result = await health_service._check_redis()
            
            assert not result['healthy']
            assert result['degraded_mode'] is True
            assert 'degraded mode' in result['error']
    
    @pytest.mark.asyncio
    async def test_health_check_celery_degraded_mode(self, health_service):
        """Test health check service reports degraded mode for Celery issues."""
        with patch('app.services.health_check_service.celery_app') as mock_celery:
            # Mock Celery to have no workers
            mock_inspect = MagicMock()
            mock_inspect.active.return_value = {}
            mock_inspect.registered.return_value = {}
            mock_celery.control.inspect.return_value = mock_inspect
            
            # Mock broker connection to fail
            mock_celery.connection_or_acquire.side_effect = ConnectionError("Broker unavailable")
            
            result = await health_service._check_celery()
            
            assert not result['healthy']
            assert result['degraded_mode'] is True
            assert 'Background tasks' in result['error']
    
    @pytest.mark.asyncio
    async def test_overall_health_status_degraded_mode(self, health_service):
        """Test overall health status shows degraded mode when Redis/Celery are unavailable."""
        # Mock individual health checks to return degraded mode
        with patch.object(health_service, '_check_redis') as mock_redis_check, \
             patch.object(health_service, '_check_celery') as mock_celery_check, \
             patch.object(health_service, '_check_database') as mock_db_check, \
             patch.object(health_service, '_check_disk_space') as mock_disk_check, \
             patch.object(health_service, '_check_memory') as mock_memory_check:
            
            # Database, disk, and memory are healthy
            mock_db_check.return_value = {'healthy': True, 'status': 'connected'}
            mock_disk_check.return_value = {'healthy': True, 'status': 'ok'}
            mock_memory_check.return_value = {'healthy': True, 'status': 'ok'}
            
            # Redis and Celery are in degraded mode
            mock_redis_check.return_value = {
                'healthy': False, 
                'status': 'disconnected',
                'degraded_mode': True,
                'error': 'Redis unavailable'
            }
            mock_celery_check.return_value = {
                'healthy': False,
                'status': 'no_workers',
                'degraded_mode': True,
                'error': 'No workers'
            }
            
            result = await health_service.get_health_status()
            
            assert result['status'] == 'degraded'
            assert result['degraded_mode'] is True
            assert not result['services']['redis']['healthy']
            assert not result['services']['celery']['healthy']
            assert result['services']['database']['healthy']
    
    @pytest.mark.asyncio
    async def test_redis_reconnection_logic(self, redis_client):
        """Test Redis reconnection functionality."""
        with patch('redis.asyncio.from_url') as mock_from_url:
            mock_redis = AsyncMock()
            mock_from_url.return_value = mock_redis
            
            # Initial connection succeeds
            mock_redis.ping.return_value = True
            await redis_client.initialize()
            assert redis_client.is_healthy()
            
            # Simulate connection loss
            redis_client._connection_healthy = False
            
            # Reconnection should work
            mock_redis.ping.return_value = True
            result = await redis_client.reconnect()
            assert result is True
            assert redis_client.is_healthy()
    
    @pytest.mark.asyncio
    async def test_cache_stats_with_unavailable_redis(self, cache_service):
        """Test cache stats when Redis is unavailable."""
        # Mock Redis client to be unhealthy
        cache_service.redis._connection_healthy = False
        
        with patch.object(cache_service.redis, 'is_healthy', return_value=False):
            stats = await cache_service.get_cache_stats()
            
            assert stats['total_keys'] == 0
            assert stats['cache_types'] == {}
            assert stats['redis_info']['status'] == 'unavailable'
    
    def test_redis_client_health_status(self, redis_client):
        """Test Redis client health status reporting."""
        # Initially unhealthy
        assert not redis_client.is_healthy()
        
        # Mark as healthy
        redis_client._connection_healthy = True
        redis_client._initialized = True
        assert redis_client.is_healthy()
        
        # Mark as unhealthy
        redis_client._connection_healthy = False
        assert not redis_client.is_healthy()


class TestCeleryResilience:
    """Test Celery resilience and error handling."""
    
    def test_resilient_task_decorator_import(self):
        """Test that resilient task decorator can be imported."""
        from app.core.celery_app import resilient_task
        assert resilient_task is not None
    
    def test_celery_configuration_resilience_settings(self):
        """Test that Celery is configured with resilience settings."""
        from app.core.celery_app import celery_app
        
        # Check retry settings
        assert celery_app.conf.broker_connection_retry_on_startup is True
        assert celery_app.conf.broker_connection_retry is True
        assert celery_app.conf.broker_connection_max_retries == 10
        assert celery_app.conf.task_acks_late is True
        assert celery_app.conf.task_reject_on_worker_lost is True
        assert celery_app.conf.task_max_retries == 3
        
        # Check transport options
        transport_opts = celery_app.conf.broker_transport_options
        assert transport_opts['retry_on_timeout'] is True
        assert transport_opts['health_check_interval'] == 30