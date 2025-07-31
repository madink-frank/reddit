from celery import Celery
from celery.exceptions import Retry
from functools import wraps
import logging
import time
from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "reddit_platform",
    broker=settings.CELERY_BROKER_URL or settings.REDIS_URL,
    backend=settings.CELERY_RESULT_BACKEND or settings.REDIS_URL,
    include=["app.workers.reddit_crawler", "app.workers.content_generator", "app.workers.monitoring"]
)

# Celery configuration with enhanced error handling and resilience
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=2,  # Increased for better throughput
    worker_max_tasks_per_child=1000,
    
    # Enhanced Redis connection settings for reliability
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    broker_connection_retry_delay=1,  # Initial delay between retries
    broker_connection_max_retry_delay=60,  # Maximum delay between retries
    
    # Result backend connection settings
    result_backend_connection_retry_on_startup=True,
    result_backend_connection_retry=True,
    result_backend_connection_max_retries=10,
    
    # Task retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Optimized transport options for Redis performance
    broker_transport_options={
        'visibility_timeout': 3600,
        'fanout_prefix': True,
        'fanout_patterns': True,
        'socket_keepalive': True,
        'socket_keepalive_options': {
            'TCP_KEEPIDLE': 1,
            'TCP_KEEPINTVL': 3,
            'TCP_KEEPCNT': 5,
        },
        'retry_on_timeout': True,
        'health_check_interval': 15,  # More frequent health checks
        
        # Performance optimizations
        'max_connections': 50,  # Increased connection pool
        'socket_connect_timeout': 3,  # Faster connection timeout
        'socket_timeout': 2,  # Faster operation timeout
        'connection_pool_kwargs': {
            'max_connections': 50,
            'retry_on_timeout': True,
            'socket_keepalive': True,
            'socket_keepalive_options': {
                'TCP_KEEPIDLE': 1,
                'TCP_KEEPINTVL': 3,
                'TCP_KEEPCNT': 5,
            }
        }
    },
    
    # Optimized result backend transport options
    result_backend_transport_options={
        'socket_keepalive': True,
        'socket_keepalive_options': {
            'TCP_KEEPIDLE': 1,
            'TCP_KEEPINTVL': 3,
            'TCP_KEEPCNT': 5,
        },
        'retry_on_timeout': True,
        'health_check_interval': 15,  # More frequent health checks
        
        # Performance optimizations
        'max_connections': 30,  # Dedicated pool for results
        'socket_connect_timeout': 3,
        'socket_timeout': 2,
        'connection_pool_kwargs': {
            'max_connections': 30,
            'retry_on_timeout': True,
            'socket_keepalive': True,
        }
    },
    
    # Additional performance settings
    worker_pool_restarts=True,
    worker_max_memory_per_child=200000,  # 200MB per worker before restart
    worker_disable_rate_limits=False,
    worker_enable_remote_control=True,
    
    # Task routing for better performance
    task_routes={
        'app.workers.reddit_crawler.*': {'queue': 'crawler'},
        'app.workers.content_generator.*': {'queue': 'content'},
        'app.workers.monitoring.*': {'queue': 'monitoring'},
    },
    
    # Queue priorities
    task_queue_max_priority=10,
    task_default_priority=5
)

# Celery Beat schedule for periodic tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    # Crawl trending posts every 2 hours
    "crawl-trending-posts": {
        "task": "app.workers.reddit_crawler.crawl_trending_posts",
        "schedule": crontab(minute=0, hour="*/2"),  # Every 2 hours at minute 0
        "args": (100,),  # limit parameter
    },
    
    # Crawl all active keywords every 4 hours
    "crawl-all-keywords": {
        "task": "app.workers.reddit_crawler.crawl_all_active_keywords",
        "schedule": crontab(minute=30, hour="*/4"),  # Every 4 hours at minute 30
    },
    
    # Clean up old posts weekly
    "cleanup-old-posts": {
        "task": "app.workers.reddit_crawler.cleanup_old_posts",
        "schedule": crontab(minute=0, hour=2, day_of_week=0),  # Every Sunday at 2:00 AM
        "args": (30,),  # Delete posts older than 30 days
    },
    
    # Update analytics cache every 6 hours
    "update-analytics-cache": {
        "task": "app.workers.content_generator.update_analytics_cache",
        "schedule": crontab(minute=0, hour="*/6"),  # Every 6 hours
    },
    
    # Health check and alerting every 15 minutes
    "health-check-and-alert": {
        "task": "health_check_and_alert",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    
    # System metrics collection every 5 minutes
    "system-metrics-collection": {
        "task": "system_metrics_collection",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
}


def resilient_task(bind=True, autoretry_for=(Exception,), retry_kwargs=None, **task_kwargs):
    """
    Decorator for creating resilient Celery tasks with exponential backoff.
    
    Args:
        bind: Whether to bind the task instance
        autoretry_for: Tuple of exceptions to automatically retry on
        retry_kwargs: Additional retry configuration
        **task_kwargs: Additional task configuration
    """
    if retry_kwargs is None:
        retry_kwargs = {
            'max_retries': 3,
            'countdown': 60,  # Initial delay
            'retry_backoff': True,
            'retry_backoff_max': 600,  # Max 10 minutes
            'retry_jitter': True,
        }
    
    def decorator(func):
        @celery_app.task(bind=bind, autoretry_for=autoretry_for, retry_kwargs=retry_kwargs, **task_kwargs)
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            try:
                logger.info(f"Starting resilient task: {func.__name__}")
                result = func(self, *args, **kwargs)
                logger.info(f"Completed resilient task: {func.__name__}")
                return result
            except Exception as exc:
                logger.error(f"Task {func.__name__} failed with error: {exc}")
                
                # Check if we should retry
                if self.request.retries < self.max_retries:
                    # Calculate exponential backoff delay
                    delay = min(
                        retry_kwargs.get('countdown', 60) * (2 ** self.request.retries),
                        retry_kwargs.get('retry_backoff_max', 600)
                    )
                    
                    logger.warning(
                        f"Retrying task {func.__name__} in {delay} seconds "
                        f"(attempt {self.request.retries + 1}/{self.max_retries})"
                    )
                    
                    raise self.retry(countdown=delay, exc=exc)
                else:
                    logger.error(f"Task {func.__name__} failed permanently after {self.max_retries} retries")
                    raise exc
        
        return wrapper
    return decorator