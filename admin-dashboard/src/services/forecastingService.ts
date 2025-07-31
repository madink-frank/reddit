/**
 * Forecasting Service
 * 
 * Handles API calls for demand forecasting, trend prediction,
 * and engagement analytics.
 */

import apiClient from './api';

export interface TrendPrediction {
  day: number;
  predicted_posts: number;
  predicted_score: number;
  trend_strength: number;
}

export interface ConfidenceInterval {
  day: number;
  lower_bound: number;
  upper_bound: number;
}

export interface KeywordTrendForecast {
  keyword: string;
  forecast_period: number;
  historical_summary: {
    average_daily_posts: number;
    average_daily_score: number;
    post_trend_slope: number;
    score_trend_slope: number;
    post_volatility: number;
    score_volatility: number;
    data_points: number;
  };
  predictions: TrendPrediction[];
  confidence_intervals: {
    [key: string]: ConfidenceInterval[];
  };
  generated_at: string;
}

export interface EngagementForecast {
  subreddit?: string;
  keyword?: string;
  forecast_period: number;
  engagement_patterns: {
    overall_avg_engagement: number;
    engagement_volatility: number;
    weekly_patterns: { [key: string]: number };
    trend_direction: 'increasing' | 'decreasing';
  };
  forecasts: {
    day: number;
    date: string;
    predicted_engagement_rate: number;
    day_of_week: number;
    seasonal_factor: number;
  }[];
  generated_at: string;
}

export interface TrendingPrediction {
  keyword: string;
  current_momentum: number;
  confidence: number;
  predicted_peak_date: string | null;
  growth_rate: number;
  factors: {
    recent_activity: number;
    historical_activity: number;
    consistency: number;
  };
}

export interface TrendingTopicsPrediction {
  forecast_period: number;
  confidence_threshold: number;
  trending_predictions: TrendingPrediction[];
  total_analyzed: number;
  generated_at: string;
}

export interface TrendAnalysis {
  keyword: string;
  analysis_period: number;
  historical_data: any[];
  trend_metrics: {
    average_daily_posts: number;
    average_daily_score: number;
    post_trend_slope: number;
    score_trend_slope: number;
    post_volatility: number;
    score_volatility: number;
    data_points: number;
  };
  short_term_predictions: TrendPrediction[];
  confidence_intervals: {
    [key: string]: ConfidenceInterval[];
  };
  insights: {
    trend_direction: 'increasing' | 'decreasing';
    volatility_level: 'high' | 'low';
    data_quality: 'good' | 'limited';
  };
}

export interface MarketInsights {
  timeframe: 'day' | 'week' | 'month';
  summary: {
    trending_topics_count: number;
    high_confidence_predictions: number;
    overall_engagement_trend: string;
  };
  top_trending: TrendingPrediction[];
  engagement_forecast: any[];
  recommendations: {
    type: 'opportunity' | 'positive' | 'warning';
    message: string;
    action: string;
  }[];
}

class ForecastingService {
  /**
   * Predict keyword trend patterns
   */
  async predictKeywordTrends(
    keyword: string,
    daysAhead: number = 30
  ): Promise<KeywordTrendForecast> {
    const response = await apiClient.get(`/forecasting/keyword-trends/${encodeURIComponent(keyword)}`, {
      params: { days_ahead: daysAhead }
    });
    return response.data.data;
  }

  /**
   * Forecast engagement patterns
   */
  async forecastEngagementPatterns(
    options: {
      subreddit?: string;
      keyword?: string;
      daysAhead?: number;
    } = {}
  ): Promise<EngagementForecast> {
    const params: any = {};
    
    if (options.subreddit) params.subreddit = options.subreddit;
    if (options.keyword) params.keyword = options.keyword;
    if (options.daysAhead) params.days_ahead = options.daysAhead;

    const response = await apiClient.get('/forecasting/engagement-forecast', { params });
    return response.data.data;
  }

  /**
   * Predict trending topics
   */
  async predictTrendingTopics(
    daysAhead: number = 7,
    confidenceThreshold: number = 0.7
  ): Promise<TrendingTopicsPrediction> {
    const response = await apiClient.get('/forecasting/trending-predictions', {
      params: {
        days_ahead: daysAhead,
        confidence_threshold: confidenceThreshold
      }
    });
    return response.data.data;
  }

  /**
   * Get comprehensive trend analysis for a keyword
   */
  async getTrendAnalysis(
    keyword: string,
    daysBack: number = 90
  ): Promise<TrendAnalysis> {
    const response = await apiClient.get(`/forecasting/trend-analysis/${encodeURIComponent(keyword)}`, {
      params: { days_back: daysBack }
    });
    return response.data.data;
  }

  /**
   * Get market insights and trend summaries
   */
  async getMarketInsights(
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<MarketInsights> {
    const response = await apiClient.get('/forecasting/market-insights', {
      params: { timeframe }
    });
    return response.data.data;
  }

  /**
   * Get multiple keyword trend forecasts
   */
  async getMultipleKeywordForecasts(
    keywords: string[],
    daysAhead: number = 30
  ): Promise<KeywordTrendForecast[]> {
    const promises = keywords.map(keyword => 
      this.predictKeywordTrends(keyword, daysAhead)
    );
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple keyword forecasts:', error);
      throw error;
    }
  }

  /**
   * Compare trend forecasts between keywords
   */
  async compareKeywordTrends(
    keywords: string[],
    daysAhead: number = 30
  ): Promise<{
    keywords: string[];
    forecasts: KeywordTrendForecast[];
    comparison: {
      strongest_trend: string;
      highest_confidence: string;
      most_volatile: string;
      recommendations: string[];
    };
  }> {
    const forecasts = await this.getMultipleKeywordForecasts(keywords, daysAhead);
    
    // Analyze forecasts for comparison
    let strongestTrend = '';
    let highestConfidence = '';
    let mostVolatile = '';
    let maxTrendStrength = 0;
    let maxConfidence = 0;
    let maxVolatility = 0;

    forecasts.forEach(forecast => {
      const avgTrendStrength = forecast.predictions.reduce(
        (sum, pred) => sum + pred.trend_strength, 0
      ) / forecast.predictions.length;

      const volatility = forecast.historical_summary.post_volatility;
      
      // Simplified confidence calculation
      const confidence = Math.max(0, 1 - (volatility / (forecast.historical_summary.average_daily_posts + 1)));

      if (avgTrendStrength > maxTrendStrength) {
        maxTrendStrength = avgTrendStrength;
        strongestTrend = forecast.keyword;
      }

      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        highestConfidence = forecast.keyword;
      }

      if (volatility > maxVolatility) {
        maxVolatility = volatility;
        mostVolatile = forecast.keyword;
      }
    });

    const recommendations = [];
    if (strongestTrend) {
      recommendations.push(`Focus on "${strongestTrend}" for strongest growth potential`);
    }
    if (highestConfidence && highestConfidence !== strongestTrend) {
      recommendations.push(`"${highestConfidence}" shows most predictable patterns`);
    }
    if (mostVolatile) {
      recommendations.push(`Monitor "${mostVolatile}" closely due to high volatility`);
    }

    return {
      keywords,
      forecasts,
      comparison: {
        strongest_trend: strongestTrend,
        highest_confidence: highestConfidence,
        most_volatile: mostVolatile,
        recommendations
      }
    };
  }
}

export const forecastingService = new ForecastingService();