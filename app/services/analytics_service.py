from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from collections import defaultdict

from app.models.post import Post
from app.models.keyword import Keyword
from app.models.comment import Comment
from app.services.cache_service import CacheService
from app.utils.redis_client import get_redis_client


class AnalyticsService:
    """트렌드 분석 및 통계 서비스"""
    
    def __init__(self, db: Session, cache_service: Optional[CacheService] = None):
        self.db = db
        self.cache_service = cache_service
    
    async def analyze_keyword_frequency(
        self, 
        user_id: int,
        keyword_ids: Optional[List[int]] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """키워드별 언급 빈도 분석
        
        Args:
            user_id: 사용자 ID
            keyword_ids: 분석할 키워드 ID 목록 (None이면 모든 키워드)
            days: 분석 기간 (일)
            
        Returns:
            키워드별 언급 빈도 데이터
        """
        # 캐시 확인
        if self.cache_service:
            cached_result = await self.cache_service.get_keyword_frequency_cache(
                user_id=user_id,
                keyword_ids=keyword_ids,
                days=days
            )
            if cached_result and cached_result.get("data"):
                return cached_result["data"]
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 기본 쿼리 구성
        query = self.db.query(
            Keyword.id,
            Keyword.keyword,
            func.count(Post.id).label('post_count'),
            func.sum(Post.score).label('total_score'),
            func.sum(Post.num_comments).label('total_comments'),
            func.avg(Post.score).label('avg_score'),
            func.avg(Post.num_comments).label('avg_comments')
        ).join(
            Post, Keyword.id == Post.keyword_id
        ).filter(
            Keyword.user_id == user_id,
            Keyword.is_active == True,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date
        )
        
        # 특정 키워드만 분석하는 경우
        if keyword_ids:
            query = query.filter(Keyword.id.in_(keyword_ids))
        
        # 키워드별로 그룹화
        results = query.group_by(
            Keyword.id, Keyword.keyword
        ).order_by(
            desc('post_count')
        ).all()
        
        # 결과 포맷팅
        frequency_data = []
        for result in results:
            frequency_data.append({
                'keyword_id': result.id,
                'keyword': result.keyword,
                'post_count': result.post_count or 0,
                'total_score': result.total_score or 0,
                'total_comments': result.total_comments or 0,
                'avg_score': float(result.avg_score or 0),
                'avg_comments': float(result.avg_comments or 0),
                'engagement_rate': self._calculate_engagement_rate(
                    result.total_score or 0, 
                    result.total_comments or 0, 
                    result.post_count or 0
                )
            })
        
        result = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'keywords': frequency_data,
            'total_keywords': len(frequency_data),
            'total_posts': sum(item['post_count'] for item in frequency_data)
        }
        
        # 결과를 캐시에 저장
        if self.cache_service:
            await self.cache_service.set_keyword_frequency_cache(
                user_id=user_id,
                keyword_ids=keyword_ids,
                days=days,
                data=result
            )
        
        return result
    
    async def analyze_time_trends(
        self, 
        user_id: int,
        keyword_ids: Optional[List[int]] = None,
        days: int = 7,
        interval_hours: int = 6
    ) -> Dict[str, Any]:
        """시간대별 트렌드 변화 계산
        
        Args:
            user_id: 사용자 ID
            keyword_ids: 분석할 키워드 ID 목록
            days: 분석 기간 (일)
            interval_hours: 시간 간격 (시간)
            
        Returns:
            시간대별 트렌드 데이터
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 시간 간격별로 데이터 수집
        query = self.db.query(
            Keyword.id,
            Keyword.keyword,
            Post.created_utc,
            Post.score,
            Post.num_comments
        ).join(
            Post, Keyword.id == Post.keyword_id
        ).filter(
            Keyword.user_id == user_id,
            Keyword.is_active == True,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date
        )
        
        if keyword_ids:
            query = query.filter(Keyword.id.in_(keyword_ids))
        
        results = query.order_by(Post.created_utc).all()
        
        # 시간대별로 데이터 그룹화
        time_buckets = defaultdict(lambda: defaultdict(list))
        
        for result in results:
            # 시간을 interval_hours 단위로 버킷화
            bucket_time = self._get_time_bucket(result.created_utc, interval_hours)
            time_buckets[bucket_time][result.keyword].append({
                'score': result.score,
                'comments': result.num_comments
            })
        
        # 시간대별 트렌드 계산
        trend_data = []
        for bucket_time in sorted(time_buckets.keys()):
            bucket_data = {
                'timestamp': bucket_time.isoformat(),
                'keywords': {}
            }
            
            for keyword, posts in time_buckets[bucket_time].items():
                post_count = len(posts)
                total_score = sum(p['score'] for p in posts)
                total_comments = sum(p['comments'] for p in posts)
                
                bucket_data['keywords'][keyword] = {
                    'post_count': post_count,
                    'total_score': total_score,
                    'total_comments': total_comments,
                    'avg_score': total_score / post_count if post_count > 0 else 0,
                    'avg_comments': total_comments / post_count if post_count > 0 else 0
                }
            
            trend_data.append(bucket_data)
        
        # 트렌드 변화율 계산
        trend_analysis = self._calculate_trend_changes(trend_data)
        
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days,
                'interval_hours': interval_hours
            },
            'time_series': trend_data,
            'trend_analysis': trend_analysis
        }
    
    async def get_keyword_statistics(
        self, 
        keyword_id: int, 
        days: int = 30
    ) -> Dict[str, Any]:
        """특정 키워드의 상세 통계
        
        Args:
            keyword_id: 키워드 ID
            days: 분석 기간 (일)
            
        Returns:
            키워드 상세 통계
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 키워드 정보 조회
        keyword = self.db.query(Keyword).filter(Keyword.id == keyword_id).first()
        if not keyword:
            return {}
        
        # 기본 통계
        stats_query = self.db.query(
            func.count(Post.id).label('total_posts'),
            func.sum(Post.score).label('total_score'),
            func.sum(Post.num_comments).label('total_comments'),
            func.avg(Post.score).label('avg_score'),
            func.avg(Post.num_comments).label('avg_comments'),
            func.max(Post.score).label('max_score'),
            func.min(Post.score).label('min_score')
        ).filter(
            Post.keyword_id == keyword_id,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date
        ).first()
        
        # 서브레딧별 분포
        subreddit_stats = self.db.query(
            Post.subreddit,
            func.count(Post.id).label('post_count'),
            func.avg(Post.score).label('avg_score')
        ).filter(
            Post.keyword_id == keyword_id,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date
        ).group_by(
            Post.subreddit
        ).order_by(
            desc('post_count')
        ).limit(10).all()
        
        # 일별 포스트 수
        daily_posts = self.db.query(
            func.date(Post.created_utc).label('date'),
            func.count(Post.id).label('post_count'),
            func.avg(Post.score).label('avg_score')
        ).filter(
            Post.keyword_id == keyword_id,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date
        ).group_by(
            func.date(Post.created_utc)
        ).order_by('date').all()
        
        return {
            'keyword': {
                'id': keyword.id,
                'keyword': keyword.keyword,
                'description': keyword.description
            },
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'overall_stats': {
                'total_posts': stats_query.total_posts or 0,
                'total_score': stats_query.total_score or 0,
                'total_comments': stats_query.total_comments or 0,
                'avg_score': float(stats_query.avg_score or 0),
                'avg_comments': float(stats_query.avg_comments or 0),
                'max_score': stats_query.max_score or 0,
                'min_score': stats_query.min_score or 0
            },
            'subreddit_distribution': [
                {
                    'subreddit': item.subreddit,
                    'post_count': item.post_count,
                    'avg_score': float(item.avg_score or 0)
                }
                for item in subreddit_stats
            ],
            'daily_trends': [
                {
                    'date': str(item.date) if item.date else None,
                    'post_count': item.post_count,
                    'avg_score': float(item.avg_score or 0)
                }
                for item in daily_posts
            ]
        }
    
    def _calculate_engagement_rate(
        self, 
        total_score: int, 
        total_comments: int, 
        post_count: int
    ) -> float:
        """참여도 계산"""
        if post_count == 0:
            return 0.0
        
        # 점수와 댓글 수를 가중평균하여 참여도 계산
        score_weight = 0.7
        comment_weight = 0.3
        
        avg_score = total_score / post_count
        avg_comments = total_comments / post_count
        
        # 정규화 (0-100 범위)
        normalized_score = min(avg_score / 100, 1.0) * 100
        normalized_comments = min(avg_comments / 50, 1.0) * 100
        
        engagement_rate = (
            normalized_score * score_weight + 
            normalized_comments * comment_weight
        )
        
        return round(engagement_rate, 2)
    
    def _get_time_bucket(self, timestamp: datetime, interval_hours: int) -> datetime:
        """시간을 지정된 간격으로 버킷화"""
        hour = (timestamp.hour // interval_hours) * interval_hours
        return timestamp.replace(hour=hour, minute=0, second=0, microsecond=0)
    
    def _calculate_trend_changes(self, trend_data: List[Dict]) -> Dict[str, Any]:
        """트렌드 변화율 계산"""
        if len(trend_data) < 2:
            return {'trend_direction': 'insufficient_data'}
        
        # 각 키워드별 트렌드 변화 계산
        keyword_trends = defaultdict(list)
        
        for bucket in trend_data:
            for keyword, stats in bucket['keywords'].items():
                keyword_trends[keyword].append(stats['post_count'])
        
        trend_analysis = {}
        for keyword, counts in keyword_trends.items():
            if len(counts) >= 2:
                # 선형 회귀를 통한 트렌드 방향 계산
                trend_direction = self._calculate_linear_trend(counts)
                trend_analysis[keyword] = {
                    'trend_direction': trend_direction,
                    'data_points': len(counts),
                    'latest_count': counts[-1],
                    'change_from_start': counts[-1] - counts[0] if counts else 0
                }
        
        return trend_analysis
    
    def _calculate_linear_trend(self, values: List[int]) -> str:
        """선형 트렌드 방향 계산"""
        if len(values) < 2:
            return 'stable'
        
        n = len(values)
        x_values = list(range(n))
        
        # 선형 회귀 계수 계산
        x_mean = sum(x_values) / n
        y_mean = sum(values) / n
        
        numerator = sum((x_values[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return 'stable'
        
        slope = numerator / denominator
        
        # 트렌드 방향 결정
        if slope > 0.5:
            return 'increasing'
        elif slope < -0.5:
            return 'decreasing'
        else:
            return 'stable'
    
    async def analyze_popular_posts(
        self,
        user_id: int,
        keyword_ids: Optional[List[int]] = None,
        days: int = 7,
        limit: int = 20,
        min_score: int = 10
    ) -> Dict[str, Any]:
        """인기 포스트 분석
        
        Args:
            user_id: 사용자 ID
            keyword_ids: 분석할 키워드 ID 목록
            days: 분석 기간 (일)
            limit: 반환할 포스트 수
            min_score: 최소 점수 기준
            
        Returns:
            인기 포스트 분석 결과
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 기본 쿼리 구성
        query = self.db.query(
            Post.id,
            Post.reddit_id,
            Post.title,
            Post.content,
            Post.author,
            Post.subreddit,
            Post.url,
            Post.score,
            Post.num_comments,
            Post.created_utc,
            Keyword.keyword
        ).join(
            Keyword, Post.keyword_id == Keyword.id
        ).filter(
            Keyword.user_id == user_id,
            Keyword.is_active == True,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date,
            Post.score >= min_score
        )
        
        # 특정 키워드만 분석하는 경우
        if keyword_ids:
            query = query.filter(Keyword.id.in_(keyword_ids))
        
        # 인기도 점수 계산 및 정렬
        posts = query.all()
        
        # 인기도 점수 계산
        popular_posts = []
        for post in posts:
            popularity_score = self._calculate_popularity_score(
                post.score, 
                post.num_comments, 
                post.created_utc
            )
            
            popular_posts.append({
                'id': post.id,
                'reddit_id': post.reddit_id,
                'title': post.title,
                'content': post.content[:500] + '...' if post.content and len(post.content) > 500 else post.content,
                'author': post.author,
                'subreddit': post.subreddit,
                'url': post.url,
                'score': post.score,
                'num_comments': post.num_comments,
                'created_utc': post.created_utc.isoformat() if post.created_utc else None,
                'keyword': post.keyword,
                'popularity_score': popularity_score,
                'engagement_ratio': self._calculate_engagement_ratio(post.score, post.num_comments)
            })
        
        # 인기도 점수로 정렬
        popular_posts.sort(key=lambda x: x['popularity_score'], reverse=True)
        
        # 상위 N개 선택
        top_posts = popular_posts[:limit]
        
        # 통계 계산
        stats = self._calculate_popular_posts_stats(popular_posts)
        
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'criteria': {
                'min_score': min_score,
                'limit': limit
            },
            'posts': top_posts,
            'statistics': stats
        }
    
    async def get_trending_posts(
        self,
        user_id: int,
        keyword_ids: Optional[List[int]] = None,
        hours: int = 24,
        limit: int = 10
    ) -> Dict[str, Any]:
        """트렌딩 포스트 선별 (최근 시간 내 급상승 포스트)
        
        Args:
            user_id: 사용자 ID
            keyword_ids: 분석할 키워드 ID 목록
            hours: 분석 시간 (시간)
            limit: 반환할 포스트 수
            
        Returns:
            트렌딩 포스트 목록
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=hours)
        
        # 최근 포스트 조회
        query = self.db.query(
            Post.id,
            Post.reddit_id,
            Post.title,
            Post.author,
            Post.subreddit,
            Post.url,
            Post.score,
            Post.num_comments,
            Post.created_utc,
            Keyword.keyword
        ).join(
            Keyword, Post.keyword_id == Keyword.id
        ).filter(
            Keyword.user_id == user_id,
            Keyword.is_active == True,
            Post.created_utc >= start_date,
            Post.created_utc <= end_date
        )
        
        if keyword_ids:
            query = query.filter(Keyword.id.in_(keyword_ids))
        
        posts = query.all()
        
        # 트렌딩 점수 계산
        trending_posts = []
        for post in posts:
            trending_score = self._calculate_trending_score(
                post.score,
                post.num_comments,
                post.created_utc,
                hours
            )
            
            trending_posts.append({
                'id': post.id,
                'reddit_id': post.reddit_id,
                'title': post.title,
                'author': post.author,
                'subreddit': post.subreddit,
                'url': post.url,
                'score': post.score,
                'num_comments': post.num_comments,
                'created_utc': post.created_utc.isoformat() if post.created_utc else None,
                'keyword': post.keyword,
                'trending_score': trending_score,
                'age_hours': self._calculate_age_hours(post.created_utc)
            })
        
        # 트렌딩 점수로 정렬
        trending_posts.sort(key=lambda x: x['trending_score'], reverse=True)
        
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'hours': hours
            },
            'posts': trending_posts[:limit],
            'total_analyzed': len(trending_posts)
        }
    
    def _calculate_popularity_score(
        self, 
        score: int, 
        num_comments: int, 
        created_utc: datetime
    ) -> float:
        """인기도 점수 계산
        
        점수와 댓글 수를 기반으로 하되, 시간 가중치를 적용
        """
        if not created_utc:
            return 0.0
        
        # 기본 점수 (업보트 수 + 댓글 수 * 가중치)
        base_score = score + (num_comments * 2)  # 댓글에 더 높은 가중치
        
        # 시간 가중치 (최근 포스트일수록 높은 점수)
        age_hours = self._calculate_age_hours(created_utc)
        time_weight = max(0.1, 1 - (age_hours / (24 * 7)))  # 1주일 기준으로 감소
        
        popularity_score = base_score * time_weight
        
        return round(popularity_score, 2)
    
    def _calculate_trending_score(
        self,
        score: int,
        num_comments: int,
        created_utc: datetime,
        analysis_hours: int
    ) -> float:
        """트렌딩 점수 계산
        
        최근 시간 내 급상승을 측정하는 점수
        """
        if not created_utc:
            return 0.0
        
        age_hours = self._calculate_age_hours(created_utc)
        
        # 너무 오래된 포스트는 트렌딩에서 제외
        if age_hours > analysis_hours:
            return 0.0
        
        # 시간당 점수 계산
        hourly_score = (score + num_comments) / max(age_hours, 0.5)  # 최소 0.5시간으로 나누기
        
        # 최신성 보너스 (더 최근일수록 높은 점수)
        recency_bonus = (analysis_hours - age_hours) / analysis_hours
        
        trending_score = hourly_score * (1 + recency_bonus)
        
        return round(trending_score, 2)
    
    def _calculate_engagement_ratio(self, score: int, num_comments: int) -> float:
        """참여도 비율 계산 (댓글 수 / 점수)"""
        if score == 0:
            return 0.0
        return round(num_comments / score, 3)
    
    def _calculate_age_hours(self, created_utc: datetime) -> float:
        """포스트 생성 후 경과 시간 (시간 단위)"""
        if not created_utc:
            return 0.0
        
        now = datetime.utcnow()
        age_delta = now - created_utc
        return age_delta.total_seconds() / 3600
    
    def _calculate_popular_posts_stats(self, posts: List[Dict]) -> Dict[str, Any]:
        """인기 포스트 통계 계산"""
        if not posts:
            return {
                'total_posts': 0,
                'avg_score': 0,
                'avg_comments': 0,
                'avg_popularity_score': 0
            }
        
        total_posts = len(posts)
        total_score = sum(p['score'] for p in posts)
        total_comments = sum(p['num_comments'] for p in posts)
        total_popularity = sum(p['popularity_score'] for p in posts)
        
        # 서브레딧별 분포
        subreddit_counts = defaultdict(int)
        for post in posts:
            subreddit_counts[post['subreddit']] += 1
        
        top_subreddits = sorted(
            subreddit_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        return {
            'total_posts': total_posts,
            'avg_score': round(total_score / total_posts, 2),
            'avg_comments': round(total_comments / total_posts, 2),
            'avg_popularity_score': round(total_popularity / total_posts, 2),
            'score_range': {
                'min': min(p['score'] for p in posts),
                'max': max(p['score'] for p in posts)
            },
            'top_subreddits': [
                {'subreddit': subreddit, 'count': count}
                for subreddit, count in top_subreddits
            ]
        }