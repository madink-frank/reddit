"""
Data Preprocessing Service - Advanced filtering, transformation, and validation
"""

import asyncio
import json
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime, timedelta
import re
from enum import Enum
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from fastapi import HTTPException

from app.models.post import Post
from app.models.comment import Comment


class FilterOperator(str, Enum):
    # Text operators
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    REGEX = "regex"
    
    # Number operators
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_EQUAL = "greater_equal"
    LESS_EQUAL = "less_equal"
    BETWEEN = "between"
    
    # Date operators
    BEFORE = "before"
    AFTER = "after"
    DATE_BETWEEN = "date_between"
    LAST_DAYS = "last_days"
    LAST_WEEKS = "last_weeks"
    LAST_MONTHS = "last_months"
    
    # Boolean operators
    IS_TRUE = "is_true"
    IS_FALSE = "is_false"


class TransformationType(str, Enum):
    AGGREGATE = "aggregate"
    SORT = "sort"
    GROUP = "group"
    CALCULATE = "calculate"
    FORMAT = "format"
    DEDUPLICATE = "deduplicate"
    SAMPLE = "sample"


class FilterCondition:
    def __init__(self, field: str, operator: FilterOperator, value: Any, field_type: str = "text"):
        self.field = field
        self.operator = operator
        self.value = value
        self.field_type = field_type


class DataTransformation:
    def __init__(self, transformation_type: TransformationType, **kwargs):
        self.type = transformation_type
        self.field = kwargs.get('field')
        self.operation = kwargs.get('operation')
        self.parameters = kwargs.get('parameters', {})


class DataPreprocessingService:
    """Service for advanced data filtering, transformation, and preprocessing"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def apply_filters_and_transformations(
        self,
        data_source: str,
        conditions: List[FilterCondition],
        transformations: List[DataTransformation],
        preview_only: bool = False,
        max_records: Optional[int] = None
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Apply filters and transformations to data source"""
        
        # Step 1: Build and execute filtered query
        filtered_data = await self._apply_filters(data_source, conditions, preview_only, max_records)
        
        # Step 2: Convert to DataFrame for transformations
        df = pd.DataFrame(filtered_data)
        
        if df.empty:
            return [], {"total_records": 0, "filtered_records": 0, "transformations_applied": 0}
        
        # Step 3: Apply transformations
        transformed_df = await self._apply_transformations(df, transformations)
        
        # Step 4: Convert back to list of dicts
        result_data = transformed_df.to_dict('records')
        
        # Step 5: Generate metadata
        metadata = {
            "total_records": len(filtered_data),
            "filtered_records": len(result_data),
            "transformations_applied": len(transformations),
            "columns": list(transformed_df.columns),
            "data_types": {col: str(dtype) for col, dtype in transformed_df.dtypes.items()},
            "processing_time": datetime.utcnow().isoformat()
        }
        
        return result_data, metadata
    
    async def _apply_filters(
        self,
        data_source: str,
        conditions: List[FilterCondition],
        preview_only: bool = False,
        max_records: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Apply filter conditions to data source"""
        
        if data_source == "posts":
            query = self.db.query(Post)
        elif data_source == "comments":
            query = self.db.query(Comment)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported data source: {data_source}")
        
        # Apply each filter condition
        for condition in conditions:
            query = self._apply_single_filter(query, condition, data_source)
        
        # Apply limits
        if preview_only:
            query = query.limit(100)  # Preview limit
        elif max_records:
            query = query.limit(max_records)
        
        # Execute query and convert to dicts
        results = query.all()
        return [self._model_to_dict(result) for result in results]
    
    def _apply_single_filter(self, query, condition: FilterCondition, data_source: str):
        """Apply a single filter condition to SQLAlchemy query"""
        
        # Get the model class
        if data_source == "posts":
            model = Post
        elif data_source == "comments":
            model = Comment
        else:
            raise ValueError(f"Unsupported data source: {data_source}")
        
        # Get the field attribute
        if not hasattr(model, condition.field):
            raise ValueError(f"Field {condition.field} not found in {data_source}")
        
        field_attr = getattr(model, condition.field)
        
        # Apply operator-specific filtering
        if condition.operator == FilterOperator.CONTAINS:
            return query.filter(field_attr.contains(condition.value))
        
        elif condition.operator == FilterOperator.NOT_CONTAINS:
            return query.filter(~field_attr.contains(condition.value))
        
        elif condition.operator == FilterOperator.EQUALS:
            return query.filter(field_attr == condition.value)
        
        elif condition.operator == FilterOperator.NOT_EQUALS:
            return query.filter(field_attr != condition.value)
        
        elif condition.operator == FilterOperator.STARTS_WITH:
            return query.filter(field_attr.like(f"{condition.value}%"))
        
        elif condition.operator == FilterOperator.ENDS_WITH:
            return query.filter(field_attr.like(f"%{condition.value}"))
        
        elif condition.operator == FilterOperator.REGEX:
            return query.filter(field_attr.op('~')(condition.value))
        
        elif condition.operator == FilterOperator.GREATER_THAN:
            return query.filter(field_attr > condition.value)
        
        elif condition.operator == FilterOperator.LESS_THAN:
            return query.filter(field_attr < condition.value)
        
        elif condition.operator == FilterOperator.GREATER_EQUAL:
            return query.filter(field_attr >= condition.value)
        
        elif condition.operator == FilterOperator.LESS_EQUAL:
            return query.filter(field_attr <= condition.value)
        
        elif condition.operator == FilterOperator.BETWEEN:
            return query.filter(and_(
                field_attr >= condition.value.get('min'),
                field_attr <= condition.value.get('max')
            ))
        
        elif condition.operator == FilterOperator.BEFORE:
            return query.filter(field_attr < condition.value)
        
        elif condition.operator == FilterOperator.AFTER:
            return query.filter(field_attr > condition.value)
        
        elif condition.operator == FilterOperator.DATE_BETWEEN:
            return query.filter(and_(
                field_attr >= condition.value.get('start'),
                field_attr <= condition.value.get('end')
            ))
        
        elif condition.operator == FilterOperator.LAST_DAYS:
            cutoff_date = datetime.utcnow() - timedelta(days=condition.value)
            return query.filter(field_attr >= cutoff_date)
        
        elif condition.operator == FilterOperator.LAST_WEEKS:
            cutoff_date = datetime.utcnow() - timedelta(weeks=condition.value)
            return query.filter(field_attr >= cutoff_date)
        
        elif condition.operator == FilterOperator.LAST_MONTHS:
            cutoff_date = datetime.utcnow() - timedelta(days=condition.value * 30)
            return query.filter(field_attr >= cutoff_date)
        
        elif condition.operator == FilterOperator.IS_TRUE:
            return query.filter(field_attr == True)
        
        elif condition.operator == FilterOperator.IS_FALSE:
            return query.filter(field_attr == False)
        
        else:
            raise ValueError(f"Unsupported operator: {condition.operator}")
    
    async def _apply_transformations(
        self,
        df: pd.DataFrame,
        transformations: List[DataTransformation]
    ) -> pd.DataFrame:
        """Apply data transformations to DataFrame"""
        
        result_df = df.copy()
        
        for transformation in transformations:
            result_df = await self._apply_single_transformation(result_df, transformation)
        
        return result_df
    
    async def _apply_single_transformation(
        self,
        df: pd.DataFrame,
        transformation: DataTransformation
    ) -> pd.DataFrame:
        """Apply a single transformation to DataFrame"""
        
        if transformation.type == TransformationType.SORT:
            ascending = transformation.operation != 'desc'
            return df.sort_values(by=transformation.field, ascending=ascending)
        
        elif transformation.type == TransformationType.GROUP:
            if transformation.operation == 'count':
                return df.groupby(transformation.field).size().reset_index(name='count')
            elif transformation.operation == 'sum':
                return df.groupby(transformation.field).sum().reset_index()
            elif transformation.operation == 'mean':
                return df.groupby(transformation.field).mean().reset_index()
            else:
                return df.groupby(transformation.field).agg(transformation.operation).reset_index()
        
        elif transformation.type == TransformationType.AGGREGATE:
            if transformation.operation == 'sum':
                result = df[transformation.field].sum()
            elif transformation.operation == 'mean':
                result = df[transformation.field].mean()
            elif transformation.operation == 'count':
                result = df[transformation.field].count()
            elif transformation.operation == 'min':
                result = df[transformation.field].min()
            elif transformation.operation == 'max':
                result = df[transformation.field].max()
            else:
                result = df[transformation.field].agg(transformation.operation)
            
            # Return single-row DataFrame with aggregated result
            return pd.DataFrame({f"{transformation.field}_{transformation.operation}": [result]})
        
        elif transformation.type == TransformationType.CALCULATE:
            # Add calculated fields
            formula = transformation.parameters.get('formula', '')
            new_field = transformation.parameters.get('new_field', 'calculated_field')
            
            try:
                # Simple formula evaluation (in production, use safer evaluation)
                df[new_field] = df.eval(formula)
            except Exception as e:
                # If formula fails, add a default value
                df[new_field] = None
            
            return df
        
        elif transformation.type == TransformationType.FORMAT:
            # Format field values
            format_type = transformation.parameters.get('format_type', 'string')
            
            if format_type == 'date':
                date_format = transformation.parameters.get('date_format', '%Y-%m-%d')
                df[transformation.field] = pd.to_datetime(df[transformation.field]).dt.strftime(date_format)
            elif format_type == 'number':
                decimal_places = transformation.parameters.get('decimal_places', 2)
                df[transformation.field] = df[transformation.field].round(decimal_places)
            elif format_type == 'currency':
                df[transformation.field] = df[transformation.field].apply(lambda x: f"${x:.2f}")
            
            return df
        
        elif transformation.type == TransformationType.DEDUPLICATE:
            # Remove duplicates
            subset_fields = transformation.parameters.get('fields', None)
            return df.drop_duplicates(subset=subset_fields)
        
        elif transformation.type == TransformationType.SAMPLE:
            # Sample data
            sample_size = transformation.parameters.get('size', 1000)
            sample_type = transformation.parameters.get('type', 'random')
            
            if sample_type == 'random':
                return df.sample(n=min(sample_size, len(df)))
            elif sample_type == 'top':
                return df.head(sample_size)
            elif sample_type == 'bottom':
                return df.tail(sample_size)
            
            return df
        
        else:
            # Unknown transformation type, return unchanged
            return df
    
    def _model_to_dict(self, model_instance) -> Dict[str, Any]:
        """Convert SQLAlchemy model instance to dictionary"""
        
        result = {}
        for column in model_instance.__table__.columns:
            value = getattr(model_instance, column.name)
            
            # Handle datetime serialization
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        
        return result
    
    async def validate_filters(
        self,
        data_source: str,
        conditions: List[FilterCondition]
    ) -> Dict[str, Any]:
        """Validate filter conditions and estimate results"""
        
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "estimated_records": 0,
            "estimated_processing_time": 0
        }
        
        # Validate each condition
        for i, condition in enumerate(conditions):
            field_validation = await self._validate_field(data_source, condition.field)
            if not field_validation["valid"]:
                validation_result["valid"] = False
                validation_result["errors"].append(
                    f"Condition {i+1}: {field_validation['error']}"
                )
            
            operator_validation = self._validate_operator(condition.operator, condition.field_type)
            if not operator_validation["valid"]:
                validation_result["valid"] = False
                validation_result["errors"].append(
                    f"Condition {i+1}: {operator_validation['error']}"
                )
            
            value_validation = self._validate_value(condition.value, condition.field_type, condition.operator)
            if not value_validation["valid"]:
                validation_result["valid"] = False
                validation_result["errors"].append(
                    f"Condition {i+1}: {value_validation['error']}"
                )
        
        # Estimate result size if validation passes
        if validation_result["valid"]:
            try:
                # Quick count query to estimate results
                if data_source == "posts":
                    query = self.db.query(func.count(Post.id))
                elif data_source == "comments":
                    query = self.db.query(func.count(Comment.id))
                else:
                    raise ValueError(f"Unsupported data source: {data_source}")
                
                # Apply filters to count query
                for condition in conditions:
                    query = self._apply_single_filter(query, condition, data_source)
                
                estimated_count = query.scalar()
                validation_result["estimated_records"] = estimated_count
                
                # Estimate processing time (rough calculation)
                validation_result["estimated_processing_time"] = max(1, estimated_count / 1000)
                
                # Add warnings for large datasets
                if estimated_count > 100000:
                    validation_result["warnings"].append(
                        f"Large dataset ({estimated_count:,} records) may take longer to process"
                    )
                
            except Exception as e:
                validation_result["warnings"].append(f"Could not estimate result size: {str(e)}")
        
        return validation_result
    
    async def _validate_field(self, data_source: str, field_name: str) -> Dict[str, Any]:
        """Validate that field exists in data source"""
        
        if data_source == "posts":
            model = Post
        elif data_source == "comments":
            model = Comment
        else:
            return {"valid": False, "error": f"Unsupported data source: {data_source}"}
        
        if hasattr(model, field_name):
            return {"valid": True}
        else:
            return {"valid": False, "error": f"Field '{field_name}' not found in {data_source}"}
    
    def _validate_operator(self, operator: FilterOperator, field_type: str) -> Dict[str, Any]:
        """Validate that operator is compatible with field type"""
        
        text_operators = [
            FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS, FilterOperator.EQUALS,
            FilterOperator.NOT_EQUALS, FilterOperator.STARTS_WITH, FilterOperator.ENDS_WITH,
            FilterOperator.REGEX
        ]
        
        number_operators = [
            FilterOperator.EQUALS, FilterOperator.NOT_EQUALS, FilterOperator.GREATER_THAN,
            FilterOperator.LESS_THAN, FilterOperator.GREATER_EQUAL, FilterOperator.LESS_EQUAL,
            FilterOperator.BETWEEN
        ]
        
        date_operators = [
            FilterOperator.EQUALS, FilterOperator.NOT_EQUALS, FilterOperator.BEFORE,
            FilterOperator.AFTER, FilterOperator.DATE_BETWEEN, FilterOperator.LAST_DAYS,
            FilterOperator.LAST_WEEKS, FilterOperator.LAST_MONTHS
        ]
        
        boolean_operators = [FilterOperator.IS_TRUE, FilterOperator.IS_FALSE]
        
        if field_type == "text" and operator in text_operators:
            return {"valid": True}
        elif field_type == "number" and operator in number_operators:
            return {"valid": True}
        elif field_type == "date" and operator in date_operators:
            return {"valid": True}
        elif field_type == "boolean" and operator in boolean_operators:
            return {"valid": True}
        else:
            return {
                "valid": False,
                "error": f"Operator '{operator}' is not compatible with field type '{field_type}'"
            }
    
    def _validate_value(self, value: Any, field_type: str, operator: FilterOperator) -> Dict[str, Any]:
        """Validate that value is appropriate for field type and operator"""
        
        if operator in [FilterOperator.IS_TRUE, FilterOperator.IS_FALSE]:
            # Boolean operators don't need values
            return {"valid": True}
        
        if value is None or (isinstance(value, str) and not value.strip()):
            return {"valid": False, "error": "Value is required for this operator"}
        
        if field_type == "number":
            if operator == FilterOperator.BETWEEN:
                if not isinstance(value, dict) or 'min' not in value or 'max' not in value:
                    return {"valid": False, "error": "Between operator requires min and max values"}
                try:
                    float(value['min'])
                    float(value['max'])
                except (ValueError, TypeError):
                    return {"valid": False, "error": "Min and max values must be numbers"}
            else:
                try:
                    float(value)
                except (ValueError, TypeError):
                    return {"valid": False, "error": "Value must be a number"}
        
        elif field_type == "date":
            if operator == FilterOperator.DATE_BETWEEN:
                if not isinstance(value, dict) or 'start' not in value or 'end' not in value:
                    return {"valid": False, "error": "Date between operator requires start and end dates"}
            elif operator in [FilterOperator.LAST_DAYS, FilterOperator.LAST_WEEKS, FilterOperator.LAST_MONTHS]:
                try:
                    int(value)
                except (ValueError, TypeError):
                    return {"valid": False, "error": "Value must be a number for relative date operators"}
        
        elif field_type == "text" and operator == FilterOperator.REGEX:
            try:
                re.compile(value)
            except re.error:
                return {"valid": False, "error": "Invalid regular expression"}
        
        return {"valid": True}
    
    async def get_available_fields(self, data_source: str) -> List[Dict[str, Any]]:
        """Get available fields for a data source"""
        
        if data_source == "posts":
            model = Post
        elif data_source == "comments":
            model = Comment
        else:
            raise ValueError(f"Unsupported data source: {data_source}")
        
        fields = []
        for column in model.__table__.columns:
            field_type = "text"  # Default
            
            # Determine field type based on SQLAlchemy column type
            column_type = str(column.type).lower()
            if "integer" in column_type or "float" in column_type or "numeric" in column_type:
                field_type = "number"
            elif "datetime" in column_type or "timestamp" in column_type:
                field_type = "date"
            elif "boolean" in column_type:
                field_type = "boolean"
            
            fields.append({
                "field": column.name,
                "label": column.name.replace('_', ' ').title(),
                "type": field_type,
                "description": f"{field_type.title()} field"
            })
        
        return fields
    
    async def create_filter_preset(
        self,
        name: str,
        description: str,
        conditions: List[FilterCondition],
        transformations: List[DataTransformation],
        user_id: str
    ) -> Dict[str, Any]:
        """Create a reusable filter preset"""
        
        preset = {
            "id": f"preset_{int(datetime.utcnow().timestamp())}",
            "name": name,
            "description": description,
            "conditions": [
                {
                    "field": c.field,
                    "operator": c.operator,
                    "value": c.value,
                    "type": c.field_type
                }
                for c in conditions
            ],
            "transformations": [
                {
                    "type": t.type,
                    "field": t.field,
                    "operation": t.operation,
                    "parameters": t.parameters
                }
                for t in transformations
            ],
            "created_by": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "usage_count": 0
        }
        
        # In production, save to database
        return preset