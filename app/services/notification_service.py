"""
Notification service for sending alerts and notifications.
"""
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from enum import Enum
import json

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationLevel(Enum):
    """Notification severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class NotificationChannel(Enum):
    """Available notification channels."""
    EMAIL = "email"
    WEBHOOK = "webhook"
    LOG = "log"


class NotificationService:
    """Service for sending notifications and alerts."""
    
    def __init__(self):
        self.channels = {
            NotificationChannel.EMAIL: self._send_email,
            NotificationChannel.WEBHOOK: self._send_webhook,
            NotificationChannel.LOG: self._send_log
        }
        
        # Configuration for different alert types
        self.alert_configs = {
            'api_response_time': {
                'threshold': 5.0,  # seconds
                'level': NotificationLevel.WARNING,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL]
            },
            'crawling_failure': {
                'level': NotificationLevel.ERROR,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL]
            },
            'database_connection_failure': {
                'level': NotificationLevel.CRITICAL,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL, NotificationChannel.WEBHOOK]
            },
            'redis_connection_failure': {
                'level': NotificationLevel.ERROR,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL]
            },
            'celery_worker_failure': {
                'level': NotificationLevel.ERROR,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL]
            },
            'disk_space_low': {
                'threshold': 1.0,  # GB
                'level': NotificationLevel.WARNING,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL]
            },
            'memory_usage_high': {
                'threshold': 90.0,  # percentage
                'level': NotificationLevel.WARNING,
                'channels': [NotificationChannel.LOG, NotificationChannel.EMAIL]
            }
        }
    
    async def send_notification(
        self,
        alert_type: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        level: Optional[NotificationLevel] = None,
        channels: Optional[List[NotificationChannel]] = None
    ) -> Dict[str, Any]:
        """
        Send a notification through configured channels.
        
        Args:
            alert_type: Type of alert (used for configuration lookup)
            message: Main notification message
            details: Additional details to include
            level: Override notification level
            channels: Override notification channels
            
        Returns:
            Dictionary containing send results
        """
        # Get configuration for this alert type
        config = self.alert_configs.get(alert_type, {})
        
        # Use provided values or fall back to configuration
        notification_level = level or config.get('level', NotificationLevel.INFO)
        notification_channels = channels or config.get('channels', [NotificationChannel.LOG])
        
        # Prepare notification data
        notification_data = {
            'alert_type': alert_type,
            'level': notification_level.value,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'service': 'reddit-content-platform'
        }
        
        # Send through each configured channel
        results = {}
        for channel in notification_channels:
            try:
                if channel in self.channels:
                    result = await self.channels[channel](notification_data)
                    results[channel.value] = result
                else:
                    results[channel.value] = {
                        'success': False,
                        'error': f'Unknown channel: {channel.value}'
                    }
            except Exception as e:
                logger.error(f"Failed to send notification via {channel.value}: {str(e)}")
                results[channel.value] = {
                    'success': False,
                    'error': str(e)
                }
        
        return {
            'alert_type': alert_type,
            'level': notification_level.value,
            'channels_attempted': len(notification_channels),
            'results': results,
            'timestamp': notification_data['timestamp']
        }
    
    async def _send_email(self, notification_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send notification via email."""
        try:
            # Check if email is configured
            if not all([
                getattr(settings, 'SMTP_HOST', None),
                getattr(settings, 'SMTP_PORT', None),
                getattr(settings, 'SMTP_USER', None),
                getattr(settings, 'SMTP_PASSWORD', None),
                getattr(settings, 'ADMIN_EMAIL', None)
            ]):
                return {
                    'success': False,
                    'error': 'Email configuration not complete'
                }
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = settings.ADMIN_EMAIL
            msg['Subject'] = f"[{notification_data['level'].upper()}] {notification_data['alert_type']} - Reddit Content Platform"
            
            # Create email body
            body = self._create_email_body(notification_data)
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            return {
                'success': True,
                'recipient': settings.ADMIN_EMAIL,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _send_webhook(self, notification_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send notification via webhook."""
        try:
            import httpx
            
            webhook_url = getattr(settings, 'WEBHOOK_URL', None)
            if not webhook_url:
                return {
                    'success': False,
                    'error': 'Webhook URL not configured'
                }
            
            # Prepare webhook payload
            payload = {
                'text': f"🚨 {notification_data['alert_type']} Alert",
                'attachments': [{
                    'color': self._get_color_for_level(notification_data['level']),
                    'fields': [
                        {
                            'title': 'Alert Type',
                            'value': notification_data['alert_type'],
                            'short': True
                        },
                        {
                            'title': 'Level',
                            'value': notification_data['level'].upper(),
                            'short': True
                        },
                        {
                            'title': 'Message',
                            'value': notification_data['message'],
                            'short': False
                        },
                        {
                            'title': 'Timestamp',
                            'value': notification_data['timestamp'],
                            'short': True
                        }
                    ]
                }]
            }
            
            # Add details if available
            if notification_data.get('details'):
                payload['attachments'][0]['fields'].append({
                    'title': 'Details',
                    'value': json.dumps(notification_data['details'], indent=2),
                    'short': False
                })
            
            # Send webhook
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
            
            return {
                'success': True,
                'webhook_url': webhook_url,
                'status_code': response.status_code,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _send_log(self, notification_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send notification to application logs."""
        try:
            level = notification_data['level']
            message = f"ALERT [{level.upper()}] {notification_data['alert_type']}: {notification_data['message']}"
            
            if notification_data.get('details'):
                message += f" | Details: {json.dumps(notification_data['details'])}"
            
            # Log at appropriate level
            if level == 'critical':
                logger.critical(message)
            elif level == 'error':
                logger.error(message)
            elif level == 'warning':
                logger.warning(message)
            else:
                logger.info(message)
            
            return {
                'success': True,
                'logged_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_email_body(self, notification_data: Dict[str, Any]) -> str:
        """Create HTML email body for notification."""
        level_colors = {
            'info': '#17a2b8',
            'warning': '#ffc107',
            'error': '#dc3545',
            'critical': '#6f42c1'
        }
        
        color = level_colors.get(notification_data['level'], '#6c757d')
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background-color: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🚨 System Alert</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Reddit Content Platform</p>
                </div>
                
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <h2 style="color: #333; margin: 0 0 10px 0;">Alert Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #666;">Alert Type:</td>
                                <td style="padding: 8px 0;">{notification_data['alert_type']}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #666;">Level:</td>
                                <td style="padding: 8px 0;">
                                    <span style="background-color: {color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                                        {notification_data['level'].upper()}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #666;">Timestamp:</td>
                                <td style="padding: 8px 0;">{notification_data['timestamp']}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333; margin: 0 0 10px 0;">Message</h3>
                        <p style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 0; border-left: 4px solid {color};">
                            {notification_data['message']}
                        </p>
                    </div>
        """
        
        # Add details if available
        if notification_data.get('details'):
            html += f"""
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333; margin: 0 0 10px 0;">Additional Details</h3>
                        <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 0; overflow-x: auto; font-size: 12px;">
{json.dumps(notification_data['details'], indent=2)}
                        </pre>
                    </div>
            """
        
        html += """
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 12px;">
                    <p style="margin: 0;">This is an automated alert from Reddit Content Platform monitoring system.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _get_color_for_level(self, level: str) -> str:
        """Get color code for notification level."""
        colors = {
            'info': 'good',
            'warning': 'warning',
            'error': 'danger',
            'critical': '#6f42c1'
        }
        return colors.get(level, '#6c757d')
    
    async def check_and_alert_api_response_time(self, response_time: float, endpoint: str):
        """Check API response time and send alert if threshold exceeded."""
        config = self.alert_configs.get('api_response_time', {})
        threshold = config.get('threshold', 5.0)
        
        if response_time > threshold:
            await self.send_notification(
                alert_type='api_response_time',
                message=f"API response time exceeded threshold: {response_time:.2f}s > {threshold}s",
                details={
                    'endpoint': endpoint,
                    'response_time': response_time,
                    'threshold': threshold
                }
            )
    
    async def alert_crawling_failure(self, keyword_id: int, keyword: str, error: str):
        """Send alert for crawling failure."""
        await self.send_notification(
            alert_type='crawling_failure',
            message=f"Crawling failed for keyword '{keyword}'",
            details={
                'keyword_id': keyword_id,
                'keyword': keyword,
                'error': error
            }
        )
    
    async def alert_system_health_issue(self, service: str, issue: str, details: Dict[str, Any]):
        """Send alert for system health issues."""
        alert_type = f"{service}_connection_failure"
        
        await self.send_notification(
            alert_type=alert_type,
            message=f"System health issue detected in {service}: {issue}",
            details=details
        )
    
    async def alert_resource_usage(self, resource_type: str, usage_value: float, threshold: float, unit: str):
        """Send alert for high resource usage."""
        alert_type = f"{resource_type}_usage_high"
        
        await self.send_notification(
            alert_type=alert_type,
            message=f"High {resource_type} usage detected: {usage_value:.1f}{unit} (threshold: {threshold}{unit})",
            details={
                'resource_type': resource_type,
                'current_usage': usage_value,
                'threshold': threshold,
                'unit': unit
            }
        )


# Global notification service instance
notification_service = NotificationService()

_notification_service = None

def get_notification_service() -> NotificationService:
    """Get the global notification service instance."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service