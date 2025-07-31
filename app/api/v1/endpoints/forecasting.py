"""
Forecasting API Endpoints

Provides endpoints for demand forecasting, trend prediction,
and engagement analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.dependencies import get_db, get_current_user
from app.services.forecasting_service import ForecastingService
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()
forecasting_service = ForecastingService()


@router.get("/keyword-trends/{keyword}")
async def predict_keyword_trends(
    keyword: str,
    days_ahead: int = Query(30, ge=1, le=90, description="Number of days to forecast"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict keyword trend patterns for specified days ahead
    
    Args:
        keyword: Keyword to analyze
        days_ahead: Number of days to forecast (1-90)
        
    Returns:
        Trend predictions with confidence intervals
    """
    try:
        result = await forecasting_service.predict_keyword_trends(
            keyword=keyword,
            days_ahead=days_ahead,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error predicting keyword trends: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to predict keyword trends: {str(e)}"
        )


@router.get("/engagement-forecast")
async def forecast_engagement_patterns(
    subreddit: Optional[str] = Query(None, description="Filter by subreddit"),
    keyword: Optional[str] = Query(None, description="Filter by keyword"),
    days_ahead: int = Query(14, ge=1, le=60, description="Number of days to forecast"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forecast engagement patterns based on historical data
    
    Args:
        subreddit: Optional subreddit filter
        keyword: Optional keyword filter
        days_ahead: Number of days to forecast (1-60)
        
    Returns:
        Engagement forecasts with pattern analysis
    """
    try:
        result = await forecasting_service.forecast_engagement_patterns(
            subreddit=subreddit,
            keyword=keyword,
            days_ahead=days_ahead,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error forecasting engagement: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to forecast engagement: {str(e)}"
        )


@router.get("/trending-predictions")
async def predict_trending_topics(
    days_ahead: int = Query(7, ge=1, le=30, description="Number of days to predict"),
    confidence_threshold: float = Query(0.7, ge=0.1, le=1.0, description="Minimum confidence threshold"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict which topics are likely to trend in the future
    
    Args:
        days_ahead: Number of days to predict ahead (1-30)
        confidence_threshold: Minimum confidence for predictions (0.1-1.0)
        
    Returns:
        Trending topic predictions with confidence scores
    """
    try:
        result = await forecasting_service.predict_trending_topics(
            days_ahead=days_ahead,
            confidence_threshold=confidence_threshold,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error predicting trending topics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to predict trending topics: {str(e)}"
        )


@router.get("/trend-analysis/{keyword}")
async def get_trend_analysis(
    keyword: str,
    days_back: int = Query(90, ge=7, le=365, description="Days of historical data to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive trend analysis for a keyword
    
    Args:
        keyword: Keyword to analyze
        days_back: Days of historical data to include (7-365)
        
    Returns:
        Comprehensive trend analysis with metrics and insights
    """
    try:
        # Get historical data and metrics
        historical_data = await forecasting_service._get_keyword_historical_data(
            keyword, db, days_back
        )
        
        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data found for keyword: {keyword}"
            )
        
        # Calculate trend metrics
        trend_metrics = forecasting_service._calculate_trend_metrics(historical_data)
        
        # Generate short-term predictions
        predictions = forecasting_service._generate_trend_predictions(
            historical_data, 7, trend_metrics
        )
        
        # Calculate confidence intervals
        confidence_intervals = forecasting_service._calculate_confidence_intervals(
            historical_data, predictions
        )
        
        return {
            "success": True,
            "data": {
                "keyword": keyword,
                "analysis_period": days_back,
                "historical_data": historical_data[-30:],  # Last 30 days for display
                "trend_metrics": trend_metrics,
                "short_term_predictions": predictions,
                "confidence_intervals": confidence_intervals,
                "insights": {
                    "trend_direction": "increasing" if trend_metrics.get('post_trend_slope', 0) > 0 else "decreasing",
                    "volatility_level": "high" if trend_metrics.get('post_volatility', 0) > trend_metrics.get('average_daily_posts', 0) else "low",
                    "data_quality": "good" if len(historical_data) >= 30 else "limited"
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing trend for {keyword}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze trend: {str(e)}"
        )


@router.get("/market-insights")
async def get_market_insights(
    timeframe: str = Query("week", regex="^(day|week|month)$", description="Timeframe for insights"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get market insights and trend summaries
    
    Args:
        timeframe: Analysis timeframe (day, week, month)
        
    Returns:
        Market insights with trend summaries and recommendations
    """
    try:
        # Map timeframe to days
        timeframe_days = {
            "day": 1,
            "week": 7,
            "month": 30
        }
        
        days_back = timeframe_days[timeframe] * 4  # Get 4x the period for analysis
        
        # Get trending predictions
        trending_result = await forecasting_service.predict_trending_topics(
            days_ahead=timeframe_days[timeframe],
            confidence_threshold=0.6,
            db=db
        )
        
        # Get engagement forecast
        engagement_result = await forecasting_service.forecast_engagement_patterns(
            days_ahead=timeframe_days[timeframe],
            db=db
        )
        
        # Compile insights
        insights = {
            "timeframe": timeframe,
            "summary": {
                "trending_topics_count": len(trending_result.get("trending_predictions", [])),
                "high_confidence_predictions": len([
                    p for p in trending_result.get("trending_predictions", [])
                    if p.get("confidence", 0) > 0.8
                ]),
                "overall_engagement_trend": engagement_result.get("engagement_patterns", {}).get("trend_direction", "stable")
            },
            "top_trending": trending_result.get("trending_predictions", [])[:5],
            "engagement_forecast": engagement_result.get("forecasts", [])[:7],
            "recommendations": []
        }
        
        # Generate recommendations
        if insights["summary"]["high_confidence_predictions"] > 0:
            insights["recommendations"].append({
                "type": "opportunity",
                "message": f"Found {insights['summary']['high_confidence_predictions']} high-confidence trending opportunities",
                "action": "Consider creating content around these trending topics"
            })
        
        if engagement_result.get("engagement_patterns", {}).get("trend_direction") == "increasing":
            insights["recommendations"].append({
                "type": "positive",
                "message": "Overall engagement is trending upward",
                "action": "Good time to increase content production"
            })
        
        return {
            "success": True,
            "data": insights
        }
        
    except Exception as e:
        logger.error(f"Error getting market insights: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get market insights: {str(e)}"
        )