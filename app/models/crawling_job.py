"""
Crawling Job Management Models

Models for managing crawling jobs, schedules, and real-time monitoring.
"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, Boolean, JSON, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
from enum import Enum as PyEnum
from .base import BaseModel


class JobStatus(PyEnum):
    """Enumeration for job status values."""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class JobPriority(PyEnum):
    """Enumeration for job priority values."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class CrawlingJob(BaseModel):
    """Model for individual crawling jobs."""
    __tablename__ = "crawling_jobs"
    
    # Basic job information
    name = Column(String(255), nullable=False)
    job_type = Column(String(50), nullable=False)  # keyword, trending, all_keywords, comments
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    priority = Column(Enum(JobPriority), default=JobPriority.NORMAL, nullable=False)
    
    # Task and queue information
    celery_task_id = Column(String(255), unique=True, index=True)
    queue_name = Column(String(100), default="default")
    
    # Job parameters
    parameters = Column(JSON, default=dict)  # keyword_id, limit, subreddits, etc.
    
    # Progress tracking
    progress_current = Column(Integer, default=0)
    progress_total = Column(Integer, default=0)
    progress_percentage = Column(Float, default=0.0)
    progress_message = Column(Text)
    
    # Timing information
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    estimated_duration = Column(Integer)  # seconds
    actual_duration = Column(Integer)  # seconds
    
    # Results and metrics
    items_processed = Column(Integer, default=0)
    items_saved = Column(Integer, default=0)
    items_failed = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    
    # Error handling
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Resource usage
    points_consumed = Column(Integer, default=0)
    memory_usage = Column(Float)  # MB
    cpu_usage = Column(Float)  # percentage
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="SET NULL"), nullable=True)
    schedule_id = Column(Integer, ForeignKey("crawling_schedules.id", ondelete="SET NULL"), nullable=True)
    
    user = relationship("User")
    keyword = relationship("Keyword")
    schedule = relationship("CrawlingSchedule", back_populates="jobs")
    
    def update_progress(self, current: int, total: int = None, message: str = None):
        """Update job progress information."""
        self.progress_current = current
        if total is not None:
            self.progress_total = total
        
        if self.progress_total > 0:
            self.progress_percentage = (self.progress_current / self.progress_total) * 100
        
        if message:
            self.progress_message = message
    
    def calculate_success_rate(self):
        """Calculate and update success rate."""
        total_items = self.items_processed
        if total_items > 0:
            self.success_rate = (self.items_saved / total_items) * 100
        else:
            self.success_rate = 0.0
    
    def mark_completed(self):
        """Mark job as completed and calculate final metrics."""
        self.status = JobStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        
        if self.started_at:
            duration = self.completed_at - self.started_at
            self.actual_duration = int(duration.total_seconds())
        
        self.calculate_success_rate()
        self.progress_percentage = 100.0
    
    def mark_failed(self, error_message: str):
        """Mark job as failed with error message."""
        self.status = JobStatus.FAILED
        self.completed_at = datetime.now(timezone.utc)
        self.error_message = error_message
        
        if self.started_at:
            duration = self.completed_at - self.started_at
            self.actual_duration = int(duration.total_seconds())
        
        self.calculate_success_rate()
    
    @property
    def is_active(self) -> bool:
        """Check if job is currently active."""
        return self.status in [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.RETRYING]
    
    @property
    def is_completed(self) -> bool:
        """Check if job is completed (success or failure)."""
        return self.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]


class ScheduleFrequency(PyEnum):
    """Enumeration for schedule frequency values."""
    ONCE = "once"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class CrawlingSchedule(BaseModel):
    """Model for crawling schedules."""
    __tablename__ = "crawling_schedules"
    
    # Basic schedule information
    name = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Schedule configuration
    frequency = Column(Enum(ScheduleFrequency), nullable=False)
    cron_expression = Column(String(100))  # For custom schedules
    timezone = Column(String(50), default="UTC")
    
    # Job configuration
    job_type = Column(String(50), nullable=False)
    job_parameters = Column(JSON, default=dict)
    job_priority = Column(Enum(JobPriority), default=JobPriority.NORMAL)
    
    # Execution settings
    max_concurrent_jobs = Column(Integer, default=1)
    timeout_seconds = Column(Integer, default=3600)  # 1 hour default
    max_retries = Column(Integer, default=3)
    
    # Timing information
    next_run_at = Column(DateTime(timezone=True))
    last_run_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Statistics
    total_runs = Column(Integer, default=0)
    successful_runs = Column(Integer, default=0)
    failed_runs = Column(Integer, default=0)
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="SET NULL"), nullable=True)
    
    user = relationship("User")
    keyword = relationship("Keyword")
    jobs = relationship("CrawlingJob", back_populates="schedule", cascade="all, delete-orphan")
    
    def update_run_statistics(self, success: bool):
        """Update schedule run statistics."""
        self.total_runs += 1
        self.last_run_at = datetime.now(timezone.utc)
        
        if success:
            self.successful_runs += 1
        else:
            self.failed_runs += 1
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_runs > 0:
            return (self.successful_runs / self.total_runs) * 100
        return 0.0
    
    @property
    def active_jobs_count(self) -> int:
        """Count of currently active jobs for this schedule."""
        return len([job for job in self.jobs if job.is_active])


class JobMetrics(BaseModel):
    """Model for storing job performance metrics."""
    __tablename__ = "job_metrics"
    
    # Job reference
    job_id = Column(Integer, ForeignKey("crawling_jobs.id", ondelete="CASCADE"), nullable=False)
    
    # Performance metrics
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    cpu_usage = Column(Float)  # percentage
    memory_usage = Column(Float)  # MB
    network_io = Column(Float)  # MB
    disk_io = Column(Float)  # MB
    
    # Processing metrics
    items_per_second = Column(Float)
    queue_size = Column(Integer)
    active_connections = Column(Integer)
    
    # Custom metrics
    custom_metrics = Column(JSON, default=dict)
    
    # Relationships
    job = relationship("CrawlingJob")


class JobNotification(BaseModel):
    """Model for job-related notifications."""
    __tablename__ = "job_notifications"
    
    # Notification information
    job_id = Column(Integer, ForeignKey("crawling_jobs.id", ondelete="CASCADE"), nullable=False)
    notification_type = Column(String(50), nullable=False)  # started, completed, failed, progress
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Delivery settings
    delivery_method = Column(String(50), nullable=False)  # email, sms, webhook, dashboard
    recipient = Column(String(255), nullable=False)
    
    # Status tracking
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True))
    delivery_status = Column(String(50))  # pending, sent, failed, delivered
    error_message = Column(Text)
    
    # Relationships
    job = relationship("CrawlingJob")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    user = relationship("User")