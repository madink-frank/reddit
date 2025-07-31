"""
Monitoring and alerting Celery workers.
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from celery import current_task

from app.core.celery_app import celery_app
from app.services.health_check_service import health_service
from app.services.notification_service import notification_service
from app.core.metrics import update_active_users, update_database_connections, update_redis_connections
from app.core.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)


@celery_app.task(name="health_check_and_alert")
def health_check_and_alert() -> Dict[str, Any]:
    """
    Periodic task to check system health and send alerts if needed.
    
    Returns:
        Dictionary containing health check results
    """
    logger.info("Starting periodic health check and alerting")
    
    try:
        import asyncio
        
        # Run health checks with alerting enabled
        health_status = asyncio.run(health_service.get_health_status(
            include_details=True,
            send_alerts=True
        ))
        
        # Update system metrics based on health check results
        await _update_system_metrics(health_status)
        
        # Check for specific threshold violations
        await _check_threshold_violations(health_status)
        
        result = {
            'status': 'completed',
            'overall_healthy': health_status['overall_healthy'],
            'healthy_services': health_status['summary']['healthy_services'],
            'total_services': health_status['summary']['total_services'],
            'health_percentage': health_status['summary']['health_percentage'],
            'timestamp': health_status['timestamp']
        }
        
        logger.info(f"Health check completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Health check and alert task failed: {str(e)}")
        
        # Send alert about monitoring system failure
        try:
            import asyncio
            asyncio.create_task(notification_service.send_notification(
                alert_type='monitoring_system_failure',
                message=f"Health monitoring system failed: {str(e)}",
                details={'error': str(e)},
                level=notification_service.NotificationLevel.CRITICAL
            ))
        except Exception as alert_error:
            logger.error(f"Failed to send monitoring failure alert: {str(alert_error)}")
        
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


async def _update_system_metrics(health_status: Dict[str, Any]):
    """Update Prometheus metrics based on health check results."""
    try:
        # Update database connection metrics
        db_status = health_status['services'].get('database', {})
        if db_status.get('healthy') and 'active_connections' in db_status:
            update_database_connections(db_status['active_connections'])
        
        # Update Redis connection metrics
        redis_status = health_status['services'].get('redis', {})
        if redis_status.get('healthy') and 'connected_clients' in redis_status:
            update_redis_connections(redis_status['connected_clients'])
        
        # Update active users count
        try:
            db = next(get_db())
            try:
                active_user_count = db.query(User).filter(User.is_active == True).count()
                update_active_users(active_user_count)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to update active users metric: {str(e)}")
            
    except Exception as e:
        logger.error(f"Failed to update system metrics: {str(e)}")


async def _check_threshold_violations(health_status: Dict[str, Any]):
    """Check for threshold violations and send alerts."""
    try:
        # Check disk space
        disk_status = health_status['services'].get('disk_space', {})
        if disk_status.get('healthy') == False and disk_status.get('status') == 'low_space':
            await notification_service.alert_resource_usage(
                resource_type='disk_space',
                usage_value=disk_status.get('usage_percent', 0),
                threshold=90.0,
                unit='%'
            )
        
        # Check memory usage
        memory_status = health_status['services'].get('memory', {})
        if memory_status.get('healthy') == False and memory_status.get('status') == 'high_usage':
            await notification_service.alert_resource_usage(
                resource_type='memory',
                usage_value=memory_status.get('usage_percent', 0),
                threshold=90.0,
                unit='%'
            )
            
    except Exception as e:
        logger.error(f"Failed to check threshold violations: {str(e)}")


@celery_app.task(name="api_response_time_check")
def api_response_time_check(endpoint: str, response_time: float) -> Dict[str, Any]:
    """
    Task to check API response time and send alerts if threshold exceeded.
    This would typically be called from middleware.
    
    Args:
        endpoint: API endpoint that was called
        response_time: Response time in seconds
        
    Returns:
        Dictionary containing check results
    """
    try:
        import asyncio
        
        # Check if response time exceeds threshold
        asyncio.create_task(notification_service.check_and_alert_api_response_time(
            response_time=response_time,
            endpoint=endpoint
        ))
        
        return {
            'status': 'completed',
            'endpoint': endpoint,
            'response_time': response_time,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"API response time check failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


@celery_app.task(name="crawling_failure_alert")
def crawling_failure_alert(keyword_id: int, keyword: str, error: str) -> Dict[str, Any]:
    """
    Task to send crawling failure alerts.
    
    Args:
        keyword_id: ID of the keyword that failed
        keyword: Keyword that failed
        error: Error message
        
    Returns:
        Dictionary containing alert results
    """
    try:
        import asyncio
        
        asyncio.create_task(notification_service.alert_crawling_failure(
            keyword_id=keyword_id,
            keyword=keyword,
            error=error
        ))
        
        return {
            'status': 'completed',
            'keyword_id': keyword_id,
            'keyword': keyword,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Crawling failure alert task failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


@celery_app.task(name="system_metrics_collection")
def system_metrics_collection() -> Dict[str, Any]:
    """
    Periodic task to collect and update system metrics.
    
    Returns:
        Dictionary containing metrics collection results
    """
    logger.info("Starting system metrics collection")
    
    try:
        import asyncio
        
        # Get health status for metrics
        health_status = asyncio.run(health_service.get_health_status(
            include_details=True,
            send_alerts=False  # Don't send alerts, just collect metrics
        ))
        
        # Update metrics
        await _update_system_metrics(health_status)
        
        # Collect additional metrics
        metrics_collected = []
        
        # Database metrics
        db_status = health_status['services'].get('database', {})
        if db_status.get('healthy'):
            metrics_collected.append('database_connections')
        
        # Redis metrics
        redis_status = health_status['services'].get('redis', {})
        if redis_status.get('healthy'):
            metrics_collected.append('redis_connections')
        
        # System resource metrics
        if health_status['services'].get('disk_space', {}).get('healthy') is not None:
            metrics_collected.append('disk_usage')
        
        if health_status['services'].get('memory', {}).get('healthy') is not None:
            metrics_collected.append('memory_usage')
        
        result = {
            'status': 'completed',
            'metrics_collected': metrics_collected,
            'total_metrics': len(metrics_collected),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"System metrics collection completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"System metrics collection failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


@celery_app.task(name="send_test_notification")
def send_test_notification(
    alert_type: str = "test_alert",
    message: str = "This is a test notification",
    level: str = "info"
) -> Dict[str, Any]:
    """
    Task to send a test notification for testing the notification system.
    
    Args:
        alert_type: Type of alert to send
        message: Message to send
        level: Notification level
        
    Returns:
        Dictionary containing notification results
    """
    try:
        import asyncio
        from app.services.notification_service import NotificationLevel
        
        # Convert string level to enum
        notification_level = getattr(NotificationLevel, level.upper(), NotificationLevel.INFO)
        
        result = asyncio.run(notification_service.send_notification(
            alert_type=alert_type,
            message=message,
            level=notification_level,
            details={
                'test': True,
                'sent_at': datetime.now(timezone.utc).isoformat()
            }
        ))
        
        logger.info(f"Test notification sent: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Test notification failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }