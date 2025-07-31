"""
Brand Monitoring API Endpoints

Provides endpoints for brand mention tracking, sentiment analysis,
and competitive analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.dependencies import get_db, get_current_user
from app.services.brand_monitoring_service import BrandMonitoringService
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()
brand_monitoring_service = BrandMonitoringService()


@router.get("/mentions/{brand_name}")
async def track_brand_mentions(
    brand_name: str,
    subreddits: Optional[str] = Query(None, description="Comma-separated list of subreddits"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track brand mentions across subreddits
    
    Args:
        brand_name: Brand name to track
        subreddits: Optional comma-separated list of subreddits
        days_back: Number of days to analyze (1-365)
        
    Returns:
        Brand mention analytics and trends
    """
    try:
        subreddit_list = None
        if subreddits:
            subreddit_list = [s.strip() for s in subreddits.split(',')]
        
        result = await brand_monitoring_service.track_brand_mentions(
            brand_name=brand_name,
            subreddits=subreddit_list,
            days_back=days_back,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error tracking brand mentions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to track brand mentions: {str(e)}"
        )


@router.get("/sentiment/{brand_name}")
async def analyze_brand_sentiment(
    brand_name: str,
    subreddits: Optional[str] = Query(None, description="Comma-separated list of subreddits"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze brand sentiment and reputation scoring
    
    Args:
        brand_name: Brand name to analyze
        subreddits: Optional comma-separated list of subreddits
        days_back: Number of days to analyze (1-365)
        
    Returns:
        Sentiment analysis and reputation score
    """
    try:
        subreddit_list = None
        if subreddits:
            subreddit_list = [s.strip() for s in subreddits.split(',')]
        
        result = await brand_monitoring_service.analyze_brand_sentiment(
            brand_name=brand_name,
            subreddits=subreddit_list,
            days_back=days_back,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error analyzing brand sentiment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze brand sentiment: {str(e)}"
        )


@router.post("/competitive-analysis")
async def competitive_analysis(
    primary_brand: str = Query(..., description="Primary brand to analyze"),
    competitor_brands: str = Query(..., description="Comma-separated list of competitor brands"),
    subreddits: Optional[str] = Query(None, description="Comma-separated list of subreddits"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform competitive analysis and benchmarking
    
    Args:
        primary_brand: Primary brand to analyze
        competitor_brands: Comma-separated list of competitor brands
        subreddits: Optional comma-separated list of subreddits
        days_back: Number of days to analyze (1-365)
        
    Returns:
        Competitive analysis results with benchmarking
    """
    try:
        competitor_list = [brand.strip() for brand in competitor_brands.split(',')]
        
        subreddit_list = None
        if subreddits:
            subreddit_list = [s.strip() for s in subreddits.split(',')]
        
        result = await brand_monitoring_service.competitive_analysis(
            primary_brand=primary_brand,
            competitor_brands=competitor_list,
            subreddits=subreddit_list,
            days_back=days_back,
            db=db
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error in competitive analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform competitive analysis: {str(e)}"
        )


@router.get("/reputation-dashboard/{brand_name}")
async def get_reputation_dashboard(
    brand_name: str,
    subreddits: Optional[str] = Query(None, description="Comma-separated list of subreddits"),
    days_back: int = Query(30, ge=7, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive reputation dashboard for a brand
    
    Args:
        brand_name: Brand name to analyze
        subreddits: Optional comma-separated list of subreddits
        days_back: Number of days to analyze (7-365)
        
    Returns:
        Comprehensive reputation dashboard data
    """
    try:
        subreddit_list = None
        if subreddits:
            subreddit_list = [s.strip() for s in subreddits.split(',')]
        
        # Get brand mentions
        mentions_data = await brand_monitoring_service.track_brand_mentions(
            brand_name=brand_name,
            subreddits=subreddit_list,
            days_back=days_back,
            db=db
        )
        
        # Get sentiment analysis
        sentiment_data = await brand_monitoring_service.analyze_brand_sentiment(
            brand_name=brand_name,
            subreddits=subreddit_list,
            days_back=days_back,
            db=db
        )
        
        # Compile dashboard data
        dashboard = {
            "brand_name": brand_name,
            "analysis_period": days_back,
            "overview": {
                "total_mentions": mentions_data.get("total_mentions", 0),
                "reputation_score": sentiment_data.get("reputation_score", {}),
                "sentiment_summary": mentions_data.get("sentiment_analysis", {}),
                "trend_direction": mentions_data.get("trends", {}).get("trend_direction", "stable")
            },
            "detailed_metrics": {
                "mentions": mentions_data,
                "sentiment": sentiment_data
            },
            "key_insights": {
                "top_subreddits": mentions_data.get("subreddit_breakdown", {}).get("top_subreddits", {}),
                "sentiment_drivers": sentiment_data.get("sentiment_drivers", {}),
                "recommendations": sentiment_data.get("recommendations", [])
            },
            "generated_at": mentions_data.get("generated_at")
        }
        
        return {
            "success": True,
            "data": dashboard
        }
        
    except Exception as e:
        logger.error(f"Error generating reputation dashboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate reputation dashboard: {str(e)}"
        )


@router.get("/market-overview")
async def get_market_overview(
    brands: str = Query(..., description="Comma-separated list of brands to analyze"),
    subreddits: Optional[str] = Query(None, description="Comma-separated list of subreddits"),
    days_back: int = Query(30, ge=7, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get market overview with multiple brand analysis
    
    Args:
        brands: Comma-separated list of brands to analyze
        subreddits: Optional comma-separated list of subreddits
        days_back: Number of days to analyze (7-365)
        
    Returns:
        Market overview with brand comparisons
    """
    try:
        brand_list = [brand.strip() for brand in brands.split(',')]
        
        if len(brand_list) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 brands are required for market overview"
            )
        
        subreddit_list = None
        if subreddits:
            subreddit_list = [s.strip() for s in subreddits.split(',')]
        
        # Analyze all brands
        brand_analyses = {}
        for brand in brand_list:
            brand_analyses[brand] = await brand_monitoring_service.track_brand_mentions(
                brand_name=brand,
                subreddits=subreddit_list,
                days_back=days_back,
                db=db
            )
        
        # Calculate market metrics
        total_mentions = sum(
            analysis.get("total_mentions", 0) 
            for analysis in brand_analyses.values()
        )
        
        # Market share calculation
        market_share = {}
        for brand, analysis in brand_analyses.items():
            mentions = analysis.get("total_mentions", 0)
            share = (mentions / total_mentions * 100) if total_mentions > 0 else 0
            market_share[brand] = {
                "mentions": mentions,
                "share_percentage": round(share, 2),
                "sentiment_score": analysis.get("sentiment_analysis", {}).get("sentiment_score", 0),
                "growth_rate": analysis.get("trends", {}).get("growth_rate", 0)
            }
        
        # Sort by market share
        sorted_brands = sorted(
            market_share.items(),
            key=lambda x: x[1]["share_percentage"],
            reverse=True
        )
        
        # Market insights
        market_leader = sorted_brands[0][0] if sorted_brands else None
        avg_sentiment = sum(
            data["sentiment_score"] for data in market_share.values()
        ) / len(market_share) if market_share else 0
        
        market_overview = {
            "analysis_period": days_back,
            "total_market_mentions": total_mentions,
            "brands_analyzed": len(brand_list),
            "market_leader": market_leader,
            "average_market_sentiment": round(avg_sentiment, 3),
            "brand_rankings": dict(sorted_brands),
            "market_insights": {
                "most_mentioned": market_leader,
                "highest_sentiment": max(
                    market_share.items(),
                    key=lambda x: x[1]["sentiment_score"]
                )[0] if market_share else None,
                "fastest_growing": max(
                    market_share.items(),
                    key=lambda x: x[1]["growth_rate"]
                )[0] if market_share else None
            },
            "generated_at": brand_analyses[brand_list[0]].get("generated_at") if brand_analyses else None
        }
        
        return {
            "success": True,
            "data": market_overview
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating market overview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate market overview: {str(e)}"
        )