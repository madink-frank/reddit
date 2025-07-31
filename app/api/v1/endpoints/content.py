"""
Content generation API endpoints.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.content_generation_service import ContentGenerationService
from app.services.content_task_manager import ContentTaskManager
from app.schemas.content import (
    ContentGenerateRequest,
    ContentGenerateResponse,
    ContentResponse,
    ContentListResponse,
    ContentTaskResponse,
    ContentTaskStatusResponse,
    BatchContentGenerateRequest,
    ContentStatsResponse
)

router = APIRouter()


@router.post("/generate", response_model=ContentGenerateResponse)
async def generate_content(
    request: ContentGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate content based on Reddit data.
    
    This endpoint can run either synchronously or asynchronously based on the request.
    For large datasets or complex content generation, async mode is recommended.
    """
    try:
        task_manager = ContentTaskManager()
        
        # Parse date strings if provided
        date_from = None
        date_to = None
        if request.date_from:
            date_from = datetime.fromisoformat(request.date_from.replace('Z', '+00:00'))
        if request.date_to:
            date_to = datetime.fromisoformat(request.date_to.replace('Z', '+00:00'))
        
        # Start content generation
        result = task_manager.start_content_generation(
            user_id=current_user.id,
            content_type=request.content_type,
            keyword_ids=request.keyword_ids,
            template_id=request.template_id,
            custom_prompt=request.custom_prompt,
            date_from=date_from,
            date_to=date_to,
            async_mode=request.async_mode
        )
        
        return ContentGenerateResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")


@router.post("/generate/batch", response_model=ContentTaskResponse)
async def generate_content_batch(
    request: BatchContentGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate multiple pieces of content in batch.
    
    This is useful for generating different types of content for the same keywords
    or generating content for multiple keyword sets at once.
    """
    try:
        task_manager = ContentTaskManager()
        
        # Validate batch requests
        if not request.content_requests:
            raise HTTPException(status_code=400, detail="No content requests provided")
        
        if len(request.content_requests) > 10:  # Limit batch size
            raise HTTPException(status_code=400, detail="Batch size cannot exceed 10 items")
        
        # Start batch generation
        result = task_manager.start_batch_generation(
            user_id=current_user.id,
            content_requests=[req.dict() for req in request.content_requests]
        )
        
        return ContentTaskResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch content generation failed: {str(e)}")


@router.get("/tasks/{task_id}/status", response_model=ContentTaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a content generation task.
    
    Use this endpoint to check the progress of asynchronous content generation tasks.
    """
    try:
        task_manager = ContentTaskManager()
        status = task_manager.get_task_status(task_id)
        
        return ContentTaskStatusResponse(**status)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")


@router.delete("/tasks/{task_id}")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a running content generation task.
    """
    try:
        task_manager = ContentTaskManager()
        result = task_manager.cancel_task(task_id)
        
        if not result.get('cancelled'):
            raise HTTPException(status_code=400, detail=result.get('message', 'Failed to cancel task'))
        
        return {"message": "Task cancelled successfully", "task_id": task_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")


@router.get("/tasks", response_model=List[Dict[str, Any]])
async def get_active_tasks(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of active content generation tasks for the current user.
    """
    try:
        task_manager = ContentTaskManager()
        tasks = task_manager.get_active_tasks(user_id=current_user.id)
        
        return tasks
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active tasks: {str(e)}")


@router.get("", response_model=ContentListResponse)
async def get_generated_content(
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of generated content for the current user.
    
    Supports filtering by content type and pagination.
    """
    try:
        content_service = ContentGenerationService(db)
        
        contents = content_service.get_generated_content(
            user_id=current_user.id,
            content_type=content_type,
            limit=limit,
            offset=offset
        )
        
        # Get total count for pagination
        from app.models.generated_content import GeneratedContent
        
        total_query = db.query(db.func.count(GeneratedContent.id)).filter(
            GeneratedContent.user_id == current_user.id
        )
        
        if content_type:
            total_query = total_query.filter(
                GeneratedContent.content_type == content_type
            )
        
        total = total_query.scalar()
        
        return ContentListResponse(
            items=[ContentResponse(**content) for content in contents],
            total=total,
            limit=limit,
            offset=offset,
            has_more=offset + len(contents) < total
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get generated content: {str(e)}")


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content_by_id(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific piece of generated content by ID.
    """
    try:
        content_service = ContentGenerationService(db)
        
        contents = content_service.get_generated_content(
            user_id=current_user.id,
            content_id=content_id
        )
        
        if not contents:
            raise HTTPException(status_code=404, detail="Content not found")
        
        return ContentResponse(**contents[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get content: {str(e)}")


@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a piece of generated content.
    """
    try:
        content_service = ContentGenerationService(db)
        
        success = content_service.delete_generated_content(
            user_id=current_user.id,
            content_id=content_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Content not found")
        
        return {"message": "Content deleted successfully", "content_id": content_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete content: {str(e)}")


@router.get("/stats/overview", response_model=ContentStatsResponse)
async def get_content_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get content generation statistics for the current user.
    
    Provides overview of content generation activity, usage patterns, and available templates.
    """
    try:
        content_service = ContentGenerationService(db)
        stats = content_service.get_content_statistics(current_user.id)
        
        return ContentStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get content statistics: {str(e)}")


@router.get("/templates", response_model=List[Dict[str, str]])
async def get_available_templates():
    """
    Get list of available content generation templates.
    
    Returns information about all available templates including their descriptions.
    """
    try:
        from app.services.content_templates import TemplateManager
        
        template_manager = TemplateManager()
        templates = template_manager.list_templates()
        
        return templates
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")


@router.get("/worker/stats")
async def get_worker_statistics(
    current_user: User = Depends(get_current_user)
):
    """
    Get Celery worker statistics.
    
    Provides information about worker status, active tasks, and system health.
    Useful for monitoring and debugging content generation performance.
    """
    try:
        task_manager = ContentTaskManager()
        stats = task_manager.get_worker_stats()
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get worker statistics: {str(e)}")


@router.post("/schedule")
async def schedule_content_generation(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Schedule content generation for future execution.
    
    This endpoint allows users to set up recurring content generation
    or schedule content generation for specific times.
    """
    try:
        task_manager = ContentTaskManager()
        
        # Validate required fields
        required_fields = ['content_type', 'keyword_ids', 'schedule_config']
        for field in required_fields:
            if field not in request:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = task_manager.schedule_content_generation(
            user_id=current_user.id,
            content_type=request['content_type'],
            keyword_ids=request['keyword_ids'],
            schedule_config=request['schedule_config']
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule content generation: {str(e)}")