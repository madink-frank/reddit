"""
Celery workers for content generation tasks.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import time
from celery import current_task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.database import get_db
from app.core.metrics import record_content_generation, record_error
from app.services.content_generation_service import ContentGenerationService
from app.services.analytics_service import AnalyticsService
from app.models.generated_content import GeneratedContent
from app.models.keyword import Keyword
from app.models.user import User

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="generate_content_async")
def generate_content_async(
    self,
    user_id: int,
    content_type: str,
    keyword_ids: List[int],
    template_id: Optional[int] = None,
    custom_prompt: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> Dict[str, Any]:
    """
    Asynchronously generate content based on Reddit data.
    
    Args:
        user_id: ID of the user requesting content generation
        content_type: Type of content to generate
        keyword_ids: List of keyword IDs to base content on
        template_id: Optional template ID
        custom_prompt: Optional custom prompt
        date_from: Start date for data collection (ISO format)
        date_to: End date for data collection (ISO format)
    
    Returns:
        Dictionary containing generated content information
    """
    task_id = self.request.id
    start_time = time.time()
    logger.info(f"Starting content generation task {task_id} for user {user_id}")
    
    try:
        # Update task state to PROGRESS
        self.update_state(
            state='PROGRESS',
            meta={
                'current': 0,
                'total': 100,
                'status': 'Initializing content generation...'
            }
        )
        
        # Get database session
        db = next(get_db())
        
        try:
            # Validate user exists
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User with ID {user_id} not found")
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': 20,
                    'total': 100,
                    'status': 'Validating keywords and collecting data...'
                }
            )
            
            # Parse date strings if provided
            date_from_dt = None
            date_to_dt = None
            if date_from:
                date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            
            # Initialize content generation service
            content_service = ContentGenerationService(db)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': 40,
                    'total': 100,
                    'status': 'Analyzing Reddit data and trends...'
                }
            )
            
            # Generate content
            result = content_service.generate_content(
                user_id=user_id,
                content_type=content_type,
                keyword_ids=keyword_ids,
                template_id=template_id,
                custom_prompt=custom_prompt,
                date_from=date_from_dt,
                date_to=date_to_dt
            )
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': 80,
                    'total': 100,
                    'status': 'Finalizing and saving content...'
                }
            )
            
            # Record successful content generation
            duration = time.time() - start_time
            record_content_generation(content_type, duration, "completed")
            
            # Add task metadata to result
            result['task_id'] = task_id
            result['generation_method'] = 'async'
            result['processing_time'] = datetime.utcnow().isoformat()
            
            logger.info(f"Content generation task {task_id} completed successfully")
            
            # Final progress update
            self.update_state(
                state='SUCCESS',
                meta={
                    'current': 100,
                    'total': 100,
                    'status': 'Content generation completed successfully',
                    'result': result
                }
            )
            
            return result
            
        finally:
            db.close()
            
    except Exception as e:
        # Record error metrics
        duration = time.time() - start_time
        record_content_generation(content_type, duration, "failed")
        record_error("ContentGenerationError", "content_generator")
        
        logger.error(f"Content generation task {task_id} failed: {str(e)}")
        
        # Update task state to FAILURE
        self.update_state(
            state='FAILURE',
            meta={
                'current': 0,
                'total': 100,
                'status': f'Content generation failed: {str(e)}',
                'error': str(e)
            }
        )
        
        # Re-raise the exception so Celery marks the task as failed
        raise


@celery_app.task(name="batch_generate_content")
def batch_generate_content(
    user_id: int,
    content_requests: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate multiple pieces of content in batch.
    
    Args:
        user_id: ID of the user requesting content generation
        content_requests: List of content generation requests
    
    Returns:
        Dictionary containing batch generation results
    """
    logger.info(f"Starting batch content generation for user {user_id}, {len(content_requests)} requests")
    
    db = next(get_db())
    results = []
    errors = []
    
    try:
        content_service = ContentGenerationService(db)
        
        for i, request in enumerate(content_requests):
            try:
                result = content_service.generate_content(
                    user_id=user_id,
                    content_type=request.get('content_type'),
                    keyword_ids=request.get('keyword_ids', []),
                    template_id=request.get('template_id'),
                    custom_prompt=request.get('custom_prompt'),
                    date_from=datetime.fromisoformat(request['date_from']) if request.get('date_from') else None,
                    date_to=datetime.fromisoformat(request['date_to']) if request.get('date_to') else None
                )
                results.append(result)
                logger.info(f"Batch item {i+1}/{len(content_requests)} completed")
                
            except Exception as e:
                error_info = {
                    'request_index': i,
                    'error': str(e),
                    'request': request
                }
                errors.append(error_info)
                logger.error(f"Batch item {i+1}/{len(content_requests)} failed: {str(e)}")
        
        return {
            'user_id': user_id,
            'total_requests': len(content_requests),
            'successful': len(results),
            'failed': len(errors),
            'results': results,
            'errors': errors,
            'completed_at': datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()


@celery_app.task(name="update_analytics_cache")
def update_analytics_cache() -> Dict[str, Any]:
    """
    Periodic task to update analytics cache for better performance.
    
    Returns:
        Dictionary containing cache update results
    """
    logger.info("Starting analytics cache update task")
    
    db = next(get_db())
    
    try:
        analytics_service = AnalyticsService(db)
        
        # Get all active users
        active_users = db.query(User).filter(User.is_active == True).all()
        
        updated_caches = 0
        errors = []
        
        for user in active_users:
            try:
                # Get user's keywords
                keywords = db.query(Keyword).filter(
                    Keyword.user_id == user.id,
                    Keyword.is_active == True
                ).all()
                
                if not keywords:
                    continue
                
                # Update trend analysis cache for each keyword
                for keyword in keywords:
                    try:
                        # This would typically call analytics service methods
                        # that cache trend data in Redis
                        analytics_service.get_keyword_trends(
                            keyword_id=keyword.id,
                            days=7,
                            use_cache=False  # Force refresh
                        )
                        updated_caches += 1
                        
                    except Exception as e:
                        errors.append({
                            'user_id': user.id,
                            'keyword_id': keyword.id,
                            'error': str(e)
                        })
                        
            except Exception as e:
                errors.append({
                    'user_id': user.id,
                    'error': str(e)
                })
        
        result = {
            'updated_caches': updated_caches,
            'total_users': len(active_users),
            'errors': len(errors),
            'error_details': errors,
            'completed_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Analytics cache update completed: {updated_caches} caches updated")
        return result
        
    except Exception as e:
        logger.error(f"Analytics cache update failed: {str(e)}")
        raise
        
    finally:
        db.close()


@celery_app.task(name="cleanup_old_generated_content")
def cleanup_old_generated_content(days_old: int = 90) -> Dict[str, Any]:
    """
    Clean up old generated content to save storage space.
    
    Args:
        days_old: Delete content older than this many days
    
    Returns:
        Dictionary containing cleanup results
    """
    logger.info(f"Starting cleanup of generated content older than {days_old} days")
    
    db = next(get_db())
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Find old content
        old_content = db.query(GeneratedContent).filter(
            GeneratedContent.created_at < cutoff_date
        ).all()
        
        deleted_count = len(old_content)
        
        # Delete old content
        for content in old_content:
            db.delete(content)
        
        db.commit()
        
        result = {
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat(),
            'completed_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Cleanup completed: {deleted_count} old content items deleted")
        return result
        
    except Exception as e:
        logger.error(f"Cleanup failed: {str(e)}")
        db.rollback()
        raise
        
    finally:
        db.close()


@celery_app.task(name="generate_scheduled_content")
def generate_scheduled_content(
    user_id: int,
    content_type: str,
    keyword_ids: List[int],
    schedule_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate content based on a schedule configuration.
    This could be used for automated content generation.
    
    Args:
        user_id: ID of the user
        content_type: Type of content to generate
        keyword_ids: List of keyword IDs
        schedule_config: Configuration for scheduled generation
    
    Returns:
        Dictionary containing generation results
    """
    logger.info(f"Starting scheduled content generation for user {user_id}")
    
    db = next(get_db())
    
    try:
        content_service = ContentGenerationService(db)
        
        # Determine date range based on schedule config
        date_to = datetime.utcnow()
        days_back = schedule_config.get('days_back', 7)
        date_from = date_to - timedelta(days=days_back)
        
        # Generate content
        result = content_service.generate_content(
            user_id=user_id,
            content_type=content_type,
            keyword_ids=keyword_ids,
            date_from=date_from,
            date_to=date_to
        )
        
        # Add schedule metadata
        result['schedule_config'] = schedule_config
        result['generation_type'] = 'scheduled'
        
        logger.info(f"Scheduled content generation completed for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Scheduled content generation failed for user {user_id}: {str(e)}")
        raise
        
    finally:
        db.close()


@celery_app.task(name="get_content_generation_status")
def get_content_generation_status(task_id: str) -> Dict[str, Any]:
    """
    Get the status of a content generation task.
    
    Args:
        task_id: ID of the task to check
    
    Returns:
        Dictionary containing task status information
    """
    try:
        # Get task result
        result = celery_app.AsyncResult(task_id)
        
        return {
            'task_id': task_id,
            'state': result.state,
            'info': result.info,
            'ready': result.ready(),
            'successful': result.successful() if result.ready() else None,
            'failed': result.failed() if result.ready() else None
        }
        
    except Exception as e:
        logger.error(f"Failed to get task status for {task_id}: {str(e)}")
        return {
            'task_id': task_id,
            'state': 'UNKNOWN',
            'error': str(e)
        }