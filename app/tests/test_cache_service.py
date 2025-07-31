"""
Tests for Cache Service

Unit tests for Redis caching functionality.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import json

from app.services.cache_service import CacheService


class TestCacheService:
    """Test cases for CacheService."""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client."""
        mock_redis = Mock()
        mock_redis.get = AsyncMock()
        mock_redis.set = AsyncMock()
        mock_redis.delete = AsyncMock()
        mock_redis.exists = AsyncMock()
        mock_redis.expire = AsyncMock()
        mock_redis.keys = AsyncMock()
        return mock_redis
    
    @pytest.fixture
    def cache_service(self, mock_redis):
        """Cache service with mocked Redis."""
        with patch('app.services.cache_service.get_redis_client', return_value=mock_redis):
            return CacheService()
    
    @pytest.mark.asyncio
    async def test_get_cache_hit(self, cache_service, mock_redis):
        """Test cache hit scenario."""
        test_data = {"key": "value", "number": 42}
        mock_redis.get.return_value = json.dumps(test_data)
        
        result = await cache_service.get("test_key")
        
        assert result == test_data
        mock_redis.get.assert_called_once_with("test_key")
    
    @pytest.mark.asyncio
    async def test_get_cache_miss(self, cache_service, mock_redis):
        """Test cache miss scenario."""
        mock_redis.get.return_value = None
        
        result = await cache_service.get("nonexistent_key")
        
        assert result is None
        mock_redis.get.assert_called_once_with("nonexistent_key")
    
    @pytest.mark.asyncio
    async def test_get_invalid_json(self, cache_service, mock_redis):
        """Test handling of invalid JSON in cache."""
        mock_redis.get.return_value = "invalid json"
        
        result = await cache_service.get("invalid_key")
        
        assert result is None
        mock_redis.get.assert_called_once_with("invalid_key")
    
    @pytest.mark.asyncio
    async def test_set_cache(self, cache_service, mock_redis):
        """Test setting cache value."""
        test_data = {"key": "value", "list": [1, 2, 3]}
        mock_redis.set.return_value = True
        
        result = await cache_service.set("test_key", test_data, ttl=3600)
        
        assert result is True
        mock_redis.set.assert_called_once_with(
            "test_key", 
            json.dumps(test_data), 
            ex=3600
        )
    
    @pytest.mark.asyncio
    async def test_set_cache_no_ttl(self, cache_service, mock_redis):
        """Test setting cache value without TTL."""
        test_data = {"key": "value"}
        mock_redis.set.return_value = True
        
        result = await cache_service.set("test_key", test_data)
        
        assert result is True
        mock_redis.set.assert_called_once_with(
            "test_key", 
            json.dumps(test_data), 
            ex=None
        )
    
    @pytest.mark.asyncio
    async def test_delete_cache(self, cache_service, mock_redis):
        """Test deleting cache value."""
        mock_redis.delete.return_value = 1
        
        result = await cache_service.delete("test_key")
        
        assert result is True
        mock_redis.delete.assert_called_once_with("test_key")
    
    @pytest.mark.asyncio
    async def test_delete_cache_not_found(self, cache_service, mock_redis):
        """Test deleting non-existent cache value."""
        mock_redis.delete.return_value = 0
        
        result = await cache_service.delete("nonexistent_key")
        
        assert result is False
        mock_redis.delete.assert_called_once_with("nonexistent_key")
    
    @pytest.mark.asyncio
    async def test_exists_cache(self, cache_service, mock_redis):
        """Test checking if cache key exists."""
        mock_redis.exists.return_value = 1
        
        result = await cache_service.exists("test_key")
        
        assert result is True
        mock_redis.exists.assert_called_once_with("test_key")
    
    @pytest.mark.asyncio
    async def test_exists_cache_not_found(self, cache_service, mock_redis):
        """Test checking non-existent cache key."""
        mock_redis.exists.return_value = 0
        
        result = await cache_service.exists("nonexistent_key")
        
        assert result is False
        mock_redis.exists.assert_called_once_with("nonexistent_key")
    
    @pytest.mark.asyncio
    async def test_expire_cache(self, cache_service, mock_redis):
        """Test setting cache expiration."""
        mock_redis.expire.return_value = True
        
        result = await cache_service.expire("test_key", 1800)
        
        assert result is True
        mock_redis.expire.assert_called_once_with("test_key", 1800)
    
    @pytest.mark.asyncio
    async def test_get_keyword_frequency_cache(self, cache_service, mock_redis):
        """Test getting keyword frequency cache."""
        test_data = {
            "data": {"keywords": [{"keyword": "python", "count": 10}]},
            "cached_at": datetime.utcnow().isoformat()
        }
        mock_redis.get.return_value = json.dumps(test_data)
        
        result = await cache_service.get_keyword_frequency_cache(
            user_id=1,
            keyword_ids=[1, 2],
            days=7
        )
        
        assert result == test_data
        expected_key = "keyword_freq:1:[1, 2]:7"
        mock_redis.get.assert_called_once_with(expected_key)
    
    @pytest.mark.asyncio
    async def test_set_keyword_frequency_cache(self, cache_service, mock_redis):
        """Test setting keyword frequency cache."""
        test_data = {"keywords": [{"keyword": "python", "count": 10}]}
        mock_redis.set.return_value = True
        
        result = await cache_service.set_keyword_frequency_cache(
            user_id=1,
            keyword_ids=[1, 2],
            days=7,
            data=test_data
        )
        
        assert result is True
        expected_key = "keyword_freq:1:[1, 2]:7"
        
        # Verify the call was made with correct parameters
        mock_redis.set.assert_called_once()
        call_args = mock_redis.set.call_args
        assert call_args[0][0] == expected_key
        
        # Parse the JSON data to verify structure
        cached_data = json.loads(call_args[0][1])
        assert "data" in cached_data
        assert "cached_at" in cached_data
        assert cached_data["data"] == test_data
    
    @pytest.mark.asyncio
    async def test_get_analytics_cache(self, cache_service, mock_redis):
        """Test getting analytics cache."""
        test_data = {
            "data": {"total_posts": 100, "avg_score": 25.5},
            "cached_at": datetime.utcnow().isoformat()
        }
        mock_redis.get.return_value = json.dumps(test_data)
        
        result = await cache_service.get_analytics_cache(
            cache_type="popular_posts",
            user_id=1,
            params={"days": 7, "limit": 10}
        )
        
        assert result == test_data
        expected_key = "analytics:popular_posts:1:{'days': 7, 'limit': 10}"
        mock_redis.get.assert_called_once_with(expected_key)
    
    @pytest.mark.asyncio
    async def test_set_analytics_cache(self, cache_service, mock_redis):
        """Test setting analytics cache."""
        test_data = {"total_posts": 100, "avg_score": 25.5}
        mock_redis.set.return_value = True
        
        result = await cache_service.set_analytics_cache(
            cache_type="popular_posts",
            user_id=1,
            params={"days": 7, "limit": 10},
            data=test_data,
            ttl=1800
        )
        
        assert result is True
        expected_key = "analytics:popular_posts:1:{'days': 7, 'limit': 10}"
        
        # Verify the call was made with correct parameters
        mock_redis.set.assert_called_once()
        call_args = mock_redis.set.call_args
        assert call_args[0][0] == expected_key
        assert call_args[1]["ex"] == 1800
        
        # Parse the JSON data to verify structure
        cached_data = json.loads(call_args[0][1])
        assert "data" in cached_data
        assert "cached_at" in cached_data
        assert cached_data["data"] == test_data
    
    @pytest.mark.asyncio
    async def test_clear_user_cache(self, cache_service, mock_redis):
        """Test clearing all cache for a user."""
        mock_redis.keys.return_value = [
            "keyword_freq:1:*",
            "analytics:*:1:*",
            "user_stats:1"
        ]
        mock_redis.delete.return_value = 3
        
        result = await cache_service.clear_user_cache(user_id=1)
        
        assert result == 3
        mock_redis.keys.assert_called_once_with("*:1:*")
        mock_redis.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_clear_analytics_cache(self, cache_service, mock_redis):
        """Test clearing analytics cache."""
        mock_redis.keys.return_value = [
            "analytics:popular_posts:*",
            "analytics:trending:*",
            "analytics:keyword_stats:*"
        ]
        mock_redis.delete.return_value = 3
        
        result = await cache_service.clear_analytics_cache()
        
        assert result == 3
        mock_redis.keys.assert_called_once_with("analytics:*")
        mock_redis.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_cache_stats(self, cache_service, mock_redis):
        """Test getting cache statistics."""
        mock_redis.keys.return_value = [
            "keyword_freq:1:*",
            "keyword_freq:2:*",
            "analytics:popular_posts:1:*",
            "analytics:trending:1:*",
            "user_stats:1"
        ]
        
        stats = await cache_service.get_cache_stats()
        
        assert "total_keys" in stats
        assert "keyword_frequency_keys" in stats
        assert "analytics_keys" in stats
        assert "user_stats_keys" in stats
        
        assert stats["total_keys"] == 5
        assert stats["keyword_frequency_keys"] == 2
        assert stats["analytics_keys"] == 2
        assert stats["user_stats_keys"] == 1
    
    @pytest.mark.asyncio
    async def test_cache_key_generation(self, cache_service):
        """Test cache key generation methods."""
        # Test keyword frequency key
        key = cache_service._get_keyword_frequency_key(
            user_id=1,
            keyword_ids=[1, 2, 3],
            days=7
        )
        assert key == "keyword_freq:1:[1, 2, 3]:7"
        
        # Test keyword frequency key with None keyword_ids
        key = cache_service._get_keyword_frequency_key(
            user_id=1,
            keyword_ids=None,
            days=7
        )
        assert key == "keyword_freq:1:all:7"
        
        # Test analytics key
        key = cache_service._get_analytics_key(
            cache_type="popular_posts",
            user_id=1,
            params={"days": 7, "limit": 10}
        )
        assert key == "analytics:popular_posts:1:{'days': 7, 'limit': 10}"
    
    @pytest.mark.asyncio
    async def test_error_handling(self, cache_service, mock_redis):
        """Test error handling in cache operations."""
        # Test Redis connection error
        mock_redis.get.side_effect = Exception("Redis connection failed")
        
        result = await cache_service.get("test_key")
        assert result is None
        
        # Test Redis set error
        mock_redis.set.side_effect = Exception("Redis set failed")
        
        result = await cache_service.set("test_key", {"data": "test"})
        assert result is False
        
        # Test Redis delete error
        mock_redis.delete.side_effect = Exception("Redis delete failed")
        
        result = await cache_service.delete("test_key")
        assert result is False
    
    @pytest.mark.asyncio
    async def test_cache_with_complex_data(self, cache_service, mock_redis):
        """Test caching complex data structures."""
        complex_data = {
            "nested": {
                "list": [1, 2, {"inner": "value"}],
                "datetime": datetime.utcnow().isoformat(),
                "boolean": True,
                "null": None
            },
            "array": [
                {"id": 1, "name": "item1"},
                {"id": 2, "name": "item2"}
            ]
        }
        
        mock_redis.set.return_value = True
        mock_redis.get.return_value = json.dumps(complex_data)
        
        # Set complex data
        set_result = await cache_service.set("complex_key", complex_data)
        assert set_result is True
        
        # Get complex data
        get_result = await cache_service.get("complex_key")
        assert get_result == complex_data
    
    @pytest.mark.asyncio
    async def test_cache_ttl_handling(self, cache_service, mock_redis):
        """Test TTL handling in cache operations."""
        test_data = {"key": "value"}
        mock_redis.set.return_value = True
        
        # Test with specific TTL
        await cache_service.set("test_key", test_data, ttl=3600)
        mock_redis.set.assert_called_with("test_key", json.dumps(test_data), ex=3600)
        
        # Test with default TTL (None)
        await cache_service.set("test_key2", test_data)
        mock_redis.set.assert_called_with("test_key2", json.dumps(test_data), ex=None)
        
        # Test expire method
        mock_redis.expire.return_value = True
        result = await cache_service.expire("test_key", 1800)
        assert result is True
        mock_redis.expire.assert_called_with("test_key", 1800)