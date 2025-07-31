"""
Advertising Effectiveness API Endpoints

Provides endpoints for campaign performance tracking, ROI calculation,
and A/B testing framework.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.core.dependencies import get_db, get_current_user
from app.services.advertising_effectiveness_service import AdvertisingEffectivenessService
from app.models.user import User
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()
advertising_service = AdvertisingEffectivenessService()


class CampaignRequest(BaseModel):
    campaign_keywords: List[str]
    subreddits: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ROIRequest(BaseModel):
    campaign_cost: float
    conversion_events: Optional[List[Dict[str, Any]]] = None
    conversion_value: Optional[float] = None


class ABTestVariant(BaseModel):
    variant_id: str
    keywords: List[str]
    subreddits: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ABTestRequest(BaseModel):
    test_variants: List[ABTestVariant]
    success_metric: str = "engagement_rate"
    confidence_level: float = 0.95


class CampaignConfig(BaseModel):
    campaign_id: str
    keywords: List[str]
    subreddits: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AttributionRequest(BaseModel):
    campaigns: List[CampaignConfig]
    attribution_window_days: int = 30


@router.post("/campaign-performance")
async def track_campaign_performance(
    request: CampaignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track campaign performance and analyze effectiveness
    
    Args:
        request: Campaign configuration and parameters
        
    Returns:
        Campaign performance metrics and analysis
    """
    try:
        result = await advertising_service.track_campaign_performance(
            campaign_keywords=request.campaign_keywords,
            subreddits=request.subreddits,
            start_date=request.start_date,
            end_date=request.end_date,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error tracking campaign performance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to track campaign performance: {str(e)}"
        )


@router.post("/roi-analysis")
async def calculate_roi_metrics(
    campaign_keywords: List[str] = Body(...),
    roi_request: ROIRequest = Body(...),
    subreddits: Optional[List[str]] = Body(None),
    start_date: Optional[datetime] = Body(None),
    end_date: Optional[datetime] = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate ROI and marketing attribution metrics
    
    Args:
        campaign_keywords: Keywords associated with the campaign
        roi_request: ROI calculation parameters
        subreddits: Optional list of subreddits
        start_date: Campaign start date
        end_date: Campaign end date
        
    Returns:
        ROI calculations and attribution metrics
    """
    try:
        # First get campaign performance data
        campaign_data = await advertising_service.track_campaign_performance(
            campaign_keywords=campaign_keywords,
            subreddits=subreddits,
            start_date=start_date,
            end_date=end_date,
            db=db
        )
        
        # Calculate ROI metrics
        result = await advertising_service.calculate_roi_metrics(
            campaign_data=campaign_data,
            campaign_cost=roi_request.campaign_cost,
            conversion_events=roi_request.conversion_events,
            conversion_value=roi_request.conversion_value
        )
        
        return {
            "success": True,
            "data": {
                "campaign_data": campaign_data,
                "roi_analysis": result
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating ROI metrics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate ROI metrics: {str(e)}"
        )


@router.post("/ab-test-analysis")
async def perform_ab_test_analysis(
    request: ABTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform A/B testing analysis for content strategies
    
    Args:
        request: A/B test configuration and variants
        
    Returns:
        A/B test results and recommendations
    """
    try:
        # Convert Pydantic models to dictionaries
        test_variants = [variant.dict() for variant in request.test_variants]
        
        result = await advertising_service.ab_test_analysis(
            test_variants=test_variants,
            success_metric=request.success_metric,
            confidence_level=request.confidence_level,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error in A/B test analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform A/B test analysis: {str(e)}"
        )


@router.post("/attribution-analysis")
async def perform_attribution_analysis(
    request: AttributionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze marketing attribution across multiple campaigns
    
    Args:
        request: Attribution analysis configuration
        
    Returns:
        Attribution analysis results with budget recommendations
    """
    try:
        # Convert Pydantic models to dictionaries
        campaigns = [campaign.dict() for campaign in request.campaigns]
        
        result = await advertising_service.campaign_attribution_analysis(
            campaigns=campaigns,
            attribution_window_days=request.attribution_window_days,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error in attribution analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform attribution analysis: {str(e)}"
        )


@router.get("/campaign-insights/{campaign_id}")
async def get_campaign_insights(
    campaign_id: str,
    keywords: str = Query(..., description="Comma-separated campaign keywords"),
    subreddits: Optional[str] = Query(None, description="Comma-separated subreddits"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive campaign insights and recommendations
    
    Args:
        campaign_id: Campaign identifier
        keywords: Comma-separated campaign keywords
        subreddits: Optional comma-separated subreddits
        days_back: Number of days to analyze
        
    Returns:
        Comprehensive campaign insights with actionable recommendations
    """
    try:
        keyword_list = [k.strip() for k in keywords.split(',')]
        subreddit_list = None
        if subreddits:
            subreddit_list = [s.strip() for s in subreddits.split(',')]
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        # Get campaign performance
        campaign_performance = await advertising_service.track_campaign_performance(
            campaign_keywords=keyword_list,
            subreddits=subreddit_list,
            start_date=start_date,
            end_date=end_date,
            db=db
        )
        
        # Generate insights
        insights = {
            "campaign_id": campaign_id,
            "analysis_period": days_back,
            "performance_summary": {
                "total_engagement": campaign_performance["performance_metrics"]["total_engagement_score"],
                "engagement_rate": campaign_performance["engagement_analysis"]["overall_engagement_rate"],
                "reach": campaign_performance["reach_metrics"]["estimated_reach"],
                "content_pieces": campaign_performance["performance_metrics"]["total_posts"]
            },
            "key_insights": {
                "best_performing_keyword": campaign_performance["content_analysis"]["content_insights"]["most_effective_keyword"],
                "top_subreddit": max(
                    campaign_performance["reach_metrics"]["subreddit_breakdown"].items(),
                    key=lambda x: x[1]["engagement"]
                )[0] if campaign_performance["reach_metrics"]["subreddit_breakdown"] else None,
                "trend_direction": campaign_performance["temporal_analysis"]["trend_analysis"]["direction"],
                "peak_performance_date": campaign_performance["temporal_analysis"]["peak_performance_date"]
            },
            "recommendations": []
        }
        
        # Generate recommendations based on performance
        performance_metrics = campaign_performance["performance_metrics"]
        engagement_analysis = campaign_performance["engagement_analysis"]
        
        if engagement_analysis["overall_engagement_rate"] < 10:
            insights["recommendations"].append({
                "type": "engagement_improvement",
                "priority": "high",
                "title": "Improve Engagement Strategy",
                "description": "Engagement rate is below average. Consider optimizing content format and timing.",
                "actions": ["Test different content formats", "Analyze optimal posting times", "Improve call-to-action"]
            })
        
        if performance_metrics["total_posts"] < 5:
            insights["recommendations"].append({
                "type": "content_volume",
                "priority": "medium",
                "title": "Increase Content Volume",
                "description": "Low content volume may limit campaign reach and effectiveness.",
                "actions": ["Increase posting frequency", "Create content calendar", "Develop content templates"]
            })
        
        # Temporal insights
        temporal_analysis = campaign_performance["temporal_analysis"]
        if temporal_analysis["trend_analysis"]["direction"] == "decreasing":
            insights["recommendations"].append({
                "type": "performance_decline",
                "priority": "high",
                "title": "Address Performance Decline",
                "description": "Campaign performance is declining over time.",
                "actions": ["Refresh creative content", "Adjust targeting", "Analyze competitor activities"]
            })
        
        return {
            "success": True,
            "data": insights
        }
        
    except Exception as e:
        logger.error(f"Error getting campaign insights: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get campaign insights: {str(e)}"
        )


@router.get("/performance-benchmarks")
async def get_performance_benchmarks(
    industry: str = Query("general", description="Industry category for benchmarks"),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance benchmarks for campaign evaluation
    
    Args:
        industry: Industry category for relevant benchmarks
        
    Returns:
        Performance benchmarks and evaluation criteria
    """
    try:
        # Industry-specific benchmarks (simplified - would be based on real data)
        benchmarks = {
            "general": {
                "engagement_rate": {"excellent": 50, "good": 25, "average": 10, "poor": 5},
                "cost_per_engagement": {"excellent": 0.10, "good": 0.25, "average": 0.50, "poor": 1.00},
                "conversion_rate": {"excellent": 5.0, "good": 2.5, "average": 1.0, "poor": 0.5},
                "reach_rate": {"excellent": 1000, "good": 500, "average": 200, "poor": 100}
            },
            "technology": {
                "engagement_rate": {"excellent": 60, "good": 35, "average": 15, "poor": 8},
                "cost_per_engagement": {"excellent": 0.15, "good": 0.35, "average": 0.70, "poor": 1.20},
                "conversion_rate": {"excellent": 7.0, "good": 4.0, "average": 2.0, "poor": 1.0},
                "reach_rate": {"excellent": 1500, "good": 800, "average": 300, "poor": 150}
            },
            "consumer": {
                "engagement_rate": {"excellent": 40, "good": 20, "average": 8, "poor": 3},
                "cost_per_engagement": {"excellent": 0.08, "good": 0.20, "average": 0.40, "poor": 0.80},
                "conversion_rate": {"excellent": 4.0, "good": 2.0, "average": 0.8, "poor": 0.3},
                "reach_rate": {"excellent": 800, "good": 400, "average": 150, "poor": 75}
            }
        }
        
        selected_benchmarks = benchmarks.get(industry, benchmarks["general"])
        
        return {
            "success": True,
            "data": {
                "industry": industry,
                "benchmarks": selected_benchmarks,
                "evaluation_guide": {
                    "excellent": "Top 10% performance - exceptional results",
                    "good": "Top 25% performance - above average results",
                    "average": "Median performance - typical industry results",
                    "poor": "Below average performance - needs improvement"
                },
                "optimization_tips": {
                    "engagement_rate": [
                        "Optimize content timing and format",
                        "Improve call-to-action clarity",
                        "Engage with community comments"
                    ],
                    "cost_per_engagement": [
                        "Refine targeting parameters",
                        "Optimize content quality",
                        "Test different content formats"
                    ],
                    "conversion_rate": [
                        "Improve landing page experience",
                        "Optimize conversion funnel",
                        "Test different offers and incentives"
                    ]
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting performance benchmarks: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get performance benchmarks: {str(e)}"
        )