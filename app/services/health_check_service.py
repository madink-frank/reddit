"""
Health check service for monitoring system components.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from redis import Redis
from celery import Celery

from app.core.database import get_db
from app.utils.redis_client import get_redis_client
from app.core.celery_app import celery_app
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


class HealthCheckService:
    """Service for performing health checks on system components."""
    
    def __init__(self):
        self.checks = {
            'database': self._check_database,
            'redis': self._check_redis,
            'celery': self._check_celery,
            'disk_space': self._check_disk_space,
            'memory': self._check_memory
        }
    
    async def get_health_status(self, include_details: bool = True, send_alerts: bool = False) -> Dict[str, Any]:
        """
        Get comprehensive health status of all system components.
        
        Args:
            include_details: Whether to include detailed information
            send_alerts: Whether to send alerts for unhealthy services
            
        Returns:
            Dictionary containing health status information
        """
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'services': {},
            'overall_healthy': True,
            'degraded_mode': False
        }
        
        # Run all health checks
        for service_name, check_func in self.checks.items():
            try:
                service_status = await check_func()
                health_status['services'][service_name] = service_status
                
                # Send alerts for unhealthy services
                if send_alerts and not service_status.get('healthy', False):
                    await self._send_health_alert(service_name, service_status)
                
                # Update overall health status
                if not service_status.get('healthy', False):
                    # Check if service is in degraded mode (Redis/Celery can be unavailable)
                    if service_status.get('degraded_mode', False) and service_name in ['redis', 'celery']:
                        health_status['degraded_mode'] = True
                        if health_status['status'] == 'healthy':
                            health_status['status'] = 'degraded'
                    else:
                        health_status['overall_healthy'] = False
                        health_status['status'] = 'unhealthy'
                    
            except Exception as e:
                logger.error(f"Health check failed for {service_name}: {str(e)}")
                service_status = {
                    'healthy': False,
                    'status': 'error',
                    'error': str(e),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                health_status['services'][service_name] = service_status
                
                # For critical services, mark as unhealthy; for Redis/Celery, mark as degraded
                if service_name in ['redis', 'celery']:
                    health_status['degraded_mode'] = True
                    if health_status['status'] == 'healthy':
                        health_status['status'] = 'degraded'
                else:
                    health_status['overall_healthy'] = False
                    health_status['status'] = 'unhealthy'
                
                # Send alert for health check failure
                if send_alerts:
                    await self._send_health_alert(service_name, service_status)
        
        # Add summary information
        healthy_services = sum(1 for s in health_status['services'].values() if s.get('healthy', False))
        total_services = len(health_status['services'])
        
        health_status['summary'] = {
            'healthy_services': healthy_services,
            'total_services': total_services,
            'health_percentage': (healthy_services / total_services * 100) if total_services > 0 else 0
        }
        
        return health_status
    
    async def _check_database(self) -> Dict[str, Any]:
        """Check PostgreSQL database connectivity and performance."""
        try:
            db = next(get_db())
            start_time = datetime.now()
            
            try:
                # Test basic connectivity
                result = db.execute(text("SELECT 1"))
                result.fetchone()
                
                # Test database performance
                db.execute(text("SELECT COUNT(*) FROM information_schema.tables"))
                
                # Get database statistics
                stats_query = text("""
                    SELECT 
                        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
                        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
                """)
                stats_result = db.execute(stats_query).fetchone()
                
                response_time = (datetime.now() - start_time).total_seconds() * 1000
                
                return {
                    'healthy': True,
                    'status': 'connected',
                    'response_time_ms': round(response_time, 2),
                    'active_connections': stats_result[0] if stats_result else 0,
                    'max_connections': stats_result[1] if stats_result else 0,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                'healthy': False,
                'status': 'disconnected',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity and performance with graceful degradation."""
        try:
            redis_client = await get_redis_client()
            start_time = datetime.now()
            
            # Check if Redis client reports as healthy
            if not redis_client.is_healthy():
                # Try to reconnect
                reconnect_success = await redis_client.reconnect()
                if not reconnect_success:
                    return {
                        'healthy': False,
                        'status': 'disconnected',
                        'error': 'Redis connection unavailable, system operating in degraded mode',
                        'degraded_mode': True,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
            
            # Test basic connectivity
            ping_result = await redis_client.ping()
            if not ping_result:
                return {
                    'healthy': False,
                    'status': 'ping_failed',
                    'error': 'Redis ping failed, system operating in degraded mode',
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Test read/write operations
            test_key = "health_check_test"
            set_success = await redis_client.set(test_key, "test_value", expire=10)
            if not set_success:
                return {
                    'healthy': False,
                    'status': 'write_failed',
                    'error': 'Redis write operation failed',
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            value = await redis_client.get(test_key)
            await redis_client.delete(test_key)
            
            if value != "test_value":
                return {
                    'healthy': False,
                    'status': 'read_write_test_failed',
                    'error': 'Redis read/write test failed',
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Get Redis info
            info = await redis_client.info()
            
            # Get performance statistics
            perf_stats = redis_client.get_performance_stats()
            
            # Get connection pool statistics
            pool_stats = await redis_client.get_connection_pool_stats()
            
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                'healthy': True,
                'status': 'connected',
                'response_time_ms': round(response_time, 2),
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', 'unknown'),
                'redis_version': info.get('redis_version', 'unknown'),
                'performance_metrics': {
                    'average_response_time_ms': perf_stats.get('average_response_time', 0),
                    'operations_per_second': perf_stats.get('operations_per_second', 0),
                    'error_rate_percent': perf_stats.get('error_rate', 0),
                    'total_operations': perf_stats.get('total_operations', 0),
                    'successful_operations': perf_stats.get('successful_operations', 0),
                    'failed_operations': perf_stats.get('failed_operations', 0)
                },
                'connection_pool': {
                    'max_connections': pool_stats.get('pool_max_connections', 0),
                    'in_use_connections': pool_stats.get('pool_in_use_connections', 0),
                    'available_connections': pool_stats.get('pool_available_connections', 0),
                    'redis_connected_clients': pool_stats.get('redis_connected_clients', 0)
                },
                'server_metrics': {
                    'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec', 0),
                    'total_commands_processed': info.get('total_commands_processed', 0),
                    'uptime_in_seconds': info.get('uptime_in_seconds', 0)
                },
                'degraded_mode': False,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Redis health check failed, system operating in degraded mode: {str(e)}")
            return {
                'healthy': False,
                'status': 'error',
                'error': f'Redis error: {str(e)} - System operating in degraded mode',
                'degraded_mode': True,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_celery(self) -> Dict[str, Any]:
        """Check Celery worker and broker connectivity with graceful degradation."""
        try:
            # Check if Celery app is configured
            if not celery_app:
                return {
                    'healthy': False,
                    'status': 'not_configured',
                    'error': 'Celery app not configured - Background tasks unavailable',
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Get active workers with timeout
            try:
                inspect = celery_app.control.inspect()
                active_workers = inspect.active()
                registered_tasks = inspect.registered()
            except Exception as e:
                logger.warning(f"Celery inspect failed: {e}")
                return {
                    'healthy': False,
                    'status': 'inspect_failed',
                    'error': f'Celery worker inspection failed: {str(e)} - Background tasks may be unavailable',
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Check broker connectivity with timeout
            broker_healthy = False
            try:
                # Test broker connection by checking connection pool
                with celery_app.connection_or_acquire() as conn:
                    conn.ensure_connection(max_retries=1)
                broker_healthy = True
            except Exception as e:
                logger.warning(f"Celery broker connection failed: {e}")
            
            worker_count = len(active_workers) if active_workers else 0
            
            # Determine overall health - system can operate without Celery workers
            # but should report degraded mode
            if worker_count == 0 and not broker_healthy:
                return {
                    'healthy': False,
                    'status': 'no_workers_no_broker',
                    'error': 'No Celery workers and broker unavailable - Background tasks disabled',
                    'active_workers': 0,
                    'broker_healthy': False,
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            elif worker_count == 0:
                return {
                    'healthy': False,
                    'status': 'no_workers',
                    'error': 'No active Celery workers - Background tasks queued but not processing',
                    'active_workers': 0,
                    'broker_healthy': broker_healthy,
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            elif not broker_healthy:
                return {
                    'healthy': False,
                    'status': 'broker_unhealthy',
                    'error': 'Celery broker connection issues - Background tasks may fail',
                    'active_workers': worker_count,
                    'broker_healthy': False,
                    'degraded_mode': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            return {
                'healthy': True,
                'status': 'connected',
                'active_workers': worker_count,
                'worker_details': active_workers or {},
                'broker_healthy': broker_healthy,
                'registered_tasks_count': len(registered_tasks) if registered_tasks else 0,
                'degraded_mode': False,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Celery health check failed: {str(e)}")
            return {
                'healthy': False,
                'status': 'error',
                'error': f'Celery health check error: {str(e)} - Background tasks may be unavailable',
                'degraded_mode': True,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space."""
        try:
            import shutil
            
            # Check disk space for current directory
            total, used, free = shutil.disk_usage('.')
            
            # Convert to GB
            total_gb = total / (1024**3)
            used_gb = used / (1024**3)
            free_gb = free / (1024**3)
            usage_percent = (used / total) * 100
            
            # Consider unhealthy if less than 1GB free or more than 90% used
            healthy = free_gb > 1.0 and usage_percent < 90
            
            return {
                'healthy': healthy,
                'status': 'ok' if healthy else 'low_space',
                'total_gb': round(total_gb, 2),
                'used_gb': round(used_gb, 2),
                'free_gb': round(free_gb, 2),
                'usage_percent': round(usage_percent, 2),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Disk space health check failed: {str(e)}")
            return {
                'healthy': False,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_memory(self) -> Dict[str, Any]:
        """Check system memory usage."""
        try:
            import psutil
            
            # Get memory information
            memory = psutil.virtual_memory()
            
            # Convert to GB
            total_gb = memory.total / (1024**3)
            available_gb = memory.available / (1024**3)
            used_gb = memory.used / (1024**3)
            usage_percent = memory.percent
            
            # Consider unhealthy if more than 90% memory used
            healthy = usage_percent < 90
            
            return {
                'healthy': healthy,
                'status': 'ok' if healthy else 'high_usage',
                'total_gb': round(total_gb, 2),
                'used_gb': round(used_gb, 2),
                'available_gb': round(available_gb, 2),
                'usage_percent': round(usage_percent, 2),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except ImportError:
            # psutil not available, return basic info
            return {
                'healthy': True,
                'status': 'monitoring_unavailable',
                'message': 'psutil not installed, memory monitoring unavailable',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Memory health check failed: {str(e)}")
            return {
                'healthy': False,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def _send_health_alert(self, service_name: str, service_status: Dict[str, Any]):
        """Send health alert for unhealthy service."""
        try:
            issue = service_status.get('error', service_status.get('status', 'unknown issue'))
            await notification_service.alert_system_health_issue(
                service=service_name,
                issue=issue,
                details=service_status
            )
        except Exception as e:
            logger.error(f"Failed to send health alert for {service_name}: {str(e)}")
    
    async def get_service_health(self, service_name: str) -> Dict[str, Any]:
        """
        Get health status for a specific service.
        
        Args:
            service_name: Name of the service to check
            
        Returns:
            Dictionary containing service health information
        """
        if service_name not in self.checks:
            return {
                'healthy': False,
                'status': 'unknown_service',
                'error': f"Unknown service: {service_name}",
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        try:
            return await self.checks[service_name]()
        except Exception as e:
            logger.error(f"Health check failed for {service_name}: {str(e)}")
            return {
                'healthy': False,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }


# Global health check service instance
health_service = HealthCheckService()