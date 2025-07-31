"""
Crawling Status API Endpoints

Provides endpoints for managing and monitoring crawling operations.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.process_log import ProcessLog
from app.models.keyword import Keyword
from app.services.scheduler_service import get_scheduler_service, SchedulerService
from app.schemas.crawling import (
    CrawlStatusResponse,
    CrawlHistoryResponse,
    CrawlStatisticsResponse,
    StartCrawlRequest,
    StartCrawlResponse,
    TaskStatusResponse,
    ActiveTasksResponse,
    WorkerStatusResponse
)


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/start", response_model=StartCrawlResponse)
async def start_crawl(
    request: StartCrawlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Start a new crawling task.
    
    - **crawl_type**: Type of crawl (keyword, trending, all_keywords)
    - **keyword_id**: Required for keyword crawl type
    - **limit**: Maximum number of items to crawl
    """
    try:
        if request.crawl_type == "keyword":
            if not request.keyword_id:
                raise HTTPException(
                    status_code=400,
                    detail="keyword_id is required for keyword crawl"
                )
            
            # Verify keyword belongs to user
            keyword = db.query(Keyword).filter(
                and_(
                    Keyword.id == request.keyword_id,
                    Keyword.user_id == current_user.id
                )
            ).first()
            
            if not keyword:
                raise HTTPException(
                    status_code=404,
                    detail="Keyword not found or access denied"
                )
            
            result = scheduler.start_keyword_crawl(
                keyword_id=request.keyword_id,
                limit=request.limit or 100
            )
            
        elif request.crawl_type == "trending":
            result = scheduler.start_trending_crawl(
                limit=request.limit or 100
            )
            
        elif request.crawl_type == "all_keywords":
            result = scheduler.start_all_keywords_crawl()
            
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid crawl_type. Must be 'keyword', 'trending', or 'all_keywords'"
            )
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to start crawl: {result['error']}"
            )
        
        return StartCrawlResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting crawl: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Get the status of a specific crawling task.
    
    - **task_id**: Celery task ID
    """
    try:
        result = scheduler.get_task_status(task_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found or error: {result['error']}"
            )
        
        return TaskStatusResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/status", response_model=CrawlStatusResponse)
async def get_crawl_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Get overall crawling status including active tasks and recent activity.
    """
    try:
        # Get active tasks
        active_tasks = scheduler.get_active_tasks()
        
        # Get recent process logs for the user
        recent_logs = db.query(ProcessLog).filter(
            ProcessLog.user_id == current_user.id
        ).order_by(desc(ProcessLog.started_at)).limit(10).all()
        
        # Get crawling statistics
        stats = scheduler.get_crawling_statistics(db)
        
        # Get worker status
        worker_status = scheduler.get_worker_status()
        
        return CrawlStatusResponse(
            active_tasks=len(active_tasks),
            active_task_details=active_tasks,
            recent_processes=len(recent_logs),
            statistics=stats,
            worker_status=worker_status,
            last_updated=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logger.error(f"Error getting crawl status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/history", response_model=List[CrawlHistoryResponse])
async def get_crawl_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    process_type: Optional[str] = Query(None, description="Filter by process type"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """
    Get crawling history for the current user.
    
    - **limit**: Maximum number of records to return (1-200)
    - **offset**: Number of records to skip for pagination
    - **process_type**: Filter by process type (keyword_crawl, trending_crawl, etc.)
    - **status**: Filter by status (running, completed, failed)
    """
    try:
        query = db.query(ProcessLog).filter(
            ProcessLog.user_id == current_user.id
        )
        
        # Apply filters
        if process_type:
            query = query.filter(ProcessLog.process_type == process_type)
        
        if status:
            query = query.filter(ProcessLog.status == status)
        
        # Get total count for pagination info
        total_count = query.count()
        
        # Apply pagination and ordering
        process_logs = query.order_by(
            desc(ProcessLog.started_at)
        ).offset(offset).limit(limit).all()
        
        # Convert to response format
        history_items = []
        for log in process_logs:
            # Calculate duration if completed
            duration = None
            if log.completed_at and log.started_at:
                duration = (log.completed_at - log.started_at).total_seconds()
            
            history_item = CrawlHistoryResponse(
                id=log.id,
                process_type=log.process_type,
                status=log.status,
                started_at=log.started_at,
                completed_at=log.completed_at,
                duration_seconds=duration,
                details=log.details or {},
                error_message=log.error_message
            )
            history_items.append(history_item)
        
        return history_items
        
    except Exception as e:
        logger.error(f"Error getting crawl history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/statistics", response_model=CrawlStatisticsResponse)
async def get_crawl_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Get detailed crawling statistics for the current user.
    """
    try:
        # Get overall statistics
        overall_stats = scheduler.get_crawling_statistics(db)
        
        # Get user-specific statistics
        user_stats = db.query(ProcessLog).filter(
            ProcessLog.user_id == current_user.id
        )
        
        total_processes = user_stats.count()
        completed_processes = user_stats.filter(
            ProcessLog.status == 'completed'
        ).count()
        failed_processes = user_stats.filter(
            ProcessLog.status == 'failed'
        ).count()
        running_processes = user_stats.filter(
            ProcessLog.status == 'running'
        ).count()
        
        # Get keyword-specific stats
        keyword_stats = {}
        user_keywords = db.query(Keyword).filter(
            Keyword.user_id == current_user.id
        ).all()
        
        for keyword in user_keywords:
            keyword_processes = db.query(ProcessLog).filter(
                and_(
                    ProcessLog.user_id == current_user.id,
                    ProcessLog.details['keyword_id'].astext == str(keyword.id)
                )
            ).all()
            
            total_posts = 0
            for process in keyword_processes:
                if process.details and 'posts_saved' in process.details:
                    total_posts += process.details['posts_saved']
            
            keyword_stats[keyword.keyword] = {
                'total_crawls': len(keyword_processes),
                'total_posts_collected': total_posts,
                'last_crawl': max([p.started_at for p in keyword_processes]) if keyword_processes else None
            }
        
        return CrawlStatisticsResponse(
            user_statistics={
                'total_processes': total_processes,
                'completed_processes': completed_processes,
                'failed_processes': failed_processes,
                'running_processes': running_processes,
                'success_rate': (completed_processes / total_processes * 100) if total_processes > 0 else 0
            },
            keyword_statistics=keyword_stats,
            overall_statistics=overall_stats,
            generated_at=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logger.error(f"Error getting crawl statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/active", response_model=ActiveTasksResponse)
async def get_active_tasks(
    current_user: User = Depends(get_current_user),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Get all currently active crawling tasks.
    """
    try:
        active_tasks = scheduler.get_active_tasks()
        scheduled_tasks = scheduler.get_scheduled_tasks()
        
        return ActiveTasksResponse(
            active_tasks=active_tasks,
            scheduled_tasks=scheduled_tasks,
            total_active=len(active_tasks),
            total_scheduled=len(scheduled_tasks)
        )
        
    except Exception as e:
        logger.error(f"Error getting active tasks: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/workers", response_model=WorkerStatusResponse)
async def get_worker_status(
    current_user: User = Depends(get_current_user),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Get status of Celery workers.
    """
    try:
        worker_status = scheduler.get_worker_status()
        
        return WorkerStatusResponse(**worker_status)
        
    except Exception as e:
        logger.error(f"Error getting worker status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/cancel/{task_id}")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    scheduler: SchedulerService = Depends(get_scheduler_service)
):
    """
    Cancel a running crawling task.
    
    - **task_id**: Celery task ID to cancel
    """
    try:
        result = scheduler.cancel_task(task_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to cancel task: {result['error']}"
            )
        
        return {
            "message": f"Task {task_id} cancelled successfully",
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling task: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )