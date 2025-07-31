"""
Report Generation Service - Custom report templates, scheduling, and delivery
"""

import asyncio
import json
import tempfile
import os
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from enum import Enum
import uuid

from sqlalchemy.orm import Session
from fastapi import HTTPException
from pydantic import BaseModel

from app.models.post import Post
from app.models.user_billing import PointTransaction
from app.services.advanced_export_service import AdvancedExportService


class ReportFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class ReportTemplate(BaseModel):
    id: str
    name: str
    description: str
    template_type: str  # 'executive', 'detailed', 'summary', 'custom'
    sections: List[Dict[str, Any]]
    default_filters: Dict[str, Any]
    format_options: Dict[str, Any]
    created_by: str
    created_at: datetime
    is_public: bool = False
    tags: List[str] = []


class ScheduledReport(BaseModel):
    id: str
    template_id: str
    name: str
    frequency: ReportFrequency
    recipients: List[str]
    filters: Dict[str, Any]
    format: str
    next_run: datetime
    last_run: Optional[datetime] = None
    is_active: bool = True
    created_by: str
    created_at: datetime


class ReportGenerationService:
    """Service for creating custom reports with templates and scheduling"""
    
    def __init__(self, db: Session):
        self.db = db
        self.export_service = AdvancedExportService(db)
        
        # In-memory storage (in production, use database)
        self.templates: Dict[str, ReportTemplate] = {}
        self.scheduled_reports: Dict[str, ScheduledReport] = {}
        self.report_history: List[Dict[str, Any]] = []
        
        # Initialize default templates
        self._initialize_default_templates()
    
    def _initialize_default_templates(self):
        """Initialize default report templates"""
        
        # Executive Summary Template
        executive_template = ReportTemplate(
            id="executive_summary",
            name="Executive Summary Report",
            description="High-level overview with key metrics and trends for executives",
            template_type="executive",
            sections=[
                {
                    "type": "title_page",
                    "title": "Executive Summary Report",
                    "subtitle": "Reddit Content Platform Analytics"
                },
                {
                    "type": "key_metrics",
                    "title": "Key Performance Indicators",
                    "metrics": ["total_posts", "engagement_rate", "sentiment_score", "growth_rate"]
                },
                {
                    "type": "trend_analysis",
                    "title": "Trend Analysis",
                    "charts": ["sentiment_timeline", "engagement_trends", "keyword_trends"]
                },
                {
                    "type": "insights",
                    "title": "Key Insights & Recommendations",
                    "auto_generate": True
                }
            ],
            default_filters={
                "dateRange": {"days": 30},
                "includeAnalysis": True
            },
            format_options={
                "format": "pdf",
                "template": "executive",
                "include_charts": True,
                "page_orientation": "portrait"
            },
            created_by="system",
            created_at=datetime.utcnow(),
            is_public=True,
            tags=["executive", "summary", "kpi"]
        )
        
        # Detailed Analytics Template
        detailed_template = ReportTemplate(
            id="detailed_analytics",
            name="Detailed Analytics Report",
            description="Comprehensive analysis with detailed statistics and visualizations",
            template_type="detailed",
            sections=[
                {
                    "type": "title_page",
                    "title": "Detailed Analytics Report"
                },
                {
                    "type": "data_overview",
                    "title": "Data Overview",
                    "include_summary_stats": True
                },
                {
                    "type": "sentiment_analysis",
                    "title": "Sentiment Analysis",
                    "charts": ["sentiment_distribution", "sentiment_timeline", "sentiment_by_subreddit"]
                },
                {
                    "type": "keyword_analysis",
                    "title": "Keyword Analysis",
                    "charts": ["word_cloud", "keyword_frequency", "keyword_trends"]
                },
                {
                    "type": "engagement_analysis",
                    "title": "Engagement Analysis",
                    "charts": ["engagement_distribution", "top_posts", "engagement_trends"]
                },
                {
                    "type": "subreddit_analysis",
                    "title": "Subreddit Analysis",
                    "charts": ["subreddit_distribution", "subreddit_engagement"]
                },
                {
                    "type": "data_tables",
                    "title": "Detailed Data",
                    "tables": ["top_posts", "keyword_stats", "subreddit_stats"]
                }
            ],
            default_filters={
                "dateRange": {"days": 7},
                "includeAnalysis": True,
                "maxRecords": 10000
            },
            format_options={
                "format": "pdf",
                "template": "detailed",
                "include_charts": True,
                "include_tables": True
            },
            created_by="system",
            created_at=datetime.utcnow(),
            is_public=True,
            tags=["detailed", "analytics", "comprehensive"]
        )
        
        # Performance Summary Template
        performance_template = ReportTemplate(
            id="performance_summary",
            name="Performance Summary",
            description="System performance and operational metrics report",
            template_type="summary",
            sections=[
                {
                    "type": "title_page",
                    "title": "Performance Summary Report"
                },
                {
                    "type": "system_metrics",
                    "title": "System Performance",
                    "metrics": ["crawling_success_rate", "processing_speed", "error_rate"]
                },
                {
                    "type": "usage_analytics",
                    "title": "Usage Analytics",
                    "charts": ["daily_usage", "feature_usage", "user_activity"]
                },
                {
                    "type": "billing_summary",
                    "title": "Billing Summary",
                    "charts": ["points_usage", "cost_breakdown", "usage_trends"]
                }
            ],
            default_filters={
                "dateRange": {"days": 30},
                "includeSystemMetrics": True
            },
            format_options={
                "format": "excel",
                "include_charts": True,
                "include_pivot_tables": True
            },
            created_by="system",
            created_at=datetime.utcnow(),
            is_public=True,
            tags=["performance", "system", "operations"]
        )
        
        # Store templates
        self.templates[executive_template.id] = executive_template
        self.templates[detailed_template.id] = detailed_template
        self.templates[performance_template.id] = performance_template
    
    async def create_custom_template(
        self,
        name: str,
        description: str,
        sections: List[Dict[str, Any]],
        created_by: str,
        template_type: str = "custom",
        default_filters: Optional[Dict[str, Any]] = None,
        format_options: Optional[Dict[str, Any]] = None,
        is_public: bool = False,
        tags: Optional[List[str]] = None
    ) -> ReportTemplate:
        """Create a custom report template"""
        
        template_id = str(uuid.uuid4())
        
        template = ReportTemplate(
            id=template_id,
            name=name,
            description=description,
            template_type=template_type,
            sections=sections,
            default_filters=default_filters or {},
            format_options=format_options or {"format": "pdf"},
            created_by=created_by,
            created_at=datetime.utcnow(),
            is_public=is_public,
            tags=tags or []
        )
        
        self.templates[template_id] = template
        return template
    
    async def get_templates(
        self,
        user_id: str,
        include_public: bool = True,
        template_type: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[ReportTemplate]:
        """Get available report templates"""
        
        templates = []
        
        for template in self.templates.values():
            # Check access permissions
            if template.created_by == user_id or (include_public and template.is_public):
                # Filter by type
                if template_type and template.template_type != template_type:
                    continue
                
                # Filter by tags
                if tags and not any(tag in template.tags for tag in tags):
                    continue
                
                templates.append(template)
        
        return sorted(templates, key=lambda t: t.created_at, reverse=True)
    
    async def generate_report_from_template(
        self,
        template_id: str,
        filters: Optional[Dict[str, Any]] = None,
        format_override: Optional[str] = None,
        user_id: str = None
    ) -> str:
        """Generate a report using a template"""
        
        if template_id not in self.templates:
            raise HTTPException(status_code=404, detail="Template not found")
        
        template = self.templates[template_id]
        
        # Check access permissions
        if not template.is_public and template.created_by != user_id:
            raise HTTPException(status_code=403, detail="Access denied to template")
        
        # Merge filters
        report_filters = {**template.default_filters, **(filters or {})}
        
        # Determine format
        report_format = format_override or template.format_options.get("format", "pdf")
        
        # Generate report based on template
        if template.template_type == "executive":
            return await self._generate_executive_report(template, report_filters, report_format)
        elif template.template_type == "detailed":
            return await self._generate_detailed_report(template, report_filters, report_format)
        elif template.template_type == "summary":
            return await self._generate_summary_report(template, report_filters, report_format)
        else:
            return await self._generate_custom_report(template, report_filters, report_format)
    
    async def _generate_executive_report(
        self,
        template: ReportTemplate,
        filters: Dict[str, Any],
        format: str
    ) -> str:
        """Generate executive summary report"""
        
        # Fetch data based on filters
        data = await self._fetch_report_data(filters)
        
        if format == "pdf":
            return await self.export_service.create_advanced_pdf_report(
                data=data,
                title=template.name,
                template="executive",
                include_visualizations=True
            )
        elif format == "excel":
            return await self.export_service.create_excel_with_charts(
                data=data,
                title=template.name,
                include_charts=True,
                include_pivot=False
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
    
    async def _generate_detailed_report(
        self,
        template: ReportTemplate,
        filters: Dict[str, Any],
        format: str
    ) -> str:
        """Generate detailed analytics report"""
        
        data = await self._fetch_report_data(filters)
        
        if format == "pdf":
            return await self.export_service.create_advanced_pdf_report(
                data=data,
                title=template.name,
                template="detailed",
                include_visualizations=True
            )
        elif format == "excel":
            return await self.export_service.create_excel_with_charts(
                data=data,
                title=template.name,
                include_charts=True,
                include_pivot=True
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
    
    async def _generate_summary_report(
        self,
        template: ReportTemplate,
        filters: Dict[str, Any],
        format: str
    ) -> str:
        """Generate performance summary report"""
        
        data = await self._fetch_report_data(filters)
        
        if format == "excel":
            return await self.export_service.create_excel_with_charts(
                data=data,
                title=template.name,
                include_charts=True,
                include_pivot=True
            )
        elif format == "pdf":
            return await self.export_service.create_advanced_pdf_report(
                data=data,
                title=template.name,
                template="standard",
                include_visualizations=True
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
    
    async def _generate_custom_report(
        self,
        template: ReportTemplate,
        filters: Dict[str, Any],
        format: str
    ) -> str:
        """Generate custom report based on template sections"""
        
        data = await self._fetch_report_data(filters)
        
        # Process custom sections
        processed_data = await self._process_custom_sections(template.sections, data, filters)
        
        if format == "pdf":
            return await self.export_service.create_advanced_pdf_report(
                data=processed_data,
                title=template.name,
                template="standard",
                include_visualizations=True
            )
        elif format == "excel":
            return await self.export_service.create_excel_with_charts(
                data=processed_data,
                title=template.name,
                include_charts=True,
                include_pivot=False
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
    
    async def _fetch_report_data(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch data for report generation"""
        
        # Build query based on filters
        query = self.db.query(Post)
        
        # Apply date range filter
        if "dateRange" in filters:
            date_range = filters["dateRange"]
            if "days" in date_range:
                start_date = datetime.utcnow() - timedelta(days=date_range["days"])
                query = query.filter(Post.created_at >= start_date)
            elif "start" in date_range and "end" in date_range:
                query = query.filter(
                    Post.created_at >= date_range["start"],
                    Post.created_at <= date_range["end"]
                )
        
        # Apply other filters
        if "keywords" in filters:
            keywords = filters["keywords"]
            for keyword in keywords:
                query = query.filter(
                    Post.title.contains(keyword) | Post.content.contains(keyword)
                )
        
        if "subreddits" in filters:
            subreddits = filters["subreddits"]
            query = query.filter(Post.subreddit.in_(subreddits))
        
        # Apply limit
        max_records = filters.get("maxRecords", 10000)
        posts = query.limit(max_records).all()
        
        # Convert to dict format
        data = []
        for post in posts:
            post_dict = {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "author": post.author,
                "subreddit": post.subreddit,
                "score": post.score,
                "created_at": post.created_at,
                "url": post.url
            }
            data.append(post_dict)
        
        return data
    
    async def _process_custom_sections(
        self,
        sections: List[Dict[str, Any]],
        data: List[Dict[str, Any]],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Process custom report sections"""
        
        processed_data = data.copy()
        
        # Add computed fields based on sections
        for section in sections:
            if section.get("type") == "sentiment_analysis":
                # Add sentiment analysis data (mock implementation)
                for item in processed_data:
                    item["sentiment_score"] = 0.1  # Mock sentiment
                    item["sentiment_label"] = "neutral"
            
            elif section.get("type") == "keyword_analysis":
                # Add keyword analysis data
                for item in processed_data:
                    item["keywords"] = ["reddit", "content", "analysis"]  # Mock keywords
            
            elif section.get("type") == "engagement_analysis":
                # Add engagement metrics
                for item in processed_data:
                    item["engagement_rate"] = item.get("score", 0) * 0.1  # Mock engagement
        
        return processed_data
    
    async def schedule_report(
        self,
        template_id: str,
        name: str,
        frequency: ReportFrequency,
        recipients: List[str],
        filters: Optional[Dict[str, Any]] = None,
        format: str = "pdf",
        user_id: str = None
    ) -> ScheduledReport:
        """Schedule a recurring report"""
        
        if template_id not in self.templates:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Calculate next run time
        now = datetime.utcnow()
        if frequency == ReportFrequency.DAILY:
            next_run = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
        elif frequency == ReportFrequency.WEEKLY:
            days_ahead = 0 - now.weekday()  # Monday
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(hour=9, minute=0, second=0, microsecond=0)
        elif frequency == ReportFrequency.MONTHLY:
            if now.month == 12:
                next_run = now.replace(year=now.year + 1, month=1, day=1, hour=9, minute=0, second=0, microsecond=0)
            else:
                next_run = now.replace(month=now.month + 1, day=1, hour=9, minute=0, second=0, microsecond=0)
        else:  # QUARTERLY
            quarter_months = [1, 4, 7, 10]
            current_quarter = (now.month - 1) // 3
            next_quarter_month = quarter_months[(current_quarter + 1) % 4]
            
            if next_quarter_month <= now.month:
                next_run = now.replace(year=now.year + 1, month=next_quarter_month, day=1, hour=9, minute=0, second=0, microsecond=0)
            else:
                next_run = now.replace(month=next_quarter_month, day=1, hour=9, minute=0, second=0, microsecond=0)
        
        scheduled_report_id = str(uuid.uuid4())
        
        scheduled_report = ScheduledReport(
            id=scheduled_report_id,
            template_id=template_id,
            name=name,
            frequency=frequency,
            recipients=recipients,
            filters=filters or {},
            format=format,
            next_run=next_run,
            created_by=user_id or "system",
            created_at=now
        )
        
        self.scheduled_reports[scheduled_report_id] = scheduled_report
        return scheduled_report
    
    async def get_scheduled_reports(self, user_id: str) -> List[ScheduledReport]:
        """Get user's scheduled reports"""
        
        return [
            report for report in self.scheduled_reports.values()
            if report.created_by == user_id
        ]
    
    async def update_scheduled_report(
        self,
        report_id: str,
        user_id: str,
        **updates
    ) -> ScheduledReport:
        """Update a scheduled report"""
        
        if report_id not in self.scheduled_reports:
            raise HTTPException(status_code=404, detail="Scheduled report not found")
        
        report = self.scheduled_reports[report_id]
        
        if report.created_by != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update fields
        for field, value in updates.items():
            if hasattr(report, field):
                setattr(report, field, value)
        
        return report
    
    async def delete_scheduled_report(self, report_id: str, user_id: str):
        """Delete a scheduled report"""
        
        if report_id not in self.scheduled_reports:
            raise HTTPException(status_code=404, detail="Scheduled report not found")
        
        report = self.scheduled_reports[report_id]
        
        if report.created_by != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        del self.scheduled_reports[report_id]
    
    async def execute_scheduled_reports(self):
        """Execute due scheduled reports (called by background task)"""
        
        now = datetime.utcnow()
        
        for report in self.scheduled_reports.values():
            if report.is_active and report.next_run <= now:
                try:
                    # Generate report
                    file_path = await self.generate_report_from_template(
                        template_id=report.template_id,
                        filters=report.filters,
                        format_override=report.format,
                        user_id=report.created_by
                    )
                    
                    # Send to recipients (mock implementation)
                    await self._send_report_to_recipients(
                        file_path=file_path,
                        recipients=report.recipients,
                        report_name=report.name
                    )
                    
                    # Update last run and calculate next run
                    report.last_run = now
                    report.next_run = self._calculate_next_run(report.frequency, now)
                    
                    # Log execution
                    self.report_history.append({
                        "report_id": report.id,
                        "executed_at": now,
                        "status": "success",
                        "recipients": len(report.recipients)
                    })
                    
                except Exception as e:
                    # Log error
                    self.report_history.append({
                        "report_id": report.id,
                        "executed_at": now,
                        "status": "failed",
                        "error": str(e)
                    })
    
    def _calculate_next_run(self, frequency: ReportFrequency, current_time: datetime) -> datetime:
        """Calculate next run time for scheduled report"""
        
        if frequency == ReportFrequency.DAILY:
            return current_time + timedelta(days=1)
        elif frequency == ReportFrequency.WEEKLY:
            return current_time + timedelta(weeks=1)
        elif frequency == ReportFrequency.MONTHLY:
            if current_time.month == 12:
                return current_time.replace(year=current_time.year + 1, month=1)
            else:
                return current_time.replace(month=current_time.month + 1)
        else:  # QUARTERLY
            return current_time + timedelta(days=90)  # Approximate
    
    async def _send_report_to_recipients(
        self,
        file_path: str,
        recipients: List[str],
        report_name: str
    ):
        """Send report to recipients (mock implementation)"""
        
        # In a real implementation, this would:
        # 1. Send emails with report attachments
        # 2. Upload to shared storage (S3, etc.)
        # 3. Send notifications through various channels
        
        print(f"Sending report '{report_name}' to {len(recipients)} recipients")
        print(f"Report file: {file_path}")
        
        # Clean up temporary file
        if os.path.exists(file_path):
            os.unlink(file_path)
    
    async def share_report(
        self,
        report_file_path: str,
        recipients: List[str],
        message: Optional[str] = None,
        expiry_days: int = 7
    ) -> Dict[str, Any]:
        """Share a generated report with recipients"""
        
        share_id = str(uuid.uuid4())
        expiry_date = datetime.utcnow() + timedelta(days=expiry_days)
        
        # In a real implementation, this would:
        # 1. Upload file to secure storage
        # 2. Generate secure sharing links
        # 3. Send notifications to recipients
        # 4. Track access and downloads
        
        share_info = {
            "share_id": share_id,
            "recipients": recipients,
            "message": message,
            "expiry_date": expiry_date,
            "download_url": f"/api/v1/reports/shared/{share_id}",
            "access_count": 0,
            "created_at": datetime.utcnow()
        }
        
        return share_info
    
    async def get_report_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics about report usage"""
        
        user_templates = [t for t in self.templates.values() if t.created_by == user_id]
        user_scheduled = [r for r in self.scheduled_reports.values() if r.created_by == user_id]
        user_history = [h for h in self.report_history if h.get("user_id") == user_id]
        
        return {
            "total_templates": len(user_templates),
            "total_scheduled_reports": len(user_scheduled),
            "active_scheduled_reports": len([r for r in user_scheduled if r.is_active]),
            "reports_generated_this_month": len([
                h for h in user_history 
                if h.get("executed_at", datetime.min).month == datetime.utcnow().month
            ]),
            "success_rate": len([h for h in user_history if h.get("status") == "success"]) / max(len(user_history), 1) * 100,
            "popular_templates": [
                {"name": t.name, "usage_count": 5}  # Mock data
                for t in user_templates[:5]
            ],
            "recent_activity": user_history[-10:]  # Last 10 activities
        }