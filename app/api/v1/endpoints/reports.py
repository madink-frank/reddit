from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.report_generation_service import (
    ReportGenerationService, 
    ReportTemplate, 
    ScheduledReport, 
    ReportFrequency
)
from app.services.billing_service import BillingService

router = APIRouter()

# ============================================================================
# Request/Response Models
# ============================================================================

class CreateTemplateRequest(BaseModel):
    name: str
    description: str
    template_type: str = "custom"
    sections: List[Dict[str, Any]]
    default_filters: Optional[Dict[str, Any]] = None
    format_options: Optional[Dict[str, Any]] = None
    is_public: bool = False
    tags: Optional[List[str]] = None

class GenerateReportRequest(BaseModel):
    template_id: str
    filters: Optional[Dict[str, Any]] = None
    format: Optional[str] = None

class ScheduleReportRequest(BaseModel):
    template_id: str
    name: str
    frequency: ReportFrequency
    recipients: List[str]
    filters: Optional[Dict[str, Any]] = None
    format: str = "pdf"

class ShareReportRequest(BaseModel):
    recipients: List[str]
    message: Optional[str] = None
    expiry_days: int = 7

class UpdateScheduledReportRequest(BaseModel):
    name: Optional[str] = None
    frequency: Optional[ReportFrequency] = None
    recipients: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None
    format: Optional[str] = None
    is_active: Optional[bool] = None

# ============================================================================
# Template Management Endpoints
# ============================================================================

@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_report_templates(
    template_type: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    include_public: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available report templates"""
    
    service = ReportGenerationService(db)
    
    tag_list = tags.split(",") if tags else None
    
    templates = await service.get_templates(
        user_id=str(current_user.id),
        include_public=include_public,
        template_type=template_type,
        tags=tag_list
    )
    
    return [template.dict() for template in templates]

@router.post("/templates", response_model=Dict[str, Any])
async def create_report_template(
    request: CreateTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a custom report template"""
    
    service = ReportGenerationService(db)
    
    template = await service.create_custom_template(
        name=request.name,
        description=request.description,
        sections=request.sections,
        created_by=str(current_user.id),
        template_type=request.template_type,
        default_filters=request.default_filters,
        format_options=request.format_options,
        is_public=request.is_public,
        tags=request.tags
    )
    
    return template.dict()

@router.get("/templates/{template_id}", response_model=Dict[str, Any])
async def get_report_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific report template"""
    
    service = ReportGenerationService(db)
    
    if template_id not in service.templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = service.templates[template_id]
    
    # Check access permissions
    if not template.is_public and template.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return template.dict()

@router.put("/templates/{template_id}", response_model=Dict[str, Any])
async def update_report_template(
    template_id: str,
    request: CreateTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a report template"""
    
    service = ReportGenerationService(db)
    
    if template_id not in service.templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = service.templates[template_id]
    
    # Check permissions
    if template.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update template
    template.name = request.name
    template.description = request.description
    template.sections = request.sections
    template.default_filters = request.default_filters or {}
    template.format_options = request.format_options or {}
    template.is_public = request.is_public
    template.tags = request.tags or []
    
    return template.dict()

@router.delete("/templates/{template_id}")
async def delete_report_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a report template"""
    
    service = ReportGenerationService(db)
    
    if template_id not in service.templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = service.templates[template_id]
    
    # Check permissions
    if template.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if template is used in scheduled reports
    used_in_scheduled = any(
        report.template_id == template_id 
        for report in service.scheduled_reports.values()
    )
    
    if used_in_scheduled:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete template that is used in scheduled reports"
        )
    
    del service.templates[template_id]
    
    return {"message": "Template deleted successfully"}

# ============================================================================
# Report Generation Endpoints
# ============================================================================

@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a report from a template"""
    
    service = ReportGenerationService(db)
    billing_service = BillingService(db)
    
    # Check if template exists
    if request.template_id not in service.templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Estimate cost
    estimated_cost = 25  # Base cost for report generation
    
    # Check user points
    user_billing = billing_service.get_user_billing(current_user.id)
    if user_billing.current_points < estimated_cost:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient points. Required: {estimated_cost}, Available: {user_billing.current_points}"
        )
    
    # Deduct points
    billing_service.deduct_points(
        user_id=current_user.id,
        amount=estimated_cost,
        operation="report_generation",
        description=f"Generated report from template {request.template_id}"
    )
    
    try:
        # Generate report
        file_path = await service.generate_report_from_template(
            template_id=request.template_id,
            filters=request.filters,
            format_override=request.format,
            user_id=str(current_user.id)
        )
        
        return {
            "message": "Report generated successfully",
            "download_url": f"/api/v1/reports/download/{file_path.split('/')[-1]}",
            "points_consumed": estimated_cost
        }
        
    except Exception as e:
        # Refund points on failure
        billing_service.add_points(
            user_id=current_user.id,
            amount=estimated_cost,
            operation="refund",
            description="Refund for failed report generation"
        )
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.get("/download/{filename}")
async def download_report(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Download a generated report"""
    
    # In production, implement proper file access control
    file_path = f"/tmp/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    return FileResponse(
        file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

# ============================================================================
# Scheduled Reports Endpoints
# ============================================================================

@router.get("/scheduled", response_model=List[Dict[str, Any]])
async def get_scheduled_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's scheduled reports"""
    
    service = ReportGenerationService(db)
    
    scheduled_reports = await service.get_scheduled_reports(str(current_user.id))
    
    return [report.dict() for report in scheduled_reports]

@router.post("/scheduled", response_model=Dict[str, Any])
async def create_scheduled_report(
    request: ScheduleReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule a recurring report"""
    
    service = ReportGenerationService(db)
    
    scheduled_report = await service.schedule_report(
        template_id=request.template_id,
        name=request.name,
        frequency=request.frequency,
        recipients=request.recipients,
        filters=request.filters,
        format=request.format,
        user_id=str(current_user.id)
    )
    
    return scheduled_report.dict()

@router.get("/scheduled/{report_id}", response_model=Dict[str, Any])
async def get_scheduled_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific scheduled report"""
    
    service = ReportGenerationService(db)
    
    if report_id not in service.scheduled_reports:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    
    report = service.scheduled_reports[report_id]
    
    if report.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return report.dict()

@router.put("/scheduled/{report_id}", response_model=Dict[str, Any])
async def update_scheduled_report(
    report_id: str,
    request: UpdateScheduledReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a scheduled report"""
    
    service = ReportGenerationService(db)
    
    # Filter out None values
    updates = {k: v for k, v in request.dict().items() if v is not None}
    
    updated_report = await service.update_scheduled_report(
        report_id=report_id,
        user_id=str(current_user.id),
        **updates
    )
    
    return updated_report.dict()

@router.delete("/scheduled/{report_id}")
async def delete_scheduled_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scheduled report"""
    
    service = ReportGenerationService(db)
    
    await service.delete_scheduled_report(report_id, str(current_user.id))
    
    return {"message": "Scheduled report deleted successfully"}

@router.post("/scheduled/{report_id}/execute")
async def execute_scheduled_report_now(
    report_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute a scheduled report immediately"""
    
    service = ReportGenerationService(db)
    
    if report_id not in service.scheduled_reports:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    
    report = service.scheduled_reports[report_id]
    
    if report.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Execute in background
    background_tasks.add_task(execute_single_report, service, report)
    
    return {"message": "Report execution started"}

async def execute_single_report(service: ReportGenerationService, report: ScheduledReport):
    """Execute a single scheduled report"""
    
    try:
        file_path = await service.generate_report_from_template(
            template_id=report.template_id,
            filters=report.filters,
            format_override=report.format,
            user_id=report.created_by
        )
        
        await service._send_report_to_recipients(
            file_path=file_path,
            recipients=report.recipients,
            report_name=report.name
        )
        
    except Exception as e:
        print(f"Failed to execute scheduled report {report.id}: {e}")

# ============================================================================
# Report Sharing Endpoints
# ============================================================================

@router.post("/share")
async def share_report(
    request: ShareReportRequest,
    report_file: str = Query(..., description="Path to the report file"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Share a generated report with recipients"""
    
    service = ReportGenerationService(db)
    
    share_info = await service.share_report(
        report_file_path=report_file,
        recipients=request.recipients,
        message=request.message,
        expiry_days=request.expiry_days
    )
    
    return share_info

@router.get("/shared/{share_id}")
async def access_shared_report(share_id: str):
    """Access a shared report"""
    
    # In production, implement proper share link validation and access tracking
    return {"message": f"Accessing shared report {share_id}"}

# ============================================================================
# Analytics and Statistics Endpoints
# ============================================================================

@router.get("/analytics")
async def get_report_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics about report usage"""
    
    service = ReportGenerationService(db)
    
    analytics = await service.get_report_analytics(str(current_user.id))
    
    return analytics

@router.get("/template-usage/{template_id}")
async def get_template_usage_stats(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics for a specific template"""
    
    service = ReportGenerationService(db)
    
    if template_id not in service.templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = service.templates[template_id]
    
    # Check access permissions
    if not template.is_public and template.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mock usage statistics
    usage_stats = {
        "template_id": template_id,
        "total_generations": 15,
        "last_30_days": 8,
        "average_generation_time": 45.2,
        "popular_formats": [
            {"format": "pdf", "count": 10},
            {"format": "excel", "count": 5}
        ],
        "scheduled_reports_using": len([
            r for r in service.scheduled_reports.values() 
            if r.template_id == template_id
        ])
    }
    
    return usage_stats

# ============================================================================
# Background Task Endpoints
# ============================================================================

@router.post("/execute-scheduled")
async def execute_all_scheduled_reports(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute all due scheduled reports (admin only)"""
    
    # In production, this would be restricted to admin users
    service = ReportGenerationService(db)
    
    background_tasks.add_task(service.execute_scheduled_reports)
    
    return {"message": "Scheduled report execution started"}

# ============================================================================
# Utility Endpoints
# ============================================================================

@router.get("/formats")
async def get_supported_formats():
    """Get supported report formats"""
    
    return {
        "formats": [
            {
                "format": "pdf",
                "name": "PDF Document",
                "description": "Professional PDF report with charts and formatting",
                "supports_charts": True,
                "supports_tables": True
            },
            {
                "format": "excel",
                "name": "Excel Workbook",
                "description": "Excel file with multiple sheets, charts, and pivot tables",
                "supports_charts": True,
                "supports_tables": True,
                "supports_pivot_tables": True
            },
            {
                "format": "csv",
                "name": "CSV File",
                "description": "Simple comma-separated values file",
                "supports_charts": False,
                "supports_tables": True
            },
            {
                "format": "json",
                "name": "JSON Data",
                "description": "Structured JSON data format",
                "supports_charts": False,
                "supports_tables": False
            }
        ]
    }

@router.get("/section-types")
async def get_available_section_types():
    """Get available section types for custom templates"""
    
    return {
        "section_types": [
            {
                "type": "title_page",
                "name": "Title Page",
                "description": "Report title and metadata",
                "required_fields": ["title"],
                "optional_fields": ["subtitle", "author", "date"]
            },
            {
                "type": "key_metrics",
                "name": "Key Metrics",
                "description": "Important KPIs and statistics",
                "required_fields": ["metrics"],
                "optional_fields": ["title", "description"]
            },
            {
                "type": "trend_analysis",
                "name": "Trend Analysis",
                "description": "Time-based trend charts and analysis",
                "required_fields": ["charts"],
                "optional_fields": ["title", "date_range"]
            },
            {
                "type": "data_overview",
                "name": "Data Overview",
                "description": "Summary of data sources and statistics",
                "required_fields": [],
                "optional_fields": ["include_summary_stats", "include_data_quality"]
            },
            {
                "type": "sentiment_analysis",
                "name": "Sentiment Analysis",
                "description": "Sentiment analysis results and visualizations",
                "required_fields": [],
                "optional_fields": ["charts", "include_breakdown"]
            },
            {
                "type": "keyword_analysis",
                "name": "Keyword Analysis",
                "description": "Keyword frequency and trend analysis",
                "required_fields": [],
                "optional_fields": ["charts", "max_keywords"]
            },
            {
                "type": "data_tables",
                "name": "Data Tables",
                "description": "Detailed data in table format",
                "required_fields": ["tables"],
                "optional_fields": ["max_rows", "include_totals"]
            }
        ]
    }