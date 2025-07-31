"""
Tests for Notification Service

Unit tests for notification and alerting functionality.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import smtplib

from app.services.notification_service import NotificationService, NotificationType, NotificationChannel


class TestNotificationService:
    """Test cases for NotificationService."""
    
    @pytest.fixture
    def notification_service(self):
        """Notification service instance."""
        return NotificationService()
    
    def test_notification_type_enum(self):
        """Test NotificationType enum values."""
        assert NotificationType.CRAWLING_FAILED.value == "crawling_failed"
        assert NotificationType.CRAWLING_COMPLETED.value == "crawling_completed"
        assert NotificationType.SYSTEM_ALERT.value == "system_alert"
        assert NotificationType.CONTENT_GENERATED.value == "content_generated"
        assert NotificationType.THRESHOLD_EXCEEDED.value == "threshold_exceeded"
    
    def test_notification_channel_enum(self):
        """Test NotificationChannel enum values."""
        assert NotificationChannel.EMAIL.value == "email"
        assert NotificationChannel.WEBHOOK.value == "webhook"
        assert NotificationChannel.SLACK.value == "slack"
        assert NotificationChannel.DISCORD.value == "discord"
    
    @pytest.mark.asyncio
    async def test_send_notification_email_success(self, notification_service):
        """Test successful email notification sending."""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = Mock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            mock_server.send_message.return_value = {}
            
            result = await notification_service.send_notification(
                notification_type=NotificationType.CRAWLING_COMPLETED,
                channel=NotificationChannel.EMAIL,
                recipient="test@example.com",
                subject="Crawling Completed",
                message="Your crawling job has completed successfully.",
                metadata={"job_id": "123", "posts_found": 50}
            )
        
        assert result["success"] is True
        assert result["channel"] == "email"
        assert result["recipient"] == "test@example.com"
        assert "sent_at" in result
        
        # Verify SMTP was called correctly
        mock_server.send_message.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_notification_email_failure(self, notification_service):
        """Test email notification sending failure."""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_smtp.side_effect = smtplib.SMTPException("SMTP server unavailable")
            
            result = await notification_service.send_notification(
                notification_type=NotificationType.SYSTEM_ALERT,
                channel=NotificationChannel.EMAIL,
                recipient="test@example.com",
                subject="System Alert",
                message="System alert message"
            )
        
        assert result["success"] is False
        assert result["error"] == "SMTP server unavailable"
        assert result["channel"] == "email"
    
    @pytest.mark.asyncio
    async def test_send_notification_webhook_success(self, notification_service):
        """Test successful webhook notification sending."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = Mock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"status": "received"})
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock(return_value=None)
            mock_post.return_value = mock_response
            
            result = await notification_service.send_notification(
                notification_type=NotificationType.CONTENT_GENERATED,
                channel=NotificationChannel.WEBHOOK,
                recipient="https://webhook.example.com/notify",
                message="Content generation completed",
                metadata={"content_id": "456", "content_type": "blog"}
            )
        
        assert result["success"] is True
        assert result["channel"] == "webhook"
        assert result["recipient"] == "https://webhook.example.com/notify"
        assert result["response_status"] == 200
    
    @pytest.mark.asyncio
    async def test_send_notification_webhook_failure(self, notification_service):
        """Test webhook notification sending failure."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = Mock()
            mock_response.status = 500
            mock_response.text = AsyncMock(return_value="Internal Server Error")
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock(return_value=None)
            mock_post.return_value = mock_response
            
            result = await notification_service.send_notification(
                notification_type=NotificationType.CRAWLING_FAILED,
                channel=NotificationChannel.WEBHOOK,
                recipient="https://webhook.example.com/notify",
                message="Crawling failed"
            )
        
        assert result["success"] is False
        assert result["channel"] == "webhook"
        assert result["response_status"] == 500
        assert "Internal Server Error" in result["error"]
    
    @pytest.mark.asyncio
    async def test_send_notification_slack_success(self, notification_service):
        """Test successful Slack notification sending."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = Mock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"ok": True})
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock(return_value=None)
            mock_post.return_value = mock_response
            
            result = await notification_service.send_notification(
                notification_type=NotificationType.THRESHOLD_EXCEEDED,
                channel=NotificationChannel.SLACK,
                recipient="#alerts",
                message="API response time threshold exceeded",
                metadata={"threshold": "2s", "actual": "3.5s"}
            )
        
        assert result["success"] is True
        assert result["channel"] == "slack"
        assert result["recipient"] == "#alerts"
    
    @pytest.mark.asyncio
    async def test_send_crawling_completion_notification(self, notification_service):
        """Test sending crawling completion notification."""
        with patch.object(notification_service, 'send_notification') as mock_send:
            mock_send.return_value = {"success": True, "channel": "email"}
            
            result = await notification_service.send_crawling_completion_notification(
                user_email="user@example.com",
                keyword="python",
                posts_found=25,
                duration_minutes=5
            )
        
        assert result["success"] is True
        mock_send.assert_called_once()
        
        # Verify the call parameters
        call_args = mock_send.call_args
        assert call_args[1]["notification_type"] == NotificationType.CRAWLING_COMPLETED
        assert call_args[1]["channel"] == NotificationChannel.EMAIL
        assert call_args[1]["recipient"] == "user@example.com"
        assert "python" in call_args[1]["subject"]
        assert "25 posts" in call_args[1]["message"]
    
    @pytest.mark.asyncio
    async def test_send_crawling_failure_notification(self, notification_service):
        """Test sending crawling failure notification."""
        with patch.object(notification_service, 'send_notification') as mock_send:
            mock_send.return_value = {"success": True, "channel": "email"}
            
            result = await notification_service.send_crawling_failure_notification(
                user_email="user@example.com",
                keyword="javascript",
                error_message="Reddit API rate limit exceeded"
            )
        
        assert result["success"] is True
        mock_send.assert_called_once()
        
        # Verify the call parameters
        call_args = mock_send.call_args
        assert call_args[1]["notification_type"] == NotificationType.CRAWLING_FAILED
        assert call_args[1]["channel"] == NotificationChannel.EMAIL
        assert "javascript" in call_args[1]["subject"]
        assert "Reddit API rate limit exceeded" in call_args[1]["message"]
    
    @pytest.mark.asyncio
    async def test_send_system_alert_notification(self, notification_service):
        """Test sending system alert notification."""
        with patch.object(notification_service, 'send_notification') as mock_send:
            mock_send.return_value = {"success": True, "channel": "slack"}
            
            result = await notification_service.send_system_alert_notification(
                channel=NotificationChannel.SLACK,
                recipient="#alerts",
                alert_type="high_cpu_usage",
                message="CPU usage exceeded 90% for 5 minutes",
                severity="high"
            )
        
        assert result["success"] is True
        mock_send.assert_called_once()
        
        # Verify the call parameters
        call_args = mock_send.call_args
        assert call_args[1]["notification_type"] == NotificationType.SYSTEM_ALERT
        assert call_args[1]["channel"] == NotificationChannel.SLACK
        assert call_args[1]["recipient"] == "#alerts"
        assert "high_cpu_usage" in call_args[1]["subject"]
    
    @pytest.mark.asyncio
    async def test_send_content_generation_notification(self, notification_service):
        """Test sending content generation notification."""
        with patch.object(notification_service, 'send_notification') as mock_send:
            mock_send.return_value = {"success": True, "channel": "webhook"}
            
            result = await notification_service.send_content_generation_notification(
                webhook_url="https://api.example.com/webhook",
                content_id="content_123",
                content_type="blog",
                title="AI Trends in 2024"
            )
        
        assert result["success"] is True
        mock_send.assert_called_once()
        
        # Verify the call parameters
        call_args = mock_send.call_args
        assert call_args[1]["notification_type"] == NotificationType.CONTENT_GENERATED
        assert call_args[1]["channel"] == NotificationChannel.WEBHOOK
        assert call_args[1]["recipient"] == "https://api.example.com/webhook"
    
    def test_format_email_message(self, notification_service):
        """Test email message formatting."""
        message = notification_service._format_email_message(
            notification_type=NotificationType.CRAWLING_COMPLETED,
            subject="Crawling Completed",
            message="Your crawling job has completed.",
            metadata={"posts_found": 50, "duration": "5 minutes"}
        )
        
        assert "Crawling Completed" in message
        assert "Your crawling job has completed." in message
        assert "posts_found: 50" in message
        assert "duration: 5 minutes" in message
        assert "Notification Type: crawling_completed" in message
    
    def test_format_webhook_payload(self, notification_service):
        """Test webhook payload formatting."""
        payload = notification_service._format_webhook_payload(
            notification_type=NotificationType.SYSTEM_ALERT,
            message="High memory usage detected",
            metadata={"memory_usage": "85%", "threshold": "80%"}
        )
        
        assert payload["type"] == "system_alert"
        assert payload["message"] == "High memory usage detected"
        assert payload["metadata"]["memory_usage"] == "85%"
        assert payload["metadata"]["threshold"] == "80%"
        assert "timestamp" in payload
    
    def test_format_slack_message(self, notification_service):
        """Test Slack message formatting."""
        payload = notification_service._format_slack_message(
            notification_type=NotificationType.THRESHOLD_EXCEEDED,
            message="API response time exceeded threshold",
            metadata={"endpoint": "/api/posts", "response_time": "3.2s"}
        )
        
        assert payload["text"] == "API response time exceeded threshold"
        assert len(payload["attachments"]) == 1
        
        attachment = payload["attachments"][0]
        assert attachment["color"] == "warning"  # threshold_exceeded should be warning
        assert "endpoint" in str(attachment["fields"])
        assert "response_time" in str(attachment["fields"])
    
    def test_get_notification_color(self, notification_service):
        """Test notification color assignment."""
        assert notification_service._get_notification_color(NotificationType.CRAWLING_COMPLETED) == "good"
        assert notification_service._get_notification_color(NotificationType.CRAWLING_FAILED) == "danger"
        assert notification_service._get_notification_color(NotificationType.SYSTEM_ALERT) == "danger"
        assert notification_service._get_notification_color(NotificationType.THRESHOLD_EXCEEDED) == "warning"
        assert notification_service._get_notification_color(NotificationType.CONTENT_GENERATED) == "good"
    
    @pytest.mark.asyncio
    async def test_batch_notifications(self, notification_service):
        """Test sending multiple notifications in batch."""
        notifications = [
            {
                "notification_type": NotificationType.CRAWLING_COMPLETED,
                "channel": NotificationChannel.EMAIL,
                "recipient": "user1@example.com",
                "subject": "Crawling Completed",
                "message": "Job 1 completed"
            },
            {
                "notification_type": NotificationType.CONTENT_GENERATED,
                "channel": NotificationChannel.WEBHOOK,
                "recipient": "https://webhook.example.com",
                "message": "Content generated"
            }
        ]
        
        with patch.object(notification_service, 'send_notification') as mock_send:
            mock_send.return_value = {"success": True}
            
            results = await notification_service.send_batch_notifications(notifications)
        
        assert len(results) == 2
        assert all(result["success"] for result in results)
        assert mock_send.call_count == 2
    
    @pytest.mark.asyncio
    async def test_notification_retry_logic(self, notification_service):
        """Test notification retry logic on failure."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            # First call fails, second succeeds
            mock_response_fail = Mock()
            mock_response_fail.status = 500
            mock_response_fail.text = AsyncMock(return_value="Server Error")
            mock_response_fail.__aenter__ = AsyncMock(return_value=mock_response_fail)
            mock_response_fail.__aexit__ = AsyncMock(return_value=None)
            
            mock_response_success = Mock()
            mock_response_success.status = 200
            mock_response_success.json = AsyncMock(return_value={"status": "ok"})
            mock_response_success.__aenter__ = AsyncMock(return_value=mock_response_success)
            mock_response_success.__aexit__ = AsyncMock(return_value=None)
            
            mock_post.side_effect = [mock_response_fail, mock_response_success]
            
            result = await notification_service.send_notification_with_retry(
                notification_type=NotificationType.SYSTEM_ALERT,
                channel=NotificationChannel.WEBHOOK,
                recipient="https://webhook.example.com",
                message="Test retry",
                max_retries=2,
                retry_delay=0.1
            )
        
        assert result["success"] is True
        assert result["attempts"] == 2
        assert mock_post.call_count == 2
    
    @pytest.mark.asyncio
    async def test_notification_rate_limiting(self, notification_service):
        """Test notification rate limiting."""
        # This would test rate limiting if implemented
        # For now, just verify the method exists and can be called
        with patch.object(notification_service, 'send_notification') as mock_send:
            mock_send.return_value = {"success": True}
            
            # Send multiple notifications quickly
            tasks = []
            for i in range(5):
                task = notification_service.send_notification(
                    notification_type=NotificationType.SYSTEM_ALERT,
                    channel=NotificationChannel.EMAIL,
                    recipient=f"user{i}@example.com",
                    subject="Test",
                    message="Test message"
                )
                tasks.append(task)
            
            results = await notification_service.send_concurrent_notifications(tasks)
            
            assert len(results) == 5
            # All should succeed (no rate limiting implemented yet)
            assert all(result["success"] for result in results)
    
    def test_validate_notification_params(self, notification_service):
        """Test notification parameter validation."""
        # Valid parameters
        assert notification_service._validate_notification_params(
            NotificationType.CRAWLING_COMPLETED,
            NotificationChannel.EMAIL,
            "test@example.com",
            "Test Subject",
            "Test message"
        ) is True
        
        # Invalid email
        assert notification_service._validate_notification_params(
            NotificationType.CRAWLING_COMPLETED,
            NotificationChannel.EMAIL,
            "invalid-email",
            "Test Subject",
            "Test message"
        ) is False
        
        # Invalid webhook URL
        assert notification_service._validate_notification_params(
            NotificationType.SYSTEM_ALERT,
            NotificationChannel.WEBHOOK,
            "not-a-url",
            None,
            "Test message"
        ) is False
        
        # Empty message
        assert notification_service._validate_notification_params(
            NotificationType.SYSTEM_ALERT,
            NotificationChannel.EMAIL,
            "test@example.com",
            "Subject",
            ""
        ) is False