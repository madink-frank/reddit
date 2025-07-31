"""
Demand Forecasting Service

Provides predictive analytics for keyword trends, engagement forecasting,
and trend prediction with confidence intervals.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.post import Post
from app.models.keyword import Keyword
from app.core.database import get_db

logger = logging.getLogger(__name__)


class ForecastingService:
    """Service for demand forecasting and predictive analytics"""
    
    def __init__(self):
        self.confidence_levels = [0.8, 0.9, 0.95]  # 80%, 90%, 95% confidence intervals
    
    async def predict_keyword_trends(
        self,
        keyword: str,
        days_ahead: int = 30,
        db: Session = None
    ) -> Dict:
        """
        Predict keyword trend patterns for specified days ahead
        
        Args:
            keyword: Keyword to analyze
            days_ahead: Number of days to forecast
            db: Database session
            
        Returns:
            Dictionary containing trend predictions with confidence intervals
        """
        try:
            if not db:
                db = next(get_db())
            
            # Get historical data for the keyword
            historical_data = await self._get_keyword_historical_data(keyword, db)
            
            if len(historical_data) < 7:  # Need at least a week of data
                return {
                    "error": "Insufficient historical data for prediction",
                    "minimum_days_required": 7,
                    "available_days": len(historical_data)
                }
            
            # Calculate trend metrics
            trend_metrics = self._calculate_trend_metrics(historical_data)
            
            # Generate predictions
            predictions = self._generate_trend_predictions(
                historical_data, 
                days_ahead,
                trend_metrics
            )
            
            # Calculate confidence intervals
            confidence_intervals = self._calculate_confidence_intervals(
                historical_data,
                predictions
            )
            
            return {
                "keyword": keyword,
                "forecast_period": days_ahead,
                "historical_summary": trend_metrics,
                "predictions": predictions,
                "confidence_intervals": confidence_intervals,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error predicting keyword trends for {keyword}: {str(e)}")
            raise
    
    async def forecast_engagement_patterns(
        self,
        subreddit: Optional[str] = None,
        keyword: Optional[str] = None,
        days_ahead: int = 14,
        db: Session = None
    ) -> Dict:
        """
        Forecast engagement patterns based on historical data
        
        Args:
            subreddit: Optional subreddit filter
            keyword: Optional keyword filter
            days_ahead: Number of days to forecast
            db: Database session
            
        Returns:
            Dictionary containing engagement forecasts
        """
        try:
            if not db:
                db = next(get_db())
            
            # Get historical engagement data
            engagement_data = await self._get_engagement_historical_data(
                subreddit, keyword, db
            )
            
            if len(engagement_data) < 14:  # Need at least 2 weeks of data
                return {
                    "error": "Insufficient engagement data for forecasting",
                    "minimum_days_required": 14,
                    "available_days": len(engagement_data)
                }
            
            # Analyze engagement patterns
            patterns = self._analyze_engagement_patterns(engagement_data)
            
            # Generate engagement forecasts
            forecasts = self._generate_engagement_forecasts(
                engagement_data,
                patterns,
                days_ahead
            )
            
            return {
                "subreddit": subreddit,
                "keyword": keyword,
                "forecast_period": days_ahead,
                "engagement_patterns": patterns,
                "forecasts": forecasts,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error forecasting engagement: {str(e)}")
            raise
    
    async def predict_trending_topics(
        self,
        days_ahead: int = 7,
        confidence_threshold: float = 0.7,
        db: Session = None
    ) -> Dict:
        """
        Predict which topics are likely to trend in the future
        
        Args:
            days_ahead: Number of days to predict ahead
            confidence_threshold: Minimum confidence for predictions
            db: Database session
            
        Returns:
            Dictionary containing trending topic predictions
        """
        try:
            if not db:
                db = next(get_db())
            
            # Get recent keyword activity
            keyword_activity = await self._get_recent_keyword_activity(db)
            
            # Calculate trend momentum for each keyword
            trend_predictions = []
            
            for keyword_data in keyword_activity:
                momentum = self._calculate_trend_momentum(keyword_data)
                
                if momentum['confidence'] >= confidence_threshold:
                    prediction = {
                        "keyword": keyword_data['keyword'],
                        "current_momentum": momentum['score'],
                        "confidence": momentum['confidence'],
                        "predicted_peak_date": momentum['predicted_peak'],
                        "growth_rate": momentum['growth_rate'],
                        "factors": momentum['factors']
                    }
                    trend_predictions.append(prediction)
            
            # Sort by confidence and momentum
            trend_predictions.sort(
                key=lambda x: (x['confidence'], x['current_momentum']), 
                reverse=True
            )
            
            return {
                "forecast_period": days_ahead,
                "confidence_threshold": confidence_threshold,
                "trending_predictions": trend_predictions[:20],  # Top 20
                "total_analyzed": len(keyword_activity),
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error predicting trending topics: {str(e)}")
            raise
    
    async def _get_keyword_historical_data(
        self, 
        keyword: str, 
        db: Session,
        days_back: int = 90
    ) -> List[Dict]:
        """Get historical data for a specific keyword"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        # Query posts containing the keyword
        posts = db.query(Post).filter(
            and_(
                Post.created_at >= start_date,
                Post.created_at <= end_date,
                func.lower(Post.title).contains(keyword.lower()) |
                func.lower(Post.content).contains(keyword.lower())
            )
        ).all()
        
        # Group by date and calculate daily metrics
        daily_data = {}
        for post in posts:
            date_key = post.created_at.date()
            
            if date_key not in daily_data:
                daily_data[date_key] = {
                    'date': date_key,
                    'post_count': 0,
                    'total_score': 0,
                    'total_comments': 0,
                    'subreddits': set()
                }
            
            daily_data[date_key]['post_count'] += 1
            daily_data[date_key]['total_score'] += post.score or 0
            daily_data[date_key]['total_comments'] += post.comment_count or 0
            daily_data[date_key]['subreddits'].add(post.subreddit)
        
        # Convert to list and fill missing dates
        result = []
        current_date = start_date.date()
        
        while current_date <= end_date.date():
            if current_date in daily_data:
                data = daily_data[current_date]
                data['subreddits'] = len(data['subreddits'])
                result.append(data)
            else:
                result.append({
                    'date': current_date,
                    'post_count': 0,
                    'total_score': 0,
                    'total_comments': 0,
                    'subreddits': 0
                })
            
            current_date += timedelta(days=1)
        
        return result
    
    async def _get_engagement_historical_data(
        self,
        subreddit: Optional[str],
        keyword: Optional[str],
        db: Session,
        days_back: int = 60
    ) -> List[Dict]:
        """Get historical engagement data"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        query = db.query(Post).filter(
            and_(
                Post.created_at >= start_date,
                Post.created_at <= end_date
            )
        )
        
        if subreddit:
            query = query.filter(Post.subreddit == subreddit)
        
        if keyword:
            query = query.filter(
                func.lower(Post.title).contains(keyword.lower()) |
                func.lower(Post.content).contains(keyword.lower())
            )
        
        posts = query.all()
        
        # Group by date and calculate engagement metrics
        daily_engagement = {}
        for post in posts:
            date_key = post.created_at.date()
            
            if date_key not in daily_engagement:
                daily_engagement[date_key] = {
                    'date': date_key,
                    'posts': 0,
                    'avg_score': 0,
                    'avg_comments': 0,
                    'engagement_rate': 0,
                    'scores': [],
                    'comments': []
                }
            
            daily_engagement[date_key]['posts'] += 1
            daily_engagement[date_key]['scores'].append(post.score or 0)
            daily_engagement[date_key]['comments'].append(post.comment_count or 0)
        
        # Calculate averages and engagement rates
        result = []
        for date_key, data in daily_engagement.items():
            if data['posts'] > 0:
                data['avg_score'] = np.mean(data['scores'])
                data['avg_comments'] = np.mean(data['comments'])
                data['engagement_rate'] = (data['avg_score'] + data['avg_comments']) / data['posts']
                
                # Remove raw arrays for cleaner output
                del data['scores']
                del data['comments']
                
                result.append(data)
        
        return sorted(result, key=lambda x: x['date'])
    
    async def _get_recent_keyword_activity(
        self, 
        db: Session,
        days_back: int = 30
    ) -> List[Dict]:
        """Get recent activity for all keywords"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        # Get all keywords
        keywords = db.query(Keyword).all()
        
        keyword_activity = []
        for keyword in keywords:
            historical_data = await self._get_keyword_historical_data(
                keyword.keyword, db, days_back
            )
            
            if historical_data:
                keyword_activity.append({
                    'keyword': keyword.keyword,
                    'historical_data': historical_data
                })
        
        return keyword_activity
    
    def _calculate_trend_metrics(self, historical_data: List[Dict]) -> Dict:
        """Calculate trend metrics from historical data"""
        
        if not historical_data:
            return {}
        
        post_counts = [d['post_count'] for d in historical_data]
        scores = [d['total_score'] for d in historical_data]
        
        # Calculate basic statistics
        avg_posts = np.mean(post_counts)
        avg_score = np.mean(scores)
        
        # Calculate trend direction (linear regression slope)
        x = np.arange(len(post_counts))
        post_trend = np.polyfit(x, post_counts, 1)[0] if len(post_counts) > 1 else 0
        score_trend = np.polyfit(x, scores, 1)[0] if len(scores) > 1 else 0
        
        # Calculate volatility (standard deviation)
        post_volatility = np.std(post_counts)
        score_volatility = np.std(scores)
        
        return {
            'average_daily_posts': float(avg_posts),
            'average_daily_score': float(avg_score),
            'post_trend_slope': float(post_trend),
            'score_trend_slope': float(score_trend),
            'post_volatility': float(post_volatility),
            'score_volatility': float(score_volatility),
            'data_points': len(historical_data)
        }
    
    def _generate_trend_predictions(
        self,
        historical_data: List[Dict],
        days_ahead: int,
        trend_metrics: Dict
    ) -> List[Dict]:
        """Generate trend predictions based on historical patterns"""
        
        predictions = []
        
        # Use simple linear extrapolation with seasonal adjustments
        base_posts = trend_metrics['average_daily_posts']
        post_trend = trend_metrics['post_trend_slope']
        
        base_score = trend_metrics['average_daily_score']
        score_trend = trend_metrics['score_trend_slope']
        
        for day in range(1, days_ahead + 1):
            # Linear prediction with trend
            predicted_posts = max(0, base_posts + (post_trend * day))
            predicted_score = max(0, base_score + (score_trend * day))
            
            # Add some seasonal variation (simplified)
            seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * day / 7)  # Weekly pattern
            
            predictions.append({
                'day': day,
                'predicted_posts': float(predicted_posts * seasonal_factor),
                'predicted_score': float(predicted_score * seasonal_factor),
                'trend_strength': abs(post_trend) + abs(score_trend)
            })
        
        return predictions
    
    def _calculate_confidence_intervals(
        self,
        historical_data: List[Dict],
        predictions: List[Dict]
    ) -> Dict:
        """Calculate confidence intervals for predictions"""
        
        post_counts = [d['post_count'] for d in historical_data]
        post_std = np.std(post_counts)
        
        confidence_intervals = {}
        
        for confidence_level in self.confidence_levels:
            # Calculate z-score for confidence level
            if confidence_level == 0.8:
                z_score = 1.28
            elif confidence_level == 0.9:
                z_score = 1.645
            else:  # 0.95
                z_score = 1.96
            
            intervals = []
            for pred in predictions:
                margin = z_score * post_std
                intervals.append({
                    'day': pred['day'],
                    'lower_bound': max(0, pred['predicted_posts'] - margin),
                    'upper_bound': pred['predicted_posts'] + margin
                })
            
            confidence_intervals[f"{int(confidence_level * 100)}%"] = intervals
        
        return confidence_intervals
    
    def _analyze_engagement_patterns(self, engagement_data: List[Dict]) -> Dict:
        """Analyze engagement patterns from historical data"""
        
        if not engagement_data:
            return {}
        
        engagement_rates = [d['engagement_rate'] for d in engagement_data]
        
        # Weekly pattern analysis
        weekly_patterns = {}
        for i, data in enumerate(engagement_data):
            day_of_week = data['date'].weekday()  # 0 = Monday
            
            if day_of_week not in weekly_patterns:
                weekly_patterns[day_of_week] = []
            
            weekly_patterns[day_of_week].append(data['engagement_rate'])
        
        # Calculate average engagement by day of week
        weekly_averages = {}
        for day, rates in weekly_patterns.items():
            weekly_averages[day] = np.mean(rates)
        
        return {
            'overall_avg_engagement': float(np.mean(engagement_rates)),
            'engagement_volatility': float(np.std(engagement_rates)),
            'weekly_patterns': {str(k): float(v) for k, v in weekly_averages.items()},
            'trend_direction': 'increasing' if engagement_rates[-7:] > engagement_rates[:7] else 'decreasing'
        }
    
    def _generate_engagement_forecasts(
        self,
        engagement_data: List[Dict],
        patterns: Dict,
        days_ahead: int
    ) -> List[Dict]:
        """Generate engagement forecasts"""
        
        forecasts = []
        base_engagement = patterns['overall_avg_engagement']
        
        for day in range(1, days_ahead + 1):
            # Get day of week for seasonal adjustment
            future_date = datetime.utcnow().date() + timedelta(days=day)
            day_of_week = future_date.weekday()
            
            # Apply weekly pattern
            weekly_multiplier = patterns['weekly_patterns'].get(str(day_of_week), 1.0)
            seasonal_adjustment = weekly_multiplier / patterns['overall_avg_engagement']
            
            predicted_engagement = base_engagement * seasonal_adjustment
            
            forecasts.append({
                'day': day,
                'date': future_date.isoformat(),
                'predicted_engagement_rate': float(predicted_engagement),
                'day_of_week': day_of_week,
                'seasonal_factor': float(seasonal_adjustment)
            })
        
        return forecasts
    
    def _calculate_trend_momentum(self, keyword_data: Dict) -> Dict:
        """Calculate trend momentum for a keyword"""
        
        historical_data = keyword_data['historical_data']
        
        if len(historical_data) < 7:
            return {'confidence': 0, 'score': 0}
        
        # Get recent vs older data
        recent_data = historical_data[-7:]  # Last 7 days
        older_data = historical_data[-14:-7]  # Previous 7 days
        
        recent_avg = np.mean([d['post_count'] for d in recent_data])
        older_avg = np.mean([d['post_count'] for d in older_data])
        
        # Calculate growth rate
        if older_avg > 0:
            growth_rate = (recent_avg - older_avg) / older_avg
        else:
            growth_rate = 1.0 if recent_avg > 0 else 0
        
        # Calculate momentum score
        momentum_score = growth_rate * recent_avg
        
        # Calculate confidence based on data consistency
        recent_std = np.std([d['post_count'] for d in recent_data])
        confidence = max(0, min(1, 1 - (recent_std / (recent_avg + 1))))
        
        # Predict peak date (simplified)
        if growth_rate > 0:
            days_to_peak = min(7, int(1 / growth_rate)) if growth_rate > 0.1 else 7
            predicted_peak = datetime.utcnow().date() + timedelta(days=days_to_peak)
        else:
            predicted_peak = None
        
        return {
            'score': float(momentum_score),
            'confidence': float(confidence),
            'growth_rate': float(growth_rate),
            'predicted_peak': predicted_peak.isoformat() if predicted_peak else None,
            'factors': {
                'recent_activity': float(recent_avg),
                'historical_activity': float(older_avg),
                'consistency': float(1 - recent_std / (recent_avg + 1))
            }
        }