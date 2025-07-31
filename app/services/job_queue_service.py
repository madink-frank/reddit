"""
Job Queue Management Service

Manages crawling job queues using Redis for real-time tracking and coordination.
"""

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Union
from uuid import uuid4
from sqlalchemy.orm import Session
from celery import current_app
from celery.result import AsyncResult

from app.utils.redis_client import get_redis_client
from app.models.crawling_job import CrawlingJob, JobStatus, JobPriority, CrawlingSchedule
from app.core.celery_app import celery_app


logger = logging.getLogger(__name__)


class JobQueueService:
    """Service for managing job queues with Redis integration."""
    
    def __init__(self):
        self.redis_client = None
        self.celery_app = celery_app
        
        # Redis key prefixes
        self.JOB_QUEUE_PREFIX = "job_queue:"
        self.JOB_STATUS_PREFIX = "job_status:"
        self.JOB_PROGRESS_PREFIX = "job_progress:"
        self.JOB_METRICS_PREFIX = "job_metrics:"
        self.ACTIVE_JOBS_KEY = "active_jobs"
        self.QUEUE_STATS_KEY = "queue_stats"
    
    async def initialize(self):
        """Initialize Redis client."""
        if not self.redis_client:
            self.redis_client = await get_redis_client()
            await self.redis_client.ensure_connection()
    
    async def enqueue_job(
        self,
        db: Session,
        job_id: int,
        priority: JobPriority = JobPriority.NORMAL,
        delay_seconds: int = 0
    ) -> Dict[str, Any]:
        """
        Enqueue a job for processing.
        
        Args:
            db: Database session
            job_id: ID of the job to enqueue
            priority: Job priority
            delay_seconds: Delay before processing
            
        Returns:
            Enqueue result information
        """
        try:
            await self.initialize()
            
            # Get job from database
            job = db.query(CrawlingJob).filter(CrawlingJob.id == job_id).first()
            if not job:
                raise ValueError(f"Job {job_id} not found")
            
            # Create queue entry
            queue_entry = {
                "job_id": job_id,
                "priority": priority.value,
                "enqueued_at": datetime.now(timezone.utc).isoformat(),
                "scheduled_for": (datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)).isoformat(),
                "job_type": job.job_type,
                "parameters": job.parameters,
                "retry_count": job.retry_count
            }
            
            # Add to priority queue
            queue_key = f"{self.JOB_QUEUE_PREFIX}{priority.value}"
            await self.redis_client.redis_client.lpush(queue_key, json.dumps(queue_entry))
            
            # Update job status
            job.status = JobStatus.QUEUED
            job.priority = priority
            db.commit()
            
            # Track in active jobs
            await self._add_to_active_jobs(job_id, queue_entry)
            
            # Update queue statistics
            await self._update_queue_stats("enqueued", priority.value)
            
            logger.info(f"Enqueued job {job_id} with priority {priority.value}")
            
            return {
                "job_id": job_id,
                "status": "enqueued",
                "priority": priority.value,
                "queue_position": await self._get_queue_position(job_id, priority),
                "estimated_start_time": queue_entry["scheduled_for"]
            }
            
        except Exception as e:
            logger.error(f"Failed to enqueue job {job_id}: {str(e)}")
            return {
                "job_id": job_id,
                "status": "enqueue_failed",
                "error": str(e)
            }
    
    async def dequeue_job(self, priority: JobPriority = None) -> Optional[Dict[str, Any]]:
        """
        Dequeue the next job for processing.
        
        Args:
            priority: Specific priority to dequeue from (optional)
            
        Returns:
            Job information or None if no jobs available
        """
        try:
            await self.initialize()
            
            # Define priority order
            priorities = [priority.value] if priority else ["urgent", "high", "normal", "low"]
            
            for priority_level in priorities:
                queue_key = f"{self.JOB_QUEUE_PREFIX}{priority_level}"
                
                # Get job from queue
                job_data = await self.redis_client.redis_client.rpop(queue_key)
                if job_data:
                    job_entry = json.loads(job_data)
                    
                    # Check if job is ready to run
                    scheduled_for = datetime.fromisoformat(job_entry["scheduled_for"].replace('Z', '+00:00'))
                    if scheduled_for > datetime.now(timezone.utc):
                        # Put back in queue if not ready
                        await self.redis_client.redis_client.rpush(queue_key, job_data)
                        continue
                    
                    # Update queue statistics
                    await self._update_queue_stats("dequeued", priority_level)
                    
                    logger.info(f"Dequeued job {job_entry['job_id']} from {priority_level} queue")
                    
                    return job_entry
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to dequeue job: {str(e)}")
            return None
    
    async def update_job_status(
        self,
        db: Session,
        job_id: int,
        status: JobStatus,
        progress: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Update job status in both database and Redis.
        
        Args:
            db: Database session
            job_id: Job ID
            status: New status
            progress: Progress information
            error_message: Error message if failed
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Update database
            job = db.query(CrawlingJob).filter(CrawlingJob.id == job_id).first()
            if not job:
                return False
            
            job.status = status
            
            if status == JobStatus.RUNNING and not job.started_at:
                job.started_at = datetime.now(timezone.utc)
            
            if status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
                if status == JobStatus.COMPLETED:
                    job.mark_completed()
                elif status == JobStatus.FAILED:
                    job.mark_failed(error_message or "Unknown error")
                
                # Remove from active jobs
                await self._remove_from_active_jobs(job_id)
            
            if progress:
                job.update_progress(
                    progress.get("current", job.progress_current),
                    progress.get("total", job.progress_total),
                    progress.get("message", job.progress_message)
                )
            
            db.commit()
            
            # Update Redis status
            status_key = f"{self.JOB_STATUS_PREFIX}{job_id}"
            status_data = {
                "job_id": job_id,
                "status": status.value,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "progress": progress or {},
                "error_message": error_message
            }
            
            await self.redis_client.set(status_key, status_data, expire=86400)  # 24 hours
            
            # Update progress in Redis
            if progress:
                await self.update_job_progress(job_id, progress)
            
            logger.info(f"Updated job {job_id} status to {status.value}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update job {job_id} status: {str(e)}")
            return False
    
    async def update_job_progress(self, job_id: int, progress: Dict[str, Any]) -> bool:
        """
        Update job progress in Redis for real-time monitoring.
        
        Args:
            job_id: Job ID
            progress: Progress information
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            progress_key = f"{self.JOB_PROGRESS_PREFIX}{job_id}"
            progress_data = {
                "job_id": job_id,
                "current": progress.get("current", 0),
                "total": progress.get("total", 0),
                "percentage": progress.get("percentage", 0),
                "message": progress.get("message", ""),
                "speed": progress.get("speed", 0),  # items per second
                "eta": progress.get("eta", ""),  # estimated time of arrival
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await self.redis_client.set(progress_key, progress_data, expire=3600)  # 1 hour
            
            # Publish progress update for real-time notifications
            await self._publish_progress_update(job_id, progress_data)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update job {job_id} progress: {str(e)}")
            return False
    
    async def get_job_status(self, job_id: int) -> Optional[Dict[str, Any]]:
        """
        Get current job status from Redis.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job status information
        """
        try:
            await self.initialize()
            
            status_key = f"{self.JOB_STATUS_PREFIX}{job_id}"
            status_data = await self.redis_client.get(status_key)
            
            if status_data:
                return status_data
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get job {job_id} status: {str(e)}")
            return None
    
    async def get_job_progress(self, job_id: int) -> Optional[Dict[str, Any]]:
        """
        Get current job progress from Redis.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job progress information
        """
        try:
            await self.initialize()
            
            progress_key = f"{self.JOB_PROGRESS_PREFIX}{job_id}"
            progress_data = await self.redis_client.get(progress_key)
            
            if progress_data:
                return progress_data
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get job {job_id} progress: {str(e)}")
            return None
    
    async def get_queue_statistics(self) -> Dict[str, Any]:
        """
        Get queue statistics from Redis.
        
        Returns:
            Queue statistics
        """
        try:
            await self.initialize()
            
            stats = {}
            
            # Get queue lengths
            for priority in ["urgent", "high", "normal", "low"]:
                queue_key = f"{self.JOB_QUEUE_PREFIX}{priority}"
                length = await self.redis_client.redis_client.llen(queue_key)
                stats[f"{priority}_queue_length"] = length
            
            # Get active jobs count
            active_jobs = await self.redis_client.get(self.ACTIVE_JOBS_KEY) or {}
            stats["active_jobs_count"] = len(active_jobs)
            
            # Get queue statistics
            queue_stats = await self.redis_client.get(self.QUEUE_STATS_KEY) or {}
            stats.update(queue_stats)
            
            # Calculate total queue length
            stats["total_queue_length"] = sum([
                stats.get(f"{p}_queue_length", 0) for p in ["urgent", "high", "normal", "low"]
            ])
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get queue statistics: {str(e)}")
            return {}
    
    async def get_active_jobs(self) -> List[Dict[str, Any]]:
        """
        Get list of currently active jobs.
        
        Returns:
            List of active job information
        """
        try:
            await self.initialize()
            
            active_jobs = await self.redis_client.get(self.ACTIVE_JOBS_KEY) or {}
            
            # Convert to list and add current status
            jobs_list = []
            for job_id, job_info in active_jobs.items():
                # Get current progress
                progress = await self.get_job_progress(int(job_id))
                if progress:
                    job_info["progress"] = progress
                
                jobs_list.append(job_info)
            
            return jobs_list
            
        except Exception as e:
            logger.error(f"Failed to get active jobs: {str(e)}")
            return []
    
    async def cancel_job(self, db: Session, job_id: int) -> Dict[str, Any]:
        """
        Cancel a job and remove it from queues.
        
        Args:
            db: Database session
            job_id: Job ID to cancel
            
        Returns:
            Cancellation result
        """
        try:
            await self.initialize()
            
            # Update job status
            success = await self.update_job_status(
                db, job_id, JobStatus.CANCELLED, error_message="Job cancelled by user"
            )
            
            if not success:
                return {"job_id": job_id, "status": "cancel_failed", "error": "Job not found"}
            
            # Remove from all queues
            for priority in ["urgent", "high", "normal", "low"]:
                await self._remove_from_queue(job_id, priority)
            
            # Cancel Celery task if exists
            job = db.query(CrawlingJob).filter(CrawlingJob.id == job_id).first()
            if job and job.celery_task_id:
                self.celery_app.control.revoke(job.celery_task_id, terminate=True)
            
            logger.info(f"Cancelled job {job_id}")
            
            return {
                "job_id": job_id,
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to cancel job {job_id}: {str(e)}")
            return {
                "job_id": job_id,
                "status": "cancel_failed",
                "error": str(e)
            }
    
    async def retry_job(self, db: Session, job_id: int) -> Dict[str, Any]:
        """
        Retry a failed job.
        
        Args:
            db: Database session
            job_id: Job ID to retry
            
        Returns:
            Retry result
        """
        try:
            await self.initialize()
            
            job = db.query(CrawlingJob).filter(CrawlingJob.id == job_id).first()
            if not job:
                return {"job_id": job_id, "status": "retry_failed", "error": "Job not found"}
            
            if job.retry_count >= job.max_retries:
                return {
                    "job_id": job_id,
                    "status": "retry_failed",
                    "error": "Maximum retries exceeded"
                }
            
            # Increment retry count
            job.retry_count += 1
            job.status = JobStatus.RETRYING
            job.error_message = None
            db.commit()
            
            # Re-enqueue job
            result = await self.enqueue_job(db, job_id, job.priority)
            
            logger.info(f"Retrying job {job_id} (attempt {job.retry_count})")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to retry job {job_id}: {str(e)}")
            return {
                "job_id": job_id,
                "status": "retry_failed",
                "error": str(e)
            }
    
    async def _add_to_active_jobs(self, job_id: int, job_info: Dict[str, Any]):
        """Add job to active jobs tracking."""
        active_jobs = await self.redis_client.get(self.ACTIVE_JOBS_KEY) or {}
        active_jobs[str(job_id)] = job_info
        await self.redis_client.set(self.ACTIVE_JOBS_KEY, active_jobs, expire=86400)
    
    async def _remove_from_active_jobs(self, job_id: int):
        """Remove job from active jobs tracking."""
        active_jobs = await self.redis_client.get(self.ACTIVE_JOBS_KEY) or {}
        active_jobs.pop(str(job_id), None)
        await self.redis_client.set(self.ACTIVE_JOBS_KEY, active_jobs, expire=86400)
    
    async def _remove_from_queue(self, job_id: int, priority: str):
        """Remove job from specific priority queue."""
        queue_key = f"{self.JOB_QUEUE_PREFIX}{priority}"
        
        # Get all items from queue
        queue_items = await self.redis_client.redis_client.lrange(queue_key, 0, -1)
        
        # Filter out the job to remove
        filtered_items = []
        for item in queue_items:
            job_data = json.loads(item)
            if job_data["job_id"] != job_id:
                filtered_items.append(item)
        
        # Clear queue and add filtered items back
        await self.redis_client.redis_client.delete(queue_key)
        if filtered_items:
            await self.redis_client.redis_client.lpush(queue_key, *filtered_items)
    
    async def _get_queue_position(self, job_id: int, priority: JobPriority) -> int:
        """Get position of job in queue."""
        queue_key = f"{self.JOB_QUEUE_PREFIX}{priority.value}"
        queue_items = await self.redis_client.redis_client.lrange(queue_key, 0, -1)
        
        for i, item in enumerate(queue_items):
            job_data = json.loads(item)
            if job_data["job_id"] == job_id:
                return i + 1
        
        return -1
    
    async def _update_queue_stats(self, operation: str, priority: str):
        """Update queue statistics."""
        stats = await self.redis_client.get(self.QUEUE_STATS_KEY) or {}
        
        # Initialize stats if needed
        if f"{operation}_count" not in stats:
            stats[f"{operation}_count"] = 0
        if f"{priority}_{operation}_count" not in stats:
            stats[f"{priority}_{operation}_count"] = 0
        
        # Update counters
        stats[f"{operation}_count"] += 1
        stats[f"{priority}_{operation}_count"] += 1
        stats["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        await self.redis_client.set(self.QUEUE_STATS_KEY, stats, expire=86400)
    
    async def _publish_progress_update(self, job_id: int, progress_data: Dict[str, Any]):
        """Publish progress update for real-time notifications."""
        try:
            # Publish to Redis pub/sub for real-time updates
            channel = f"job_progress:{job_id}"
            await self.redis_client.redis_client.publish(channel, json.dumps(progress_data))
        except Exception as e:
            logger.error(f"Failed to publish progress update for job {job_id}: {str(e)}")


# Global service instance
job_queue_service = JobQueueService()


def get_job_queue_service() -> JobQueueService:
    """Get job queue service instance."""
    return job_queue_service