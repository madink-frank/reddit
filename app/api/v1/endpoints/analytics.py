from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.utils.redis_client import get_redis_client
from app.schemas.analytics import (
    KeywordFrequencyResponse,
    TimeTrendsResponse,
    KeywordStatsResponse
)

router = APIRouter()


async def get_cached_analytics_service(db: Session = Depends(get_db)) -> AnalyticsService:
    """캐시가 적용된 Analytics Service 의존성"""
    redis_client = await get_redis_client()
    cache_service = CacheService(redis_client)
    return AnalyticsService(db, cache_service)


@router.get("/trends/frequency", response_model=KeywordFrequencyResponse)
async def get_keyword_frequency(
    keyword_ids: Optional[List[int]] = Query(None, description="키워드 ID 목록 (선택사항)"),
    days: int = Query(7, ge=1, le=365, description="분석 기간 (일)"),
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """키워드별 언급 빈도 분석"""
    try:
        result = await analytics_service.analyze_keyword_frequency(
            user_id=current_user.id,
            keyword_ids=keyword_ids,
            days=days
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"트렌드 분석 중 오류가 발생했습니다: {str(e)}")


@router.get("/trends/timeline", response_model=TimeTrendsResponse)
async def get_time_trends(
    keyword_ids: Optional[List[int]] = Query(None, description="키워드 ID 목록 (선택사항)"),
    days: int = Query(7, ge=1, le=365, description="분석 기간 (일)"),
    interval_hours: int = Query(6, ge=1, le=24, description="시간 간격 (시간)"),
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """시간대별 트렌드 변화 분석"""
    try:
        result = await analytics_service.analyze_time_trends(
            user_id=current_user.id,
            keyword_ids=keyword_ids,
            days=days,
            interval_hours=interval_hours
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"시간대별 트렌드 분석 중 오류가 발생했습니다: {str(e)}")


@router.get("/keywords/{keyword_id}/stats", response_model=KeywordStatsResponse)
async def get_keyword_statistics(
    keyword_id: int,
    days: int = Query(30, ge=1, le=365, description="분석 기간 (일)"),
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """특정 키워드의 상세 통계"""
    try:
        result = await analytics_service.get_keyword_statistics(
            keyword_id=keyword_id,
            days=days
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="키워드를 찾을 수 없습니다")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"키워드 통계 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/posts/popular")
async def get_popular_posts(
    keyword_ids: Optional[List[int]] = Query(None, description="키워드 ID 목록 (선택사항)"),
    days: int = Query(7, ge=1, le=365, description="분석 기간 (일)"),
    limit: int = Query(20, ge=1, le=100, description="반환할 포스트 수"),
    min_score: int = Query(10, ge=0, description="최소 점수 기준"),
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """인기 포스트 분석"""
    try:
        result = await analytics_service.analyze_popular_posts(
            user_id=current_user.id,
            keyword_ids=keyword_ids,
            days=days,
            limit=limit,
            min_score=min_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인기 포스트 분석 중 오류가 발생했습니다: {str(e)}")


@router.get("/posts/trending")
async def get_trending_posts(
    keyword_ids: Optional[List[int]] = Query(None, description="키워드 ID 목록 (선택사항)"),
    hours: int = Query(24, ge=1, le=168, description="분석 시간 (시간)"),
    limit: int = Query(10, ge=1, le=50, description="반환할 포스트 수"),
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """트렌딩 포스트 조회"""
    try:
        result = await analytics_service.get_trending_posts(
            user_id=current_user.id,
            keyword_ids=keyword_ids,
            hours=hours,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"트렌딩 포스트 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/dashboard")
async def get_dashboard_data(
    days: int = Query(7, ge=1, le=365, description="분석 기간 (일)"),
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """대시보드용 종합 분석 데이터"""
    try:
        # 키워드 빈도 분석
        frequency_data = await analytics_service.analyze_keyword_frequency(
            user_id=current_user.id,
            days=days
        )
        
        # 시간대별 트렌드 (24시간 간격)
        time_trends = await analytics_service.analyze_time_trends(
            user_id=current_user.id,
            days=days,
            interval_hours=24
        )
        
        # 인기 포스트 (상위 5개)
        popular_posts = await analytics_service.analyze_popular_posts(
            user_id=current_user.id,
            days=days,
            limit=5,
            min_score=5
        )
        
        return {
            "period": {
                "days": days
            },
            "keyword_frequency": frequency_data,
            "time_trends": time_trends,
            "popular_posts": popular_posts,
            "summary": {
                "total_keywords": frequency_data.get("total_keywords", 0),
                "total_posts": frequency_data.get("total_posts", 0),
                "most_active_keyword": (
                    frequency_data["keywords"][0]["keyword"] 
                    if frequency_data.get("keywords") else None
                ),
                "top_post_score": (
                    popular_posts["posts"][0]["score"]
                    if popular_posts.get("posts") else 0
                )
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"대시보드 데이터 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/cache/stats")
async def get_cache_statistics(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """캐시 통계 조회"""
    try:
        if not analytics_service.cache_service:
            raise HTTPException(status_code=503, detail="캐시 서비스가 사용 불가능합니다")
        
        stats = await analytics_service.cache_service.get_cache_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"캐시 통계 조회 중 오류가 발생했습니다: {str(e)}")


@router.delete("/cache/user")
async def invalidate_user_cache(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """사용자 캐시 무효화"""
    try:
        if not analytics_service.cache_service:
            raise HTTPException(status_code=503, detail="캐시 서비스가 사용 불가능합니다")
        
        deleted_count = await analytics_service.cache_service.invalidate_user_cache(current_user.id)
        return {
            "message": f"사용자 캐시가 성공적으로 무효화되었습니다",
            "deleted_keys": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"캐시 무효화 중 오류가 발생했습니다: {str(e)}")


@router.delete("/cache/keyword/{keyword_id}")
async def invalidate_keyword_cache(
    keyword_id: int,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_cached_analytics_service)
):
    """키워드 캐시 무효화"""
    try:
        if not analytics_service.cache_service:
            raise HTTPException(status_code=503, detail="캐시 서비스가 사용 불가능합니다")
        
        deleted_count = await analytics_service.cache_service.invalidate_keyword_cache(keyword_id)
        return {
            "message": f"키워드 {keyword_id} 캐시가 성공적으로 무효화되었습니다",
            "deleted_keys": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"키워드 캐시 무효화 중 오류가 발생했습니다: {str(e)}")