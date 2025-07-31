"""
Crawling Notification Service

Handles notifications for crawling job events including completion alerts,
SMS/email notifications, and in-dashboard notifications.
"""

import logging
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from email.mime.text import MIMEText as MimeText
from email.mime.multipart import MIMEMultipart as MimeMultipart
import smtplib
import requests

from app.core.config import settings
from app.utils.redis_client import get_redis_client
from app.models.crawling_job import CrawlingJob, JobNotification
from app.models.user import User
from app.services.notification_service import get_notification_service


logger = logging.getLogger(__name__)


class CrawlingNotificationService:
    """Service for managing crawling-related notifications."""
    
    def __init__(self):
        self.redis_client = None
        self.notification_service = None
        
        # Redis key prefixes
        self.NOTIFICATIONS_PREFIX = "crawling_notifications:"
        self.USER_NOTIFICATIONS_PREFIX = "user_notifications:"
        self.NOTIFICATION_SETTINGS_PREFIX = "notification_settings:"
    
    async def initialize(self):
        """Initialize Redis client and dependencies."""
        if not self.redis_client:
            self.redis_client = await get_redis_client()
            await self.redis_client.ensure_connection()
        
        if not self.notification_service:
            self.notification_service = get_notification_service()
    
    async def notify_job_started(
        self,
        db: Session,
        job: CrawlingJob,
        user: User
    ) -> bool:
        """
        Send notification when a crawling job starts.
        
        Args:
            db: Database session
            job: Crawling job that started
            user: User who owns the job
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Check user notification preferences
            settings = await self._get_user_notification_settings(user.id)
            if not settings.get("job_started", True):
                return True  # User disabled this notification type
            
            # Create notification message
            title = f"Crawling Job Started"
            message = f"Job '{job.name}' ({job.job_type}) has started processing."
            
            # Send in-dashboard notification
            await self._send_dashboard_notification(
                user.id, job.id, "job_started", title, message, "info"
            )
            
            # Send email notification if enabled
            if settings.get("email_enabled", False) and user.email:
                await self._send_email_notification(
                    user.email, title, message, job
                )
            
            # Send SMS notification if enabled
            if settings.get("sms_enabled", False) and settings.get("phone_number"):
                await self._send_sms_notification(
                    settings["phone_number"], f"{title}: {message}"
                )
            
            # Store notification in database
            await self._store_notification(
                db, job.id, user.id, "job_started", title, message
            )
            
            logger.info(f"Sent job started notification for job {job.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send job started notification: {str(e)}")
            return False
    
    async def notify_job_completed(
        self,
        db: Session,
        job: CrawlingJob,
        user: User
    ) -> bool:
        """
        Send notification when a crawling job completes successfully.
        
        Args:
            db: Database session
            job: Completed crawling job
            user: User who owns the job
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Check user notification preferences
            settings = await self._get_user_notification_settings(user.id)
            if not settings.get("job_completed", True):
                return True
            
            # Create notification message with job statistics
            title = f"Crawling Job Completed"
            message = (
                f"Job '{job.name}' completed successfully! "
                f"Processed {job.items_processed} items, "
                f"saved {job.items_saved} items "
                f"({job.success_rate:.1f}% success rate) "
                f"in {job.actual_duration}s."
            )
            
            # Send in-dashboard notification
            await self._send_dashboard_notification(
                user.id, job.id, "job_completed", title, message, "success"
            )
            
            # Send email notification if enabled
            if settings.get("email_enabled", False) and user.email:
                await self._send_email_notification(
                    user.email, title, message, job, include_stats=True
                )
            
            # Send SMS notification if enabled
            if settings.get("sms_enabled", False) and settings.get("phone_number"):
                await self._send_sms_notification(
                    settings["phone_number"], f"{title}: {message}"
                )
            
            # Store notification in database
            await self._store_notification(
                db, job.id, user.id, "job_completed", title, message
            )
            
            logger.info(f"Sent job completed notification for job {job.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send job completed notification: {str(e)}")
            return False
    
    async def notify_job_failed(
        self,
        db: Session,
        job: CrawlingJob,
        user: User,
        error_message: str
    ) -> bool:
        """
        Send notification when a crawling job fails.
        
        Args:
            db: Database session
            job: Failed crawling job
            user: User who owns the job
            error_message: Error message
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Check user notification preferences
            settings = await self._get_user_notification_settings(user.id)
            if not settings.get("job_failed", True):
                return True
            
            # Create notification message
            title = f"Crawling Job Failed"
            message = (
                f"Job '{job.name}' failed after {job.retry_count} retries. "
                f"Error: {error_message[:100]}{'...' if len(error_message) > 100 else ''}"
            )
            
            # Send in-dashboard notification
            await self._send_dashboard_notification(
                user.id, job.id, "job_failed", title, message, "error"
            )
            
            # Send email notification if enabled (always send for failures)
            if user.email:
                await self._send_email_notification(
                    user.email, title, message, job, error_message=error_message
                )
            
            # Send SMS notification if enabled (always send for failures)
            if settings.get("sms_enabled", False) and settings.get("phone_number"):
                await self._send_sms_notification(
                    settings["phone_number"], f"ALERT - {title}: {message}"
                )
            
            # Store notification in database
            await self._store_notification(
                db, job.id, user.id, "job_failed", title, message
            )
            
            logger.info(f"Sent job failed notification for job {job.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send job failed notification: {str(e)}")
            return False
    
    async def notify_job_progress(
        self,
        db: Session,
        job: CrawlingJob,
        user: User,
        progress: Dict[str, Any]
    ) -> bool:
        """
        Send notification for significant job progress milestones.
        
        Args:
            db: Database session
            job: Crawling job in progress
            user: User who owns the job
            progress: Progress information
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Check user notification preferences
            settings = await self._get_user_notification_settings(user.id)
            if not settings.get("job_progress", False):
                return True  # Progress notifications are opt-in
            
            # Only notify on significant milestones (25%, 50%, 75%)
            percentage = progress.get("percentage", 0)
            milestones = [25, 50, 75]
            
            if not any(abs(percentage - milestone) < 1 for milestone in milestones):
                return True  # Not a milestone
            
            # Create notification message
            title = f"Job Progress Update"
            message = (
                f"Job '{job.name}' is {percentage:.0f}% complete. "
                f"Processed {progress.get('current', 0)} of {progress.get('total', 0)} items."
            )
            
            # Send in-dashboard notification only
            await self._send_dashboard_notification(
                user.id, job.id, "job_progress", title, message, "info"
            )
            
            logger.info(f"Sent job progress notification for job {job.id} at {percentage}%")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send job progress notification: {str(e)}")
            return False
    
    async def get_user_notifications(
        self,
        user_id: int,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get notifications for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of notifications to return
            unread_only: Only return unread notifications
            
        Returns:
            List of notifications
        """
        try:
            await self.initialize()
            
            # Get notifications from Redis
            notifications_key = f"{self.USER_NOTIFICATIONS_PREFIX}{user_id}"
            notifications = await self.redis_client.get(notifications_key) or []
            
            # Filter unread if requested
            if unread_only:
                notifications = [n for n in notifications if not n.get("read", False)]
            
            # Sort by timestamp (newest first) and limit
            notifications.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            return notifications[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get user notifications: {str(e)}")
            return []
    
    async def mark_notification_read(
        self,
        user_id: int,
        notification_id: str
    ) -> bool:
        """
        Mark a notification as read.
        
        Args:
            user_id: User ID
            notification_id: Notification ID
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Get user notifications
            notifications_key = f"{self.USER_NOTIFICATIONS_PREFIX}{user_id}"
            notifications = await self.redis_client.get(notifications_key) or []
            
            # Find and mark notification as read
            for notification in notifications:
                if notification.get("id") == notification_id:
                    notification["read"] = True
                    notification["read_at"] = datetime.now(timezone.utc).isoformat()
                    break
            
            # Save updated notifications
            await self.redis_client.set(notifications_key, notifications, expire=86400 * 30)  # 30 days
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark notification as read: {str(e)}")
            return False
    
    async def get_notification_settings(self, user_id: int) -> Dict[str, Any]:
        """
        Get notification settings for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Notification settings
        """
        try:
            await self.initialize()
            
            settings = await self._get_user_notification_settings(user_id)
            return settings
            
        except Exception as e:
            logger.error(f"Failed to get notification settings: {str(e)}")
            return self._get_default_notification_settings()
    
    async def update_notification_settings(
        self,
        user_id: int,
        settings: Dict[str, Any]
    ) -> bool:
        """
        Update notification settings for a user.
        
        Args:
            user_id: User ID
            settings: New notification settings
            
        Returns:
            Success status
        """
        try:
            await self.initialize()
            
            # Validate settings
            valid_keys = {
                "job_started", "job_completed", "job_failed", "job_progress",
                "email_enabled", "sms_enabled", "phone_number"
            }
            
            filtered_settings = {k: v for k, v in settings.items() if k in valid_keys}
            
            # Save settings
            settings_key = f"{self.NOTIFICATION_SETTINGS_PREFIX}{user_id}"
            await self.redis_client.set(settings_key, filtered_settings, expire=86400 * 365)  # 1 year
            
            logger.info(f"Updated notification settings for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update notification settings: {str(e)}")
            return False
    
    async def _send_dashboard_notification(
        self,
        user_id: int,
        job_id: int,
        notification_type: str,
        title: str,
        message: str,
        severity: str
    ):
        """Send in-dashboard notification."""
        notification = {
            "id": f"{job_id}_{notification_type}_{int(datetime.now().timestamp())}",
            "job_id": job_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "severity": severity,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "read": False
        }
        
        # Add to user notifications
        notifications_key = f"{self.USER_NOTIFICATIONS_PREFIX}{user_id}"
        notifications = await self.redis_client.get(notifications_key) or []
        notifications.insert(0, notification)  # Add to beginning
        
        # Keep only last 100 notifications
        notifications = notifications[:100]
        
        await self.redis_client.set(notifications_key, notifications, expire=86400 * 30)  # 30 days
        
        # Publish real-time notification
        await self.redis_client.redis_client.publish(
            f"user_notifications:{user_id}",
            json.dumps(notification)
        )
    
    async def _send_email_notification(
        self,
        email: str,
        title: str,
        message: str,
        job: CrawlingJob,
        include_stats: bool = False,
        error_message: str = None
    ):
        """Send email notification."""
        try:
            if not settings.SMTP_HOST or not settings.SMTP_USER:
                logger.warning("SMTP not configured, skipping email notification")
                return
            
            # Create email content
            html_content = self._create_email_template(
                title, message, job, include_stats, error_message
            )
            
            msg = MimeMultipart('alternative')
            msg['Subject'] = f"Reddit Crawler - {title}"
            msg['From'] = settings.SMTP_USER
            msg['To'] = email
            
            # Add HTML content
            html_part = MimeText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Sent email notification to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")
    
    async def _send_sms_notification(self, phone_number: str, message: str):
        """Send SMS notification using Twilio or similar service."""
        try:
            if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
                logger.warning("Twilio not configured, skipping SMS notification")
                return
            
            # Use Twilio API
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            
            data = {
                'From': settings.TWILIO_PHONE_NUMBER,
                'To': phone_number,
                'Body': message[:160]  # SMS character limit
            }
            
            response = requests.post(
                url,
                data=data,
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            )
            
            if response.status_code == 201:
                logger.info(f"Sent SMS notification to {phone_number}")
            else:
                logger.error(f"Failed to send SMS: {response.text}")
                
        except Exception as e:
            logger.error(f"Failed to send SMS notification: {str(e)}")
    
    async def _store_notification(
        self,
        db: Session,
        job_id: int,
        user_id: int,
        notification_type: str,
        title: str,
        message: str
    ):
        """Store notification in database."""
        try:
            notification = JobNotification(
                job_id=job_id,
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                delivery_method="dashboard",
                recipient=str(user_id),
                is_sent=True,
                sent_at=datetime.now(timezone.utc),
                delivery_status="delivered"
            )
            
            db.add(notification)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to store notification in database: {str(e)}")
    
    async def _get_user_notification_settings(self, user_id: int) -> Dict[str, Any]:
        """Get user notification settings from Redis."""
        settings_key = f"{self.NOTIFICATION_SETTINGS_PREFIX}{user_id}"
        settings = await self.redis_client.get(settings_key)
        
        if not settings:
            settings = self._get_default_notification_settings()
            await self.redis_client.set(settings_key, settings, expire=86400 * 365)
        
        return settings
    
    def _get_default_notification_settings(self) -> Dict[str, Any]:
        """Get default notification settings."""
        return {
            "job_started": True,
            "job_completed": True,
            "job_failed": True,
            "job_progress": False,
            "email_enabled": False,
            "sms_enabled": False,
            "phone_number": ""
        }
    
    def _create_email_template(
        self,
        title: str,
        message: str,
        job: CrawlingJob,
        include_stats: bool = False,
        error_message: str = None
    ) -> str:
        """Create HTML email template."""
        stats_html = ""
        if include_stats:
            stats_html = f"""
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0; color: #495057;">Job Statistics</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Items Processed: {job.items_processed}</li>
                    <li>Items Saved: {job.items_saved}</li>
                    <li>Items Failed: {job.items_failed}</li>
                    <li>Success Rate: {job.success_rate:.1f}%</li>
                    <li>Duration: {job.actual_duration}s</li>
                    <li>Points Consumed: {job.points_consumed}</li>
                </ul>
            </div>
            """
        
        error_html = ""
        if error_message:
            error_html = f"""
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
                <h3 style="margin: 0 0 10px 0; color: #721c24;">Error Details</h3>
                <p style="margin: 0; font-family: monospace; font-size: 12px; color: #721c24;">{error_message}</p>
            </div>
            """
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px;">Reddit Content Crawler</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">{title}</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; margin-bottom: 15px;">{message}</p>
                
                <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #495057;">Job Details</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Job Name: {job.name}</li>
                        <li>Job Type: {job.job_type}</li>
                        <li>Priority: {job.priority.value}</li>
                        <li>Created: {job.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</li>
                        <li>Status: {job.status.value}</li>
                    </ul>
                </div>
                
                {stats_html}
                {error_html}
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; font-size: 12px; color: #6c757d;">
                        This is an automated notification from Reddit Content Crawler. 
                        You can manage your notification preferences in the dashboard.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """


# Global service instance
crawling_notification_service = CrawlingNotificationService()


def get_crawling_notification_service() -> CrawlingNotificationService:
    """Get crawling notification service instance."""
    return crawling_notification_service