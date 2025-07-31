import redis.asyncio as redis
from typing import Optional, Any, Union
import json
import asyncio
import logging
import time
from datetime import datetime, timedelta
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisPerformanceMonitor:
    """Monitor Redis performance metrics"""
    
    def __init__(self):
        self.operation_times = []
        self.connection_pool_stats = {}
        self.error_counts = {}
        self.last_reset = datetime.utcnow()
    
    def record_operation(self, operation: str, duration: float, success: bool = True):
        """Record operation performance metrics"""
        timestamp = datetime.utcnow()
        
        # Keep only last 1000 operations for memory efficiency
        if len(self.operation_times) >= 1000:
            self.operation_times = self.operation_times[-500:]
        
        self.operation_times.append({
            'operation': operation,
            'duration': duration,
            'timestamp': timestamp,
            'success': success
        })
        
        if not success:
            self.error_counts[operation] = self.error_counts.get(operation, 0) + 1
    
    def get_performance_stats(self) -> dict:
        """Get performance statistics"""
        if not self.operation_times:
            return {
                'total_operations': 0,
                'average_response_time': 0,
                'error_rate': 0,
                'operations_per_second': 0
            }
        
        # Calculate metrics from last hour
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_ops = [op for op in self.operation_times if op['timestamp'] > one_hour_ago]
        
        if not recent_ops:
            return {
                'total_operations': len(self.operation_times),
                'average_response_time': 0,
                'error_rate': 0,
                'operations_per_second': 0
            }
        
        total_ops = len(recent_ops)
        successful_ops = [op for op in recent_ops if op['success']]
        failed_ops = [op for op in recent_ops if not op['success']]
        
        avg_response_time = sum(op['duration'] for op in successful_ops) / len(successful_ops) if successful_ops else 0
        error_rate = len(failed_ops) / total_ops * 100 if total_ops > 0 else 0
        ops_per_second = total_ops / 3600  # Operations per second over the last hour
        
        return {
            'total_operations': total_ops,
            'average_response_time': round(avg_response_time * 1000, 2),  # Convert to ms
            'error_rate': round(error_rate, 2),
            'operations_per_second': round(ops_per_second, 2),
            'successful_operations': len(successful_ops),
            'failed_operations': len(failed_ops),
            'error_breakdown': dict(self.error_counts)
        }

class RedisClient:
    def __init__(self):
        self.redis_client = None
        self.connection_pool = None
        self._initialized = False
        self._connection_healthy = False
        self._last_connection_attempt = None
        self._connection_failures = 0
        self._max_connection_failures = 5
        self.performance_monitor = RedisPerformanceMonitor()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((redis.ConnectionError, redis.TimeoutError, ConnectionError))
    )
    async def initialize(self):
        """Initialize async Redis client with optimized connection pooling"""
        try:
            if not self._initialized:
                # Create optimized connection pool for production load
                self.connection_pool = redis.ConnectionPool.from_url(
                    settings.REDIS_URL,
                    # Connection pool settings optimized for production
                    max_connections=50,  # Increased for higher concurrency
                    retry_on_timeout=True,
                    retry_on_error=[redis.ConnectionError, redis.TimeoutError],
                    
                    # Socket settings for better performance
                    socket_connect_timeout=3,  # Reduced for faster failure detection
                    socket_timeout=2,  # Reduced for faster operations
                    socket_keepalive=True,
                    socket_keepalive_options={
                        'TCP_KEEPIDLE': 1,
                        'TCP_KEEPINTVL': 3,
                        'TCP_KEEPCNT': 5,
                    },
                    
                    # Health check settings
                    health_check_interval=15,  # More frequent health checks
                    
                    # Encoding settings
                    decode_responses=True,
                    encoding='utf-8',
                    
                    # Connection retry settings (handled by tenacity decorator)
                )
                
                # Create Redis client with the optimized pool
                self.redis_client = redis.Redis(
                    connection_pool=self.connection_pool,
                    single_connection_client=False  # Use connection pooling
                )
                
                # Test the connection with performance monitoring
                start_time = time.time()
                await self.redis_client.ping()
                duration = time.time() - start_time
                
                self.performance_monitor.record_operation('ping', duration, True)
                self._initialized = True
                self._connection_healthy = True
                self._connection_failures = 0
                
                logger.info(f"Redis connection established successfully with optimized pool (ping: {duration*1000:.2f}ms)")
                
                # Log connection pool configuration
                logger.info(f"Redis connection pool configured: max_connections=50, health_check_interval=15s")
                
        except Exception as e:
            self._connection_failures += 1
            self._connection_healthy = False
            
            # Record failed operation
            self.performance_monitor.record_operation('initialize', 0, False)
            
            logger.error(f"Redis connection failed (attempt {self._connection_failures}): {e}")
            
            if self._connection_failures >= self._max_connection_failures:
                logger.warning("Max Redis connection failures reached, entering degraded mode")
            raise
    
    async def ensure_connection(self):
        """Ensure Redis connection is established with graceful degradation"""
        if not self._initialized or not self._connection_healthy:
            try:
                await self.initialize()
            except Exception as e:
                logger.warning(f"Redis connection unavailable, operating in degraded mode: {e}")
                return False
        return True
    
    def is_healthy(self) -> bool:
        """Check if Redis connection is healthy"""
        return self._connection_healthy and self._initialized
    
    async def ping(self) -> bool:
        """Test Redis connectivity with performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('ping', 0, False)
                return False
                
            result = await self.redis_client.ping()
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('ping', duration, True)
            self._connection_healthy = True
            self._connection_failures = 0
            
            # Log slow pings (> 50ms)
            if duration > 0.05:
                logger.warning(f"Slow Redis PING detected: {duration*1000:.2f}ms")
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('ping', duration, False)
            self._connection_healthy = False
            self._connection_failures += 1
            logger.warning(f"Redis PING error: {e}")
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis with performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('get', 0, False)
                logger.debug(f"Redis unavailable, cache miss for key: {key}")
                return None
                
            value = await self.redis_client.get(key)
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('get', duration, True)
            
            # Log slow operations (> 10ms)
            if duration > 0.01:
                logger.warning(f"Slow Redis GET for key '{key}': {duration*1000:.2f}ms")
            
            if value:
                # Try to parse as JSON, if it fails return raw value
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('get', duration, False)
            self._connection_healthy = False
            logger.warning(f"Redis GET error for key '{key}': {e}")
            return None
    
    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Set value in Redis with performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('set', 0, False)
                logger.debug(f"Redis unavailable, skipping cache set for key: {key}")
                return False
                
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value, default=str)
            else:
                serialized_value = str(value)
            
            result = await self.redis_client.setex(key, expire, serialized_value)
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('set', duration, True)
            
            # Log slow operations (> 10ms)
            if duration > 0.01:
                logger.warning(f"Slow Redis SET for key '{key}': {duration*1000:.2f}ms")
            
            return bool(result)
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('set', duration, False)
            self._connection_healthy = False
            logger.warning(f"Redis SET error for key '{key}': {e}")
            return False
    
    async def setex(self, key: str, time: int, value: Union[str, Any]) -> bool:
        """Set value in Redis with expiration time and performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('setex', 0, False)
                logger.debug(f"Redis unavailable, skipping cache setex for key: {key}")
                return False
                
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value, default=str)
            else:
                serialized_value = str(value)
            
            result = await self.redis_client.setex(key, time, serialized_value)
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('setex', duration, True)
            
            # Log slow operations (> 10ms)
            if duration > 0.01:
                logger.warning(f"Slow Redis SETEX for key '{key}': {duration*1000:.2f}ms")
            
            return bool(result)
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('setex', duration, False)
            self._connection_healthy = False
            logger.warning(f"Redis SETEX error for key '{key}': {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis with performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('delete', 0, False)
                logger.debug(f"Redis unavailable, skipping cache delete for key: {key}")
                return False
                
            result = await self.redis_client.delete(key)
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('delete', duration, True)
            
            # Log slow operations (> 10ms)
            if duration > 0.01:
                logger.warning(f"Slow Redis DELETE for key '{key}': {duration*1000:.2f}ms")
            
            return bool(result)
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('delete', duration, False)
            self._connection_healthy = False
            logger.warning(f"Redis DELETE error for key '{key}': {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis with performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('exists', 0, False)
                logger.debug(f"Redis unavailable, assuming key does not exist: {key}")
                return False
                
            result = await self.redis_client.exists(key)
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('exists', duration, True)
            
            # Log slow operations (> 10ms)
            if duration > 0.01:
                logger.warning(f"Slow Redis EXISTS for key '{key}': {duration*1000:.2f}ms")
            
            return bool(result)
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('exists', duration, False)
            self._connection_healthy = False
            logger.warning(f"Redis EXISTS error for key '{key}': {e}")
            return False
    
    async def info(self) -> dict:
        """Get Redis server information with performance monitoring"""
        start_time = time.time()
        try:
            connection_ok = await self.ensure_connection()
            if not connection_ok:
                self.performance_monitor.record_operation('info', 0, False)
                return {"error": "Redis connection unavailable"}
                
            info_data = await self.redis_client.info()
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('info', duration, True)
            
            # Add connection pool statistics
            if self.connection_pool:
                pool_stats = {
                    'max_connections': self.connection_pool.max_connections,
                    'created_connections': getattr(self.connection_pool, 'created_connections', 0),
                    'available_connections': getattr(self.connection_pool, 'available_connections', 0),
                    'in_use_connections': getattr(self.connection_pool, 'in_use_connections', 0)
                }
                info_data['connection_pool'] = pool_stats
            
            return info_data
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('info', duration, False)
            self._connection_healthy = False
            logger.warning(f"Redis INFO error: {e}")
            return {"error": str(e)}
    
    async def close(self):
        """Close Redis connection and connection pool"""
        try:
            if self.redis_client:
                await self.redis_client.close()
            if self.connection_pool:
                await self.connection_pool.disconnect()
            
            self._initialized = False
            self._connection_healthy = False
            logger.info("Redis connection and pool closed")
        except Exception as e:
            logger.warning(f"Error closing Redis connection: {e}")
    
    async def reconnect(self):
        """Force reconnection to Redis with performance monitoring"""
        start_time = time.time()
        try:
            await self.close()
            await self.initialize()
            duration = time.time() - start_time
            
            self.performance_monitor.record_operation('reconnect', duration, True)
            logger.info(f"Redis reconnection successful ({duration*1000:.2f}ms)")
            return True
        except Exception as e:
            duration = time.time() - start_time
            self.performance_monitor.record_operation('reconnect', duration, False)
            logger.error(f"Redis reconnection failed: {e}")
            return False
    
    def get_performance_stats(self) -> dict:
        """Get Redis performance statistics"""
        stats = self.performance_monitor.get_performance_stats()
        
        # Add connection health information
        stats.update({
            'connection_healthy': self._connection_healthy,
            'connection_failures': self._connection_failures,
            'initialized': self._initialized,
            'last_connection_attempt': self._last_connection_attempt.isoformat() if self._last_connection_attempt else None
        })
        
        return stats
    
    async def get_connection_pool_stats(self) -> dict:
        """Get connection pool statistics"""
        if not self.connection_pool:
            return {"error": "Connection pool not initialized"}
        
        try:
            # Get Redis info for additional metrics
            info = await self.redis_client.info()
            
            return {
                'pool_max_connections': self.connection_pool.max_connections,
                'pool_created_connections': getattr(self.connection_pool, 'created_connections', 0),
                'pool_available_connections': getattr(self.connection_pool, 'available_connections', 0),
                'pool_in_use_connections': getattr(self.connection_pool, 'in_use_connections', 0),
                'redis_connected_clients': info.get('connected_clients', 0),
                'redis_used_memory': info.get('used_memory_human', 'N/A'),
                'redis_total_commands_processed': info.get('total_commands_processed', 0),
                'redis_instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec', 0)
            }
        except Exception as e:
            logger.warning(f"Error getting connection pool stats: {e}")
            return {"error": str(e)}

# Global Redis client instance
redis_client = RedisClient()

async def get_redis_client() -> RedisClient:
    """Get Redis client instance"""
    return redis_client