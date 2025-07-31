from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PeriodInfo(BaseModel):
    """분석 기간 정보"""
    start_date: str
    end_date: str
    days: int


class KeywordFrequencyItem(BaseModel):
    """키워드 빈도 분석 항목"""
    keyword_id: int
    keyword: str
    post_count: int
    total_score: int
    total_comments: int
    avg_score: float
    avg_comments: float
    engagement_rate: float


class KeywordFrequencyResponse(BaseModel):
    """키워드 빈도 분석 응답"""
    period: PeriodInfo
    keywords: List[KeywordFrequencyItem]
    total_keywords: int
    total_posts: int


class TimelinePeriodInfo(PeriodInfo):
    """시간대별 분석 기간 정보"""
    interval_hours: int


class KeywordTimeStats(BaseModel):
    """시간대별 키워드 통계"""
    post_count: int
    total_score: int
    total_comments: int
    avg_score: float
    avg_comments: float


class TimelineDataPoint(BaseModel):
    """시간대별 데이터 포인트"""
    timestamp: str
    keywords: Dict[str, KeywordTimeStats]


class TrendAnalysisItem(BaseModel):
    """트렌드 분석 항목"""
    trend_direction: str = Field(..., description="increasing, decreasing, stable")
    data_points: int
    latest_count: int
    change_from_start: int


class TimeTrendsResponse(BaseModel):
    """시간대별 트렌드 분석 응답"""
    period: TimelinePeriodInfo
    time_series: List[TimelineDataPoint]
    trend_analysis: Dict[str, TrendAnalysisItem]


class KeywordInfo(BaseModel):
    """키워드 정보"""
    id: int
    keyword: str
    description: Optional[str]


class OverallStats(BaseModel):
    """전체 통계"""
    total_posts: int
    total_score: int
    total_comments: int
    avg_score: float
    avg_comments: float
    max_score: int
    min_score: int


class SubredditDistribution(BaseModel):
    """서브레딧 분포"""
    subreddit: str
    post_count: int
    avg_score: float


class DailyTrend(BaseModel):
    """일별 트렌드"""
    date: Optional[str]
    post_count: int
    avg_score: float


class KeywordStatsResponse(BaseModel):
    """키워드 상세 통계 응답"""
    keyword: KeywordInfo
    period: PeriodInfo
    overall_stats: OverallStats
    subreddit_distribution: List[SubredditDistribution]
    daily_trends: List[DailyTrend]


class DashboardSummary(BaseModel):
    """대시보드 요약"""
    total_keywords: int
    total_posts: int
    most_active_keyword: Optional[str]
    top_post_score: int


class PopularPost(BaseModel):
    """인기 포스트 항목"""
    id: int
    reddit_id: str
    title: str
    content: Optional[str]
    author: str
    subreddit: str
    url: str
    score: int
    num_comments: int
    created_utc: Optional[str]
    keyword: str
    popularity_score: float
    engagement_ratio: float


class PopularPostsStats(BaseModel):
    """인기 포스트 통계"""
    total_posts: int
    avg_score: float
    avg_comments: float
    avg_popularity_score: float
    score_range: Dict[str, int]
    top_subreddits: List[Dict[str, Any]]


class PopularPostsCriteria(BaseModel):
    """인기 포스트 분석 기준"""
    min_score: int
    limit: int


class PopularPostsResponse(BaseModel):
    """인기 포스트 분석 응답"""
    period: PeriodInfo
    criteria: PopularPostsCriteria
    posts: List[PopularPost]
    statistics: PopularPostsStats


class TrendingPost(BaseModel):
    """트렌딩 포스트 항목"""
    id: int
    reddit_id: str
    title: str
    author: str
    subreddit: str
    url: str
    score: int
    num_comments: int
    created_utc: Optional[str]
    keyword: str
    trending_score: float
    age_hours: float


class TrendingPeriodInfo(BaseModel):
    """트렌딩 분석 기간 정보"""
    start_date: str
    end_date: str
    hours: int


class TrendingPostsResponse(BaseModel):
    """트렌딩 포스트 응답"""
    period: TrendingPeriodInfo
    posts: List[TrendingPost]
    total_analyzed: int


class DashboardResponse(BaseModel):
    """대시보드 응답"""
    period: Dict[str, int]
    keyword_frequency: KeywordFrequencyResponse
    time_trends: TimeTrendsResponse
    popular_posts: PopularPostsResponse
    summary: DashboardSummary


# ============================================================================
# Export and Reporting Schemas
# ============================================================================

class ExportFilters(BaseModel):
    """Export filters"""
    dateRange: Optional[Dict[str, datetime]] = None
    keywords: Optional[List[str]] = None
    subreddits: Optional[List[str]] = None
    sentiment: Optional[str] = None
    analysisTypes: Optional[List[str]] = None
    minConfidence: Optional[float] = None


class ExportOptions(BaseModel):
    """Export options"""
    includeAnalysis: Optional[bool] = True
    includeImages: Optional[bool] = False
    includeMetadata: Optional[bool] = True
    maxRecords: Optional[int] = 10000
    compression: Optional[bool] = False


class ExportScheduling(BaseModel):
    """Export scheduling options"""
    recurring: bool = False
    frequency: Optional[str] = None  # 'daily', 'weekly', 'monthly'
    nextExecution: Optional[datetime] = None


class ExportRequest(BaseModel):
    """Export request schema"""
    dataType: str = Field(..., description="Type of data to export: posts, analysis, images, reports, metrics")
    format: str = Field(..., description="Export format: excel, csv, json, pdf, xml")
    filters: Optional[ExportFilters] = None
    options: Optional[ExportOptions] = None
    scheduling: Optional[ExportScheduling] = None


class ExportMetadata(BaseModel):
    """Export file metadata"""
    format: str
    compression: bool
    checksum: str


class ExportResult(BaseModel):
    """Export result schema"""
    id: str
    requestId: str
    status: str = Field(..., description="queued, processing, completed, failed")
    progress: Optional[int] = Field(0, ge=0, le=100)
    downloadUrl: Optional[str] = None
    fileSize: Optional[int] = None
    recordCount: Optional[int] = None
    processingTime: Optional[float] = None
    pointsConsumed: int = 0
    expiresAt: datetime
    error: Optional[str] = None
    metadata: Optional[ExportMetadata] = None


class ExportTemplate(BaseModel):
    """Export template schema"""
    id: str
    name: str
    description: str
    format: str
    dataType: str
    defaultOptions: ExportOptions


class ExportField(BaseModel):
    """Available export field"""
    field: str
    label: str
    type: str = Field(..., description="string, number, date, boolean")
    description: Optional[str] = None


class ExportValidation(BaseModel):
    """Export request validation result"""
    valid: bool
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    estimatedSize: Optional[int] = None
    estimatedTime: Optional[float] = None
    pointsCost: Optional[int] = None
    estimatedRecords: Optional[int] = None


class ExportStats(BaseModel):
    """Export statistics"""
    totalExports: int
    successRate: float
    averageSize: float
    averageTime: float
    popularFormats: List[Dict[str, Any]]
    recentActivity: List[Dict[str, Any]]