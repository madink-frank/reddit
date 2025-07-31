import json
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Callable, List
from functools import wraps

from app.utils.redis_client import RedisClient


class CacheService:
    """캐싱 서비스 - Redis를 사용한 트렌드 분석 결과 캐싱"""
    
    def __init__(self, redis_client: RedisClient):
        self.redis = redis_client
        self.default_ttl = 3600  # 1시간
        self.cache_prefix = "reddit_analytics"
    
    def _generate_cache_key(self, prefix: str, **kwargs) -> str:
        """캐시 키 생성"""
        # 파라미터들을 정렬하여 일관된 키 생성
        sorted_params = sorted(kwargs.items())
        params_str = json.dumps(sorted_params, sort_keys=True, default=str)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()
        return f"{self.cache_prefix}:{prefix}:{params_hash}"
    
    async def get_cached_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """캐시된 결과 조회 with graceful degradation"""
        try:
            # Check if Redis is available
            if not self.redis.is_healthy():
                return None
                
            cached_data = await self.redis.get(cache_key)
            if cached_data:
                return cached_data
            return None
        except Exception as e:
            print(f"Cache get error, continuing without cache: {e}")
            return None
    
    async def set_cached_result(
        self, 
        cache_key: str, 
        data: Dict[str, Any], 
        ttl: Optional[int] = None
    ) -> bool:
        """결과를 캐시에 저장 with graceful degradation"""
        try:
            # Check if Redis is available
            if not self.redis.is_healthy():
                return False
                
            expire_time = ttl or self.default_ttl
            
            # 캐시 메타데이터 추가
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(seconds=expire_time)).isoformat()
            }
            
            return await self.redis.set(cache_key, cache_data, expire_time)
        except Exception as e:
            print(f"Cache set error, continuing without cache: {e}")
            return False
    
    async def invalidate_cache(self, pattern: str) -> int:
        """패턴에 맞는 캐시 무효화 with graceful degradation"""
        try:
            # Check if Redis is available
            if not self.redis.is_healthy():
                return 0
                
            # Redis SCAN을 사용하여 패턴에 맞는 키들 찾기
            keys_to_delete = []
            cursor = 0
            
            while True:
                cursor, keys = await self.redis.redis_client.scan(
                    cursor=cursor, 
                    match=f"{self.cache_prefix}:{pattern}*"
                )
                keys_to_delete.extend(keys)
                if cursor == 0:
                    break
            
            # 찾은 키들 삭제
            if keys_to_delete:
                deleted_count = await self.redis.redis_client.delete(*keys_to_delete)
                return deleted_count
            return 0
        except Exception as e:
            print(f"Cache invalidation error, continuing without cache: {e}")
            return 0
    
    # 키워드 빈도 분석 캐싱
    async def get_keyword_frequency_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        days: int = 7
    ) -> Optional[Dict[str, Any]]:
        """키워드 빈도 분석 캐시 조회"""
        cache_key = self._generate_cache_key(
            "keyword_frequency",
            user_id=user_id,
            keyword_ids=keyword_ids,
            days=days
        )
        return await self.get_cached_result(cache_key)
    
    async def set_keyword_frequency_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        days: int = 7,
        data: Dict[str, Any] = None,
        ttl: int = 1800  # 30분
    ) -> bool:
        """키워드 빈도 분석 결과 캐싱"""
        cache_key = self._generate_cache_key(
            "keyword_frequency",
            user_id=user_id,
            keyword_ids=keyword_ids,
            days=days
        )
        return await self.set_cached_result(cache_key, data, ttl)
    
    # 시간대별 트렌드 캐싱
    async def get_time_trends_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        days: int = 7,
        interval_hours: int = 6
    ) -> Optional[Dict[str, Any]]:
        """시간대별 트렌드 캐시 조회"""
        cache_key = self._generate_cache_key(
            "time_trends",
            user_id=user_id,
            keyword_ids=keyword_ids,
            days=days,
            interval_hours=interval_hours
        )
        return await self.get_cached_result(cache_key)
    
    async def set_time_trends_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        days: int = 7,
        interval_hours: int = 6,
        data: Dict[str, Any] = None,
        ttl: int = 1800  # 30분
    ) -> bool:
        """시간대별 트렌드 결과 캐싱"""
        cache_key = self._generate_cache_key(
            "time_trends",
            user_id=user_id,
            keyword_ids=keyword_ids,
            days=days,
            interval_hours=interval_hours
        )
        return await self.set_cached_result(cache_key, data, ttl)
    
    # 인기 포스트 캐싱
    async def get_popular_posts_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        days: int = 7,
        limit: int = 20,
        min_score: int = 10
    ) -> Optional[Dict[str, Any]]:
        """인기 포스트 캐시 조회"""
        cache_key = self._generate_cache_key(
            "popular_posts",
            user_id=user_id,
            keyword_ids=keyword_ids,
            days=days,
            limit=limit,
            min_score=min_score
        )
        return await self.get_cached_result(cache_key)
    
    async def set_popular_posts_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        days: int = 7,
        limit: int = 20,
        min_score: int = 10,
        data: Dict[str, Any] = None,
        ttl: int = 900  # 15분
    ) -> bool:
        """인기 포스트 결과 캐싱"""
        cache_key = self._generate_cache_key(
            "popular_posts",
            user_id=user_id,
            keyword_ids=keyword_ids,
            days=days,
            limit=limit,
            min_score=min_score
        )
        return await self.set_cached_result(cache_key, data, ttl)
    
    # 트렌딩 포스트 캐싱
    async def get_trending_posts_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        hours: int = 24,
        limit: int = 10
    ) -> Optional[Dict[str, Any]]:
        """트렌딩 포스트 캐시 조회"""
        cache_key = self._generate_cache_key(
            "trending_posts",
            user_id=user_id,
            keyword_ids=keyword_ids,
            hours=hours,
            limit=limit
        )
        return await self.get_cached_result(cache_key)
    
    async def set_trending_posts_cache(
        self, 
        user_id: int, 
        keyword_ids: Optional[List[int]] = None, 
        hours: int = 24,
        limit: int = 10,
        data: Dict[str, Any] = None,
        ttl: int = 300  # 5분 (트렌딩은 더 자주 업데이트)
    ) -> bool:
        """트렌딩 포스트 결과 캐싱"""
        cache_key = self._generate_cache_key(
            "trending_posts",
            user_id=user_id,
            keyword_ids=keyword_ids,
            hours=hours,
            limit=limit
        )
        return await self.set_cached_result(cache_key, data, ttl)
    
    # 키워드 통계 캐싱
    async def get_keyword_stats_cache(
        self, 
        keyword_id: int, 
        days: int = 30
    ) -> Optional[Dict[str, Any]]:
        """키워드 통계 캐시 조회"""
        cache_key = self._generate_cache_key(
            "keyword_stats",
            keyword_id=keyword_id,
            days=days
        )
        return await self.get_cached_result(cache_key)
    
    async def set_keyword_stats_cache(
        self, 
        keyword_id: int, 
        days: int = 30,
        data: Dict[str, Any] = None,
        ttl: int = 3600  # 1시간
    ) -> bool:
        """키워드 통계 결과 캐싱"""
        cache_key = self._generate_cache_key(
            "keyword_stats",
            keyword_id=keyword_id,
            days=days
        )
        return await self.set_cached_result(cache_key, data, ttl)
    
    # 사용자별 캐시 무효화
    async def invalidate_user_cache(self, user_id: int) -> int:
        """특정 사용자의 모든 캐시 무효화"""
        patterns = [
            f"keyword_frequency:*user_id*{user_id}*",
            f"time_trends:*user_id*{user_id}*",
            f"popular_posts:*user_id*{user_id}*",
            f"trending_posts:*user_id*{user_id}*"
        ]
        
        total_deleted = 0
        for pattern in patterns:
            deleted = await self.invalidate_cache(pattern)
            total_deleted += deleted
        
        return total_deleted
    
    # 키워드별 캐시 무효화
    async def invalidate_keyword_cache(self, keyword_id: int) -> int:
        """특정 키워드 관련 캐시 무효화"""
        pattern = f"keyword_stats:*keyword_id*{keyword_id}*"
        return await self.invalidate_cache(pattern)
    
    # 캐시 통계
    async def get_cache_stats(self) -> Dict[str, Any]:
        """캐시 통계 조회 with graceful degradation"""
        try:
            # Check if Redis is available
            if not self.redis.is_healthy():
                return {
                    "total_keys": 0,
                    "cache_types": {},
                    "redis_info": {
                        "status": "unavailable",
                        "used_memory": "N/A",
                        "connected_clients": 0,
                        "total_commands_processed": 0
                    }
                }
            
            info = await self.redis.info()
            
            # 캐시 키 개수 조회
            cursor = 0
            cache_keys = []
            
            while True:
                cursor, keys = await self.redis.redis_client.scan(
                    cursor=cursor, 
                    match=f"{self.cache_prefix}:*"
                )
                cache_keys.extend(keys)
                if cursor == 0:
                    break
            
            # 캐시 타입별 개수
            cache_types = {}
            for key in cache_keys:
                cache_type = key.split(':')[1] if ':' in key else 'unknown'
                cache_types[cache_type] = cache_types.get(cache_type, 0) + 1
            
            return {
                "total_keys": len(cache_keys),
                "cache_types": cache_types,
                "redis_info": {
                    "status": "connected",
                    "used_memory": info.get("used_memory_human", "N/A"),
                    "connected_clients": info.get("connected_clients", 0),
                    "total_commands_processed": info.get("total_commands_processed", 0)
                }
            }
        except Exception as e:
            print(f"Cache stats error, returning degraded stats: {e}")
            return {
                "error": str(e),
                "total_keys": 0,
                "cache_types": {},
                "redis_info": {"status": "error"}
            }


def cache_result(
    cache_service: CacheService,
    cache_method: str,
    ttl: Optional[int] = None
):
    """캐시 데코레이터"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 캐시 조회 시도
            cache_get_method = getattr(cache_service, f"get_{cache_method}_cache", None)
            if cache_get_method:
                cached_result = await cache_get_method(*args, **kwargs)
                if cached_result and cached_result.get("data"):
                    return cached_result["data"]
            
            # 캐시 미스 시 실제 함수 실행
            result = await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)
            
            # 결과를 캐시에 저장
            cache_set_method = getattr(cache_service, f"set_{cache_method}_cache", None)
            if cache_set_method and result:
                cache_kwargs = kwargs.copy()
                cache_kwargs['data'] = result
                if ttl:
                    cache_kwargs['ttl'] = ttl
                await cache_set_method(*args, **cache_kwargs)
            
            return result
        return wrapper
    return decorator