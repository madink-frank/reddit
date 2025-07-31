"""
Advertising Effectiveness Analysis Service

Provides campaign performance tracking, ROI calculation, marketing attribution,
and A/B testing framework for content strategies.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
import statistics
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.post import Post
from app.models.comment import Comment
from app.core.database import get_db

logger = logging.getLogger(__name__)


class AdvertisingEffectivenessService:
    """Service for advertising effectiveness analysis and campaign tracking"""
    
    def __init__(self):
        self.campaign_indicators = [
            'sponsored', 'ad', 'promotion', 'promo', 'campaign',
            'marketing', 'advertisement', 'commercial', 'brand'
        ]
        
        self.engagement_weights = {
            'upvotes': 1.0,
            'comments': 2.0,
            'shares': 3.0,
            'saves': 2.5
        }
    
    async def track_campaign_performance(
        self,
        campaign_keywords: List[str],
        subreddits: Optional[List[str]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db: Session = None
    ) -> Dict:
        """
        Track campaign performance and analyze effectiveness
        
        Args:
            campaign_keywords: Keywords associated with the campaign
            subreddits: Optional list of subreddits to analyze
            start_date: Campaign start date
            end_date: Campaign end date
            db: Database session
            
        Returns:
            Dictionary containing campaign performance metrics
        """
        try:
            if not db:
                db = next(get_db())
            
            if not start_date:
                start_date = datetime.utcnow() - timedelta(days=30)
            if not end_date:
                end_date = datetime.utcnow()
            
            # Get campaign-related posts
            campaign_posts = await self._get_campaign_posts(
                campaign_keywords, subreddits, start_date, end_date, db
            )
            
            # Get campaign-related comments
            campaign_comments = await self._get_campaign_comments(
                campaign_keywords, subreddits, start_date, end_date, db
            )
            
            # Calculate performance metrics
            performance_metrics = self._calculate_performance_metrics(
                campaign_posts, campaign_comments
            )
            
            # Analyze engagement patterns
            engagement_analysis = self._analyze_engagement_patterns(
                campaign_posts, campaign_comments
            )
            
            # Calculate reach and impressions
            reach_metrics = self._calculate_reach_metrics(
                campaign_posts, campaign_comments, subreddits
            )
            
            # Analyze temporal performance
            temporal_analysis = self._analyze_temporal_performance(
                campaign_posts, campaign_comments, start_date, end_date
            )
            
            # Content effectiveness analysis
            content_analysis = self._analyze_content_effectiveness(
                campaign_posts, campaign_keywords
            )
            
            return {
                "campaign_keywords": campaign_keywords,
                "analysis_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "duration_days": (end_date - start_date).days
                },
                "performance_metrics": performance_metrics,
                "engagement_analysis": engagement_analysis,
                "reach_metrics": reach_metrics,
                "temporal_analysis": temporal_analysis,
                "content_analysis": content_analysis,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error tracking campaign performance: {str(e)}")
            raise
    
    async def calculate_roi_metrics(
        self,
        campaign_data: Dict,
        campaign_cost: float,
        conversion_events: Optional[List[Dict]] = None,
        conversion_value: Optional[float] = None
    ) -> Dict:
        """
        Calculate ROI and marketing attribution metrics
        
        Args:
            campaign_data: Campaign performance data
            campaign_cost: Total campaign cost
            conversion_events: List of conversion events
            conversion_value: Value per conversion
            
        Returns:
            Dictionary containing ROI calculations and attribution metrics
        """
        try:
            performance_metrics = campaign_data.get("performance_metrics", {})
            engagement_analysis = campaign_data.get("engagement_analysis", {})
            
            # Calculate basic ROI metrics
            total_engagement = performance_metrics.get("total_engagement_score", 0)
            total_reach = campaign_data.get("reach_metrics", {}).get("estimated_reach", 0)
            
            # Cost per engagement
            cost_per_engagement = campaign_cost / max(total_engagement, 1)
            
            # Cost per reach (CPM equivalent)
            cost_per_thousand_reach = (campaign_cost / max(total_reach, 1)) * 1000
            
            # Engagement rate
            engagement_rate = engagement_analysis.get("overall_engagement_rate", 0)
            
            # Calculate conversion metrics if provided
            conversion_metrics = {}
            if conversion_events:
                total_conversions = len(conversion_events)
                conversion_rate = (total_conversions / max(total_reach, 1)) * 100
                cost_per_conversion = campaign_cost / max(total_conversions, 1)
                
                conversion_metrics = {
                    "total_conversions": total_conversions,
                    "conversion_rate": conversion_rate,
                    "cost_per_conversion": cost_per_conversion
                }
                
                if conversion_value:
                    total_revenue = total_conversions * conversion_value
                    roi_percentage = ((total_revenue - campaign_cost) / campaign_cost) * 100
                    
                    conversion_metrics.update({
                        "total_revenue": total_revenue,
                        "roi_percentage": roi_percentage,
                        "revenue_per_dollar_spent": total_revenue / campaign_cost
                    })
            
            # Attribution analysis
            attribution_analysis = self._analyze_attribution_patterns(
                campaign_data, conversion_events or []
            )
            
            # Performance benchmarking
            performance_benchmarks = self._calculate_performance_benchmarks(
                cost_per_engagement, engagement_rate, conversion_metrics
            )
            
            return {
                "campaign_cost": campaign_cost,
                "basic_metrics": {
                    "cost_per_engagement": cost_per_engagement,
                    "cost_per_thousand_reach": cost_per_thousand_reach,
                    "engagement_rate": engagement_rate,
                    "total_engagement": total_engagement,
                    "total_reach": total_reach
                },
                "conversion_metrics": conversion_metrics,
                "attribution_analysis": attribution_analysis,
                "performance_benchmarks": performance_benchmarks,
                "efficiency_score": self._calculate_efficiency_score(
                    cost_per_engagement, engagement_rate, conversion_metrics
                ),
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error calculating ROI metrics: {str(e)}")
            raise
    
    async def ab_test_analysis(
        self,
        test_variants: List[Dict],
        success_metric: str = "engagement_rate",
        confidence_level: float = 0.95,
        db: Session = None
    ) -> Dict:
        """
        Perform A/B testing analysis for content strategies
        
        Args:
            test_variants: List of test variant configurations
            success_metric: Metric to optimize for
            confidence_level: Statistical confidence level
            db: Database session
            
        Returns:
            Dictionary containing A/B test results and recommendations
        """
        try:
            if not db:
                db = next(get_db())
            
            variant_results = {}
            
            # Analyze each variant
            for variant in test_variants:
                variant_id = variant.get("variant_id")
                variant_keywords = variant.get("keywords", [])
                variant_subreddits = variant.get("subreddits")
                variant_start = variant.get("start_date")
                variant_end = variant.get("end_date")
                
                # Get performance data for this variant
                variant_performance = await self.track_campaign_performance(
                    campaign_keywords=variant_keywords,
                    subreddits=variant_subreddits,
                    start_date=variant_start,
                    end_date=variant_end,
                    db=db
                )
                
                variant_results[variant_id] = {
                    "configuration": variant,
                    "performance": variant_performance,
                    "success_metric_value": self._extract_success_metric(
                        variant_performance, success_metric
                    )
                }
            
            # Statistical analysis
            statistical_analysis = self._perform_statistical_analysis(
                variant_results, success_metric, confidence_level
            )
            
            # Determine winning variant
            winning_analysis = self._determine_winning_variant(
                variant_results, statistical_analysis, success_metric
            )
            
            # Generate recommendations
            recommendations = self._generate_ab_test_recommendations(
                variant_results, winning_analysis, statistical_analysis
            )
            
            return {
                "test_configuration": {
                    "variants": test_variants,
                    "success_metric": success_metric,
                    "confidence_level": confidence_level
                },
                "variant_results": variant_results,
                "statistical_analysis": statistical_analysis,
                "winning_analysis": winning_analysis,
                "recommendations": recommendations,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in A/B test analysis: {str(e)}")
            raise
    
    async def campaign_attribution_analysis(
        self,
        campaigns: List[Dict],
        attribution_window_days: int = 30,
        db: Session = None
    ) -> Dict:
        """
        Analyze marketing attribution across multiple campaigns
        
        Args:
            campaigns: List of campaign configurations
            attribution_window_days: Attribution window in days
            db: Database session
            
        Returns:
            Dictionary containing attribution analysis results
        """
        try:
            if not db:
                db = next(get_db())
            
            campaign_performances = {}
            
            # Get performance data for each campaign
            for campaign in campaigns:
                campaign_id = campaign.get("campaign_id")
                campaign_performance = await self.track_campaign_performance(
                    campaign_keywords=campaign.get("keywords", []),
                    subreddits=campaign.get("subreddits"),
                    start_date=campaign.get("start_date"),
                    end_date=campaign.get("end_date"),
                    db=db
                )
                
                campaign_performances[campaign_id] = {
                    "configuration": campaign,
                    "performance": campaign_performance
                }
            
            # Cross-campaign attribution analysis
            attribution_analysis = self._analyze_cross_campaign_attribution(
                campaign_performances, attribution_window_days
            )
            
            # Channel effectiveness analysis
            channel_analysis = self._analyze_channel_effectiveness(
                campaign_performances
            )
            
            # Budget allocation recommendations
            budget_recommendations = self._generate_budget_recommendations(
                campaign_performances, attribution_analysis
            )
            
            return {
                "campaigns_analyzed": len(campaigns),
                "attribution_window_days": attribution_window_days,
                "campaign_performances": campaign_performances,
                "attribution_analysis": attribution_analysis,
                "channel_analysis": channel_analysis,
                "budget_recommendations": budget_recommendations,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in campaign attribution analysis: {str(e)}")
            raise
    
    async def _get_campaign_posts(
        self,
        campaign_keywords: List[str],
        subreddits: Optional[List[str]],
        start_date: datetime,
        end_date: datetime,
        db: Session
    ) -> List[Post]:
        """Get posts related to campaign keywords"""
        
        query = db.query(Post).filter(
            and_(
                Post.created_at >= start_date,
                Post.created_at <= end_date
            )
        )
        
        # Add subreddit filter
        if subreddits:
            query = query.filter(Post.subreddit.in_(subreddits))
        
        # Add campaign keyword filter
        keyword_conditions = []
        for keyword in campaign_keywords:
            keyword_conditions.extend([
                func.lower(Post.title).contains(keyword.lower()),
                func.lower(Post.content).contains(keyword.lower())
            ])
        
        if keyword_conditions:
            query = query.filter(or_(*keyword_conditions))
        
        return query.all()
    
    async def _get_campaign_comments(
        self,
        campaign_keywords: List[str],
        subreddits: Optional[List[str]],
        start_date: datetime,
        end_date: datetime,
        db: Session
    ) -> List[Comment]:
        """Get comments related to campaign keywords"""
        
        query = db.query(Comment).filter(
            and_(
                Comment.created_at >= start_date,
                Comment.created_at <= end_date
            )
        )
        
        # Add subreddit filter through post relationship
        if subreddits:
            query = query.join(Post).filter(Post.subreddit.in_(subreddits))
        
        # Add campaign keyword filter
        keyword_conditions = []
        for keyword in campaign_keywords:
            keyword_conditions.append(
                func.lower(Comment.content).contains(keyword.lower())
            )
        
        if keyword_conditions:
            query = query.filter(or_(*keyword_conditions))
        
        return query.all()
    
    def _calculate_performance_metrics(
        self,
        posts: List[Post],
        comments: List[Comment]
    ) -> Dict:
        """Calculate basic performance metrics"""
        
        total_posts = len(posts)
        total_comments = len(comments)
        
        # Post metrics
        total_post_score = sum(post.score or 0 for post in posts)
        total_post_comments = sum(post.comment_count or 0 for post in posts)
        avg_post_score = total_post_score / max(total_posts, 1)
        
        # Comment metrics
        total_comment_score = sum(comment.score or 0 for comment in comments)
        avg_comment_score = total_comment_score / max(total_comments, 1)
        
        # Overall engagement
        total_engagement_score = total_post_score + total_comment_score + total_post_comments
        
        return {
            "total_posts": total_posts,
            "total_comments": total_comments,
            "total_post_score": total_post_score,
            "total_comment_score": total_comment_score,
            "total_post_comments": total_post_comments,
            "total_engagement_score": total_engagement_score,
            "average_post_score": avg_post_score,
            "average_comment_score": avg_comment_score,
            "engagement_per_post": total_engagement_score / max(total_posts, 1)
        }
    
    def _analyze_engagement_patterns(
        self,
        posts: List[Post],
        comments: List[Comment]
    ) -> Dict:
        """Analyze engagement patterns and trends"""
        
        if not posts and not comments:
            return {
                "overall_engagement_rate": 0,
                "engagement_distribution": {},
                "top_performing_content": [],
                "engagement_trends": {}
            }
        
        # Calculate engagement rates
        post_engagement_rates = []
        for post in posts:
            engagement = (post.score or 0) + (post.comment_count or 0)
            post_engagement_rates.append(engagement)
        
        # Engagement distribution
        if post_engagement_rates:
            engagement_distribution = {
                "mean": statistics.mean(post_engagement_rates),
                "median": statistics.median(post_engagement_rates),
                "std_dev": statistics.stdev(post_engagement_rates) if len(post_engagement_rates) > 1 else 0,
                "min": min(post_engagement_rates),
                "max": max(post_engagement_rates)
            }
        else:
            engagement_distribution = {
                "mean": 0, "median": 0, "std_dev": 0, "min": 0, "max": 0
            }
        
        # Top performing content
        top_posts = sorted(posts, key=lambda p: (p.score or 0) + (p.comment_count or 0), reverse=True)[:5]
        top_performing_content = [
            {
                "title": post.title,
                "score": post.score or 0,
                "comments": post.comment_count or 0,
                "subreddit": post.subreddit,
                "engagement": (post.score or 0) + (post.comment_count or 0)
            }
            for post in top_posts
        ]
        
        # Overall engagement rate
        total_engagement = sum(post_engagement_rates)
        total_posts = len(posts)
        overall_engagement_rate = total_engagement / max(total_posts, 1)
        
        return {
            "overall_engagement_rate": overall_engagement_rate,
            "engagement_distribution": engagement_distribution,
            "top_performing_content": top_performing_content,
            "engagement_trends": {
                "high_performers": len([rate for rate in post_engagement_rates if rate > engagement_distribution["mean"]]),
                "low_performers": len([rate for rate in post_engagement_rates if rate < engagement_distribution["mean"] / 2])
            }
        }
    
    def _calculate_reach_metrics(
        self,
        posts: List[Post],
        comments: List[Comment],
        subreddits: Optional[List[str]]
    ) -> Dict:
        """Calculate reach and impression metrics"""
        
        # Unique subreddits reached
        unique_subreddits = set()
        for post in posts:
            unique_subreddits.add(post.subreddit)
        
        # Estimate reach based on subreddit activity
        # This is a simplified estimation - in practice, you'd use more sophisticated methods
        estimated_reach = 0
        subreddit_reach = {}
        
        for subreddit in unique_subreddits:
            subreddit_posts = [p for p in posts if p.subreddit == subreddit]
            subreddit_engagement = sum((p.score or 0) + (p.comment_count or 0) for p in subreddit_posts)
            
            # Estimate reach as engagement * multiplier (simplified)
            estimated_subreddit_reach = subreddit_engagement * 10  # Rough multiplier
            subreddit_reach[subreddit] = {
                "posts": len(subreddit_posts),
                "engagement": subreddit_engagement,
                "estimated_reach": estimated_subreddit_reach
            }
            estimated_reach += estimated_subreddit_reach
        
        return {
            "unique_subreddits": len(unique_subreddits),
            "estimated_reach": estimated_reach,
            "subreddit_breakdown": subreddit_reach,
            "reach_per_post": estimated_reach / max(len(posts), 1)
        }
    
    def _analyze_temporal_performance(
        self,
        posts: List[Post],
        comments: List[Comment],
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """Analyze performance over time"""
        
        # Group by date
        daily_performance = defaultdict(lambda: {
            "posts": 0,
            "comments": 0,
            "engagement": 0
        })
        
        for post in posts:
            date_key = post.created_at.date()
            daily_performance[date_key]["posts"] += 1
            daily_performance[date_key]["engagement"] += (post.score or 0) + (post.comment_count or 0)
        
        for comment in comments:
            date_key = comment.created_at.date()
            daily_performance[date_key]["comments"] += 1
            daily_performance[date_key]["engagement"] += comment.score or 0
        
        # Calculate trends
        dates = sorted(daily_performance.keys())
        if len(dates) >= 2:
            # Simple trend calculation
            early_avg = statistics.mean([
                daily_performance[date]["engagement"] 
                for date in dates[:len(dates)//2]
            ])
            late_avg = statistics.mean([
                daily_performance[date]["engagement"] 
                for date in dates[len(dates)//2:]
            ])
            
            trend_direction = "increasing" if late_avg > early_avg else "decreasing"
            trend_strength = abs(late_avg - early_avg) / max(early_avg, 1)
        else:
            trend_direction = "stable"
            trend_strength = 0
        
        # Find peak performance day
        peak_date = max(dates, key=lambda d: daily_performance[d]["engagement"]) if dates else None
        
        return {
            "daily_breakdown": {
                date.isoformat(): stats 
                for date, stats in daily_performance.items()
            },
            "trend_analysis": {
                "direction": trend_direction,
                "strength": trend_strength
            },
            "peak_performance_date": peak_date.isoformat() if peak_date else None,
            "campaign_duration_days": (end_date - start_date).days
        }
    
    def _analyze_content_effectiveness(
        self,
        posts: List[Post],
        campaign_keywords: List[str]
    ) -> Dict:
        """Analyze content effectiveness by keyword and format"""
        
        keyword_performance = {}
        
        for keyword in campaign_keywords:
            keyword_posts = [
                post for post in posts 
                if keyword.lower() in (post.title or "").lower() or 
                   keyword.lower() in (post.content or "").lower()
            ]
            
            if keyword_posts:
                total_engagement = sum(
                    (post.score or 0) + (post.comment_count or 0) 
                    for post in keyword_posts
                )
                avg_engagement = total_engagement / len(keyword_posts)
                
                keyword_performance[keyword] = {
                    "posts_count": len(keyword_posts),
                    "total_engagement": total_engagement,
                    "average_engagement": avg_engagement,
                    "engagement_rate": avg_engagement / max(len(keyword_posts), 1)
                }
        
        # Content format analysis (simplified)
        format_analysis = {
            "text_posts": len([p for p in posts if not p.url or p.url.startswith("http")]),
            "link_posts": len([p for p in posts if p.url and not p.url.startswith("http")]),
            "total_posts": len(posts)
        }
        
        # Best performing keywords
        best_keywords = sorted(
            keyword_performance.items(),
            key=lambda x: x[1]["average_engagement"],
            reverse=True
        )[:3]
        
        return {
            "keyword_performance": keyword_performance,
            "format_analysis": format_analysis,
            "best_performing_keywords": dict(best_keywords),
            "content_insights": {
                "most_effective_keyword": best_keywords[0][0] if best_keywords else None,
                "keyword_diversity": len(keyword_performance),
                "average_keyword_performance": statistics.mean([
                    kp["average_engagement"] for kp in keyword_performance.values()
                ]) if keyword_performance else 0
            }
        }
    
    def _analyze_attribution_patterns(
        self,
        campaign_data: Dict,
        conversion_events: List[Dict]
    ) -> Dict:
        """Analyze attribution patterns for conversions"""
        
        if not conversion_events:
            return {
                "attribution_model": "last_click",
                "channel_attribution": {},
                "touchpoint_analysis": {},
                "conversion_paths": []
            }
        
        # Simplified attribution analysis
        channel_conversions = defaultdict(int)
        touchpoint_analysis = defaultdict(int)
        
        for event in conversion_events:
            # Last-click attribution (simplified)
            last_channel = event.get("last_channel", "direct")
            channel_conversions[last_channel] += 1
            
            # Touchpoint analysis
            touchpoints = event.get("touchpoints", [])
            for touchpoint in touchpoints:
                touchpoint_analysis[touchpoint] += 1
        
        return {
            "attribution_model": "last_click",
            "channel_attribution": dict(channel_conversions),
            "touchpoint_analysis": dict(touchpoint_analysis),
            "conversion_paths": conversion_events[:10],  # Sample paths
            "attribution_insights": {
                "primary_channel": max(channel_conversions.items(), key=lambda x: x[1])[0] if channel_conversions else None,
                "average_touchpoints": statistics.mean([
                    len(event.get("touchpoints", [])) for event in conversion_events
                ]) if conversion_events else 0
            }
        }
    
    def _calculate_performance_benchmarks(
        self,
        cost_per_engagement: float,
        engagement_rate: float,
        conversion_metrics: Dict
    ) -> Dict:
        """Calculate performance benchmarks and ratings"""
        
        # Industry benchmarks (simplified - would be based on real data)
        benchmarks = {
            "cost_per_engagement": {"excellent": 0.10, "good": 0.25, "average": 0.50, "poor": 1.00},
            "engagement_rate": {"excellent": 50, "good": 25, "average": 10, "poor": 5},
            "conversion_rate": {"excellent": 5.0, "good": 2.5, "average": 1.0, "poor": 0.5}
        }
        
        def get_performance_rating(value: float, benchmark: Dict, reverse: bool = False) -> str:
            if reverse:  # For metrics where lower is better (like cost)
                if value <= benchmark["excellent"]: return "excellent"
                elif value <= benchmark["good"]: return "good"
                elif value <= benchmark["average"]: return "average"
                else: return "poor"
            else:  # For metrics where higher is better
                if value >= benchmark["excellent"]: return "excellent"
                elif value >= benchmark["good"]: return "good"
                elif value >= benchmark["average"]: return "average"
                else: return "poor"
        
        ratings = {
            "cost_per_engagement_rating": get_performance_rating(
                cost_per_engagement, benchmarks["cost_per_engagement"], reverse=True
            ),
            "engagement_rate_rating": get_performance_rating(
                engagement_rate, benchmarks["engagement_rate"]
            )
        }
        
        if conversion_metrics and "conversion_rate" in conversion_metrics:
            ratings["conversion_rate_rating"] = get_performance_rating(
                conversion_metrics["conversion_rate"], benchmarks["conversion_rate"]
            )
        
        return {
            "benchmarks": benchmarks,
            "ratings": ratings,
            "overall_performance": self._calculate_overall_performance_score(ratings)
        }
    
    def _calculate_efficiency_score(
        self,
        cost_per_engagement: float,
        engagement_rate: float,
        conversion_metrics: Dict
    ) -> Dict:
        """Calculate overall campaign efficiency score"""
        
        # Normalize metrics to 0-100 scale
        engagement_score = min(100, engagement_rate * 2)  # Scale engagement rate
        cost_efficiency_score = max(0, 100 - (cost_per_engagement * 100))  # Invert cost
        
        scores = [engagement_score, cost_efficiency_score]
        
        if conversion_metrics and "conversion_rate" in conversion_metrics:
            conversion_score = min(100, conversion_metrics["conversion_rate"] * 20)
            scores.append(conversion_score)
        
        overall_score = statistics.mean(scores)
        
        return {
            "overall_score": overall_score,
            "component_scores": {
                "engagement": engagement_score,
                "cost_efficiency": cost_efficiency_score,
                "conversion": scores[2] if len(scores) > 2 else None
            },
            "performance_grade": self._get_performance_grade(overall_score)
        }
    
    def _get_performance_grade(self, score: float) -> str:
        """Convert numeric score to letter grade"""
        if score >= 90: return "A+"
        elif score >= 80: return "A"
        elif score >= 70: return "B"
        elif score >= 60: return "C"
        elif score >= 50: return "D"
        else: return "F"
    
    def _calculate_overall_performance_score(self, ratings: Dict) -> str:
        """Calculate overall performance based on individual ratings"""
        rating_scores = {"excellent": 4, "good": 3, "average": 2, "poor": 1}
        
        scores = [rating_scores.get(rating, 1) for rating in ratings.values()]
        avg_score = statistics.mean(scores)
        
        if avg_score >= 3.5: return "excellent"
        elif avg_score >= 2.5: return "good"
        elif avg_score >= 1.5: return "average"
        else: return "poor"
    
    def _extract_success_metric(self, performance_data: Dict, metric: str) -> float:
        """Extract success metric value from performance data"""
        
        metric_paths = {
            "engagement_rate": ["engagement_analysis", "overall_engagement_rate"],
            "total_engagement": ["performance_metrics", "total_engagement_score"],
            "reach": ["reach_metrics", "estimated_reach"],
            "posts": ["performance_metrics", "total_posts"]
        }
        
        if metric in metric_paths:
            path = metric_paths[metric]
            value = performance_data
            for key in path:
                value = value.get(key, 0)
            return float(value)
        
        return 0.0
    
    def _perform_statistical_analysis(
        self,
        variant_results: Dict,
        success_metric: str,
        confidence_level: float
    ) -> Dict:
        """Perform statistical analysis on A/B test results"""
        
        # Extract metric values for each variant
        variant_values = {}
        for variant_id, result in variant_results.items():
            variant_values[variant_id] = result["success_metric_value"]
        
        # Simple statistical analysis (in practice, would use proper statistical tests)
        values = list(variant_values.values())
        
        if len(values) < 2:
            return {
                "statistical_significance": False,
                "confidence_level": confidence_level,
                "p_value": None,
                "effect_size": None,
                "sample_sizes": {vid: 1 for vid in variant_values.keys()}
            }
        
        # Calculate basic statistics
        mean_diff = max(values) - min(values)
        std_dev = statistics.stdev(values) if len(values) > 1 else 0
        effect_size = mean_diff / max(std_dev, 0.001)  # Avoid division by zero
        
        # Simplified significance test (would use proper t-test in practice)
        is_significant = effect_size > 1.0  # Simplified threshold
        
        return {
            "statistical_significance": is_significant,
            "confidence_level": confidence_level,
            "effect_size": effect_size,
            "mean_difference": mean_diff,
            "standard_deviation": std_dev,
            "sample_sizes": {vid: 1 for vid in variant_values.keys()},
            "variant_values": variant_values
        }
    
    def _determine_winning_variant(
        self,
        variant_results: Dict,
        statistical_analysis: Dict,
        success_metric: str
    ) -> Dict:
        """Determine the winning variant from A/B test"""
        
        variant_values = statistical_analysis.get("variant_values", {})
        
        if not variant_values:
            return {
                "winner": None,
                "confidence": 0,
                "improvement": 0,
                "recommendation": "Insufficient data for winner determination"
            }
        
        # Find best performing variant
        winner_id = max(variant_values.items(), key=lambda x: x[1])[0]
        winner_value = variant_values[winner_id]
        
        # Calculate improvement over baseline (assume first variant is baseline)
        baseline_id = list(variant_values.keys())[0]
        baseline_value = variant_values[baseline_id]
        
        improvement = ((winner_value - baseline_value) / max(baseline_value, 0.001)) * 100
        
        # Determine confidence based on statistical significance
        confidence = 95 if statistical_analysis.get("statistical_significance") else 50
        
        recommendation = self._generate_winner_recommendation(
            winner_id, improvement, confidence, statistical_analysis
        )
        
        return {
            "winner": winner_id,
            "winner_value": winner_value,
            "baseline_value": baseline_value,
            "improvement": improvement,
            "confidence": confidence,
            "recommendation": recommendation
        }
    
    def _generate_winner_recommendation(
        self,
        winner_id: str,
        improvement: float,
        confidence: int,
        statistical_analysis: Dict
    ) -> str:
        """Generate recommendation based on A/B test results"""
        
        if confidence >= 95 and improvement > 10:
            return f"Strong recommendation: Implement variant {winner_id} with {improvement:.1f}% improvement"
        elif confidence >= 90 and improvement > 5:
            return f"Moderate recommendation: Consider implementing variant {winner_id}"
        elif improvement > 0:
            return f"Weak signal: Variant {winner_id} shows promise but needs more data"
        else:
            return "No clear winner: Continue testing or try new variants"
    
    def _generate_ab_test_recommendations(
        self,
        variant_results: Dict,
        winning_analysis: Dict,
        statistical_analysis: Dict
    ) -> List[Dict]:
        """Generate actionable recommendations from A/B test"""
        
        recommendations = []
        
        # Winner recommendation
        if winning_analysis.get("winner"):
            recommendations.append({
                "type": "implementation",
                "priority": "high" if winning_analysis.get("confidence", 0) >= 95 else "medium",
                "title": f"Implement Winning Variant: {winning_analysis['winner']}",
                "description": winning_analysis.get("recommendation", ""),
                "expected_improvement": f"{winning_analysis.get('improvement', 0):.1f}%"
            })
        
        # Statistical significance recommendation
        if not statistical_analysis.get("statistical_significance"):
            recommendations.append({
                "type": "testing",
                "priority": "medium",
                "title": "Extend Test Duration",
                "description": "Results are not statistically significant. Consider running the test longer or increasing sample size.",
                "expected_improvement": "Improved confidence in results"
            })
        
        # Performance insights
        variant_values = statistical_analysis.get("variant_values", {})
        if len(variant_values) > 1:
            worst_variant = min(variant_values.items(), key=lambda x: x[1])[0]
            recommendations.append({
                "type": "optimization",
                "priority": "low",
                "title": f"Analyze Variant {worst_variant} Performance",
                "description": "Investigate why this variant underperformed to inform future tests.",
                "expected_improvement": "Better test design"
            })
        
        return recommendations
    
    def _analyze_cross_campaign_attribution(
        self,
        campaign_performances: Dict,
        attribution_window_days: int
    ) -> Dict:
        """Analyze attribution across multiple campaigns"""
        
        # Simplified cross-campaign analysis
        campaign_overlaps = {}
        total_attribution_score = 0
        
        for campaign_id, performance in campaign_performances.items():
            campaign_score = performance["performance"]["performance_metrics"]["total_engagement_score"]
            total_attribution_score += campaign_score
            
            campaign_overlaps[campaign_id] = {
                "attribution_score": campaign_score,
                "attribution_percentage": 0  # Will be calculated below
            }
        
        # Calculate attribution percentages
        for campaign_id in campaign_overlaps:
            if total_attribution_score > 0:
                campaign_overlaps[campaign_id]["attribution_percentage"] = (
                    campaign_overlaps[campaign_id]["attribution_score"] / total_attribution_score * 100
                )
        
        return {
            "attribution_model": "engagement_based",
            "campaign_attribution": campaign_overlaps,
            "total_attribution_score": total_attribution_score,
            "attribution_insights": {
                "primary_campaign": max(
                    campaign_overlaps.items(),
                    key=lambda x: x[1]["attribution_score"]
                )[0] if campaign_overlaps else None,
                "campaign_synergy": len(campaign_overlaps) > 1
            }
        }
    
    def _analyze_channel_effectiveness(self, campaign_performances: Dict) -> Dict:
        """Analyze effectiveness by channel/subreddit"""
        
        channel_metrics = defaultdict(lambda: {
            "campaigns": 0,
            "total_engagement": 0,
            "total_reach": 0,
            "avg_performance": 0
        })
        
        for campaign_id, performance in campaign_performances.items():
            subreddit_breakdown = performance["performance"]["reach_metrics"]["subreddit_breakdown"]
            
            for subreddit, metrics in subreddit_breakdown.items():
                channel_metrics[subreddit]["campaigns"] += 1
                channel_metrics[subreddit]["total_engagement"] += metrics.get("engagement", 0)
                channel_metrics[subreddit]["total_reach"] += metrics.get("estimated_reach", 0)
        
        # Calculate averages
        for channel, metrics in channel_metrics.items():
            campaigns_count = metrics["campaigns"]
            metrics["avg_engagement"] = metrics["total_engagement"] / max(campaigns_count, 1)
            metrics["avg_reach"] = metrics["total_reach"] / max(campaigns_count, 1)
            metrics["efficiency_score"] = metrics["avg_engagement"] / max(metrics["avg_reach"], 1) * 100
        
        # Rank channels
        top_channels = sorted(
            channel_metrics.items(),
            key=lambda x: x[1]["efficiency_score"],
            reverse=True
        )[:5]
        
        return {
            "channel_metrics": dict(channel_metrics),
            "top_performing_channels": dict(top_channels),
            "channel_insights": {
                "most_effective_channel": top_channels[0][0] if top_channels else None,
                "total_channels": len(channel_metrics),
                "average_efficiency": statistics.mean([
                    metrics["efficiency_score"] for metrics in channel_metrics.values()
                ]) if channel_metrics else 0
            }
        }
    
    def _generate_budget_recommendations(
        self,
        campaign_performances: Dict,
        attribution_analysis: Dict
    ) -> List[Dict]:
        """Generate budget allocation recommendations"""
        
        recommendations = []
        
        # Get campaign attribution data
        campaign_attribution = attribution_analysis.get("campaign_attribution", {})
        
        if not campaign_attribution:
            return [{
                "type": "data_collection",
                "priority": "high",
                "title": "Collect More Performance Data",
                "description": "Insufficient data for budget recommendations",
                "action": "Run campaigns longer to gather performance data"
            }]
        
        # Find best performing campaign
        best_campaign = max(
            campaign_attribution.items(),
            key=lambda x: x[1]["attribution_score"]
        )[0]
        
        best_performance = campaign_attribution[best_campaign]
        
        recommendations.append({
            "type": "budget_increase",
            "priority": "high",
            "title": f"Increase Budget for Campaign: {best_campaign}",
            "description": f"This campaign shows {best_performance['attribution_percentage']:.1f}% of total attribution",
            "action": f"Consider allocating 40-60% of budget to {best_campaign}",
            "expected_roi": "High"
        })
        
        # Find underperforming campaigns
        avg_attribution = statistics.mean([
            data["attribution_percentage"] for data in campaign_attribution.values()
        ])
        
        underperformers = [
            campaign_id for campaign_id, data in campaign_attribution.items()
            if data["attribution_percentage"] < avg_attribution * 0.5
        ]
        
        if underperformers:
            recommendations.append({
                "type": "budget_reallocation",
                "priority": "medium",
                "title": "Optimize Underperforming Campaigns",
                "description": f"Campaigns {', '.join(underperformers)} are underperforming",
                "action": "Reduce budget or optimize targeting for these campaigns",
                "expected_roi": "Medium"
            })
        
        return recommendations