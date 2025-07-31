"""
Scheduler Service for Reddit Crawling

Manages dynamic scheduling and monitoring of crawling tasks.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from celery import current_app
from celery.result import AsyncResult
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.models.keyword import Keyword
from app.models.process_log import ProcessLog
from app.workers.reddit_crawler import (
    crawl_keyword_posts,
    crawl_post_comments,
    crawl_trending_posts,
    crawl_all_active_keywords
)


logger = logging.getLogger(__name__)


class SchedulerService:
    """Service for managing crawling task scheduling and monitoring."""
    
    def __init__(self):
        self.celery_app = celery_app
    
    def start_keyword_crawl(self, keyword_id: int, limit: int = 100) -> Dict[str, Any]:
        """
        Start crawling task for a specific keyword.
        
        Args:
            keyword_id: ID of the keyword to crawl
            limit: Maximum number of posts to crawl
            
        Returns:
            Task information
        """
        try:
            task = crawl_keyword_posts.delay(keyword_id, limit)
            
            logger.info(f"Started keyword crawl task {task.id} for keyword {keyword_id}")
            
            return {
                'task_id': task.id,
                'keyword_id': keyword_id,
                'status': 'started',
                'limit': limit,
                'started_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to start keyword crawl for {keyword_id}: {str(e)}")
            return {
                'error': str(e),
                'keyword_id': keyword_id,
                'status': 'failed'
            }
    
    def start_comments_crawl(self, post_id: int, limit: int = 50) -> Dict[str, Any]:
        """
        Start crawling task for post comments.
        
        Args:
            post_id: ID of the post to crawl comments for
            limit: Maximum number of comments to crawl
            
        Returns:
            Task information
        """
        try:
            task = crawl_post_comments.delay(post_id, limit)
            
            logger.info(f"Started comments crawl task {task.id} for post {post_id}")
            
            return {
                'task_id': task.id,
                'post_id': post_id,
                'status': 'started',
                'limit': limit,
                'started_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to start comments crawl for post {post_id}: {str(e)}")
            return {
                'error': str(e),
                'post_id': post_id,
                'status': 'failed'
            }
    
    def start_trending_crawl(self, limit: int = 100) -> Dict[str, Any]:
        """
        Start crawling task for trending posts.
        
        Args:
            limit: Maximum number of posts to crawl per subreddit
            
        Returns:
            Task information
        """
        try:
            task = crawl_trending_posts.delay(limit)
            
            logger.info(f"Started trending posts crawl task {task.id}")
            
            return {
                'task_id': task.id,
                'status': 'started',
                'limit': limit,
                'started_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to start trending posts crawl: {str(e)}")
            return {
                'error': str(e),
                'status': 'failed'
            }
    
    def start_all_keywords_crawl(self) -> Dict[str, Any]:
        """
        Start crawling task for all active keywords.
        
        Returns:
            Task information
        """
        try:
            task = crawl_all_active_keywords.delay()
            
            logger.info(f"Started all keywords crawl task {task.id}")
            
            return {
                'task_id': task.id,
                'status': 'started',
                'started_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to start all keywords crawl: {str(e)}")
            return {
                'error': str(e),
                'status': 'failed'
            }
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get status of a specific task.
        
        Args:
            task_id: Celery task ID
            
        Returns:
            Task status information
        """
        try:
            result = AsyncResult(task_id, app=self.celery_app)
            
            status_info = {
                'task_id': task_id,
                'status': result.status,
                'ready': result.ready(),
                'successful': result.successful() if result.ready() else None,
                'failed': result.failed() if result.ready() else None
            }
            
            # Add result if task is completed
            if result.ready():
                if result.successful():
                    status_info['result'] = result.result
                elif result.failed():
                    status_info['error'] = str(result.result)
            else:
                # Add progress info if available
                if hasattr(result, 'info') and result.info:
                    status_info['progress'] = result.info
            
            return status_info
            
        except Exception as e:
            logger.error(f"Failed to get task status for {task_id}: {str(e)}")
            return {
                'task_id': task_id,
                'status': 'unknown',
                'error': str(e)
            }
    
    def cancel_task(self, task_id: str) -> Dict[str, Any]:
        """
        Cancel a running task.
        
        Args:
            task_id: Celery task ID
            
        Returns:
            Cancellation result
        """
        try:
            self.celery_app.control.revoke(task_id, terminate=True)
            
            logger.info(f"Cancelled task {task_id}")
            
            return {
                'task_id': task_id,
                'status': 'cancelled',
                'cancelled_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to cancel task {task_id}: {str(e)}")
            return {
                'task_id': task_id,
                'status': 'cancel_failed',
                'error': str(e)
            }
    
    def get_active_tasks(self) -> List[Dict[str, Any]]:
        """
        Get list of currently active tasks.
        
        Returns:
            List of active task information
        """
        try:
            # Get active tasks from Celery
            inspect = self.celery_app.control.inspect()
            active_tasks = inspect.active()
            
            if not active_tasks:
                return []
            
            tasks = []
            for worker, worker_tasks in active_tasks.items():
                for task in worker_tasks:
                    tasks.append({
                        'task_id': task['id'],
                        'name': task['name'],
                        'worker': worker,
                        'args': task.get('args', []),
                        'kwargs': task.get('kwargs', {}),
                        'time_start': task.get('time_start')
                    })
            
            return tasks
            
        except Exception as e:
            logger.error(f"Failed to get active tasks: {str(e)}")
            return []
    
    def get_scheduled_tasks(self) -> List[Dict[str, Any]]:
        """
        Get list of scheduled periodic tasks.
        
        Returns:
            List of scheduled task information
        """
        try:
            # Get scheduled tasks from Celery Beat
            inspect = self.celery_app.control.inspect()
            scheduled_tasks = inspect.scheduled()
            
            if not scheduled_tasks:
                return []
            
            tasks = []
            for worker, worker_tasks in scheduled_tasks.items():
                for task in worker_tasks:
                    tasks.append({
                        'task_id': task['request']['id'],
                        'name': task['request']['task'],
                        'worker': worker,
                        'eta': task['eta'],
                        'priority': task['priority']
                    })
            
            return tasks
            
        except Exception as e:
            logger.error(f"Failed to get scheduled tasks: {str(e)}")
            return []
    
    def get_crawling_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Get crawling statistics from process logs.
        
        Args:
            db: Database session
            
        Returns:
            Crawling statistics
        """
        try:
            # Get statistics for the last 24 hours
            since = datetime.now(timezone.utc) - timedelta(hours=24)
            
            # Count process logs by status
            total_processes = db.query(ProcessLog).filter(
                ProcessLog.started_at >= since
            ).count()
            
            completed_processes = db.query(ProcessLog).filter(
                ProcessLog.started_at >= since,
                ProcessLog.status == 'completed'
            ).count()
            
            failed_processes = db.query(ProcessLog).filter(
                ProcessLog.started_at >= since,
                ProcessLog.status == 'failed'
            ).count()
            
            running_processes = db.query(ProcessLog).filter(
                ProcessLog.started_at >= since,
                ProcessLog.status == 'running'
            ).count()
            
            # Get keyword crawl statistics
            keyword_crawls = db.query(ProcessLog).filter(
                ProcessLog.started_at >= since,
                ProcessLog.process_type == 'keyword_crawl',
                ProcessLog.status == 'completed'
            ).all()
            
            total_posts_crawled = 0
            for crawl in keyword_crawls:
                if crawl.details and 'posts_saved' in crawl.details:
                    total_posts_crawled += crawl.details['posts_saved']
            
            return {
                'period': '24_hours',
                'total_processes': total_processes,
                'completed_processes': completed_processes,
                'failed_processes': failed_processes,
                'running_processes': running_processes,
                'success_rate': (completed_processes / total_processes * 100) if total_processes > 0 else 0,
                'total_posts_crawled': total_posts_crawled,
                'active_keywords': db.query(Keyword).filter(Keyword.is_active == True).count()
            }
            
        except Exception as e:
            logger.error(f"Failed to get crawling statistics: {str(e)}")
            return {
                'error': str(e)
            }
    
    def schedule_keyword_crawl(
        self,
        keyword_id: int,
        schedule_time: datetime,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Schedule a keyword crawl for a specific time.
        
        Args:
            keyword_id: ID of the keyword to crawl
            schedule_time: When to run the crawl
            limit: Maximum number of posts to crawl
            
        Returns:
            Scheduled task information
        """
        try:
            # Calculate ETA (time until execution)
            eta = schedule_time
            
            task = crawl_keyword_posts.apply_async(
                args=[keyword_id, limit],
                eta=eta
            )
            
            logger.info(f"Scheduled keyword crawl task {task.id} for {schedule_time}")
            
            return {
                'task_id': task.id,
                'keyword_id': keyword_id,
                'status': 'scheduled',
                'scheduled_for': schedule_time.isoformat(),
                'limit': limit
            }
            
        except Exception as e:
            logger.error(f"Failed to schedule keyword crawl: {str(e)}")
            return {
                'error': str(e),
                'keyword_id': keyword_id,
                'status': 'schedule_failed'
            }
    
    def get_worker_status(self) -> Dict[str, Any]:
        """
        Get status of Celery workers.
        
        Returns:
            Worker status information
        """
        try:
            inspect = self.celery_app.control.inspect()
            
            # Get worker statistics
            stats = inspect.stats()
            active = inspect.active()
            registered = inspect.registered()
            
            workers = []
            if stats:
                for worker_name, worker_stats in stats.items():
                    worker_info = {
                        'name': worker_name,
                        'status': 'online',
                        'pool': worker_stats.get('pool', {}),
                        'total_tasks': worker_stats.get('total', {}),
                        'active_tasks': len(active.get(worker_name, [])) if active else 0,
                        'registered_tasks': len(registered.get(worker_name, [])) if registered else 0
                    }
                    workers.append(worker_info)
            
            return {
                'workers': workers,
                'total_workers': len(workers),
                'online_workers': len([w for w in workers if w['status'] == 'online'])
            }
            
        except Exception as e:
            logger.error(f"Failed to get worker status: {str(e)}")
            return {
                'error': str(e),
                'workers': [],
                'total_workers': 0,
                'online_workers': 0
            }


# Global service instance
scheduler_service = SchedulerService()


def get_scheduler_service() -> SchedulerService:
    """Get scheduler service instance."""
    return scheduler_service