import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.services.analytics_service import AnalyticsService
from app.models.user import User
from app.models.keyword import Keyword
from app.models.post import Post


class TestAnalyticsService:
    """Analytics Service 테스트"""
    
    @pytest.fixture
    def analytics_service(self, db_session: Session):
        return AnalyticsService(db_session)
    
    @pytest.fixture
    def sample_user(self, db_session: Session):
        user = User(
            reddit_id="test_user_123",
            username="testuser",
            email="test@example.com"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def sample_keywords(self, db_session: Session, sample_user: User):
        keywords = [
            Keyword(user_id=sample_user.id, keyword="python", description="Python programming"),
            Keyword(user_id=sample_user.id, keyword="fastapi", description="FastAPI framework"),
            Keyword(user_id=sample_user.id, keyword="machine learning", description="ML topics")
        ]
        for keyword in keywords:
            db_session.add(keyword)
        db_session.commit()
        for keyword in keywords:
            db_session.refresh(keyword)
        return keywords
    
    @pytest.fixture
    def sample_posts(self, db_session: Session, sample_keywords):
        posts = []
        base_time = datetime.utcnow() - timedelta(days=5)
        
        # Python 키워드 포스트들
        for i in range(10):
            post = Post(
                keyword_id=sample_keywords[0].id,
                reddit_id=f"python_post_{i}",
                title=f"Python Tutorial {i}",
                content=f"Content about Python {i}",
                author=f"author_{i}",
                subreddit="Python",
                score=10 + i * 5,
                num_comments=5 + i * 2,
                created_utc=base_time + timedelta(hours=i * 6)
            )
            posts.append(post)
            db_session.add(post)
        
        # FastAPI 키워드 포스트들
        for i in range(5):
            post = Post(
                keyword_id=sample_keywords[1].id,
                reddit_id=f"fastapi_post_{i}",
                title=f"FastAPI Guide {i}",
                content=f"Content about FastAPI {i}",
                author=f"fastapi_author_{i}",
                subreddit="FastAPI",
                score=20 + i * 3,
                num_comments=8 + i,
                created_utc=base_time + timedelta(hours=i * 12)
            )
            posts.append(post)
            db_session.add(post)
        
        db_session.commit()
        return posts
    
    def test_analyze_keyword_frequency(self, analytics_service, sample_user, sample_posts):
        """키워드 빈도 분석 테스트"""
        result = analytics_service.analyze_keyword_frequency(
            user_id=sample_user.id,
            days=7
        )
        
        assert "period" in result
        assert "keywords" in result
        assert "total_keywords" in result
        assert "total_posts" in result
        
        # 기간 정보 확인
        assert result["period"]["days"] == 7
        
        # 키워드 데이터 확인
        keywords = result["keywords"]
        assert len(keywords) == 2  # python, fastapi (machine learning은 포스트 없음)
        
        # Python 키워드가 더 많은 포스트를 가져야 함
        python_keyword = next(k for k in keywords if k["keyword"] == "python")
        fastapi_keyword = next(k for k in keywords if k["keyword"] == "fastapi")
        
        assert python_keyword["post_count"] == 10
        assert fastapi_keyword["post_count"] == 5
        assert python_keyword["post_count"] > fastapi_keyword["post_count"]
        
        # 통계 값들이 올바르게 계산되었는지 확인
        assert python_keyword["total_score"] > 0
        assert python_keyword["avg_score"] > 0
        assert python_keyword["engagement_rate"] >= 0
    
    def test_analyze_keyword_frequency_with_specific_keywords(
        self, analytics_service, sample_user, sample_keywords, sample_posts
    ):
        """특정 키워드만 분석하는 테스트"""
        # Python 키워드만 분석
        result = analytics_service.analyze_keyword_frequency(
            user_id=sample_user.id,
            keyword_ids=[sample_keywords[0].id],  # Python 키워드만
            days=7
        )
        
        keywords = result["keywords"]
        assert len(keywords) == 1
        assert keywords[0]["keyword"] == "python"
        assert keywords[0]["post_count"] == 10
    
    def test_analyze_time_trends(self, analytics_service, sample_user, sample_posts):
        """시간대별 트렌드 분석 테스트"""
        result = analytics_service.analyze_time_trends(
            user_id=sample_user.id,
            days=7,
            interval_hours=12
        )
        
        assert "period" in result
        assert "time_series" in result
        assert "trend_analysis" in result
        
        # 기간 정보 확인
        period = result["period"]
        assert period["days"] == 7
        assert period["interval_hours"] == 12
        
        # 시계열 데이터 확인
        time_series = result["time_series"]
        assert len(time_series) > 0
        
        # 각 시간 버킷에 키워드 데이터가 있는지 확인
        for bucket in time_series:
            assert "timestamp" in bucket
            assert "keywords" in bucket
            
            if bucket["keywords"]:
                for keyword, stats in bucket["keywords"].items():
                    assert "post_count" in stats
                    assert "total_score" in stats
                    assert "avg_score" in stats
        
        # 트렌드 분석 결과 확인
        trend_analysis = result["trend_analysis"]
        if trend_analysis:
            for keyword, analysis in trend_analysis.items():
                assert "trend_direction" in analysis
                assert analysis["trend_direction"] in ["increasing", "decreasing", "stable"]
                assert "data_points" in analysis
                assert "latest_count" in analysis
    
    def test_get_keyword_statistics(self, analytics_service, sample_keywords, sample_posts):
        """키워드 상세 통계 테스트"""
        python_keyword_id = sample_keywords[0].id
        
        result = analytics_service.get_keyword_statistics(
            keyword_id=python_keyword_id,
            days=30
        )
        
        assert "keyword" in result
        assert "period" in result
        assert "overall_stats" in result
        assert "subreddit_distribution" in result
        assert "daily_trends" in result
        
        # 키워드 정보 확인
        keyword_info = result["keyword"]
        assert keyword_info["id"] == python_keyword_id
        assert keyword_info["keyword"] == "python"
        
        # 전체 통계 확인
        overall_stats = result["overall_stats"]
        assert overall_stats["total_posts"] == 10
        assert overall_stats["total_score"] > 0
        assert overall_stats["avg_score"] > 0
        
        # 서브레딧 분포 확인
        subreddit_dist = result["subreddit_distribution"]
        assert len(subreddit_dist) > 0
        assert subreddit_dist[0]["subreddit"] == "Python"
        assert subreddit_dist[0]["post_count"] == 10
        
        # 일별 트렌드 확인
        daily_trends = result["daily_trends"]
        assert len(daily_trends) > 0
    
    def test_get_keyword_statistics_nonexistent(self, analytics_service):
        """존재하지 않는 키워드 통계 조회 테스트"""
        result = analytics_service.get_keyword_statistics(
            keyword_id=99999,
            days=30
        )
        
        assert result == {}
    
    def test_calculate_engagement_rate(self, analytics_service):
        """참여도 계산 테스트"""
        # 정상적인 경우
        engagement_rate = analytics_service._calculate_engagement_rate(
            total_score=500,
            total_comments=100,
            post_count=10
        )
        assert 0 <= engagement_rate <= 100
        
        # 포스트가 없는 경우
        engagement_rate = analytics_service._calculate_engagement_rate(
            total_score=0,
            total_comments=0,
            post_count=0
        )
        assert engagement_rate == 0.0
    
    def test_get_time_bucket(self, analytics_service):
        """시간 버킷화 테스트"""
        test_time = datetime(2024, 1, 1, 14, 30, 45)
        
        # 6시간 간격
        bucket = analytics_service._get_time_bucket(test_time, 6)
        expected = datetime(2024, 1, 1, 12, 0, 0)
        assert bucket == expected
        
        # 12시간 간격
        bucket = analytics_service._get_time_bucket(test_time, 12)
        expected = datetime(2024, 1, 1, 12, 0, 0)
        assert bucket == expected
        
        # 24시간 간격
        bucket = analytics_service._get_time_bucket(test_time, 24)
        expected = datetime(2024, 1, 1, 0, 0, 0)
        assert bucket == expected
    
    def test_calculate_linear_trend(self, analytics_service):
        """선형 트렌드 계산 테스트"""
        # 증가 트렌드
        increasing_values = [1, 3, 5, 7, 9]
        trend = analytics_service._calculate_linear_trend(increasing_values)
        assert trend == "increasing"
        
        # 감소 트렌드
        decreasing_values = [10, 8, 6, 4, 2]
        trend = analytics_service._calculate_linear_trend(decreasing_values)
        assert trend == "decreasing"
        
        # 안정 트렌드
        stable_values = [5, 5, 5, 5, 5]
        trend = analytics_service._calculate_linear_trend(stable_values)
        assert trend == "stable"
        
        # 데이터 부족
        insufficient_data = [5]
        trend = analytics_service._calculate_linear_trend(insufficient_data)
        assert trend == "stable"
    
    def test_analyze_popular_posts(self, analytics_service, sample_user, sample_posts):
        """인기 포스트 분석 테스트"""
        result = analytics_service.analyze_popular_posts(
            user_id=sample_user.id,
            days=7,
            limit=10,
            min_score=5
        )
        
        assert "period" in result
        assert "criteria" in result
        assert "posts" in result
        assert "statistics" in result
        
        # 기준 확인
        criteria = result["criteria"]
        assert criteria["min_score"] == 5
        assert criteria["limit"] == 10
        
        # 포스트 데이터 확인
        posts = result["posts"]
        assert len(posts) > 0
        
        # 첫 번째 포스트가 가장 높은 인기도 점수를 가져야 함
        if len(posts) > 1:
            assert posts[0]["popularity_score"] >= posts[1]["popularity_score"]
        
        # 각 포스트가 필요한 필드를 가지는지 확인
        for post in posts:
            assert "id" in post
            assert "title" in post
            assert "score" in post
            assert "num_comments" in post
            assert "popularity_score" in post
            assert "engagement_ratio" in post
            assert post["score"] >= 5  # min_score 기준 확인
        
        # 통계 확인
        stats = result["statistics"]
        assert "total_posts" in stats
        assert "avg_score" in stats
        assert "avg_popularity_score" in stats
        assert stats["total_posts"] > 0
    
    def test_analyze_popular_posts_with_specific_keywords(
        self, analytics_service, sample_user, sample_keywords, sample_posts
    ):
        """특정 키워드만 인기 포스트 분석"""
        # Python 키워드만 분석
        result = analytics_service.analyze_popular_posts(
            user_id=sample_user.id,
            keyword_ids=[sample_keywords[0].id],  # Python 키워드만
            days=7,
            limit=10,
            min_score=5
        )
        
        posts = result["posts"]
        # 모든 포스트가 Python 키워드여야 함
        for post in posts:
            assert post["keyword"] == "python"
    
    def test_get_trending_posts(self, analytics_service, sample_user, sample_posts):
        """트렌딩 포스트 조회 테스트"""
        result = analytics_service.get_trending_posts(
            user_id=sample_user.id,
            hours=48,  # 48시간 내
            limit=5
        )
        
        assert "period" in result
        assert "posts" in result
        assert "total_analyzed" in result
        
        # 기간 정보 확인
        period = result["period"]
        assert period["hours"] == 48
        
        # 포스트 데이터 확인
        posts = result["posts"]
        assert len(posts) <= 5  # limit 확인
        
        # 트렌딩 점수로 정렬되어 있는지 확인
        if len(posts) > 1:
            assert posts[0]["trending_score"] >= posts[1]["trending_score"]
        
        # 각 포스트가 필요한 필드를 가지는지 확인
        for post in posts:
            assert "trending_score" in post
            assert "age_hours" in post
            assert post["age_hours"] <= 48  # 시간 범위 확인
    
    def test_calculate_popularity_score(self, analytics_service):
        """인기도 점수 계산 테스트"""
        test_time = datetime.utcnow() - timedelta(hours=12)  # 12시간 전
        
        popularity_score = analytics_service._calculate_popularity_score(
            score=100,
            num_comments=20,
            created_utc=test_time
        )
        
        assert popularity_score > 0
        assert isinstance(popularity_score, float)
        
        # 더 최근 포스트가 더 높은 점수를 가져야 함
        recent_time = datetime.utcnow() - timedelta(hours=1)
        recent_score = analytics_service._calculate_popularity_score(
            score=100,
            num_comments=20,
            created_utc=recent_time
        )
        
        assert recent_score > popularity_score
    
    def test_calculate_trending_score(self, analytics_service):
        """트렌딩 점수 계산 테스트"""
        test_time = datetime.utcnow() - timedelta(hours=2)  # 2시간 전
        
        trending_score = analytics_service._calculate_trending_score(
            score=50,
            num_comments=10,
            created_utc=test_time,
            analysis_hours=24
        )
        
        assert trending_score > 0
        assert isinstance(trending_score, float)
        
        # 더 최근 포스트가 더 높은 트렌딩 점수를 가져야 함
        very_recent_time = datetime.utcnow() - timedelta(minutes=30)
        recent_trending_score = analytics_service._calculate_trending_score(
            score=50,
            num_comments=10,
            created_utc=very_recent_time,
            analysis_hours=24
        )
        
        assert recent_trending_score > trending_score
    
    def test_calculate_engagement_ratio(self, analytics_service):
        """참여도 비율 계산 테스트"""
        # 정상적인 경우
        ratio = analytics_service._calculate_engagement_ratio(score=100, num_comments=25)
        assert ratio == 0.25
        
        # 점수가 0인 경우
        ratio = analytics_service._calculate_engagement_ratio(score=0, num_comments=10)
        assert ratio == 0.0
    
    def test_calculate_age_hours(self, analytics_service):
        """포스트 나이 계산 테스트"""
        # 2시간 전 포스트
        test_time = datetime.utcnow() - timedelta(hours=2)
        age_hours = analytics_service._calculate_age_hours(test_time)
        
        assert 1.9 <= age_hours <= 2.1  # 약간의 오차 허용
        
        # None인 경우
        age_hours = analytics_service._calculate_age_hours(None)
        assert age_hours == 0.0