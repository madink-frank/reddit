"""
Crawling Jobs API Endpoints

API endpoints for managing crawling jobs, schedules, and real-time monitoring.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.crawling_job import CrawlingJob, JobStatus, JobPriority, CrawlingSchedule, ScheduleFrequency
from app.services.job_queue_service import get_job_queue_service
from app.services.job_monitoring_service import get_job_monitoring_service
from app.schemas.crawling import (
    StartCrawlRequest,
    StartCrawlResponse,
    TaskStatusResponse,
    CrawlHistoryResponse
)


router = APIRouter()


# Job Management Endpoints

@router.post("/jobs/create", response_model=Dict[str, Any])
async def create_crawling_job(
    job_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new crawling job."""
    try:
        job = CrawlingJob(
            name=job_data.get("name", f"Crawl {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
            job_type=job_data["job_type"],
            parameters=job_data.get("parameters", {}),
            priority=JobPriority(job_data.get("priority", "normal")),
            user_id=current_user.id,
            keyword_id=job_data.get("keyword_id"),
            max_retries=job_data.get("max_retries", 3)
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Enqueue the job
        job_queue_service = get_job_queue_service()
        enqueue_result = await job_queue_service.enqueue_job(db, job.id, job.priority)
        
        return {
            "job_id": job.id,
            "status": "created",
            "enqueue_result": enqueue_result,
            "created_at": job.created_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.get("/jobs/{job_id}/status", response_model=Dict[str, Any])
async def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current status of a specific job."""
    try:
        # Check if job belongs to user
        job = db.query(CrawlingJob).filter(
            CrawlingJob.id == job_id,
            CrawlingJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get real-time status from Redis
        job_queue_service = get_job_queue_service()
        redis_status = await job_queue_service.get_job_status(job_id)
        
        # Get progress information
        progress = await job_queue_service.get_job_progress(job_id)
        
        return {
            "job_id": job_id,
            "database_status": job.status.value,
            "redis_status": redis_status,
            "progress": progress,
            "created_at": job.created_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "error_message": job.error_message,
            "retry_count": job.retry_count,
            "points_consumed": job.points_consumed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.get("/jobs/{job_id}/progress", response_model=Dict[str, Any])
async def get_job_progress(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed progress information for a job."""
    try:
        # Check if job belongs to user
        job = db.query(CrawlingJob).filter(
            CrawlingJob.id == job_id,
            CrawlingJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get detailed progress from monitoring service
        monitoring_service = get_job_monitoring_service()
        progress_details = await monitoring_service.get_job_progress_details(job_id)
        
        return progress_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job progress: {str(e)}")


@router.post("/jobs/{job_id}/cancel", response_model=Dict[str, Any])
async def cancel_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a running or queued job."""
    try:
        # Check if job belongs to user
        job = db.query(CrawlingJob).filter(
            CrawlingJob.id == job_id,
            CrawlingJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.is_completed:
            raise HTTPException(status_code=400, detail="Job is already completed")
        
        # Cancel the job
        job_queue_service = get_job_queue_service()
        cancel_result = await job_queue_service.cancel_job(db, job_id)
        
        return cancel_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")


@router.post("/jobs/{job_id}/retry", response_model=Dict[str, Any])
async def retry_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retry a failed job."""
    try:
        # Check if job belongs to user
        job = db.query(CrawlingJob).filter(
            CrawlingJob.id == job_id,
            CrawlingJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.status != JobStatus.FAILED:
            raise HTTPException(status_code=400, detail="Only failed jobs can be retried")
        
        # Retry the job
        job_queue_service = get_job_queue_service()
        retry_result = await job_queue_service.retry_job(db, job_id)
        
        return retry_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retry job: {str(e)}")


# Monitoring Endpoints

@router.get("/monitoring/dashboard", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get real-time dashboard statistics."""
    try:
        monitoring_service = get_job_monitoring_service()
        stats = await monitoring_service.get_real_time_dashboard_stats(db, current_user.id)
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")


@router.get("/monitoring/active-jobs", response_model=List[Dict[str, Any]])
async def get_active_jobs_monitoring(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get monitoring information for all active jobs."""
    try:
        monitoring_service = get_job_monitoring_service()
        active_jobs = await monitoring_service.get_active_jobs_monitoring(db, current_user.id)
        
        return active_jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active jobs: {str(e)}")


@router.get("/monitoring/job-history", response_model=List[Dict[str, Any]])
async def get_job_history(
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = Query(None),
    job_type_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job history with filtering options."""
    try:
        # Convert status filter to enum if provided
        status_enum = None
        if status_filter:
            try:
                status_enum = JobStatus(status_filter)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status filter: {status_filter}")
        
        monitoring_service = get_job_monitoring_service()
        history = await monitoring_service.get_job_history(
            db, current_user.id, limit, status_enum, job_type_filter
        )
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job history: {str(e)}")


# Queue Management Endpoints

@router.get("/queue/statistics", response_model=Dict[str, Any])
async def get_queue_statistics():
    """Get queue statistics and metrics."""
    try:
        job_queue_service = get_job_queue_service()
        stats = await job_queue_service.get_queue_statistics()
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get queue statistics: {str(e)}")


@router.get("/queue/active-jobs", response_model=List[Dict[str, Any]])
async def get_queue_active_jobs():
    """Get list of jobs currently in queues."""
    try:
        job_queue_service = get_job_queue_service()
        active_jobs = await job_queue_service.get_active_jobs()
        
        return active_jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active jobs from queue: {str(e)}")


# Schedule Management Endpoints

@router.post("/schedules/create", response_model=Dict[str, Any])
async def create_crawling_schedule(
    schedule_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new crawling schedule."""
    try:
        schedule = CrawlingSchedule(
            name=schedule_data["name"],
            description=schedule_data.get("description", ""),
            frequency=ScheduleFrequency(schedule_data["frequency"]),
            cron_expression=schedule_data.get("cron_expression"),
            job_type=schedule_data["job_type"],
            job_parameters=schedule_data.get("job_parameters", {}),
            job_priority=JobPriority(schedule_data.get("job_priority", "normal")),
            max_concurrent_jobs=schedule_data.get("max_concurrent_jobs", 1),
            timeout_seconds=schedule_data.get("timeout_seconds", 3600),
            max_retries=schedule_data.get("max_retries", 3),
            user_id=current_user.id,
            keyword_id=schedule_data.get("keyword_id")
        )
        
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        return {
            "schedule_id": schedule.id,
            "status": "created",
            "created_at": schedule.created_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create schedule: {str(e)}")


@router.get("/schedules", response_model=List[Dict[str, Any]])
async def get_crawling_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all crawling schedules for the user."""
    try:
        schedules = db.query(CrawlingSchedule).filter(
            CrawlingSchedule.user_id == current_user.id
        ).all()
        
        schedule_list = []
        for schedule in schedules:
            schedule_data = {
                "schedule_id": schedule.id,
                "name": schedule.name,
                "description": schedule.description,
                "frequency": schedule.frequency.value,
                "job_type": schedule.job_type,
                "is_active": schedule.is_active,
                "next_run_at": schedule.next_run_at.isoformat() if schedule.next_run_at else None,
                "last_run_at": schedule.last_run_at.isoformat() if schedule.last_run_at else None,
                "total_runs": schedule.total_runs,
                "success_rate": schedule.success_rate,
                "active_jobs_count": schedule.active_jobs_count,
                "created_at": schedule.created_at.isoformat()
            }
            schedule_list.append(schedule_data)
        
        return schedule_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get schedules: {str(e)}")


@router.put("/schedules/{schedule_id}/toggle", response_model=Dict[str, Any])
async def toggle_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle a schedule's active status."""
    try:
        schedule = db.query(CrawlingSchedule).filter(
            CrawlingSchedule.id == schedule_id,
            CrawlingSchedule.user_id == current_user.id
        ).first()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        schedule.is_active = not schedule.is_active
        db.commit()
        
        return {
            "schedule_id": schedule_id,
            "is_active": schedule.is_active,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle schedule: {str(e)}")


# Manual Trigger Endpoints

@router.post("/trigger/keyword-crawl", response_model=Dict[str, Any])
async def trigger_keyword_crawl(
    keyword_id: int,
    limit: int = Query(100, ge=1, le=1000),
    priority: str = Query("normal"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a keyword crawl job."""
    try:
        # Create job
        job = CrawlingJob(
            name=f"Manual Keyword Crawl - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            job_type="keyword_crawl",
            parameters={"keyword_id": keyword_id, "limit": limit},
            priority=JobPriority(priority),
            user_id=current_user.id,
            keyword_id=keyword_id
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Enqueue immediately
        job_queue_service = get_job_queue_service()
        enqueue_result = await job_queue_service.enqueue_job(db, job.id, job.priority)
        
        return {
            "job_id": job.id,
            "status": "triggered",
            "enqueue_result": enqueue_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger keyword crawl: {str(e)}")


@router.post("/trigger/trending-crawl", response_model=Dict[str, Any])
async def trigger_trending_crawl(
    limit: int = Query(100, ge=1, le=1000),
    priority: str = Query("normal"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a trending posts crawl job."""
    try:
        # Create job
        job = CrawlingJob(
            name=f"Manual Trending Crawl - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            job_type="trending_crawl",
            parameters={"limit": limit},
            priority=JobPriority(priority),
            user_id=current_user.id
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Enqueue immediately
        job_queue_service = get_job_queue_service()
        enqueue_result = await job_queue_service.enqueue_job(db, job.id, job.priority)
        
        return {
            "job_id": job.id,
            "status": "triggered",
            "enqueue_result": enqueue_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger trending crawl: {str(e)}")


@router.post("/trigger/all-keywords-crawl", response_model=Dict[str, Any])
async def trigger_all_keywords_crawl(
    priority: str = Query("normal"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger crawl for all active keywords."""
    try:
        # Create job
        job = CrawlingJob(
            name=f"Manual All Keywords Crawl - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            job_type="all_keywords_crawl",
            parameters={},
            priority=JobPriority(priority),
            user_id=current_user.id
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Enqueue immediately
        job_queue_service = get_job_queue_service()
        enqueue_result = await job_queue_service.enqueue_job(db, job.id, job.priority)
        
        return {
            "job_id": job.id,
            "status": "triggered",
            "enqueue_result": enqueue_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger all keywords crawl: {str(e)}")