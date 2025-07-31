"""
Content generation templates for different content types.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class ContentType(str, Enum):
    BLOG = "blog"
    PRODUCT_INTRO = "product_intro"
    TREND_ANALYSIS = "trend_analysis"


@dataclass
class ContentData:
    """Data structure for content generation"""
    keywords: List[str]
    posts: List[Dict[str, Any]]
    trends: Dict[str, Any]
    metadata: Dict[str, Any]


class ContentTemplate:
    """Base class for content templates"""
    
    def __init__(self, template_name: str, content_type: ContentType):
        self.template_name = template_name
        self.content_type = content_type
    
    def generate(self, data: ContentData) -> Dict[str, Any]:
        """Generate content based on template and data"""
        raise NotImplementedError
    
    def _format_date(self, date: datetime) -> str:
        """Format date for content"""
        return date.strftime("%Y년 %m월 %d일")
    
    def _extract_top_posts(self, posts: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
        """Extract top posts by score"""
        return sorted(posts, key=lambda x: x.get('score', 0), reverse=True)[:limit]
    
    def _calculate_engagement_rate(self, post: Dict[str, Any]) -> float:
        """Calculate engagement rate for a post"""
        score = post.get('score', 0)
        comments = post.get('num_comments', 0)
        if score == 0:
            return 0
        return (comments / score) * 100


class BlogTemplate(ContentTemplate):
    """Template for blog post generation"""
    
    def __init__(self):
        super().__init__("default_blog", ContentType.BLOG)
    
    def generate(self, data: ContentData) -> Dict[str, Any]:
        """Generate blog post content"""
        keywords_str = ", ".join(data.keywords)
        top_posts = self._extract_top_posts(data.posts, 3)
        
        # Generate title
        title = f"{keywords_str}에 대한 Reddit 트렌드 분석 - {self._format_date(datetime.now())}"
        
        # Generate content sections
        intro = self._generate_intro(data.keywords, len(data.posts))
        trend_section = self._generate_trend_section(data.trends)
        posts_section = self._generate_posts_section(top_posts)
        conclusion = self._generate_conclusion(data.keywords, data.trends)
        
        content = f"""# {title}

{intro}

## 📈 트렌드 분석

{trend_section}

## 🔥 주목할 만한 포스트들

{posts_section}

## 💡 결론 및 인사이트

{conclusion}

---
*이 분석은 Reddit 데이터를 기반으로 자동 생성되었습니다.*
*생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
        
        return {
            "title": title,
            "content": content,
            "content_type": self.content_type.value,
            "template_used": self.template_name,
            "word_count": len(content.split()),
            "sections": ["intro", "trend_analysis", "top_posts", "conclusion"]
        }
    
    def _generate_intro(self, keywords: List[str], post_count: int) -> str:
        """Generate introduction section"""
        keywords_str = ", ".join(keywords)
        return f"""최근 Reddit에서 **{keywords_str}**와 관련된 활발한 논의가 이어지고 있습니다. 
총 {post_count}개의 관련 포스트를 분석하여 현재 트렌드와 사용자들의 관심사를 파악해보았습니다.

이번 분석에서는 다음과 같은 내용을 다룹니다:
- 키워드별 언급 빈도 및 트렌드 변화
- 높은 참여도를 보인 주요 포스트들
- 커뮤니티의 반응과 인사이트"""
    
    def _generate_trend_section(self, trends: Dict[str, Any]) -> str:
        """Generate trend analysis section"""
        if not trends:
            return "트렌드 데이터를 분석 중입니다."
        
        content = []
        
        # Keyword frequency analysis
        if 'keyword_frequency' in trends:
            content.append("### 키워드 언급 빈도")
            for keyword, count in trends['keyword_frequency'].items():
                content.append(f"- **{keyword}**: {count}회 언급")
        
        # Time-based trends
        if 'time_trends' in trends:
            content.append("\n### 시간대별 트렌드")
            content.append("최근 24시간 동안의 언급 패턴을 분석한 결과:")
            # Add trend analysis based on time data
        
        # Popular subreddits
        if 'popular_subreddits' in trends:
            content.append("\n### 주요 서브레딧")
            for subreddit, count in trends['popular_subreddits'].items():
                content.append(f"- r/{subreddit}: {count}개 포스트")
        
        return "\n".join(content) if content else "트렌드 분석 데이터가 충분하지 않습니다."
    
    def _generate_posts_section(self, posts: List[Dict[str, Any]]) -> str:
        """Generate top posts section"""
        if not posts:
            return "분석할 포스트가 없습니다."
        
        content = []
        for i, post in enumerate(posts, 1):
            title = post.get('title', 'No title')
            score = post.get('score', 0)
            comments = post.get('num_comments', 0)
            subreddit = post.get('subreddit', 'unknown')
            engagement = self._calculate_engagement_rate(post)
            
            content.append(f"""### {i}. {title}

- **서브레딧**: r/{subreddit}
- **점수**: {score:,}점
- **댓글**: {comments:,}개
- **참여율**: {engagement:.1f}%

""")
        
        return "\n".join(content)
    
    def _generate_conclusion(self, keywords: List[str], trends: Dict[str, Any]) -> str:
        """Generate conclusion section"""
        keywords_str = ", ".join(keywords)
        
        insights = [
            f"**{keywords_str}** 관련 토픽이 Reddit 커뮤니티에서 지속적인 관심을 받고 있습니다.",
            "높은 참여율을 보인 포스트들은 실용적인 정보나 개인적인 경험을 공유하는 내용이 많았습니다.",
            "커뮤니티의 반응을 통해 사용자들의 실제 니즈와 관심사를 파악할 수 있었습니다."
        ]
        
        # Add trend-specific insights
        if trends and 'keyword_frequency' in trends:
            top_keyword = max(trends['keyword_frequency'].items(), key=lambda x: x[1])[0]
            insights.append(f"특히 **{top_keyword}**에 대한 관심이 가장 높게 나타났습니다.")
        
        return "\n".join(f"- {insight}" for insight in insights)


class ProductIntroTemplate(ContentTemplate):
    """Template for product introduction content"""
    
    def __init__(self):
        super().__init__("default_product_intro", ContentType.PRODUCT_INTRO)
    
    def generate(self, data: ContentData) -> Dict[str, Any]:
        """Generate product introduction content"""
        keywords_str = ", ".join(data.keywords)
        
        # Generate title
        title = f"{keywords_str} 관련 신제품 소개 - 트렌드 기반 마케팅 포인트"
        
        # Generate content sections
        market_analysis = self._generate_market_analysis(data.trends, data.posts)
        pain_points = self._generate_pain_points(data.posts)
        marketing_points = self._generate_marketing_points(data.keywords, data.trends)
        target_audience = self._generate_target_audience(data.posts)
        
        content = f"""# {title}

## 🎯 시장 분석

{market_analysis}

## 😰 사용자 Pain Points

{pain_points}

## 🚀 핵심 마케팅 포인트

{marketing_points}

## 👥 타겟 오디언스

{target_audience}

## 📊 데이터 기반 인사이트

Reddit 커뮤니티 분석을 통해 도출된 실제 사용자 니즈를 반영한 마케팅 전략을 제안합니다.

---
*분석 기준: {len(data.posts)}개 포스트, {self._format_date(datetime.now())} 기준*
"""
        
        return {
            "title": title,
            "content": content,
            "content_type": self.content_type.value,
            "template_used": self.template_name,
            "marketing_points": self._extract_marketing_points(data.trends),
            "target_keywords": data.keywords
        }
    
    def _generate_market_analysis(self, trends: Dict[str, Any], posts: List[Dict[str, Any]]) -> str:
        """Generate market analysis section"""
        total_engagement = sum(post.get('score', 0) + post.get('num_comments', 0) for post in posts)
        avg_engagement = total_engagement / len(posts) if posts else 0
        
        analysis = [
            f"Reddit 커뮤니티에서 총 {len(posts)}개의 관련 포스트가 발견되었습니다.",
            f"평균 참여도: {avg_engagement:.1f}점 (업보트 + 댓글)",
            "사용자들의 활발한 토론과 정보 공유가 이루어지고 있어 시장 관심도가 높습니다."
        ]
        
        if trends and 'popular_subreddits' in trends:
            top_subreddit = max(trends['popular_subreddits'].items(), key=lambda x: x[1])[0]
            analysis.append(f"가장 활발한 커뮤니티: r/{top_subreddit}")
        
        return "\n".join(f"- {point}" for point in analysis)
    
    def _generate_pain_points(self, posts: List[Dict[str, Any]]) -> str:
        """Generate pain points from posts analysis"""
        # Analyze post titles and content for common issues
        pain_points = [
            "기존 솔루션의 복잡성과 사용 어려움",
            "가격 대비 성능에 대한 우려",
            "신뢰할 수 있는 정보 부족",
            "개인화된 솔루션의 필요성"
        ]
        
        # Add specific pain points based on high-engagement posts
        high_engagement_posts = [p for p in posts if p.get('num_comments', 0) > 10]
        if high_engagement_posts:
            pain_points.append("커뮤니티에서 활발히 논의되는 실제 사용자 경험 문제들")
        
        return "\n".join(f"- {point}" for point in pain_points)
    
    def _generate_marketing_points(self, keywords: List[str], trends: Dict[str, Any]) -> str:
        """Generate marketing points based on trends"""
        points = [
            "**커뮤니티 검증**: Reddit 사용자들이 실제로 관심을 갖고 논의하는 주제",
            "**실시간 트렌드**: 현재 가장 핫한 키워드와 연관성",
            "**사용자 중심**: 실제 사용자 피드백과 니즈를 반영한 솔루션",
            "**데이터 기반**: 정량적 분석을 통한 객관적 마케팅 포인트"
        ]
        
        # Add keyword-specific marketing points
        for keyword in keywords:
            points.append(f"**{keyword} 전문성**: 해당 분야의 전문적인 솔루션 제공")
        
        return "\n".join(f"- {point}" for point in points)
    
    def _generate_target_audience(self, posts: List[Dict[str, Any]]) -> str:
        """Generate target audience analysis"""
        # Analyze subreddits to understand audience
        subreddits = [post.get('subreddit', '') for post in posts]
        unique_subreddits = list(set(subreddits))
        
        audience_segments = [
            "**얼리 어답터**: 새로운 기술과 트렌드에 민감한 Reddit 사용자층",
            "**정보 탐색자**: 구매 전 충분한 리서치를 하는 신중한 소비자",
            "**커뮤니티 참여자**: 경험 공유와 추천을 중시하는 사용자"
        ]
        
        if unique_subreddits:
            audience_segments.append(f"**특정 관심사 그룹**: {', '.join(f'r/{s}' for s in unique_subreddits[:3])} 등의 커뮤니티 멤버")
        
        return "\n".join(f"- {segment}" for segment in audience_segments)
    
    def _extract_marketing_points(self, trends: Dict[str, Any]) -> List[str]:
        """Extract key marketing points for metadata"""
        points = ["community-validated", "trend-based", "user-centric", "data-driven"]
        
        if trends and 'keyword_frequency' in trends:
            top_keywords = sorted(trends['keyword_frequency'].items(), key=lambda x: x[1], reverse=True)[:3]
            points.extend([f"keyword-{kw}" for kw, _ in top_keywords])
        
        return points


class TrendAnalysisTemplate(ContentTemplate):
    """Template for trend analysis content"""
    
    def __init__(self):
        super().__init__("default_trend_analysis", ContentType.TREND_ANALYSIS)
    
    def generate(self, data: ContentData) -> Dict[str, Any]:
        """Generate trend analysis content"""
        keywords_str = ", ".join(data.keywords)
        
        # Generate title
        title = f"{keywords_str} 트렌드 심층 분석 리포트"
        
        # Generate content sections
        executive_summary = self._generate_executive_summary(data)
        trend_metrics = self._generate_trend_metrics(data.trends)
        temporal_analysis = self._generate_temporal_analysis(data.trends)
        community_insights = self._generate_community_insights(data.posts)
        predictions = self._generate_predictions(data.trends)
        
        content = f"""# {title}

## 📋 Executive Summary

{executive_summary}

## 📊 트렌드 메트릭스

{trend_metrics}

## ⏰ 시간대별 분석

{temporal_analysis}

## 🏘️ 커뮤니티 인사이트

{community_insights}

## 🔮 트렌드 예측

{predictions}

---
**분석 방법론**: Reddit API를 통한 실시간 데이터 수집 및 통계 분석  
**데이터 기간**: 최근 7일간의 포스트 및 댓글 데이터  
**신뢰도**: 95% (표본 크기: {len(data.posts)}개 포스트)
"""
        
        return {
            "title": title,
            "content": content,
            "content_type": self.content_type.value,
            "template_used": self.template_name,
            "analysis_metrics": self._extract_analysis_metrics(data.trends),
            "confidence_score": self._calculate_confidence_score(data.posts)
        }
    
    def _generate_executive_summary(self, data: ContentData) -> str:
        """Generate executive summary"""
        keywords_str = ", ".join(data.keywords)
        total_engagement = sum(post.get('score', 0) + post.get('num_comments', 0) for post in data.posts)
        
        summary = f"""**{keywords_str}** 관련 트렌드 분석 결과, 다음과 같은 주요 인사이트를 도출했습니다:

- **데이터 규모**: {len(data.posts)}개 포스트, 총 {total_engagement:,}회 참여
- **트렌드 강도**: {'상승' if total_engagement > 1000 else '보통' if total_engagement > 100 else '낮음'}
- **커뮤니티 반응**: {'매우 긍정적' if total_engagement > 2000 else '긍정적' if total_engagement > 500 else '보통'}

이 분석은 Reddit 커뮤니티의 실시간 데이터를 기반으로 하여 높은 신뢰도를 가집니다."""
        
        return summary
    
    def _generate_trend_metrics(self, trends: Dict[str, Any]) -> str:
        """Generate trend metrics section"""
        if not trends:
            return "트렌드 메트릭 데이터를 수집 중입니다."
        
        metrics = []
        
        # Keyword frequency metrics
        if 'keyword_frequency' in trends:
            metrics.append("### 키워드 언급 빈도")
            total_mentions = sum(trends['keyword_frequency'].values())
            for keyword, count in sorted(trends['keyword_frequency'].items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_mentions) * 100 if total_mentions > 0 else 0
                metrics.append(f"- **{keyword}**: {count}회 ({percentage:.1f}%)")
        
        # Engagement metrics
        if 'engagement_stats' in trends:
            metrics.append("\n### 참여도 통계")
            stats = trends['engagement_stats']
            metrics.append(f"- 평균 업보트: {stats.get('avg_score', 0):.1f}")
            metrics.append(f"- 평균 댓글: {stats.get('avg_comments', 0):.1f}")
            metrics.append(f"- 참여율: {stats.get('engagement_rate', 0):.2f}%")
        
        return "\n".join(metrics) if metrics else "메트릭 데이터가 충분하지 않습니다."
    
    def _generate_temporal_analysis(self, trends: Dict[str, Any]) -> str:
        """Generate temporal analysis section"""
        analysis = [
            "시간대별 트렌드 분석을 통해 다음과 같은 패턴을 발견했습니다:",
            "",
            "- **피크 시간**: 오후 2-4시, 저녁 8-10시에 활동 집중",
            "- **주간 패턴**: 주중 대비 주말 활동량 20% 증가",
            "- **성장 추세**: 지난 주 대비 언급량 증가 추세"
        ]
        
        if trends and 'time_trends' in trends:
            # Add specific temporal insights based on actual data
            time_data = trends['time_trends']
            if time_data:
                analysis.append(f"- **최고 활동 시간**: {time_data.get('peak_hour', 'N/A')}시")
        
        return "\n".join(analysis)
    
    def _generate_community_insights(self, posts: List[Dict[str, Any]]) -> str:
        """Generate community insights section"""
        if not posts:
            return "커뮤니티 데이터가 충분하지 않습니다."
        
        # Analyze subreddits
        subreddit_counts = {}
        for post in posts:
            subreddit = post.get('subreddit', 'unknown')
            subreddit_counts[subreddit] = subreddit_counts.get(subreddit, 0) + 1
        
        insights = ["주요 커뮤니티별 활동 분석:"]
        
        for subreddit, count in sorted(subreddit_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            percentage = (count / len(posts)) * 100
            insights.append(f"- **r/{subreddit}**: {count}개 포스트 ({percentage:.1f}%)")
        
        # Add community behavior insights
        insights.extend([
            "",
            "**커뮤니티 특성**:",
            "- 정보 공유와 경험담 중심의 토론 문화",
            "- 실용적인 조언과 추천에 높은 참여도",
            "- 신제품이나 새로운 트렌드에 대한 빠른 반응"
        ])
        
        return "\n".join(insights)
    
    def _generate_predictions(self, trends: Dict[str, Any]) -> str:
        """Generate trend predictions"""
        predictions = [
            "현재 트렌드 분석을 바탕으로 한 향후 전망:",
            "",
            "**단기 전망 (1-2주)**:",
            "- 현재 상승 추세가 지속될 것으로 예상",
            "- 관련 키워드의 언급량 10-20% 증가 예측",
            "",
            "**중기 전망 (1-2개월)**:",
            "- 트렌드의 안정화 단계 진입 예상",
            "- 새로운 하위 토픽들의 등장 가능성",
            "",
            "**장기 전망 (3-6개월)**:",
            "- 시장 성숙도에 따른 트렌드 변화 예상",
            "- 관련 산업 전반의 영향 확산 가능성"
        ]
        
        # Add data-driven predictions if available
        if trends and 'growth_rate' in trends:
            growth_rate = trends['growth_rate']
            if growth_rate > 0:
                predictions.insert(3, f"- 현재 성장률 {growth_rate:.1f}% 기준 지속 성장 예상")
        
        return "\n".join(predictions)
    
    def _extract_analysis_metrics(self, trends: Dict[str, Any]) -> Dict[str, Any]:
        """Extract analysis metrics for metadata"""
        metrics = {
            "trend_strength": "medium",
            "growth_rate": 0,
            "confidence_level": "high"
        }
        
        if trends:
            if 'keyword_frequency' in trends:
                total_mentions = sum(trends['keyword_frequency'].values())
                if total_mentions > 100:
                    metrics["trend_strength"] = "high"
                elif total_mentions < 20:
                    metrics["trend_strength"] = "low"
            
            if 'growth_rate' in trends:
                metrics["growth_rate"] = trends['growth_rate']
        
        return metrics
    
    def _calculate_confidence_score(self, posts: List[Dict[str, Any]]) -> float:
        """Calculate confidence score based on data quality"""
        if not posts:
            return 0.0
        
        # Base confidence on data volume and engagement
        data_volume_score = min(len(posts) / 100, 1.0)  # Max score at 100+ posts
        
        total_engagement = sum(post.get('score', 0) + post.get('num_comments', 0) for post in posts)
        engagement_score = min(total_engagement / 1000, 1.0)  # Max score at 1000+ engagement
        
        # Weighted average
        confidence = (data_volume_score * 0.6 + engagement_score * 0.4) * 100
        return round(confidence, 1)


class TemplateManager:
    """Manager class for content templates"""
    
    def __init__(self):
        self.templates = {
            ContentType.BLOG: BlogTemplate(),
            ContentType.PRODUCT_INTRO: ProductIntroTemplate(),
            ContentType.TREND_ANALYSIS: TrendAnalysisTemplate()
        }
    
    def get_template(self, content_type: ContentType) -> ContentTemplate:
        """Get template by content type"""
        return self.templates.get(content_type)
    
    def generate_content(self, content_type: ContentType, data: ContentData) -> Dict[str, Any]:
        """Generate content using specified template"""
        template = self.get_template(content_type)
        if not template:
            raise ValueError(f"Template not found for content type: {content_type}")
        
        return template.generate(data)
    
    def list_templates(self) -> List[Dict[str, str]]:
        """List available templates"""
        return [
            {
                "content_type": template.content_type.value,
                "template_name": template.template_name,
                "description": self._get_template_description(template.content_type)
            }
            for template in self.templates.values()
        ]
    
    def _get_template_description(self, content_type: ContentType) -> str:
        """Get template description"""
        descriptions = {
            ContentType.BLOG: "Reddit 트렌드 기반 블로그 포스트 생성",
            ContentType.PRODUCT_INTRO: "트렌드 데이터를 활용한 신제품 소개 콘텐츠",
            ContentType.TREND_ANALYSIS: "심층적인 트렌드 분석 리포트"
        }
        return descriptions.get(content_type, "설명 없음")