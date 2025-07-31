"""
Redis Performance Monitoring Service

Provides comprehensive monitoring and optimization for Redis operations.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from app.utils.redis_client import get_redis_client
from app.core.metrics import record_cache_hit, record_cache_miss, update_redis_connections

logger = logging.getLogger(__name__)


@dataclass
class RedisPerformanceAlert:
    """Redis performance alert data structure"""
    alert_type: str
    message: str
    severity: str
    timestamp: datetime
    metric_value: float
    threshold: float


class RedisPerformanceService:
    """Service for monitoring and optimizing Redis performance"""
    
    def __init__(self):
        self.redis_client = None
        self.performance_thresholds = {
            'slow_operation_ms': 50,  # Alert if operations take > 50ms
            'high_error_rate_percent': 5,  # Alert if error rate > 5%
            'low_hit_rate_percent': 70,  # Alert if cache hit rate < 70%
            'high_memory_usage_percent': 80,  # Alert if memory usage > 80%
            'max_connections_percent': 90,  # Alert if connection usage > 90%
        }
        self.alerts = []
        self.monitoring_enabled = True
    
    async def initialize(self):
        """Initialize Redis client"""
        if not self.redis_client:
            self.redis_client = await get_redis_client()
            await self.redis_client.ensure_connection()
    
    async def get_comprehensive_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive Redis performance report"""
        try:
            await self.initialize()
            
            # Get basic performance stats
            perf_stats = self.redis_client.get_performance_stats()
            
            # Get connection pool stats
            pool_stats = await self.redis_client.get_connection_pool_stats()
            
            # Get Redis server info
            redis_info = await self.redis_client.info()
            
            # Calculate additional metrics
            cache_metrics = await self._calculate_cache_metrics()
            memory_metrics = self._extract_memory_metrics(redis_info)
            connection_metrics = self._extract_connection_metrics(redis_info, pool_stats)
            
            # Check for performance issues
            alerts = await self._check_performance_alerts(perf_stats, redis_info, pool_stats)
            
            # Generate recommendations
            recommendations = self._generate_performance_recommendations(
                perf_stats, redis_info, pool_stats, cache_metrics
            )
            
            report = {
                'timestamp': datetime.utcnow().isoformat(),
                'performance_stats': perf_stats,
                'connection_pool_stats': pool_stats,
                'cache_metrics': cache_metrics,
                'memory_metrics': memory_metrics,
                'connection_metrics': connection_metrics,
                'alerts': [alert.__dict__ for alert in alerts],
                'recommendations': recommendations,
                'overall_health_score': self._calculate_health_score(perf_stats, redis_info),
                'redis_server_info': {
                    'version': redis_info.get('redis_version', 'unknown'),
                    'uptime_seconds': redis_info.get('uptime_in_seconds', 0),
                    'total_commands_processed': redis_info.get('total_commands_processed', 0),
                    'instantaneous_ops_per_sec': redis_info.get('instantaneous_ops_per_sec', 0),
                }
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate performance report: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def monitor_operation_performance(
        self, 
        operation_name: str, 
        duration: float, 
        success: bool = True
    ):
        """Monitor individual operation performance"""
        if not self.monitoring_enabled:
            return
        
        try:
            # Record metrics for Prometheus
            if success:
                record_cache_hit('redis')
            else:
                record_cache_miss('redis')
            
            # Check for slow operations
            if duration > (self.performance_thresholds['slow_operation_ms'] / 1000):
                alert = RedisPerformanceAlert(
                    alert_type='slow_operation',
                    message=f"Slow Redis {operation_name} operation: {duration*1000:.2f}ms",
                    severity='warning',
                    timestamp=datetime.utcnow(),
                    metric_value=duration * 1000,
                    threshold=self.performance_thresholds['slow_operation_ms']
                )
                await self._handle_alert(alert)
            
        except Exception as e:
            logger.error(f"Error monitoring operation performance: {e}")
    
    async def optimize_connection_pool(self) -> Dict[str, Any]:
        """Analyze and suggest connection pool optimizations"""
        try:
            await self.initialize()
            
            pool_stats = await self.redis_client.get_connection_pool_stats()
            redis_info = await self.redis_client.info()
            
            current_max = pool_stats.get('pool_max_connections', 50)
            in_use = pool_stats.get('pool_in_use_connections', 0)
            available = pool_stats.get('pool_available_connections', 0)
            
            utilization = (in_use / current_max) * 100 if current_max > 0 else 0
            
            recommendations = []
            
            # Check if pool is under-utilized
            if utilization < 30:
                recommendations.append({
                    'type': 'reduce_pool_size',
                    'current_size': current_max,
                    'suggested_size': max(20, int(current_max * 0.7)),
                    'reason': f'Pool utilization is low ({utilization:.1f}%)'
                })
            
            # Check if pool is over-utilized
            elif utilization > 80:
                recommendations.append({
                    'type': 'increase_pool_size',
                    'current_size': current_max,
                    'suggested_size': min(100, int(current_max * 1.3)),
                    'reason': f'Pool utilization is high ({utilization:.1f}%)'
                })
            
            # Check connection efficiency
            total_commands = redis_info.get('total_commands_processed', 0)
            connected_clients = redis_info.get('connected_clients', 0)
            
            if connected_clients > 0:
                commands_per_connection = total_commands / connected_clients
                if commands_per_connection < 1000:
                    recommendations.append({
                        'type': 'optimize_connection_reuse',
                        'commands_per_connection': commands_per_connection,
                        'reason': 'Low command-to-connection ratio suggests poor connection reuse'
                    })
            
            return {
                'current_stats': pool_stats,
                'utilization_percent': round(utilization, 2),
                'recommendations': recommendations,
                'optimal_range': '50-80% utilization',
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error optimizing connection pool: {e}")
            return {'error': str(e)}
    
    async def analyze_cache_patterns(self, hours: int = 24) -> Dict[str, Any]:
        """Analyze cache usage patterns for optimization"""
        try:
            await self.initialize()
            
            # Get performance stats
            perf_stats = self.redis_client.get_performance_stats()
            
            # Analyze operation patterns
            operations = perf_stats.get('error_breakdown', {})
            total_ops = perf_stats.get('total_operations', 0)
            
            patterns = {}
            for op_type, count in operations.items():
                patterns[op_type] = {
                    'count': count,
                    'percentage': (count / total_ops * 100) if total_ops > 0 else 0
                }
            
            # Generate optimization suggestions
            suggestions = []
            
            # Check for high miss rates
            error_rate = perf_stats.get('error_rate', 0)
            if error_rate > self.performance_thresholds['high_error_rate_percent']:
                suggestions.append({
                    'type': 'high_error_rate',
                    'description': f'Error rate is {error_rate:.1f}%, consider connection stability improvements',
                    'priority': 'high'
                })
            
            # Check response times
            avg_response = perf_stats.get('average_response_time', 0)
            if avg_response > self.performance_thresholds['slow_operation_ms']:
                suggestions.append({
                    'type': 'slow_responses',
                    'description': f'Average response time is {avg_response:.1f}ms, consider optimization',
                    'priority': 'medium'
                })
            
            return {
                'analysis_period_hours': hours,
                'operation_patterns': patterns,
                'performance_summary': perf_stats,
                'optimization_suggestions': suggestions,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing cache patterns: {e}")
            return {'error': str(e)}
    
    async def _calculate_cache_metrics(self) -> Dict[str, Any]:
        """Calculate cache-specific metrics"""
        try:
            perf_stats = self.redis_client.get_performance_stats()
            
            total_ops = perf_stats.get('total_operations', 0)
            successful_ops = perf_stats.get('successful_operations', 0)
            failed_ops = perf_stats.get('failed_operations', 0)
            
            hit_rate = (successful_ops / total_ops * 100) if total_ops > 0 else 0
            miss_rate = (failed_ops / total_ops * 100) if total_ops > 0 else 0
            
            return {
                'hit_rate_percent': round(hit_rate, 2),
                'miss_rate_percent': round(miss_rate, 2),
                'total_operations': total_ops,
                'successful_operations': successful_ops,
                'failed_operations': failed_ops,
                'operations_per_second': perf_stats.get('operations_per_second', 0)
            }
            
        except Exception as e:
            logger.error(f"Error calculating cache metrics: {e}")
            return {}
    
    def _extract_memory_metrics(self, redis_info: Dict[str, Any]) -> Dict[str, Any]:
        """Extract memory-related metrics from Redis info"""
        return {
            'used_memory': redis_info.get('used_memory', 0),
            'used_memory_human': redis_info.get('used_memory_human', 'N/A'),
            'used_memory_peak': redis_info.get('used_memory_peak', 0),
            'used_memory_peak_human': redis_info.get('used_memory_peak_human', 'N/A'),
            'memory_fragmentation_ratio': redis_info.get('mem_fragmentation_ratio', 0),
            'maxmemory': redis_info.get('maxmemory', 0),
            'maxmemory_human': redis_info.get('maxmemory_human', 'N/A'),
        }
    
    def _extract_connection_metrics(
        self, 
        redis_info: Dict[str, Any], 
        pool_stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract connection-related metrics"""
        connected_clients = redis_info.get('connected_clients', 0)
        max_clients = redis_info.get('maxclients', 0)
        
        # Update Prometheus metrics
        update_redis_connections(connected_clients)
        
        return {
            'connected_clients': connected_clients,
            'max_clients': max_clients,
            'client_utilization_percent': (connected_clients / max_clients * 100) if max_clients > 0 else 0,
            'pool_max_connections': pool_stats.get('pool_max_connections', 0),
            'pool_in_use_connections': pool_stats.get('pool_in_use_connections', 0),
            'pool_available_connections': pool_stats.get('pool_available_connections', 0),
            'blocked_clients': redis_info.get('blocked_clients', 0),
            'total_connections_received': redis_info.get('total_connections_received', 0),
        }
    
    async def _check_performance_alerts(
        self, 
        perf_stats: Dict[str, Any], 
        redis_info: Dict[str, Any], 
        pool_stats: Dict[str, Any]
    ) -> List[RedisPerformanceAlert]:
        """Check for performance issues and generate alerts"""
        alerts = []
        
        # Check error rate
        error_rate = perf_stats.get('error_rate', 0)
        if error_rate > self.performance_thresholds['high_error_rate_percent']:
            alerts.append(RedisPerformanceAlert(
                alert_type='high_error_rate',
                message=f"High Redis error rate: {error_rate:.1f}%",
                severity='warning',
                timestamp=datetime.utcnow(),
                metric_value=error_rate,
                threshold=self.performance_thresholds['high_error_rate_percent']
            ))
        
        # Check memory usage
        used_memory = redis_info.get('used_memory', 0)
        max_memory = redis_info.get('maxmemory', 0)
        if max_memory > 0:
            memory_usage_percent = (used_memory / max_memory) * 100
            if memory_usage_percent > self.performance_thresholds['high_memory_usage_percent']:
                alerts.append(RedisPerformanceAlert(
                    alert_type='high_memory_usage',
                    message=f"High Redis memory usage: {memory_usage_percent:.1f}%",
                    severity='critical',
                    timestamp=datetime.utcnow(),
                    metric_value=memory_usage_percent,
                    threshold=self.performance_thresholds['high_memory_usage_percent']
                ))
        
        # Check connection pool usage
        max_connections = pool_stats.get('pool_max_connections', 0)
        in_use_connections = pool_stats.get('pool_in_use_connections', 0)
        if max_connections > 0:
            connection_usage_percent = (in_use_connections / max_connections) * 100
            if connection_usage_percent > self.performance_thresholds['max_connections_percent']:
                alerts.append(RedisPerformanceAlert(
                    alert_type='high_connection_usage',
                    message=f"High connection pool usage: {connection_usage_percent:.1f}%",
                    severity='warning',
                    timestamp=datetime.utcnow(),
                    metric_value=connection_usage_percent,
                    threshold=self.performance_thresholds['max_connections_percent']
                ))
        
        return alerts
    
    def _generate_performance_recommendations(
        self, 
        perf_stats: Dict[str, Any], 
        redis_info: Dict[str, Any], 
        pool_stats: Dict[str, Any],
        cache_metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        # Response time recommendations
        avg_response = perf_stats.get('average_response_time', 0)
        if avg_response > 20:  # > 20ms
            recommendations.append({
                'category': 'performance',
                'priority': 'medium',
                'title': 'Optimize Response Times',
                'description': f'Average response time is {avg_response:.1f}ms. Consider connection pooling optimization.',
                'actions': [
                    'Review connection pool configuration',
                    'Check network latency to Redis server',
                    'Consider Redis pipelining for bulk operations'
                ]
            })
        
        # Memory recommendations
        fragmentation_ratio = redis_info.get('mem_fragmentation_ratio', 0)
        if fragmentation_ratio > 1.5:
            recommendations.append({
                'category': 'memory',
                'priority': 'low',
                'title': 'Memory Fragmentation',
                'description': f'Memory fragmentation ratio is {fragmentation_ratio:.2f}. Consider memory optimization.',
                'actions': [
                    'Monitor memory usage patterns',
                    'Consider Redis memory optimization settings',
                    'Review data expiration policies'
                ]
            })
        
        # Connection recommendations
        hit_rate = cache_metrics.get('hit_rate_percent', 0)
        if hit_rate < 70:
            recommendations.append({
                'category': 'caching',
                'priority': 'high',
                'title': 'Low Cache Hit Rate',
                'description': f'Cache hit rate is {hit_rate:.1f}%. Review caching strategy.',
                'actions': [
                    'Analyze cache key patterns',
                    'Review TTL settings',
                    'Consider cache warming strategies'
                ]
            })
        
        return recommendations
    
    def _calculate_health_score(
        self, 
        perf_stats: Dict[str, Any], 
        redis_info: Dict[str, Any]
    ) -> int:
        """Calculate overall Redis health score (0-100)"""
        score = 100
        
        # Deduct for high error rate
        error_rate = perf_stats.get('error_rate', 0)
        if error_rate > 0:
            score -= min(error_rate * 2, 30)  # Max 30 points deduction
        
        # Deduct for slow response times
        avg_response = perf_stats.get('average_response_time', 0)
        if avg_response > 10:  # > 10ms
            score -= min((avg_response - 10) * 2, 20)  # Max 20 points deduction
        
        # Deduct for memory issues
        fragmentation_ratio = redis_info.get('mem_fragmentation_ratio', 1.0)
        if fragmentation_ratio > 1.5:
            score -= min((fragmentation_ratio - 1.5) * 20, 15)  # Max 15 points deduction
        
        # Ensure score is between 0 and 100
        return max(0, min(100, int(score)))
    
    async def _handle_alert(self, alert: RedisPerformanceAlert):
        """Handle performance alert"""
        self.alerts.append(alert)
        
        # Keep only last 100 alerts
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
        
        # Log alert
        logger.warning(f"Redis Performance Alert: {alert.message}")
        
        # Could integrate with notification system here
        # await notification_service.send_alert(alert)


# Global service instance
redis_performance_service = RedisPerformanceService()


def get_redis_performance_service() -> RedisPerformanceService:
    """Get Redis performance service instance"""
    return redis_performance_service