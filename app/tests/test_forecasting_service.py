"""
Tests for Forecasting Service

Tests demand forecasting, trend prediction, and engagement analytics functionality.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
import numpy as np

from app.services.forecasting_service import ForecastingService
from app.models.post import Post
from app.models.keyword import Keyword


class TestForecastingService:
    """Test cases for ForecastingService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = ForecastingService()
        self.mock_db = Mock()
        
        # Create sample historical data
        self.sample_historical_data = []
        base_date = datetime.utcnow() - timedelta(days=30)
        
        for i in range(30):
            date = base_date + timedelta(days=i)
            self.sample_historical_data.append({
                'date': date.date(),
                'post_count': 10 + i + np.random.randint(-3, 4),
                'total_score': 100 + i * 5 + np.random.randint(-20, 21),
                'total_comments': 50 + i * 2 + np.random.randint(-10, 11),
                'subreddits': 3 + np.random.randint(-1, 2)
            })
    
    @pytest.mark.asyncio
    async def test_predict_keyword_trends_success(self):
        """Test successful keyword trend prediction"""
        
        # Mock the historical data retrieval
        with patch.object(
            self.service, 
            '_get_keyword_historical_data',
            return_value=self.sample_historical_data
        ):
            result = await self.service.predict_keyword_trends(
                keyword="test_keyword",
                days_ahead=7,
                db=self.mock_db
            )
            
            # Verify result structure
            assert "keyword" in result
            assert "forecast_period" in result
            assert "historical_summary" in result
            assert "predictions" in result
            assert "confidence_intervals" in result
            
            assert result["keyword"] == "test_keyword"
            assert result["forecast_period"] == 7
            assert len(result["predictions"]) == 7
            
            # Verify prediction structure
            prediction = result["predictions"][0]
            assert "day" in prediction
            assert "predicted_posts" in prediction
            assert "predicted_score" in prediction
            assert "trend_strength" in prediction
    
    @pytest.mark.asyncio
    async def test_predict_keyword_trends_insufficient_data(self):
        """Test keyword trend prediction with insufficient data"""
        
        # Mock insufficient historical data
        insufficient_data = self.sample_historical_data[:5]  # Only 5 days
        
        with patch.object(
            self.service,
            '_get_keyword_historical_data',
            return_value=insufficient_data
        ):
            result = await self.service.predict_keyword_trends(
                keyword="test_keyword",
                days_ahead=7,
                db=self.mock_db
            )
            
            # Should return error for insufficient data
            assert "error" in result
            assert "minimum_days_required" in result
            assert result["minimum_days_required"] == 7
    
    @pytest.mark.asyncio
    async def test_forecast_engagement_patterns_success(self):
        """Test successful engagement pattern forecasting"""
        
        # Create sample engagement data
        engagement_data = []
        base_date = datetime.utcnow() - timedelta(days=20)
        
        for i in range(20):
            date = base_date + timedelta(days=i)
            engagement_data.append({
                'date': date.date(),
                'posts': 15 + np.random.randint(-3, 4),
                'avg_score': 50 + np.random.randint(-10, 11),
                'avg_comments': 25 + np.random.randint(-5, 6),
                'engagement_rate': 75 + np.random.randint(-15, 16)
            })
        
        with patch.object(
            self.service,
            '_get_engagement_historical_data',
            return_value=engagement_data
        ):
            result = await self.service.forecast_engagement_patterns(
                subreddit="test_subreddit",
                keyword="test_keyword",
                days_ahead=7,
                db=self.mock_db
            )
            
            # Verify result structure
            assert "subreddit" in result
            assert "keyword" in result
            assert "forecast_period" in result
            assert "engagement_patterns" in result
            assert "forecasts" in result
            
            assert result["subreddit"] == "test_subreddit"
            assert result["keyword"] == "test_keyword"
            assert len(result["forecasts"]) == 7
            
            # Verify engagement patterns
            patterns = result["engagement_patterns"]
            assert "overall_avg_engagement" in patterns
            assert "engagement_volatility" in patterns
            assert "weekly_patterns" in patterns
            assert "trend_direction" in patterns
    
    @pytest.mark.asyncio
    async def test_predict_trending_topics_success(self):
        """Test successful trending topics prediction"""
        
        # Mock keyword activity data
        keyword_activity = [
            {
                'keyword': 'trending_keyword_1',
                'historical_data': self.sample_historical_data
            },
            {
                'keyword': 'trending_keyword_2', 
                'historical_data': self.sample_historical_data
            }
        ]
        
        with patch.object(
            self.service,
            '_get_recent_keyword_activity',
            return_value=keyword_activity
        ):
            result = await self.service.predict_trending_topics(
                days_ahead=7,
                confidence_threshold=0.5,
                db=self.mock_db
            )
            
            # Verify result structure
            assert "forecast_period" in result
            assert "confidence_threshold" in result
            assert "trending_predictions" in result
            assert "total_analyzed" in result
            
            assert result["forecast_period"] == 7
            assert result["confidence_threshold"] == 0.5
            assert result["total_analyzed"] == 2
            
            # Verify predictions are sorted by confidence
            predictions = result["trending_predictions"]
            if len(predictions) > 1:
                for i in range(len(predictions) - 1):
                    assert predictions[i]["confidence"] >= predictions[i + 1]["confidence"]
    
    def test_calculate_trend_metrics(self):
        """Test trend metrics calculation"""
        
        result = self.service._calculate_trend_metrics(self.sample_historical_data)
        
        # Verify all required metrics are present
        required_metrics = [
            'average_daily_posts',
            'average_daily_score', 
            'post_trend_slope',
            'score_trend_slope',
            'post_volatility',
            'score_volatility',
            'data_points'
        ]
        
        for metric in required_metrics:
            assert metric in result
            assert isinstance(result[metric], (int, float))
        
        assert result['data_points'] == len(self.sample_historical_data)
    
    def test_generate_trend_predictions(self):
        """Test trend prediction generation"""
        
        # Calculate trend metrics first
        trend_metrics = self.service._calculate_trend_metrics(self.sample_historical_data)
        
        # Generate predictions
        predictions = self.service._generate_trend_predictions(
            self.sample_historical_data,
            days_ahead=5,
            trend_metrics=trend_metrics
        )
        
        # Verify predictions structure
        assert len(predictions) == 5
        
        for i, prediction in enumerate(predictions):
            assert prediction['day'] == i + 1
            assert 'predicted_posts' in prediction
            assert 'predicted_score' in prediction
            assert 'trend_strength' in prediction
            
            # Predictions should be non-negative
            assert prediction['predicted_posts'] >= 0
            assert prediction['predicted_score'] >= 0
    
    def test_calculate_confidence_intervals(self):
        """Test confidence interval calculation"""
        
        # Create sample predictions
        predictions = [
            {'day': 1, 'predicted_posts': 15, 'predicted_score': 150},
            {'day': 2, 'predicted_posts': 16, 'predicted_score': 160},
            {'day': 3, 'predicted_posts': 17, 'predicted_score': 170}
        ]
        
        confidence_intervals = self.service._calculate_confidence_intervals(
            self.sample_historical_data,
            predictions
        )
        
        # Verify confidence levels
        expected_levels = ['80%', '90%', '95%']
        for level in expected_levels:
            assert level in confidence_intervals
            intervals = confidence_intervals[level]
            assert len(intervals) == len(predictions)
            
            for interval in intervals:
                assert 'day' in interval
                assert 'lower_bound' in interval
                assert 'upper_bound' in interval
                assert interval['lower_bound'] <= interval['upper_bound']
    
    def test_analyze_engagement_patterns(self):
        """Test engagement pattern analysis"""
        
        # Create engagement data with weekly patterns
        engagement_data = []
        base_date = datetime.utcnow() - timedelta(days=21)  # 3 weeks
        
        for i in range(21):
            date = base_date + timedelta(days=i)
            # Simulate higher engagement on weekends
            day_of_week = date.weekday()
            base_engagement = 50
            if day_of_week >= 5:  # Weekend
                base_engagement = 75
            
            engagement_data.append({
                'date': date.date(),
                'engagement_rate': base_engagement + np.random.randint(-5, 6)
            })
        
        patterns = self.service._analyze_engagement_patterns(engagement_data)
        
        # Verify pattern structure
        assert 'overall_avg_engagement' in patterns
        assert 'engagement_volatility' in patterns
        assert 'weekly_patterns' in patterns
        assert 'trend_direction' in patterns
        
        # Verify weekly patterns (should have 7 days)
        weekly_patterns = patterns['weekly_patterns']
        assert len(weekly_patterns) <= 7  # May not have data for all days
        
        # Weekend days should have higher engagement
        if '5' in weekly_patterns and '6' in weekly_patterns:  # Sat, Sun
            weekend_avg = (weekly_patterns['5'] + weekly_patterns['6']) / 2
            weekday_values = [v for k, v in weekly_patterns.items() if k not in ['5', '6']]
            if weekday_values:
                weekday_avg = sum(weekday_values) / len(weekday_values)
                assert weekend_avg > weekday_avg
    
    def test_calculate_trend_momentum(self):
        """Test trend momentum calculation"""
        
        keyword_data = {
            'keyword': 'test_keyword',
            'historical_data': self.sample_historical_data
        }
        
        momentum = self.service._calculate_trend_momentum(keyword_data)
        
        # Verify momentum structure
        assert 'score' in momentum
        assert 'confidence' in momentum
        assert 'growth_rate' in momentum
        assert 'predicted_peak' in momentum
        assert 'factors' in momentum
        
        # Verify confidence is between 0 and 1
        assert 0 <= momentum['confidence'] <= 1
        
        # Verify factors structure
        factors = momentum['factors']
        assert 'recent_activity' in factors
        assert 'historical_activity' in factors
        assert 'consistency' in factors
    
    def test_insufficient_data_handling(self):
        """Test handling of insufficient data scenarios"""
        
        # Test with empty data
        empty_metrics = self.service._calculate_trend_metrics([])
        assert empty_metrics == {}
        
        # Test with minimal data
        minimal_data = self.sample_historical_data[:3]
        minimal_momentum = self.service._calculate_trend_momentum({
            'keyword': 'test',
            'historical_data': minimal_data
        })
        
        # Should return low confidence for insufficient data
        assert minimal_momentum['confidence'] == 0
        assert minimal_momentum['score'] == 0
    
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling in forecasting methods"""
        
        # Test with database error
        with patch.object(
            self.service,
            '_get_keyword_historical_data',
            side_effect=Exception("Database error")
        ):
            with pytest.raises(Exception):
                await self.service.predict_keyword_trends(
                    keyword="test_keyword",
                    days_ahead=7,
                    db=self.mock_db
                )
    
    def test_confidence_level_configuration(self):
        """Test confidence level configuration"""
        
        # Verify default confidence levels
        expected_levels = [0.8, 0.9, 0.95]
        assert self.service.confidence_levels == expected_levels
        
        # Test with custom confidence levels
        custom_service = ForecastingService()
        custom_service.confidence_levels = [0.7, 0.85, 0.99]
        
        predictions = [{'day': 1, 'predicted_posts': 15}]
        intervals = custom_service._calculate_confidence_intervals(
            self.sample_historical_data,
            predictions
        )
        
        # Should have custom confidence levels
        assert '70%' in intervals
        assert '85%' in intervals
        assert '99%' in intervals