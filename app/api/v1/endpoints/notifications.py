"""
Notifications API Endpoints

API endpoints for managing crawling job notifications and user notification preferences.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.crawling_notification_service import get_crawling_notification_service


router = APIRouter()


@router.get("/notifications", response_model=List[Dict[str, Any]])
async def get_user_notifications(
    limit: int = Query(50, ge=1, le=200),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for the current user."""
    try:
        notification_service = get_crawling_notification_service()
        notifications = await notification_service.get_user_notifications(
            current_user.id, limit, unread_only
        )
        
        return notifications
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")


@router.post("/notifications/{notification_id}/read", response_model=Dict[str, Any])
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    try:
        notification_service = get_crawling_notification_service()
        success = await notification_service.mark_notification_read(
            current_user.id, notification_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "notification_id": notification_id,
            "status": "marked_as_read",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")


@router.post("/notifications/mark-all-read", response_model=Dict[str, Any])
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for the current user."""
    try:
        notification_service = get_crawling_notification_service()
        
        # Get all unread notifications
        notifications = await notification_service.get_user_notifications(
            current_user.id, limit=1000, unread_only=True
        )
        
        # Mark each as read
        marked_count = 0
        for notification in notifications:
            success = await notification_service.mark_notification_read(
                current_user.id, notification["id"]
            )
            if success:
                marked_count += 1
        
        return {
            "status": "success",
            "marked_count": marked_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark all notifications as read: {str(e)}")


@router.delete("/notifications/{notification_id}", response_model=Dict[str, Any])
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a specific notification."""
    try:
        notification_service = get_crawling_notification_service()
        
        # Get user notifications
        notifications = await notification_service.get_user_notifications(
            current_user.id, limit=1000
        )
        
        # Filter out the notification to delete
        updated_notifications = [n for n in notifications if n["id"] != notification_id]
        
        if len(updated_notifications) == len(notifications):
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Update notifications in Redis
        await notification_service.redis_client.set(
            f"{notification_service.USER_NOTIFICATIONS_PREFIX}{current_user.id}",
            updated_notifications,
            expire=86400 * 30
        )
        
        return {
            "notification_id": notification_id,
            "status": "deleted",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")


@router.delete("/notifications/clear-all", response_model=Dict[str, Any])
async def clear_all_notifications(
    current_user: User = Depends(get_current_user)
):
    """Clear all notifications for the current user."""
    try:
        notification_service = get_crawling_notification_service()
        
        # Clear notifications in Redis
        await notification_service.redis_client.set(
            f"{notification_service.USER_NOTIFICATIONS_PREFIX}{current_user.id}",
            [],
            expire=86400 * 30
        )
        
        return {
            "status": "cleared",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear notifications: {str(e)}")


@router.get("/notification-settings", response_model=Dict[str, Any])
async def get_notification_settings(
    current_user: User = Depends(get_current_user)
):
    """Get notification settings for the current user."""
    try:
        notification_service = get_crawling_notification_service()
        settings = await notification_service.get_notification_settings(current_user.id)
        
        return settings
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notification settings: {str(e)}")


@router.put("/notification-settings", response_model=Dict[str, Any])
async def update_notification_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update notification settings for the current user."""
    try:
        notification_service = get_crawling_notification_service()
        success = await notification_service.update_notification_settings(
            current_user.id, settings
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update settings")
        
        return {
            "status": "updated",
            "settings": settings,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update notification settings: {str(e)}")


@router.get("/notification-stats", response_model=Dict[str, Any])
async def get_notification_stats(
    current_user: User = Depends(get_current_user)
):
    """Get notification statistics for the current user."""
    try:
        notification_service = get_crawling_notification_service()
        
        # Get all notifications
        all_notifications = await notification_service.get_user_notifications(
            current_user.id, limit=1000
        )
        
        # Calculate statistics
        total_count = len(all_notifications)
        unread_count = len([n for n in all_notifications if not n.get("read", False)])
        
        # Count by type
        type_counts = {}
        severity_counts = {}
        
        for notification in all_notifications:
            notification_type = notification.get("type", "unknown")
            severity = notification.get("severity", "info")
            
            type_counts[notification_type] = type_counts.get(notification_type, 0) + 1
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Recent activity (last 24 hours)
        recent_cutoff = datetime.now(timezone.utc).timestamp() - (24 * 60 * 60)
        recent_notifications = [
            n for n in all_notifications 
            if datetime.fromisoformat(n["timestamp"].replace('Z', '+00:00')).timestamp() > recent_cutoff
        ]
        
        return {
            "total_notifications": total_count,
            "unread_notifications": unread_count,
            "read_notifications": total_count - unread_count,
            "recent_24h": len(recent_notifications),
            "type_breakdown": type_counts,
            "severity_breakdown": severity_counts,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notification stats: {str(e)}")


@router.post("/test-notification", response_model=Dict[str, Any])
async def send_test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a test notification to verify the notification system."""
    try:
        notification_service = get_crawling_notification_service()
        
        # Send test dashboard notification
        await notification_service._send_dashboard_notification(
            current_user.id,
            0,  # Test job ID
            "test",
            "Test Notification",
            "This is a test notification to verify the notification system is working correctly.",
            "info"
        )
        
        return {
            "status": "sent",
            "message": "Test notification sent successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test notification: {str(e)}")