# Design Document

## Overview

This design addresses the Redis connection issues in the Reddit Content Platform by implementing proper async Redis client configuration, fixing Celery broker connections, and improving error handling and monitoring.

## Architecture

### Current Issues Analysis

Based on the health check results, the following issues have been identified:

1. **Redis Connection Error**: `'coroutine' object has no attribute 'ping'`
   - Root cause: Improper async Redis client usage
   - Impact: Caching and session management disabled

2. **Celery Connection Error**: `Connection refused to redis.railway.internal:6379`
   - Root cause: Incorrect Redis broker URL configuration
   - Impact: Background tasks not processing

3. **Health Check Inconsistency**: Overall system reports unhealthy despite core functionality working
   - Root cause: Health checks not properly handling Redis failures
   - Impact: Misleading system status

## Components and Interfaces

### 1. Redis Client Configuration

#### Current Implementation Issues
```python
# Problematic async Redis usage
redis_client.ping()  # Synchronous call on async client
```

#### Proposed Solution
```python
# Proper async Redis client implementation
import redis.asyncio as redis
from redis.asyncio import ConnectionPool

class RedisManager:
    def __init__(self):
        self.pool = None
        self.client = None
    
    async def initialize(self):
        self.pool = ConnectionPool.from_url(
            url=settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
            retry_on_timeout=True
        )
        self.client = redis.Redis(connection_pool=self.pool)
    
    async def ping(self):
        return await self.client.ping()
    
    async def close(self):
        if self.client:
            await self.client.close()
```

### 2. Celery Configuration

#### Current Configuration Issues
```python
# Incorrect broker URL format
CELERY_BROKER_URL = "redis://redis.railway.internal:6379"
```

#### Proposed Solution
```python
# Proper Railway Redis URL with authentication
CELERY_BROKER_URL = settings.REDIS_URL  # Uses full Redis URL with auth
CELERY_RESULT_BACKEND = settings.REDIS_URL

# Additional Celery configuration for reliability
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_CONNECTION_RETRY = True
CELERY_BROKER_CONNECTION_MAX_RETRIES = 10
```

### 3. Environment Configuration

#### Railway Environment Variables
```bash
# Current Railway environment provides:
REDIS_URL=redis://default:password@redis.railway.internal:6379
REDIS_PASSWORD=WutUmkzdLVisXrlycEHhdfOsoGNPOdvA
REDISHOST=redis.railway.internal
REDISPORT=6379
```

#### Configuration Management
```python
class Settings:
    # Use the full Redis URL provided by Railway
    REDIS_URL: str = Field(default_factory=lambda: os.getenv("REDIS_URL"))
    
    # Fallback construction if needed
    @property
    def redis_url_fallback(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        
        host = os.getenv("REDISHOST", "localhost")
        port = os.getenv("REDISPORT", "6379")
        password = os.getenv("REDIS_PASSWORD", "")
        
        if password:
            return f"redis://default:{password}@{host}:{port}"
        return f"redis://{host}:{port}"
```

### 4. Health Check Improvements

#### Enhanced Health Check Implementation
```python
async def check_redis_health() -> HealthStatus:
    try:
        start_time = time.time()
        await redis_manager.ping()
        response_time = (time.time() - start_time) * 1000
        
        return HealthStatus(
            healthy=True,
            status="connected",
            response_time_ms=response_time,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        return HealthStatus(
            healthy=False,
            status="disconnected",
            error=str(e),
            timestamp=datetime.utcnow()
        )

async def check_celery_health() -> HealthStatus:
    try:
        # Check Celery worker status
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        if active_workers:
            return HealthStatus(
                healthy=True,
                status="workers_active",
                worker_count=len(active_workers),
                timestamp=datetime.utcnow()
            )
        else:
            return HealthStatus(
                healthy=False,
                status="no_workers",
                timestamp=datetime.utcnow()
            )
    except Exception as e:
        return HealthStatus(
            healthy=False,
            status="error",
            error=str(e),
            timestamp=datetime.utcnow()
        )
```

## Data Models

### Health Status Model
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HealthStatus(BaseModel):
    healthy: bool
    status: str
    error: Optional[str] = None
    response_time_ms: Optional[float] = None
    worker_count: Optional[int] = None
    timestamp: datetime
```

### Redis Connection Model
```python
class RedisConnectionInfo(BaseModel):
    host: str
    port: int
    password_set: bool
    pool_size: int
    active_connections: int
    max_connections: int
```

## Error Handling

### 1. Connection Retry Logic
```python
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def connect_redis():
    try:
        await redis_manager.initialize()
        await redis_manager.ping()
        logger.info("Redis connection established successfully")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        raise
```

### 2. Graceful Degradation
```python
class CacheService:
    async def get(self, key: str) -> Optional[str]:
        try:
            return await redis_manager.client.get(key)
        except Exception as e:
            logger.warning(f"Redis get failed, falling back: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl: int = 3600):
        try:
            await redis_manager.client.setex(key, ttl, value)
        except Exception as e:
            logger.warning(f"Redis set failed, continuing without cache: {e}")
```

## Testing Strategy

### 1. Unit Tests
- Redis client initialization and connection
- Celery configuration validation
- Health check logic
- Error handling scenarios

### 2. Integration Tests
- End-to-end Redis operations
- Celery task processing
- Health endpoint responses
- Connection recovery scenarios

### 3. Production Validation
- Health check monitoring
- Performance metrics collection
- Error rate tracking
- Connection stability monitoring

## Implementation Plan

### Phase 1: Redis Client Fix (30 minutes)
1. Update Redis client configuration
2. Fix async/await usage
3. Test connection establishment

### Phase 2: Celery Configuration (15 minutes)
1. Update Celery broker URL
2. Add connection retry configuration
3. Test worker connectivity

### Phase 3: Health Check Enhancement (15 minutes)
1. Improve health check logic
2. Add detailed error reporting
3. Test health endpoint responses

### Phase 4: Validation and Monitoring (15 minutes)
1. Deploy changes to Railway
2. Verify all services healthy
3. Monitor system stability