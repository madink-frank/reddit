"""
Pydantic schemas for crawling API endpoints.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class StartCrawlRequest(BaseModel):
    """Request model for starting a crawl."""
    crawl_type: str = Field(..., description="Type of crawl: keyword, trending, all_keywords")
    keyword_id: Optional[int] = Field(None, description="Required for keyword crawl")
    limit: Optional[int] = Field(100, ge=1, le=1000, description="Maximum items to crawl")


class StartCrawlResponse(BaseModel):
    """Response model for starting a crawl."""
    task_id: str = Field(..., description="Celery task ID")
    status: str = Field(..., description="Initial task status")
    started_at: str = Field(..., description="Task start timestamp")
    crawl_type: Optional[str] = Field(None, description="Type of crawl started")
    keyword_id: Optional[int] = Field(None, description="Keyword ID if applicable")
    limit: Optional[int] = Field(None, description="Crawl limit")


class TaskStatusResponse(BaseModel):
    """Response model for task status."""
    task_id: str = Field(..., description="Celery task ID")
    status: str = Field(..., description="Current task status")
    ready: bool = Field(..., description="Whether task is completed")
    successful: Optional[bool] = Field(None, description="Whether task completed successfully")
    failed: Optional[bool] = Field(None, description="Whether task failed")
    result: Optional[Dict[str, Any]] = Field(None, description="Task result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    progress: Optional[Dict[str, Any]] = Field(None, description="Progress information")


class CrawlHistoryResponse(BaseModel):
    """Response model for crawl history item."""
    id: int = Field(..., description="Process log ID")
    process_type: str = Field(..., description="Type of process")
    status: str = Field(..., description="Process status")
    started_at: datetime = Field(..., description="Process start time")
    completed_at: Optional[datetime] = Field(None, description="Process completion time")
    duration_seconds: Optional[float] = Field(None, description="Process duration in seconds")
    details: Dict[str, Any] = Field(default_factory=dict, description="Process details")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class WorkerInfo(BaseModel):
    """Information about a Celery worker."""
    name: str = Field(..., description="Worker name")
    status: str = Field(..., description="Worker status")
    pool: Dict[str, Any] = Field(default_factory=dict, description="Worker pool info")
    total_tasks: Dict[str, Any] = Field(default_factory=dict, description="Total tasks processed")
    active_tasks: int = Field(..., description="Number of active tasks")
    registered_tasks: int = Field(..., description="Number of registered tasks")


class WorkerStatusResponse(BaseModel):
    """Response model for worker status."""
    workers: List[WorkerInfo] = Field(default_factory=list, description="List of workers")
    total_workers: int = Field(..., description="Total number of workers")
    online_workers: int = Field(..., description="Number of online workers")
    error: Optional[str] = Field(None, description="Error message if any")


class ActiveTaskInfo(BaseModel):
    """Information about an active task."""
    task_id: str = Field(..., description="Task ID")
    name: str = Field(..., description="Task name")
    worker: str = Field(..., description="Worker processing the task")
    args: List[Any] = Field(default_factory=list, description="Task arguments")
    kwargs: Dict[str, Any] = Field(default_factory=dict, description="Task keyword arguments")
    time_start: Optional[float] = Field(None, description="Task start time")


class ScheduledTaskInfo(BaseModel):
    """Information about a scheduled task."""
    task_id: str = Field(..., description="Task ID")
    name: str = Field(..., description="Task name")
    worker: str = Field(..., description="Worker that will process the task")
    eta: str = Field(..., description="Estimated time of arrival")
    priority: int = Field(..., description="Task priority")


class ActiveTasksResponse(BaseModel):
    """Response model for active tasks."""
    active_tasks: List[ActiveTaskInfo] = Field(default_factory=list, description="Currently active tasks")
    scheduled_tasks: List[ScheduledTaskInfo] = Field(default_factory=list, description="Scheduled tasks")
    total_active: int = Field(..., description="Total number of active tasks")
    total_scheduled: int = Field(..., description="Total number of scheduled tasks")


class CrawlStatusResponse(BaseModel):
    """Response model for overall crawl status."""
    active_tasks: int = Field(..., description="Number of active tasks")
    active_task_details: List[ActiveTaskInfo] = Field(default_factory=list, description="Details of active tasks")
    recent_processes: int = Field(..., description="Number of recent processes")
    statistics: Dict[str, Any] = Field(default_factory=dict, description="Crawling statistics")
    worker_status: Dict[str, Any] = Field(default_factory=dict, description="Worker status information")
    last_updated: datetime = Field(..., description="Last update timestamp")


class CrawlStatisticsResponse(BaseModel):
    """Response model for crawl statistics."""
    user_statistics: Dict[str, Any] = Field(default_factory=dict, description="User-specific statistics")
    keyword_statistics: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Per-keyword statistics")
    overall_statistics: Dict[str, Any] = Field(default_factory=dict, description="Overall system statistics")
    generated_at: datetime = Field(..., description="Statistics generation timestamp")


class CrawlProgressUpdate(BaseModel):
    """Model for real-time crawl progress updates."""
    task_id: str = Field(..., description="Task ID")
    status: str = Field(..., description="Current status")
    progress: int = Field(..., ge=0, le=100, description="Progress percentage")
    message: str = Field(..., description="Progress message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(), description="Update timestamp")


class CrawlSummary(BaseModel):
    """Summary of a completed crawl operation."""
    task_id: str = Field(..., description="Task ID")
    process_type: str = Field(..., description="Type of process")
    status: str = Field(..., description="Final status")
    started_at: datetime = Field(..., description="Start time")
    completed_at: datetime = Field(..., description="Completion time")
    duration_seconds: float = Field(..., description="Total duration")
    items_processed: int = Field(..., description="Number of items processed")
    items_saved: int = Field(..., description="Number of items saved")
    items_failed: int = Field(..., description="Number of items that failed")
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")