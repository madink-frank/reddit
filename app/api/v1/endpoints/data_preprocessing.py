from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.data_preprocessing_service import (
    DataPreprocessingService,
    FilterCondition,
    DataTransformation,
    FilterOperator,
    TransformationType
)

router = APIRouter()

# ============================================================================
# Request/Response Models
# ============================================================================

class FilterConditionRequest(BaseModel):
    field: str
    operator: FilterOperator
    value: Any
    field_type: str = "text"

class DataTransformationRequest(BaseModel):
    type: TransformationType
    field: Optional[str] = None
    operation: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class FilterRequest(BaseModel):
    data_source: str
    conditions: List[FilterConditionRequest]
    transformations: List[DataTransformationRequest] = []
    preview_only: bool = False
    max_records: Optional[int] = None

class FilterPresetRequest(BaseModel):
    name: str
    description: str
    conditions: List[FilterConditionRequest]
    transformations: List[DataTransformationRequest] = []

class ValidationRequest(BaseModel):
    data_source: str
    conditions: List[FilterConditionRequest]

# ============================================================================
# Data Filtering and Preprocessing Endpoints
# ============================================================================

@router.post("/filter")
async def apply_filters_and_transformations(
    request: FilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply filters and transformations to data"""
    
    service = DataPreprocessingService(db)
    
    # Convert request models to service models
    conditions = [
        FilterCondition(
            field=c.field,
            operator=c.operator,
            value=c.value,
            field_type=c.field_type
        )
        for c in request.conditions
    ]
    
    transformations = [
        DataTransformation(
            transformation_type=t.type,
            field=t.field,
            operation=t.operation,
            parameters=t.parameters or {}
        )
        for t in request.transformations
    ]
    
    try:
        filtered_data, metadata = await service.apply_filters_and_transformations(
            data_source=request.data_source,
            conditions=conditions,
            transformations=transformations,
            preview_only=request.preview_only,
            max_records=request.max_records
        )
        
        return {
            "data": filtered_data,
            "metadata": metadata,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Filter processing failed: {str(e)}")

@router.post("/validate")
async def validate_filters(
    request: ValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate filter conditions and estimate results"""
    
    service = DataPreprocessingService(db)
    
    # Convert request models to service models
    conditions = [
        FilterCondition(
            field=c.field,
            operator=c.operator,
            value=c.value,
            field_type=c.field_type
        )
        for c in request.conditions
    ]
    
    validation_result = await service.validate_filters(
        data_source=request.data_source,
        conditions=conditions
    )
    
    return validation_result

@router.get("/fields/{data_source}")
async def get_available_fields(
    data_source: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available fields for a data source"""
    
    service = DataPreprocessingService(db)
    
    try:
        fields = await service.get_available_fields(data_source)
        return {"fields": fields}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/operators")
async def get_available_operators():
    """Get available filter operators by field type"""
    
    operators = {
        "text": [
            {"value": "contains", "label": "Contains"},
            {"value": "not_contains", "label": "Does not contain"},
            {"value": "equals", "label": "Equals"},
            {"value": "not_equals", "label": "Does not equal"},
            {"value": "starts_with", "label": "Starts with"},
            {"value": "ends_with", "label": "Ends with"},
            {"value": "regex", "label": "Matches regex"}
        ],
        "number": [
            {"value": "equals", "label": "Equals"},
            {"value": "not_equals", "label": "Does not equal"},
            {"value": "greater_than", "label": "Greater than"},
            {"value": "less_than", "label": "Less than"},
            {"value": "greater_equal", "label": "Greater than or equal"},
            {"value": "less_equal", "label": "Less than or equal"},
            {"value": "between", "label": "Between"}
        ],
        "date": [
            {"value": "equals", "label": "On date"},
            {"value": "before", "label": "Before"},
            {"value": "after", "label": "After"},
            {"value": "date_between", "label": "Between"},
            {"value": "last_days", "label": "Last N days"},
            {"value": "last_weeks", "label": "Last N weeks"},
            {"value": "last_months", "label": "Last N months"}
        ],
        "boolean": [
            {"value": "is_true", "label": "Is true"},
            {"value": "is_false", "label": "Is false"}
        ]
    }
    
    return {"operators": operators}

@router.get("/transformations")
async def get_available_transformations():
    """Get available data transformation types"""
    
    transformations = [
        {
            "type": "sort",
            "name": "Sort Data",
            "description": "Order data by field values",
            "parameters": {
                "field": {"type": "select", "required": True, "description": "Field to sort by"},
                "operation": {"type": "select", "required": True, "options": ["asc", "desc"], "description": "Sort direction"}
            }
        },
        {
            "type": "group",
            "name": "Group Data",
            "description": "Group data by field values",
            "parameters": {
                "field": {"type": "select", "required": True, "description": "Field to group by"},
                "operation": {"type": "select", "required": True, "options": ["count", "sum", "mean", "min", "max"], "description": "Aggregation operation"}
            }
        },
        {
            "type": "aggregate",
            "name": "Aggregate Data",
            "description": "Calculate aggregate values",
            "parameters": {
                "field": {"type": "select", "required": True, "description": "Field to aggregate"},
                "operation": {"type": "select", "required": True, "options": ["sum", "mean", "count", "min", "max"], "description": "Aggregation operation"}
            }
        },
        {
            "type": "calculate",
            "name": "Calculate Field",
            "description": "Create calculated fields using formulas",
            "parameters": {
                "formula": {"type": "text", "required": True, "description": "Calculation formula"},
                "new_field": {"type": "text", "required": True, "description": "Name for new field"}
            }
        },
        {
            "type": "format",
            "name": "Format Data",
            "description": "Format field values",
            "parameters": {
                "field": {"type": "select", "required": True, "description": "Field to format"},
                "format_type": {"type": "select", "required": True, "options": ["date", "number", "currency"], "description": "Format type"},
                "date_format": {"type": "text", "required": False, "description": "Date format string (for date formatting)"},
                "decimal_places": {"type": "number", "required": False, "description": "Decimal places (for number formatting)"}
            }
        },
        {
            "type": "deduplicate",
            "name": "Remove Duplicates",
            "description": "Remove duplicate records",
            "parameters": {
                "fields": {"type": "multiselect", "required": False, "description": "Fields to check for duplicates (all fields if empty)"}
            }
        },
        {
            "type": "sample",
            "name": "Sample Data",
            "description": "Take a sample of the data",
            "parameters": {
                "size": {"type": "number", "required": True, "description": "Sample size"},
                "type": {"type": "select", "required": True, "options": ["random", "top", "bottom"], "description": "Sampling method"}
            }
        }
    ]
    
    return {"transformations": transformations}

# ============================================================================
# Filter Presets Endpoints
# ============================================================================

@router.post("/presets")
async def create_filter_preset(
    request: FilterPresetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a reusable filter preset"""
    
    service = DataPreprocessingService(db)
    
    # Convert request models to service models
    conditions = [
        FilterCondition(
            field=c.field,
            operator=c.operator,
            value=c.value,
            field_type=c.field_type
        )
        for c in request.conditions
    ]
    
    transformations = [
        DataTransformation(
            transformation_type=t.type,
            field=t.field,
            operation=t.operation,
            parameters=t.parameters or {}
        )
        for t in request.transformations
    ]
    
    preset = await service.create_filter_preset(
        name=request.name,
        description=request.description,
        conditions=conditions,
        transformations=transformations,
        user_id=str(current_user.id)
    )
    
    return preset

@router.get("/presets")
async def get_filter_presets(
    current_user: User = Depends(get_current_user)
):
    """Get available filter presets"""
    
    # Mock presets - in production, load from database
    presets = [
        {
            "id": "recent_high_engagement",
            "name": "Recent High Engagement",
            "description": "Posts from last 7 days with high scores",
            "conditions": [
                {
                    "field": "created_at",
                    "operator": "last_days",
                    "value": 7,
                    "type": "date"
                },
                {
                    "field": "score",
                    "operator": "greater_than",
                    "value": 100,
                    "type": "number"
                }
            ],
            "transformations": [
                {
                    "type": "sort",
                    "field": "score",
                    "operation": "desc"
                }
            ],
            "created_by": "system",
            "usage_count": 25
        },
        {
            "id": "positive_sentiment",
            "name": "Positive Sentiment Content",
            "description": "Content with positive sentiment analysis",
            "conditions": [
                {
                    "field": "sentiment_score",
                    "operator": "greater_than",
                    "value": 0.5,
                    "type": "number"
                }
            ],
            "transformations": [],
            "created_by": "system",
            "usage_count": 18
        },
        {
            "id": "popular_subreddits",
            "name": "Popular Subreddits",
            "description": "Content from top performing subreddits",
            "conditions": [
                {
                    "field": "subreddit",
                    "operator": "contains",
                    "value": "technology|programming|datascience",
                    "type": "text"
                }
            ],
            "transformations": [
                {
                    "type": "group",
                    "field": "subreddit",
                    "operation": "count"
                }
            ],
            "created_by": "system",
            "usage_count": 12
        }
    ]
    
    return {"presets": presets}

@router.get("/presets/{preset_id}")
async def get_filter_preset(
    preset_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific filter preset"""
    
    # Mock implementation - in production, load from database
    presets = await get_filter_presets(current_user)
    preset = next((p for p in presets["presets"] if p["id"] == preset_id), None)
    
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    return preset

# ============================================================================
# Data Source Information Endpoints
# ============================================================================

@router.get("/sources")
async def get_available_data_sources():
    """Get available data sources for filtering"""
    
    sources = [
        {
            "id": "posts",
            "name": "Reddit Posts",
            "description": "Reddit posts with metadata and analysis results",
            "record_count": 50000,  # Mock count
            "last_updated": "2024-01-15T10:30:00Z"
        },
        {
            "id": "comments",
            "name": "Reddit Comments",
            "description": "Reddit comments with analysis data",
            "record_count": 150000,  # Mock count
            "last_updated": "2024-01-15T10:30:00Z"
        }
    ]
    
    return {"sources": sources}

@router.get("/sources/{source_id}/stats")
async def get_data_source_stats(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for a data source"""
    
    service = DataPreprocessingService(db)
    
    try:
        # Get basic stats
        if source_id == "posts":
            from sqlalchemy import func
            from app.models.post import Post
            
            total_count = db.query(func.count(Post.id)).scalar()
            recent_count = db.query(func.count(Post.id)).filter(
                Post.created_at >= datetime.utcnow() - timedelta(days=7)
            ).scalar()
            
            stats = {
                "total_records": total_count,
                "recent_records": recent_count,
                "fields_available": len(await service.get_available_fields(source_id)),
                "last_updated": datetime.utcnow().isoformat(),
                "data_quality": {
                    "completeness": 95.5,
                    "accuracy": 98.2,
                    "consistency": 97.8
                }
            }
            
        elif source_id == "comments":
            # Similar implementation for comments
            stats = {
                "total_records": 150000,
                "recent_records": 5000,
                "fields_available": 8,
                "last_updated": datetime.utcnow().isoformat(),
                "data_quality": {
                    "completeness": 92.1,
                    "accuracy": 96.8,
                    "consistency": 94.5
                }
            }
        else:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

# ============================================================================
# Export Preview Endpoints
# ============================================================================

@router.post("/preview")
async def preview_filtered_data(
    request: FilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview filtered and transformed data"""
    
    # Force preview mode and limit records
    request.preview_only = True
    request.max_records = 100
    
    return await apply_filters_and_transformations(request, db, current_user)

@router.post("/export-estimate")
async def estimate_export_size(
    request: FilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Estimate the size and processing time for an export"""
    
    service = DataPreprocessingService(db)
    
    # Convert request models to service models
    conditions = [
        FilterCondition(
            field=c.field,
            operator=c.operator,
            value=c.value,
            field_type=c.field_type
        )
        for c in request.conditions
    ]
    
    validation_result = await service.validate_filters(
        data_source=request.data_source,
        conditions=conditions
    )
    
    if not validation_result["valid"]:
        return {
            "valid": False,
            "errors": validation_result["errors"]
        }
    
    estimated_records = validation_result["estimated_records"]
    
    # Estimate file sizes for different formats
    avg_record_size = {
        "csv": 200,    # bytes per record
        "excel": 300,
        "json": 250,
        "pdf": 500
    }
    
    format_estimates = {}
    for format_type, size_per_record in avg_record_size.items():
        estimated_size = estimated_records * size_per_record
        format_estimates[format_type] = {
            "size_bytes": estimated_size,
            "size_mb": round(estimated_size / 1024 / 1024, 2),
            "processing_time_seconds": max(5, estimated_records / 1000)
        }
    
    return {
        "valid": True,
        "estimated_records": estimated_records,
        "format_estimates": format_estimates,
        "warnings": validation_result.get("warnings", [])
    }