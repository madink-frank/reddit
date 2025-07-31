"""
Brand Monitoring Service

Provides brand mention tracking, sentiment analysis, and competitive analysis
for brand monitoring and reputation management.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import re
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.post import Post
from app.models.comment import Comment
from app.core.database import get_db

logger = logging.getLogger(__name__)


class BrandMonitoringService:
    """Service for brand monitoring and reputation measurement"""
    
    def __init__(self):
        self.sentiment_keywords = {
            'positive': [
                'love', 'great', 'awesome', 'excellent', 'amazing', 'fantastic',
                'wonderful', 'perfect', 'best', 'good', 'like', 'recommend',
                'happy', 'satisfied', 'impressed', 'quality', 'reliable'
            ],
            'negative': [
                'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst',
                'disappointed', 'frustrated', 'angry', 'broken', 'useless',
                'poor', 'cheap', 'scam', 'fraud', 'problem', 'issue', 'bug'
            ]
        }
    
    async def track_brand_mentions(
        self,
        brand_name: str,
        subreddits: Optional[List[str]] = None,
        days_back: int = 30,
        db: Session = None
    ) -> Dict:
        """
        Track brand mentions across subreddits
        
        Args:
            brand_name: Brand name to track
            subreddits: Optional list of subreddits to monitor
            days_back: Number of days to look back
            db: Database session
            
        Returns:
            Dictionary containing brand mention analytics
        """
        try:
            if not db:
                db = next(get_db())
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            # Create brand mention patterns
            brand_patterns = self._create_brand_patterns(brand_name)
            
            # Get posts mentioning the brand
            posts = await self._get_brand_mentions_posts(
                brand_patterns, subreddits, start_date, end_date, db
            )
            
            # Get comments mentioning the brand
            comments = await self._get_brand_mentions_comments(
                brand_patterns, subreddits, start_date, end_date, db
            )
            
            # Analyze mentions
            mention_analysis = self._analyze_brand_mentions(posts, comments, brand_name)
            
            # Calculate trends
            trends = self._calculate_mention_trends(posts, comments, days_back)
            
            # Analyze sentiment
            sentiment_analysis = self._analyze_brand_sentiment(posts, comments)
            
            # Subreddit breakdown
            subreddit_breakdown = self._analyze_subreddit_breakdown(posts, comments)
            
            return {
                "brand_name": brand_name,
                "monitoring_period": days_back,
                "total_mentions": mention_analysis["total_mentions"],
                "mention_breakdown": mention_analysis,
                "trends": trends,
                "sentiment_analysis": sentiment_analysis,
                "subreddit_breakdown": subreddit_breakdown,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error tracking brand mentions for {brand_name}: {str(e)}")
            raise
    
    async def analyze_brand_sentiment(
        self,
        brand_name: str,
        subreddits: Optional[List[str]] = None,
        days_back: int = 30,
        db: Session = None
    ) -> Dict:
        """
        Analyze brand sentiment and reputation scoring
        
        Args:
            brand_name: Brand name to analyze
            subreddits: Optional list of subreddits to analyze
            days_back: Number of days to analyze
            db: Database session
            
        Returns:
            Dictionary containing sentiment analysis and reputation score
        """
        try:
            if not db:
                db = next(get_db())
            
            # Get brand mentions
            brand_data = await self.track_brand_mentions(
                brand_name, subreddits, days_back, db
            )
            
            # Calculate reputation score
            reputation_score = self._calculate_reputation_score(brand_data)
            
            # Analyze sentiment trends over time
            sentiment_trends = await self._analyze_sentiment_trends(
                brand_name, subreddits, days_back, db
            )
            
            # Identify key sentiment drivers
            sentiment_drivers = self._identify_sentiment_drivers(brand_data)
            
            # Generate recommendations
            recommendations = self._generate_reputation_recommendations(
                reputation_score, sentiment_trends, sentiment_drivers
            )
            
            return {
                "brand_name": brand_name,
                "reputation_score": reputation_score,
                "sentiment_trends": sentiment_trends,
                "sentiment_drivers": sentiment_drivers,
                "recommendations": recommendations,
                "analysis_period": days_back,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing brand sentiment for {brand_name}: {str(e)}")
            raise
    
    async def competitive_analysis(
        self,
        primary_brand: str,
        competitor_brands: List[str],
        subreddits: Optional[List[str]] = None,
        days_back: int = 30,
        db: Session = None
    ) -> Dict:
        """
        Perform competitive analysis and benchmarking
        
        Args:
            primary_brand: Primary brand to analyze
            competitor_brands: List of competitor brands
            subreddits: Optional list of subreddits to analyze
            days_back: Number of days to analyze
            db: Database session
            
        Returns:
            Dictionary containing competitive analysis results
        """
        try:
            if not db:
                db = next(get_db())
            
            # Analyze all brands
            all_brands = [primary_brand] + competitor_brands
            brand_analyses = {}
            
            for brand in all_brands:
                brand_analyses[brand] = await self.track_brand_mentions(
                    brand, subreddits, days_back, db
                )
            
            # Compare metrics
            comparison_metrics = self._compare_brand_metrics(brand_analyses)
            
            # Market share analysis
            market_share = self._calculate_market_share(brand_analyses)
            
            # Competitive positioning
            positioning = self._analyze_competitive_positioning(brand_analyses)
            
            # Opportunity analysis
            opportunities = self._identify_competitive_opportunities(
                primary_brand, brand_analyses
            )
            
            return {
                "primary_brand": primary_brand,
                "competitors": competitor_brands,
                "comparison_metrics": comparison_metrics,
                "market_share": market_share,
                "competitive_positioning": positioning,
                "opportunities": opportunities,
                "analysis_period": days_back,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in competitive analysis: {str(e)}")
            raise
    
    def _create_brand_patterns(self, brand_name: str) -> List[str]:
        """Create regex patterns for brand mention detection"""
        
        # Basic brand name
        patterns = [brand_name.lower()]
        
        # Add variations
        patterns.append(brand_name.lower().replace(' ', ''))  # Remove spaces
        patterns.append(brand_name.lower().replace(' ', '_'))  # Underscores
        patterns.append(brand_name.lower().replace(' ', '-'))  # Hyphens
        
        # Add hashtag version
        patterns.append(f"#{brand_name.lower().replace(' ', '')}")
        
        # Add @mention version
        patterns.append(f"@{brand_name.lower().replace(' ', '')}")
        
        return patterns
    
    async def _get_brand_mentions_posts(
        self,
        brand_patterns: List[str],
        subreddits: Optional[List[str]],
        start_date: datetime,
        end_date: datetime,
        db: Session
    ) -> List[Post]:
        """Get posts mentioning the brand"""
        
        query = db.query(Post).filter(
            and_(
                Post.created_at >= start_date,
                Post.created_at <= end_date
            )
        )
        
        # Add subreddit filter
        if subreddits:
            query = query.filter(Post.subreddit.in_(subreddits))
        
        # Add brand mention filter
        brand_conditions = []
        for pattern in brand_patterns:
            brand_conditions.extend([
                func.lower(Post.title).contains(pattern),
                func.lower(Post.content).contains(pattern)
            ])
        
        query = query.filter(or_(*brand_conditions))
        
        return query.all()
    
    async def _get_brand_mentions_comments(
        self,
        brand_patterns: List[str],
        subreddits: Optional[List[str]],
        start_date: datetime,
        end_date: datetime,
        db: Session
    ) -> List[Comment]:
        """Get comments mentioning the brand"""
        
        query = db.query(Comment).filter(
            and_(
                Comment.created_at >= start_date,
                Comment.created_at <= end_date
            )
        )
        
        # Add subreddit filter through post relationship
        if subreddits:
            query = query.join(Post).filter(Post.subreddit.in_(subreddits))
        
        # Add brand mention filter
        brand_conditions = []
        for pattern in brand_patterns:
            brand_conditions.append(func.lower(Comment.content).contains(pattern))
        
        query = query.filter(or_(*brand_conditions))
        
        return query.all()
    
    def _analyze_brand_mentions(
        self, 
        posts: List[Post], 
        comments: List[Comment], 
        brand_name: str
    ) -> Dict:
        """Analyze brand mentions from posts and comments"""
        
        total_posts = len(posts)
        total_comments = len(comments)
        total_mentions = total_posts + total_comments
        
        # Calculate engagement metrics
        total_post_score = sum(post.score or 0 for post in posts)
        total_comment_score = sum(comment.score or 0 for comment in comments)
        total_post_comments = sum(post.comment_count or 0 for post in posts)
        
        avg_post_score = total_post_score / max(total_posts, 1)
        avg_comment_score = total_comment_score / max(total_comments, 1)
        
        return {
            "total_mentions": total_mentions,
            "post_mentions": total_posts,
            "comment_mentions": total_comments,
            "total_engagement_score": total_post_score + total_comment_score,
            "average_post_score": avg_post_score,
            "average_comment_score": avg_comment_score,
            "total_post_comments": total_post_comments,
            "engagement_rate": (total_post_score + total_comment_score) / max(total_mentions, 1)
        }
    
    def _calculate_mention_trends(
        self, 
        posts: List[Post], 
        comments: List[Comment], 
        days_back: int
    ) -> Dict:
        """Calculate mention trends over time"""
        
        # Group mentions by date
        daily_mentions = defaultdict(int)
        
        for post in posts:
            date_key = post.created_at.date()
            daily_mentions[date_key] += 1
        
        for comment in comments:
            date_key = comment.created_at.date()
            daily_mentions[date_key] += 1
        
        # Calculate trend metrics
        dates = sorted(daily_mentions.keys())
        if len(dates) < 2:
            return {
                "trend_direction": "stable",
                "growth_rate": 0,
                "daily_average": len(posts) + len(comments) / max(days_back, 1),
                "peak_date": dates[0] if dates else None,
                "daily_breakdown": dict(daily_mentions)
            }
        
        # Calculate growth rate (recent vs older periods)
        mid_point = len(dates) // 2
        recent_avg = sum(daily_mentions[date] for date in dates[mid_point:]) / max(len(dates) - mid_point, 1)
        older_avg = sum(daily_mentions[date] for date in dates[:mid_point]) / max(mid_point, 1)
        
        growth_rate = (recent_avg - older_avg) / max(older_avg, 1) if older_avg > 0 else 0
        
        # Find peak date
        peak_date = max(dates, key=lambda d: daily_mentions[d])
        
        return {
            "trend_direction": "increasing" if growth_rate > 0.1 else "decreasing" if growth_rate < -0.1 else "stable",
            "growth_rate": growth_rate,
            "daily_average": sum(daily_mentions.values()) / max(len(dates), 1),
            "peak_date": peak_date.isoformat(),
            "daily_breakdown": {date.isoformat(): count for date, count in daily_mentions.items()}
        }
    
    def _analyze_brand_sentiment(
        self, 
        posts: List[Post], 
        comments: List[Comment]
    ) -> Dict:
        """Analyze sentiment of brand mentions"""
        
        all_texts = []
        
        # Collect all text content
        for post in posts:
            if post.title:
                all_texts.append(post.title)
            if post.content:
                all_texts.append(post.content)
        
        for comment in comments:
            if comment.content:
                all_texts.append(comment.content)
        
        if not all_texts:
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 0,
                "positive_mentions": 0,
                "negative_mentions": 0,
                "neutral_mentions": 0,
                "sentiment_breakdown": {"positive": 0, "negative": 0, "neutral": 0}
            }
        
        # Simple keyword-based sentiment analysis
        sentiment_scores = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for text in all_texts:
            text_lower = text.lower()
            
            positive_matches = sum(1 for word in self.sentiment_keywords['positive'] if word in text_lower)
            negative_matches = sum(1 for word in self.sentiment_keywords['negative'] if word in text_lower)
            
            if positive_matches > negative_matches:
                sentiment_scores.append(1)
                positive_count += 1
            elif negative_matches > positive_matches:
                sentiment_scores.append(-1)
                negative_count += 1
            else:
                sentiment_scores.append(0)
                neutral_count += 1
        
        # Calculate overall sentiment
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        
        overall_sentiment = "positive" if avg_sentiment > 0.1 else "negative" if avg_sentiment < -0.1 else "neutral"
        
        return {
            "overall_sentiment": overall_sentiment,
            "sentiment_score": avg_sentiment,
            "positive_mentions": positive_count,
            "negative_mentions": negative_count,
            "neutral_mentions": neutral_count,
            "sentiment_breakdown": {
                "positive": positive_count / len(all_texts),
                "negative": negative_count / len(all_texts),
                "neutral": neutral_count / len(all_texts)
            }
        }
    
    def _analyze_subreddit_breakdown(
        self, 
        posts: List[Post], 
        comments: List[Comment]
    ) -> Dict:
        """Analyze brand mentions by subreddit"""
        
        subreddit_stats = defaultdict(lambda: {
            "posts": 0,
            "comments": 0,
            "total_score": 0,
            "avg_score": 0
        })
        
        # Analyze posts
        for post in posts:
            subreddit = post.subreddit
            subreddit_stats[subreddit]["posts"] += 1
            subreddit_stats[subreddit]["total_score"] += post.score or 0
        
        # Analyze comments (need to get subreddit from post)
        for comment in comments:
            if hasattr(comment, 'post') and comment.post:
                subreddit = comment.post.subreddit
                subreddit_stats[subreddit]["comments"] += 1
                subreddit_stats[subreddit]["total_score"] += comment.score or 0
        
        # Calculate averages
        for subreddit, stats in subreddit_stats.items():
            total_mentions = stats["posts"] + stats["comments"]
            stats["total_mentions"] = total_mentions
            stats["avg_score"] = stats["total_score"] / max(total_mentions, 1)
        
        # Sort by total mentions
        sorted_subreddits = sorted(
            subreddit_stats.items(),
            key=lambda x: x[1]["total_mentions"],
            reverse=True
        )
        
        return {
            "total_subreddits": len(subreddit_stats),
            "top_subreddits": dict(sorted_subreddits[:10]),
            "all_subreddits": dict(subreddit_stats)
        }
    
    def _calculate_reputation_score(self, brand_data: Dict) -> Dict:
        """Calculate overall brand reputation score"""
        
        sentiment_analysis = brand_data.get("sentiment_analysis", {})
        mention_analysis = brand_data.get("mention_breakdown", {})
        
        # Base score from sentiment (0-100)
        sentiment_score = sentiment_analysis.get("sentiment_score", 0)
        base_score = max(0, min(100, (sentiment_score + 1) * 50))  # Convert -1,1 to 0,100
        
        # Engagement factor
        engagement_rate = mention_analysis.get("engagement_rate", 0)
        engagement_factor = min(1.2, 1 + (engagement_rate / 100))  # Max 20% boost
        
        # Volume factor (more mentions = more confidence in score)
        total_mentions = mention_analysis.get("total_mentions", 0)
        volume_factor = min(1.1, 1 + (total_mentions / 1000))  # Max 10% boost
        
        # Calculate final score
        final_score = base_score * engagement_factor * volume_factor
        final_score = max(0, min(100, final_score))
        
        # Determine reputation level
        if final_score >= 80:
            reputation_level = "Excellent"
        elif final_score >= 60:
            reputation_level = "Good"
        elif final_score >= 40:
            reputation_level = "Fair"
        elif final_score >= 20:
            reputation_level = "Poor"
        else:
            reputation_level = "Critical"
        
        return {
            "score": final_score,
            "level": reputation_level,
            "factors": {
                "sentiment_contribution": base_score,
                "engagement_boost": (engagement_factor - 1) * 100,
                "volume_boost": (volume_factor - 1) * 100
            },
            "confidence": min(100, total_mentions / 10)  # Confidence based on mention volume
        }
    
    async def _analyze_sentiment_trends(
        self,
        brand_name: str,
        subreddits: Optional[List[str]],
        days_back: int,
        db: Session
    ) -> Dict:
        """Analyze sentiment trends over time"""
        
        # Get mentions for each week
        weekly_sentiment = {}
        weeks = days_back // 7
        
        for week in range(weeks):
            week_start = datetime.utcnow() - timedelta(days=(week + 1) * 7)
            week_end = week_start + timedelta(days=7)
            
            week_data = await self.track_brand_mentions(
                brand_name, subreddits, 7, db
            )
            
            week_key = f"week_{weeks - week}"
            weekly_sentiment[week_key] = {
                "sentiment_score": week_data.get("sentiment_analysis", {}).get("sentiment_score", 0),
                "mentions": week_data.get("total_mentions", 0),
                "start_date": week_start.date().isoformat(),
                "end_date": week_end.date().isoformat()
            }
        
        # Calculate trend direction
        scores = [data["sentiment_score"] for data in weekly_sentiment.values()]
        if len(scores) >= 2:
            trend_direction = "improving" if scores[-1] > scores[0] else "declining" if scores[-1] < scores[0] else "stable"
        else:
            trend_direction = "stable"
        
        return {
            "weekly_sentiment": weekly_sentiment,
            "trend_direction": trend_direction,
            "average_sentiment": sum(scores) / len(scores) if scores else 0,
            "sentiment_volatility": max(scores) - min(scores) if scores else 0
        }
    
    def _identify_sentiment_drivers(self, brand_data: Dict) -> Dict:
        """Identify key factors driving sentiment"""
        
        sentiment_analysis = brand_data.get("sentiment_analysis", {})
        subreddit_breakdown = brand_data.get("subreddit_breakdown", {})
        
        # Identify top positive and negative subreddits
        top_subreddits = subreddit_breakdown.get("top_subreddits", {})
        
        positive_subreddits = []
        negative_subreddits = []
        
        for subreddit, stats in top_subreddits.items():
            if stats.get("avg_score", 0) > 5:
                positive_subreddits.append(subreddit)
            elif stats.get("avg_score", 0) < -2:
                negative_subreddits.append(subreddit)
        
        return {
            "positive_drivers": {
                "subreddits": positive_subreddits[:5],
                "factors": ["High engagement", "Positive community sentiment"]
            },
            "negative_drivers": {
                "subreddits": negative_subreddits[:5],
                "factors": ["Low engagement", "Critical discussions"]
            },
            "key_metrics": {
                "engagement_impact": "High" if sentiment_analysis.get("sentiment_score", 0) > 0 else "Low",
                "volume_impact": "High" if brand_data.get("total_mentions", 0) > 100 else "Medium" if brand_data.get("total_mentions", 0) > 20 else "Low"
            }
        }
    
    def _generate_reputation_recommendations(
        self,
        reputation_score: Dict,
        sentiment_trends: Dict,
        sentiment_drivers: Dict
    ) -> List[Dict]:
        """Generate actionable reputation management recommendations"""
        
        recommendations = []
        
        score = reputation_score.get("score", 0)
        trend = sentiment_trends.get("trend_direction", "stable")
        
        # Score-based recommendations
        if score < 40:
            recommendations.append({
                "priority": "high",
                "category": "reputation_recovery",
                "title": "Immediate Reputation Recovery Needed",
                "description": "Brand reputation is critically low. Implement crisis management protocols.",
                "actions": [
                    "Address negative feedback directly",
                    "Increase positive community engagement",
                    "Monitor mentions more frequently"
                ]
            })
        elif score < 60:
            recommendations.append({
                "priority": "medium",
                "category": "reputation_improvement",
                "title": "Focus on Reputation Improvement",
                "description": "Brand reputation needs attention to prevent further decline.",
                "actions": [
                    "Engage with community feedback",
                    "Highlight positive customer experiences",
                    "Address common concerns proactively"
                ]
            })
        
        # Trend-based recommendations
        if trend == "declining":
            recommendations.append({
                "priority": "high",
                "category": "trend_reversal",
                "title": "Reverse Negative Sentiment Trend",
                "description": "Brand sentiment is declining. Take immediate action.",
                "actions": [
                    "Identify root causes of negative sentiment",
                    "Implement targeted engagement campaigns",
                    "Monitor competitor activities"
                ]
            })
        elif trend == "improving":
            recommendations.append({
                "priority": "low",
                "category": "momentum_building",
                "title": "Build on Positive Momentum",
                "description": "Brand sentiment is improving. Capitalize on this trend.",
                "actions": [
                    "Amplify positive feedback",
                    "Expand successful engagement strategies",
                    "Document best practices"
                ]
            })
        
        # Driver-based recommendations
        negative_subreddits = sentiment_drivers.get("negative_drivers", {}).get("subreddits", [])
        if negative_subreddits:
            recommendations.append({
                "priority": "medium",
                "category": "targeted_engagement",
                "title": "Address Negative Communities",
                "description": f"Focus on improving sentiment in: {', '.join(negative_subreddits[:3])}",
                "actions": [
                    "Engage directly with these communities",
                    "Address specific concerns raised",
                    "Provide value-added content"
                ]
            })
        
        return recommendations
    
    def _compare_brand_metrics(self, brand_analyses: Dict) -> Dict:
        """Compare metrics across multiple brands"""
        
        comparison = {}
        
        for brand, analysis in brand_analyses.items():
            comparison[brand] = {
                "total_mentions": analysis.get("total_mentions", 0),
                "sentiment_score": analysis.get("sentiment_analysis", {}).get("sentiment_score", 0),
                "engagement_rate": analysis.get("mention_breakdown", {}).get("engagement_rate", 0),
                "growth_rate": analysis.get("trends", {}).get("growth_rate", 0)
            }
        
        # Rank brands by each metric
        rankings = {}
        for metric in ["total_mentions", "sentiment_score", "engagement_rate", "growth_rate"]:
            sorted_brands = sorted(
                comparison.items(),
                key=lambda x: x[1][metric],
                reverse=True
            )
            rankings[metric] = [brand for brand, _ in sorted_brands]
        
        return {
            "brand_metrics": comparison,
            "rankings": rankings
        }
    
    def _calculate_market_share(self, brand_analyses: Dict) -> Dict:
        """Calculate market share based on mention volume"""
        
        total_mentions = sum(
            analysis.get("total_mentions", 0) 
            for analysis in brand_analyses.values()
        )
        
        market_share = {}
        for brand, analysis in brand_analyses.items():
            mentions = analysis.get("total_mentions", 0)
            share = (mentions / total_mentions * 100) if total_mentions > 0 else 0
            market_share[brand] = {
                "mentions": mentions,
                "share_percentage": share
            }
        
        # Sort by market share
        sorted_share = sorted(
            market_share.items(),
            key=lambda x: x[1]["share_percentage"],
            reverse=True
        )
        
        return {
            "total_market_mentions": total_mentions,
            "brand_shares": dict(sorted_share),
            "market_leader": sorted_share[0][0] if sorted_share else None
        }
    
    def _analyze_competitive_positioning(self, brand_analyses: Dict) -> Dict:
        """Analyze competitive positioning"""
        
        positioning = {}
        
        for brand, analysis in brand_analyses.items():
            sentiment_score = analysis.get("sentiment_analysis", {}).get("sentiment_score", 0)
            mentions = analysis.get("total_mentions", 0)
            
            # Determine quadrant (high/low sentiment vs high/low volume)
            high_sentiment = sentiment_score > 0.1
            high_volume = mentions > 50  # Adjust threshold as needed
            
            if high_sentiment and high_volume:
                quadrant = "market_leader"
            elif high_sentiment and not high_volume:
                quadrant = "niche_favorite"
            elif not high_sentiment and high_volume:
                quadrant = "challenged_leader"
            else:
                quadrant = "underperformer"
            
            positioning[brand] = {
                "quadrant": quadrant,
                "sentiment_score": sentiment_score,
                "mention_volume": mentions,
                "competitive_strength": "strong" if high_sentiment else "weak"
            }
        
        return positioning
    
    def _identify_competitive_opportunities(
        self, 
        primary_brand: str, 
        brand_analyses: Dict
    ) -> List[Dict]:
        """Identify competitive opportunities"""
        
        opportunities = []
        primary_analysis = brand_analyses.get(primary_brand, {})
        primary_sentiment = primary_analysis.get("sentiment_analysis", {}).get("sentiment_score", 0)
        primary_mentions = primary_analysis.get("total_mentions", 0)
        
        for competitor, analysis in brand_analyses.items():
            if competitor == primary_brand:
                continue
            
            competitor_sentiment = analysis.get("sentiment_analysis", {}).get("sentiment_score", 0)
            competitor_mentions = analysis.get("total_mentions", 0)
            
            # Identify opportunities
            if competitor_sentiment < primary_sentiment and competitor_mentions > primary_mentions:
                opportunities.append({
                    "type": "sentiment_advantage",
                    "competitor": competitor,
                    "description": f"You have better sentiment than {competitor} despite lower mention volume",
                    "action": "Increase brand awareness to capitalize on positive sentiment"
                })
            
            if competitor_mentions < primary_mentions and competitor_sentiment > primary_sentiment:
                opportunities.append({
                    "type": "volume_advantage",
                    "competitor": competitor,
                    "description": f"You have higher mention volume than {competitor} but lower sentiment",
                    "action": "Focus on improving brand sentiment and reputation"
                })
            
            # Gap analysis
            sentiment_gap = competitor_sentiment - primary_sentiment
            volume_gap = competitor_mentions - primary_mentions
            
            if sentiment_gap > 0.2:
                opportunities.append({
                    "type": "sentiment_gap",
                    "competitor": competitor,
                    "description": f"Significant sentiment gap with {competitor}",
                    "action": "Analyze their positive engagement strategies"
                })
            
            if volume_gap > 100:
                opportunities.append({
                    "type": "awareness_gap",
                    "competitor": competitor,
                    "description": f"Significant awareness gap with {competitor}",
                    "action": "Increase marketing and community engagement efforts"
                })
        
        return opportunities[:5]  # Return top 5 opportunities