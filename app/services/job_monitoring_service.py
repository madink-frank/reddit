"""
Job Monitoring Service

Provides real-time job status tracking and progress monitoring capabilities.
"""

import json
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Callable
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.utils.redis_client import get_redis_client
from app.models.crawling_job import CrawlingJob, JobStatus, JobMetrics, CrawlingSchedule
from app.services.job_queue_service import get_job_queue_service


logger = logging.getLogger(__name__)


class JobMonitoringService:
    """Service for real-time job monitoring and status tracking."""
    
    def __init__(self):
        self.redis_client = None
        self.job_queue_service = None
        self.subscribers = {}  # WebSocket connections for real-time updates
        
        # Redis key prefixes
        self.MONITORING_PREFIX = "monitoring:"
        self.METRICS_PREFIX = "metrics:"
        self.ALERTS_PREFIX = "alerts:"
        self.DASHBOARD_STATS_KEY = "dashboard_stats"
    
    async def initialize(self):
        """Initialize Redis client and dependencies."""
        if not self.redis_client:
            self.redis_client = await get_redis_client()
            await self.redis_client.ensure_connection()
        
        if not self.job_queue_service:
            self.job_queue_service = get_job_queue_service()
            await self.job_queue_service.initialize()
    
    async def get_real_time_dashboard_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Get real-time dashboard statistics for monitoring.
        
        Args:
            db: Database session
            user_id: User ID for filtering
            
        Returns:
            Dashboard statistics
        """
        try:
            await self.initialize()
            
            # Get current time for calculations
            now = datetime.now(timezone.utc)
            last_24h = now - timedelta(hours=24)
            last_hour = now - timedelta(hours=1)
            
            # Active crawling schedules count
            active_schedules = db.query(CrawlingSchedule).filter(
                and_(
                    CrawlingSchedule.user_id == user_id,
                    CrawlingSchedule.is_active == True
                )
            ).count()
            
            # Active jobs count
            active_jobs = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.status.in_([JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.RETRYING])
                )
            ).count()
            
            # Success/failure rates (last 24 hours)
            total_jobs_24h = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.created_at >= last_24h
                )
            ).count()
            
            successful_jobs_24h = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.status == JobStatus.COMPLETED,
                    CrawlingJob.created_at >= last_24h
                )
            ).count()
            
            failed_jobs_24h = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.status == JobStatus.FAILED,
                    CrawlingJob.created_at >= last_24h
                )
            ).count()
            
            success_rate = (successful_jobs_24h / total_jobs_24h * 100) if total_jobs_24h > 0 else 0
            
            # Collection speed metrics (last hour)
            recent_jobs = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.completed_at >= last_hour,
                    CrawlingJob.status == JobStatus.COMPLETED
                )
            ).all()
            
            total_items_processed = sum(job.items_processed for job in recent_jobs)
            total_processing_time = sum(job.actual_duration or 0 for job in recent_jobs)
            
            collection_speed = (total_items_processed / (total_processing_time / 3600)) if total_processing_time > 0 else 0
            
            # Queue statistics
            queue_stats = await self.job_queue_service.get_queue_statistics()
            
            # Points consumption (if billing is enabled)
            points_consumed_24h = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.created_at >= last_24h
                )
            ).with_entities(CrawlingJob.points_consumed).all()
            
            total_points_consumed = sum(p[0] or 0 for p in points_consumed_24h)
            
            stats = {
                "active_crawling_schedules": active_schedules,
                "active_jobs": active_jobs,
                "success_rate": round(success_rate, 2),
                "failed_jobs_24h": failed_jobs_24h,
                "collection_speed": round(collection_speed, 2),  # items per hour
                "total_items_processed_1h": total_items_processed,
                "points_consumed_24h": total_points_consumed,
                "queue_statistics": queue_stats,
                "last_updated": now.isoformat()
            }
            
            # Cache stats in Redis for quick access
            await self.redis_client.set(
                f"{self.DASHBOARD_STATS_KEY}:{user_id}",
                stats,
                expire=60  # Cache for 1 minute
            )
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get dashboard stats for user {user_id}: {str(e)}")
            return {
                "error": str(e),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
    
    async def get_job_progress_details(self, job_id: int) -> Dict[str, Any]:
        """
        Get detailed progress information for a specific job.
        
        Args:
            job_id: Job ID
            
        Returns:
            Detailed progress information
        """
        try:
            await self.initialize()
            
            # Get progress from Redis
            progress = await self.job_queue_service.get_job_progress(job_id)
            if not progress:
                return {"error": "Progress information not found"}
            
            # Get status from Redis
            status = await self.job_queue_service.get_job_status(job_id)
            
            # Calculate additional metrics
            current = progress.get("current", 0)
            total = progress.get("total", 0)
            speed = progress.get("speed", 0)
            
            # Estimate time remaining
            eta = ""
            if speed > 0 and total > current:
                remaining_items = total - current
                remaining_seconds = remaining_items / speed
                eta = (datetime.now(timezone.utc) + timedelta(seconds=remaining_seconds)).isoformat()
            
            return {
                "job_id": job_id,
                "progress": progress,
                "status": status,
                "estimated_completion": eta,
                "performance_metrics": {
                    "items_per_second": speed,
                    "completion_percentage": progress.get("percentage", 0),
                    "elapsed_time": self._calculate_elapsed_time(status),
                    "estimated_total_time": self._estimate_total_time(progress, speed)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get progress details for job {job_id}: {str(e)}")
            return {"error": str(e)}
    
    async def get_active_jobs_monitoring(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """
        Get monitoring information for all active jobs.
        
        Args:
            db: Database session
            user_id: User ID for filtering
            
        Returns:
            List of active job monitoring data
        """
        try:
            await self.initialize()
            
            # Get active jobs from database
            active_jobs = db.query(CrawlingJob).filter(
                and_(
                    CrawlingJob.user_id == user_id,
                    CrawlingJob.status.in_([JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.RETRYING])
                )
            ).order_by(desc(CrawlingJob.created_at)).all()
            
            monitoring_data = []
            
            for job in active_jobs:
                # Get real-time progress
                progress = await self.job_queue_service.get_job_progress(job.id)
                status = await self.job_queue_service.get_job_status(job.id)
                
                # Get recent metrics
                metrics = await self._get_job_metrics(job.id)
                
                job_data = {
                    "job_id": job.id,
                    "name": job.name,
                    "job_type": job.job_type,
                    "status": job.status.value,
                    "priority": job.priority.value,
                    "created_at": job.created_at.isoformat(),
                    "started_at": job.started_at.isoformat() if job.started_at else None,
                    "progress": progress or {
                        "current": job.progress_current,
                        "total": job.progress_total,
                        "percentage": job.progress_percentage,
                        "message": job.progress_message
                    },
                    "metrics": metrics,
                    "parameters": job.parameters,
                    "retry_count": job.retry_count,
                    "points_consumed": job.points_consumed
                }
                
                monitoring_data.append(job_data)
            
            return monitoring_data
            
        except Exception as e:
            logger.error(f"Failed to get active jobs monitoring for user {user_id}: {str(e)}")
            return []
    
    async def get_job_history(
        self,
        db: Session,
        user_id: int,
        limit: int = 50,
        status_filter: Optional[JobStatus] = None,
        job_type_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get job history with filtering options.
        
        Args:
            db: Database session
            user_id: User ID for filtering
            limit: Maximum number of jobs to return
            status_filter: Filter by job status
            job_type_filter: Filter by job type
            
        Returns:
            List of job history data
        """
        try:
            query = db.query(CrawlingJob).filter(CrawlingJob.user_id == user_id)
            
            if status_filter:
                query = query.filter(CrawlingJob.status == status_filter)
            
            if job_type_filter:
                query = query.filter(CrawlingJob.job_type == job_type_filter)
            
            jobs = query.order_by(desc(CrawlingJob.created_at)).limit(limit).all()
            
            history_data = []
            for job in jobs:
                job_data = {
                    "job_id": job.id,
                    "name": job.name,
                    "job_type": job.job_type,
                    "status": job.status.value,
                    "priority": job.priority.value,
                    "created_at": job.created_at.isoformat(),
                    "started_at": job.started_at.isoformat() if job.started_at else None,
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                    "duration_seconds": job.actual_duration,
                    "items_processed": job.items_processed,
                    "items_saved": job.items_saved,
                    "items_failed": job.items_failed,
                    "success_rate": job.success_rate,
                    "points_consumed": job.points_consumed,
                    "error_message": job.error_message,
                    "retry_count": job.retry_count
                }
                history_data.append(job_data)
            
            return history_data
            
        except Exception as e:
            logger.error(f"Failed to get job history for user {user_id}: {str(e)}")
            return []
    
    async def record_job_metrics(
        self,
        job_id: int,
        metrics: Dict[str, Any]
    ) -> bool:
        """
        Record performance metrics for a job.
        
        Args:
            job_id: Job ID
            metrics: Performance metrics data
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Store metrics in Redis with timestamp
            metrics_data = {
                "job_id": job_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **metrics
            }
            
            # Store in time-series format
            metrics_key = f"{self.METRICS_PREFIX}{job_id}"
            current_metrics = await self.redis_client.get(metrics_key) or []
            
            # Keep only last 100 metrics entries
            if len(current_metrics) >= 100:
                current_metrics = current_metrics[-99:]
            
            current_metrics.append(metrics_data)
            
            await self.redis_client.set(metrics_key, current_metrics, expire=3600)  # 1 hour
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to record metrics for job {job_id}: {str(e)}")
            return False
    
    async def subscribe_to_job_updates(
        self,
        job_id: int,
        callback: Callable[[Dict[str, Any]], None]
    ):
        """
        Subscribe to real-time job updates.
        
        Args:
            job_id: Job ID to monitor
            callback: Callback function for updates
        """
        try:
            await self.initialize()
            
            # Subscribe to Redis pub/sub channel
            pubsub = self.redis_client.redis_client.pubsub()
            await pubsub.subscribe(f"job_progress:{job_id}")
            
            # Store subscriber
            if job_id not in self.subscribers:
                self.subscribers[job_id] = []
            self.subscribers[job_id].append(callback)
            
            # Listen for messages
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        callback(data)
                    except Exception as e:
                        logger.error(f"Error processing job update: {str(e)}")
            
        except Exception as e:
            logger.error(f"Failed to subscribe to job {job_id} updates: {str(e)}")
    
    async def unsubscribe_from_job_updates(self, job_id: int, callback: Callable):
        """
        Unsubscribe from job updates.
        
        Args:
            job_id: Job ID
            callback: Callback function to remove
        """
        if job_id in self.subscribers:
            try:
                self.subscribers[job_id].remove(callback)
                if not self.subscribers[job_id]:
                    del self.subscribers[job_id]
            except ValueError:
                pass
    
    async def create_job_alert(
        self,
        job_id: int,
        alert_type: str,
        message: str,
        severity: str = "info"
    ) -> bool:
        """
        Create an alert for a job.
        
        Args:
            job_id: Job ID
            alert_type: Type of alert (error, warning, info)
            message: Alert message
            severity: Alert severity level
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            alert_data = {
                "job_id": job_id,
                "alert_type": alert_type,
                "message": message,
                "severity": severity,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Store alert
            alert_key = f"{self.ALERTS_PREFIX}{job_id}"
            alerts = await self.redis_client.get(alert_key) or []
            alerts.append(alert_data)
            
            # Keep only last 50 alerts
            if len(alerts) > 50:
                alerts = alerts[-50:]
            
            await self.redis_client.set(alert_key, alerts, expire=86400)  # 24 hours
            
            # Publish alert for real-time notifications
            await self.redis_client.redis_client.publish(
                f"job_alerts:{job_id}",
                json.dumps(alert_data)
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create alert for job {job_id}: {str(e)}")
            return False
    
    async def _get_job_metrics(self, job_id: int) -> Dict[str, Any]:
        """Get recent metrics for a job."""
        try:
            metrics_key = f"{self.METRICS_PREFIX}{job_id}"
            metrics_list = await self.redis_client.get(metrics_key) or []
            
            if not metrics_list:
                return {}
            
            # Get latest metrics
            latest_metrics = metrics_list[-1] if metrics_list else {}
            
            # Calculate averages from recent metrics
            recent_metrics = metrics_list[-10:] if len(metrics_list) >= 10 else metrics_list
            
            if recent_metrics:
                avg_cpu = sum(m.get("cpu_usage", 0) for m in recent_metrics) / len(recent_metrics)
                avg_memory = sum(m.get("memory_usage", 0) for m in recent_metrics) / len(recent_metrics)
                avg_speed = sum(m.get("items_per_second", 0) for m in recent_metrics) / len(recent_metrics)
                
                return {
                    "latest": latest_metrics,
                    "averages": {
                        "cpu_usage": round(avg_cpu, 2),
                        "memory_usage": round(avg_memory, 2),
                        "items_per_second": round(avg_speed, 2)
                    }
                }
            
            return {"latest": latest_metrics}
            
        except Exception as e:
            logger.error(f"Failed to get metrics for job {job_id}: {str(e)}")
            return {}
    
    def _calculate_elapsed_time(self, status: Optional[Dict[str, Any]]) -> int:
        """Calculate elapsed time for a job."""
        if not status or "updated_at" not in status:
            return 0
        
        try:
            updated_at = datetime.fromisoformat(status["updated_at"].replace('Z', '+00:00'))
            elapsed = datetime.now(timezone.utc) - updated_at
            return int(elapsed.total_seconds())
        except Exception:
            return 0
    
    def _estimate_total_time(self, progress: Dict[str, Any], speed: float) -> int:
        """Estimate total time for job completion."""
        if not progress or speed <= 0:
            return 0
        
        total = progress.get("total", 0)
        current = progress.get("current", 0)
        
        if total <= 0 or current <= 0:
            return 0
        
        return int(total / speed)


# Global service instance
job_monitoring_service = JobMonitoringService()


def get_job_monitoring_service() -> JobMonitoringService:
    """Get job monitoring service instance."""
    return job_monitoring_service