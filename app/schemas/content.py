"""
Pydantic schemas for content generation API.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator


class ContentGenerateRequest(BaseModel):
    """Request schema for content generation"""
    content_type: str = Field(..., description="Type of content to generate (blog, product_intro, trend_analysis)")
    keyword_ids: List[int] = Field(..., description="List of keyword IDs to base content on")
    template_id: Optional[int] = Field(None, description="Optional template ID")
    custom_prompt: Optional[str] = Field(None, description="Optional custom prompt for content generation")
    date_from: Optional[str] = Field(None, description="Start date for data collection (ISO format)")
    date_to: Optional[str] = Field(None, description="End date for data collection (ISO format)")
    async_mode: bool = Field(True, description="Whether to run asynchronously")
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = ['blog', 'product_intro', 'trend_analysis']
        if v not in allowed_types:
            raise ValueError(f'content_type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('keyword_ids')
    def validate_keyword_ids(cls, v):
        if not v:
            raise ValueError('At least one keyword ID is required')
        if len(v) > 10:
            raise ValueError('Maximum 10 keywords allowed per request')
        return v


class ContentGenerateResponse(BaseModel):
    """Response schema for content generation"""
    task_id: Optional[str] = Field(None, description="Task ID for async operations")
    status: str = Field(..., description="Status of the content generation")
    async_mode: bool = Field(..., description="Whether the operation is asynchronous")
    message: str = Field(..., description="Status message")
    result: Optional[Dict[str, Any]] = Field(None, description="Generated content (for sync operations)")
    started_at: Optional[str] = Field(None, description="Task start time")
    completed_at: Optional[str] = Field(None, description="Task completion time")
    failed_at: Optional[str] = Field(None, description="Task failure time")
    error: Optional[str] = Field(None, description="Error message if failed")


class BatchContentRequest(BaseModel):
    """Individual content request for batch generation"""
    content_type: str = Field(..., description="Type of content to generate")
    keyword_ids: List[int] = Field(..., description="List of keyword IDs")
    template_id: Optional[int] = Field(None, description="Optional template ID")
    custom_prompt: Optional[str] = Field(None, description="Optional custom prompt")
    date_from: Optional[str] = Field(None, description="Start date (ISO format)")
    date_to: Optional[str] = Field(None, description="End date (ISO format)")
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = ['blog', 'product_intro', 'trend_analysis']
        if v not in allowed_types:
            raise ValueError(f'content_type must be one of: {", ".join(allowed_types)}')
        return v


class BatchContentGenerateRequest(BaseModel):
    """Request schema for batch content generation"""
    content_requests: List[BatchContentRequest] = Field(..., description="List of content generation requests")
    
    @validator('content_requests')
    def validate_batch_size(cls, v):
        if not v:
            raise ValueError('At least one content request is required')
        if len(v) > 10:
            raise ValueError('Maximum 10 content requests allowed per batch')
        return v


class ContentTaskResponse(BaseModel):
    """Response schema for content generation tasks"""
    task_id: Optional[str] = Field(None, description="Task ID")
    status: str = Field(..., description="Task status")
    message: str = Field(..., description="Status message")
    batch_size: Optional[int] = Field(None, description="Batch size for batch operations")
    started_at: Optional[str] = Field(None, description="Task start time")
    scheduled_at: Optional[str] = Field(None, description="Task schedule time")
    failed_at: Optional[str] = Field(None, description="Task failure time")
    error: Optional[str] = Field(None, description="Error message if failed")


class ContentTaskStatusResponse(BaseModel):
    """Response schema for task status"""
    task_id: str = Field(..., description="Task ID")
    state: str = Field(..., description="Task state")
    ready: Optional[bool] = Field(None, description="Whether task is ready")
    successful: Optional[bool] = Field(None, description="Whether task was successful")
    failed: Optional[bool] = Field(None, description="Whether task failed")
    message: str = Field(..., description="Status message")
    progress: Optional[Dict[str, Any]] = Field(None, description="Progress information")
    result: Optional[Dict[str, Any]] = Field(None, description="Task result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    checked_at: str = Field(..., description="Status check time")


class ContentResponse(BaseModel):
    """Response schema for generated content"""
    id: int = Field(..., description="Content ID")
    title: str = Field(..., description="Content title")
    content_type: str = Field(..., description="Type of content")
    content: str = Field(..., description="Generated content")
    template_used: Optional[str] = Field(None, description="Template used for generation")
    source_keywords: List[int] = Field(..., description="Source keyword IDs")
    metadata: Dict[str, Any] = Field(..., description="Content metadata")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True


class ContentListResponse(BaseModel):
    """Response schema for content list"""
    items: List[ContentResponse] = Field(..., description="List of content items")
    total: int = Field(..., description="Total number of items")
    limit: int = Field(..., description="Items per page")
    offset: int = Field(..., description="Number of items skipped")
    has_more: bool = Field(..., description="Whether there are more items")


class ContentStatsResponse(BaseModel):
    """Response schema for content statistics"""
    total_content: int = Field(..., description="Total number of generated content items")
    content_by_type: Dict[str, int] = Field(..., description="Content count by type")
    recent_activity: int = Field(..., description="Recent activity count (last 30 days)")
    template_usage: Dict[str, int] = Field(..., description="Template usage statistics")
    available_templates: List[Dict[str, str]] = Field(..., description="Available templates")


class ContentTemplateResponse(BaseModel):
    """Response schema for content templates"""
    content_type: str = Field(..., description="Content type")
    template_name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")


class ContentSearchRequest(BaseModel):
    """Request schema for content search"""
    query: Optional[str] = Field(None, description="Search query")
    content_type: Optional[str] = Field(None, description="Filter by content type")
    keyword_ids: Optional[List[int]] = Field(None, description="Filter by keyword IDs")
    date_from: Optional[str] = Field(None, description="Start date filter (ISO format)")
    date_to: Optional[str] = Field(None, description="End date filter (ISO format)")
    limit: int = Field(20, ge=1, le=100, description="Number of items to return")
    offset: int = Field(0, ge=0, description="Number of items to skip")
    
    @validator('content_type')
    def validate_content_type(cls, v):
        if v is not None:
            allowed_types = ['blog', 'product_intro', 'trend_analysis']
            if v not in allowed_types:
                raise ValueError(f'content_type must be one of: {", ".join(allowed_types)}')
        return v


class ContentUpdateRequest(BaseModel):
    """Request schema for content updates"""
    title: Optional[str] = Field(None, description="Updated title")
    content: Optional[str] = Field(None, description="Updated content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Updated metadata")


class ContentExportRequest(BaseModel):
    """Request schema for content export"""
    content_ids: List[int] = Field(..., description="List of content IDs to export")
    format: str = Field("json", description="Export format (json, markdown, html)")
    include_metadata: bool = Field(True, description="Whether to include metadata")
    
    @validator('format')
    def validate_format(cls, v):
        allowed_formats = ['json', 'markdown', 'html']
        if v not in allowed_formats:
            raise ValueError(f'format must be one of: {", ".join(allowed_formats)}')
        return v
    
    @validator('content_ids')
    def validate_content_ids(cls, v):
        if not v:
            raise ValueError('At least one content ID is required')
        if len(v) > 50:
            raise ValueError('Maximum 50 content items can be exported at once')
        return v


class WorkerStatsResponse(BaseModel):
    """Response schema for worker statistics"""
    active_workers: int = Field(..., description="Number of active workers")
    total_active_tasks: int = Field(..., description="Total number of active tasks")
    workers: Dict[str, Any] = Field(..., description="Worker details")
    queues: Dict[str, Any] = Field(..., description="Queue information")
    registered_tasks: Optional[Dict[str, List[str]]] = Field(None, description="Registered tasks by worker")
    checked_at: str = Field(..., description="Statistics check time")
    error: Optional[str] = Field(None, description="Error message if failed")
    message: Optional[str] = Field(None, description="Status message")


class ScheduleConfigRequest(BaseModel):
    """Request schema for scheduling content generation"""
    content_type: str = Field(..., description="Type of content to generate")
    keyword_ids: List[int] = Field(..., description="List of keyword IDs")
    schedule_config: Dict[str, Any] = Field(..., description="Schedule configuration")
    template_id: Optional[int] = Field(None, description="Optional template ID")
    custom_prompt: Optional[str] = Field(None, description="Optional custom prompt")
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = ['blog', 'product_intro', 'trend_analysis']
        if v not in allowed_types:
            raise ValueError(f'content_type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('keyword_ids')
    def validate_keyword_ids(cls, v):
        if not v:
            raise ValueError('At least one keyword ID is required')
        return v