"""
Prometheus metrics collection for the Reddit Content Platform.
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client.core import CollectorRegistry
from fastapi import Request, Response
from fastapi.responses import PlainTextResponse
import time
from typing import Callable

# Create a custom registry for our metrics
REGISTRY = CollectorRegistry()

# API Metrics
api_requests_total = Counter(
    'api_requests_total',
    'Total number of API requests',
    ['method', 'endpoint', 'status_code'],
    registry=REGISTRY
)

api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint'],
    registry=REGISTRY
)

api_requests_in_progress = Gauge(
    'api_requests_in_progress',
    'Number of API requests currently being processed',
    registry=REGISTRY
)

# Crawling Metrics
crawling_jobs_total = Counter(
    'crawling_jobs_total',
    'Total number of crawling jobs',
    ['job_type', 'status'],
    registry=REGISTRY
)

crawling_posts_collected = Counter(
    'crawling_posts_collected_total',
    'Total number of posts collected from crawling',
    ['keyword', 'subreddit'],
    registry=REGISTRY
)

crawling_job_duration_seconds = Histogram(
    'crawling_job_duration_seconds',
    'Duration of crawling jobs in seconds',
    ['job_type'],
    registry=REGISTRY
)

active_crawling_jobs = Gauge(
    'active_crawling_jobs',
    'Number of currently active crawling jobs',
    registry=REGISTRY
)

# Content Generation Metrics
content_generation_total = Counter(
    'content_generation_total',
    'Total number of content generation requests',
    ['content_type', 'status'],
    registry=REGISTRY
)

content_generation_duration_seconds = Histogram(
    'content_generation_duration_seconds',
    'Duration of content generation in seconds',
    ['content_type'],
    registry=REGISTRY
)

# System Metrics
active_users = Gauge(
    'active_users_total',
    'Number of active users',
    registry=REGISTRY
)

database_connections = Gauge(
    'database_connections_active',
    'Number of active database connections',
    registry=REGISTRY
)

redis_connections = Gauge(
    'redis_connections_active',
    'Number of active Redis connections',
    registry=REGISTRY
)

# Error Metrics
errors_total = Counter(
    'errors_total',
    'Total number of errors',
    ['error_type', 'component'],
    registry=REGISTRY
)

# Cache Metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total number of cache hits',
    ['cache_type'],
    registry=REGISTRY
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total number of cache misses',
    ['cache_type'],
    registry=REGISTRY
)


class PrometheusMiddleware:
    """Middleware to collect API metrics."""
    
    def __init__(self, app_name: str = "reddit_content_platform"):
        self.app_name = app_name
    
    async def __call__(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics collection for the metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)
        
        # Increment in-progress requests
        api_requests_in_progress.inc()
        
        # Record start time
        start_time = time.time()
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Record metrics
            method = request.method
            endpoint = self._get_endpoint_name(request.url.path)
            status_code = str(response.status_code)
            
            # Increment request counter
            api_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()
            
            # Record request duration
            duration = time.time() - start_time
            api_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            return response
            
        except Exception as e:
            # Record error metrics
            errors_total.labels(
                error_type=type(e).__name__,
                component="api"
            ).inc()
            raise
        finally:
            # Decrement in-progress requests
            api_requests_in_progress.dec()
    
    def _get_endpoint_name(self, path: str) -> str:
        """Extract endpoint name from path for consistent labeling."""
        # Remove API version prefix
        if path.startswith("/api/v1"):
            path = path[7:]
        
        # Replace path parameters with placeholders
        parts = path.split("/")
        normalized_parts = []
        
        for part in parts:
            if part.isdigit():
                normalized_parts.append("{id}")
            elif part and not part.isalnum() and part != "health" and part != "metrics":
                normalized_parts.append("{param}")
            else:
                normalized_parts.append(part)
        
        return "/".join(normalized_parts) or "/"


def get_metrics_response() -> PlainTextResponse:
    """Generate Prometheus metrics response."""
    metrics_data = generate_latest(REGISTRY)
    return PlainTextResponse(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST
    )


# Utility functions for recording metrics from other parts of the application

def record_crawling_job_start(job_type: str):
    """Record the start of a crawling job."""
    active_crawling_jobs.inc()
    

def record_crawling_job_complete(job_type: str, duration: float, status: str, posts_count: int = 0, keyword: str = "", subreddit: str = ""):
    """Record the completion of a crawling job."""
    active_crawling_jobs.dec()
    crawling_jobs_total.labels(job_type=job_type, status=status).inc()
    crawling_job_duration_seconds.labels(job_type=job_type).observe(duration)
    
    if posts_count > 0 and keyword and subreddit:
        crawling_posts_collected.labels(keyword=keyword, subreddit=subreddit).inc(posts_count)


def record_content_generation(content_type: str, duration: float, status: str):
    """Record content generation metrics."""
    content_generation_total.labels(content_type=content_type, status=status).inc()
    content_generation_duration_seconds.labels(content_type=content_type).observe(duration)


def record_cache_hit(cache_type: str):
    """Record a cache hit."""
    cache_hits_total.labels(cache_type=cache_type).inc()


def record_cache_miss(cache_type: str):
    """Record a cache miss."""
    cache_misses_total.labels(cache_type=cache_type).inc()


def record_error(error_type: str, component: str):
    """Record an error occurrence."""
    errors_total.labels(error_type=error_type, component=component).inc()


def update_active_users(count: int):
    """Update the active users gauge."""
    active_users.set(count)


def update_database_connections(count: int):
    """Update the database connections gauge."""
    database_connections.set(count)


def update_redis_connections(count: int):
    """Update the Redis connections gauge."""
    redis_connections.set(count)