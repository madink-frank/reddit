"""
Content generation task management service.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from celery.result import AsyncResult

from app.core.celery_app import celery_app
from app.workers.content_generator import (
    generate_content_async,
    batch_generate_content,
    generate_scheduled_content
)

logger = logging.getLogger(__name__)


class ContentTaskManager:
    """Manager for content generation tasks"""
    
    def __init__(self):
        self.celery_app = celery_app
    
    def start_content_generation(
        self,
        user_id: int,
        content_type: str,
        keyword_ids: List[int],
        template_id: Optional[int] = None,
        custom_prompt: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        async_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Start content generation task.
        
        Args:
            user_id: ID of the user requesting content generation
            content_type: Type of content to generate
            keyword_ids: List of keyword IDs to base content on
            template_id: Optional template ID
            custom_prompt: Optional custom prompt
            date_from: Start date for data collection
            date_to: End date for data collection
            async_mode: Whether to run asynchronously or synchronously
        
        Returns:
            Dictionary containing task information
        """
        try:
            # Prepare task arguments
            task_args = {
                'user_id': user_id,
                'content_type': content_type,
                'keyword_ids': keyword_ids,
                'template_id': template_id,
                'custom_prompt': custom_prompt,
                'date_from': date_from.isoformat() if date_from else None,
                'date_to': date_to.isoformat() if date_to else None
            }
            
            if async_mode:
                # Start async task
                task = generate_content_async.delay(**task_args)
                
                return {
                    'task_id': task.id,
                    'status': 'PENDING',
                    'async': True,
                    'started_at': datetime.utcnow().isoformat(),
                    'message': 'Content generation task started'
                }
            else:
                # Run synchronously (for testing or immediate results)
                from app.core.database import get_db
                from app.services.content_generation_service import ContentGenerationService
                
                db = next(get_db())
                try:
                    content_service = ContentGenerationService(db)
                    result = content_service.generate_content(**task_args)
                    
                    return {
                        'task_id': None,
                        'status': 'SUCCESS',
                        'async': False,
                        'result': result,
                        'completed_at': datetime.utcnow().isoformat()
                    }
                finally:
                    db.close()
                    
        except Exception as e:
            logger.error(f"Failed to start content generation: {str(e)}")
            return {
                'task_id': None,
                'status': 'FAILED',
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
    
    def start_batch_generation(
        self,
        user_id: int,
        content_requests: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Start batch content generation.
        
        Args:
            user_id: ID of the user requesting content generation
            content_requests: List of content generation requests
        
        Returns:
            Dictionary containing task information
        """
        try:
            task = batch_generate_content.delay(user_id, content_requests)
            
            return {
                'task_id': task.id,
                'status': 'PENDING',
                'batch_size': len(content_requests),
                'started_at': datetime.utcnow().isoformat(),
                'message': f'Batch content generation started for {len(content_requests)} items'
            }
            
        except Exception as e:
            logger.error(f"Failed to start batch content generation: {str(e)}")
            return {
                'task_id': None,
                'status': 'FAILED',
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of a content generation task.
        
        Args:
            task_id: ID of the task to check
        
        Returns:
            Dictionary containing task status information
        """
        try:
            result = AsyncResult(task_id, app=self.celery_app)
            
            status_info = {
                'task_id': task_id,
                'state': result.state,
                'ready': result.ready(),
                'successful': result.successful() if result.ready() else None,
                'failed': result.failed() if result.ready() else None,
                'checked_at': datetime.utcnow().isoformat()
            }
            
            # Add state-specific information
            if result.state == 'PENDING':
                status_info['message'] = 'Task is waiting to be processed'
            elif result.state == 'PROGRESS':
                status_info['progress'] = result.info
                status_info['message'] = result.info.get('status', 'Task is in progress')
            elif result.state == 'SUCCESS':
                status_info['result'] = result.result
                status_info['message'] = 'Task completed successfully'
            elif result.state == 'FAILURE':
                status_info['error'] = str(result.info)
                status_info['message'] = f'Task failed: {str(result.info)}'
            else:
                status_info['info'] = result.info
                status_info['message'] = f'Task state: {result.state}'
            
            return status_info
            
        except Exception as e:
            logger.error(f"Failed to get task status for {task_id}: {str(e)}")
            return {
                'task_id': task_id,
                'state': 'UNKNOWN',
                'error': str(e),
                'message': 'Failed to retrieve task status'
            }
    
    def cancel_task(self, task_id: str) -> Dict[str, Any]:
        """
        Cancel a running task.
        
        Args:
            task_id: ID of the task to cancel
        
        Returns:
            Dictionary containing cancellation result
        """
        try:
            self.celery_app.control.revoke(task_id, terminate=True)
            
            return {
                'task_id': task_id,
                'cancelled': True,
                'message': 'Task cancellation requested',
                'cancelled_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to cancel task {task_id}: {str(e)}")
            return {
                'task_id': task_id,
                'cancelled': False,
                'error': str(e),
                'message': 'Failed to cancel task'
            }
    
    def get_active_tasks(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get list of active tasks, optionally filtered by user.
        
        Args:
            user_id: Optional user ID to filter tasks
        
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
                    task_info = {
                        'task_id': task['id'],
                        'name': task['name'],
                        'worker': worker,
                        'args': task.get('args', []),
                        'kwargs': task.get('kwargs', {}),
                        'time_start': task.get('time_start')
                    }
                    
                    # Filter by user_id if provided
                    if user_id is not None:
                        task_args = task.get('args', [])
                        task_kwargs = task.get('kwargs', {})
                        
                        # Check if this task belongs to the user
                        task_user_id = None
                        if task_args and len(task_args) > 0:
                            task_user_id = task_args[0]  # First arg is usually user_id
                        elif 'user_id' in task_kwargs:
                            task_user_id = task_kwargs['user_id']
                        
                        if task_user_id != user_id:
                            continue
                    
                    tasks.append(task_info)
            
            return tasks
            
        except Exception as e:
            logger.error(f"Failed to get active tasks: {str(e)}")
            return []
    
    def get_task_history(
        self,
        user_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get task history from Celery result backend.
        Note: This requires proper result backend configuration.
        
        Args:
            user_id: Optional user ID to filter tasks
            limit: Maximum number of tasks to return
        
        Returns:
            List of task history information
        """
        # This would require implementing a custom result backend
        # or storing task history in the database
        # For now, return empty list as this is complex to implement
        # without additional infrastructure
        
        logger.warning("Task history retrieval not implemented - requires custom result backend")
        return []
    
    def schedule_content_generation(
        self,
        user_id: int,
        content_type: str,
        keyword_ids: List[int],
        schedule_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Schedule content generation for future execution.
        
        Args:
            user_id: ID of the user
            content_type: Type of content to generate
            keyword_ids: List of keyword IDs
            schedule_config: Schedule configuration
        
        Returns:
            Dictionary containing scheduled task information
        """
        try:
            # For now, execute immediately
            # In a full implementation, this would use Celery Beat
            # or a custom scheduler
            
            task = generate_scheduled_content.delay(
                user_id, content_type, keyword_ids, schedule_config
            )
            
            return {
                'task_id': task.id,
                'status': 'SCHEDULED',
                'schedule_config': schedule_config,
                'scheduled_at': datetime.utcnow().isoformat(),
                'message': 'Content generation scheduled'
            }
            
        except Exception as e:
            logger.error(f"Failed to schedule content generation: {str(e)}")
            return {
                'task_id': None,
                'status': 'FAILED',
                'error': str(e),
                'message': 'Failed to schedule content generation'
            }
    
    def get_worker_stats(self) -> Dict[str, Any]:
        """
        Get statistics about Celery workers.
        
        Returns:
            Dictionary containing worker statistics
        """
        try:
            inspect = self.celery_app.control.inspect()
            
            stats = {
                'active_workers': 0,
                'total_active_tasks': 0,
                'workers': {},
                'queues': {},
                'checked_at': datetime.utcnow().isoformat()
            }
            
            # Get worker stats
            worker_stats = inspect.stats()
            if worker_stats:
                stats['active_workers'] = len(worker_stats)
                stats['workers'] = worker_stats
            
            # Get active tasks
            active_tasks = inspect.active()
            if active_tasks:
                for worker, tasks in active_tasks.items():
                    stats['total_active_tasks'] += len(tasks)
            
            # Get registered tasks
            registered = inspect.registered()
            if registered:
                stats['registered_tasks'] = registered
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get worker stats: {str(e)}")
            return {
                'error': str(e),
                'message': 'Failed to retrieve worker statistics'
            }