/**
 * Brand Monitoring Service
 * 
 * Handles API calls for brand mention tracking, sentiment analysis,
 * and competitive analysis.
 */

import apiClient from './api';

export interface BrandMention {
  brand_name: string;
  monitoring_period: number;
  total_mentions: number;
  mention_breakdown: {
    total_mentions: number;
    post_mentions: number;
    comment_mentions: number;
    total_engagement_score: number;
    average_post_score: number;
    average_comment_score: number;
    total_post_comments: number;
    engagement_rate: number;
  };
  trends: {
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    growth_rate: number;
    daily_average: number;
    peak_date: string;
    daily_breakdown: { [date: string]: number };
  };
  sentiment_analysis: {
    overall_sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_score: number;
    positive_mentions: number;
    negative_mentions: number;
    neutral_mentions: number;
    sentiment_breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  subreddit_breakdown: {
    total_subreddits: number;
    top_subreddits: { [subreddit: string]: any };
    all_subreddits: { [subreddit: string]: any };
  };
  generated_at: string;
}

export interface BrandSentiment {
  brand_name: string;
  reputation_score: {
    score: number;
    level: string;
    factors: {
      sentiment_contribution: number;
      engagement_boost: number;
      volume_boost: number;
    };
    confidence: number;
  };
  sentiment_trends: {
    weekly_sentiment: { [week: string]: any };
    trend_direction: 'improving' | 'declining' | 'stable';
    average_sentiment: number;
    sentiment_volatility: number;
  };
  sentiment_drivers: {
    positive_drivers: {
      subreddits: string[];
      factors: string[];
    };
    negative_drivers: {
      subreddits: string[];
      factors: string[];
    };
    key_metrics: {
      engagement_impact: string;
      volume_impact: string;
    };
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actions: string[];
  }[];
  analysis_period: number;
  generated_at: string;
}

export interface CompetitiveAnalysis {
  primary_brand: string;
  competitors: string[];
  comparison_metrics: {
    brand_metrics: { [brand: string]: any };
    rankings: { [metric: string]: string[] };
  };
  market_share: {
    total_market_mentions: number;
    brand_shares: { [brand: string]: any };
    market_leader: string;
  };
  competitive_positioning: { [brand: string]: any };
  opportunities: {
    type: string;
    competitor: string;
    description: string;
    action: string;
  }[];
  analysis_period: number;
  generated_at: string;
}

export interface ReputationDashboard {
  brand_name: string;
  analysis_period: number;
  overview: {
    total_mentions: number;
    reputation_score: any;
    sentiment_summary: any;
    trend_direction: string;
  };
  detailed_metrics: {
    mentions: BrandMention;
    sentiment: BrandSentiment;
  };
  key_insights: {
    top_subreddits: { [subreddit: string]: any };
    sentiment_drivers: any;
    recommendations: any[];
  };
  generated_at: string;
}

export interface MarketOverview {
  analysis_period: number;
  total_market_mentions: number;
  brands_analyzed: number;
  market_leader: string;
  average_market_sentiment: number;
  brand_rankings: { [brand: string]: any };
  market_insights: {
    most_mentioned: string;
    highest_sentiment: string;
    fastest_growing: string;
  };
  generated_at: string;
}

class BrandMonitoringService {
  /**
   * Track brand mentions across subreddits
   */
  async trackBrandMentions(
    brandName: string,
    options: {
      subreddits?: string[];
      daysBack?: number;
    } = {}
  ): Promise<BrandMention> {
    const params: any = {};
    
    if (options.subreddits && options.subreddits.length > 0) {
      params.subreddits = options.subreddits.join(',');
    }
    if (options.daysBack) {
      params.days_back = options.daysBack;
    }

    const response = await apiClient.get(`/brand-monitoring/mentions/${encodeURIComponent(brandName)}`, { params });
    return response.data.data;
  }

  /**
   * Analyze brand sentiment and reputation
   */
  async analyzeBrandSentiment(
    brandName: string,
    options: {
      subreddits?: string[];
      daysBack?: number;
    } = {}
  ): Promise<BrandSentiment> {
    const params: any = {};
    
    if (options.subreddits && options.subreddits.length > 0) {
      params.subreddits = options.subreddits.join(',');
    }
    if (options.daysBack) {
      params.days_back = options.daysBack;
    }

    const response = await apiClient.get(`/brand-monitoring/sentiment/${encodeURIComponent(brandName)}`, { params });
    return response.data.data;
  }

  /**
   * Perform competitive analysis
   */
  async performCompetitiveAnalysis(
    primaryBrand: string,
    competitorBrands: string[],
    options: {
      subreddits?: string[];
      daysBack?: number;
    } = {}
  ): Promise<CompetitiveAnalysis> {
    const params: any = {
      primary_brand: primaryBrand,
      competitor_brands: competitorBrands.join(',')
    };
    
    if (options.subreddits && options.subreddits.length > 0) {
      params.subreddits = options.subreddits.join(',');
    }
    if (options.daysBack) {
      params.days_back = options.daysBack;
    }

    const response = await apiClient.post('/brand-monitoring/competitive-analysis', null, { params });
    return response.data.data;
  }

  /**
   * Get comprehensive reputation dashboard
   */
  async getReputationDashboard(
    brandName: string,
    options: {
      subreddits?: string[];
      daysBack?: number;
    } = {}
  ): Promise<ReputationDashboard> {
    const params: any = {};
    
    if (options.subreddits && options.subreddits.length > 0) {
      params.subreddits = options.subreddits.join(',');
    }
    if (options.daysBack) {
      params.days_back = options.daysBack;
    }

    const response = await apiClient.get(`/brand-monitoring/reputation-dashboard/${encodeURIComponent(brandName)}`, { params });
    return response.data.data;
  }

  /**
   * Get market overview with multiple brands
   */
  async getMarketOverview(
    brands: string[],
    options: {
      subreddits?: string[];
      daysBack?: number;
    } = {}
  ): Promise<MarketOverview> {
    const params: any = {
      brands: brands.join(',')
    };
    
    if (options.subreddits && options.subreddits.length > 0) {
      params.subreddits = options.subreddits.join(',');
    }
    if (options.daysBack) {
      params.days_back = options.daysBack;
    }

    const response = await apiClient.get('/brand-monitoring/market-overview', { params });
    return response.data.data;
  }

  /**
   * Get brand health score
   */
  getBrandHealthScore(reputationScore: any): {
    score: number;
    level: string;
    color: string;
    description: string;
  } {
    const score = reputationScore?.score || 0;
    
    if (score >= 80) {
      return {
        score,
        level: 'Excellent',
        color: 'text-green-500',
        description: 'Brand has excellent reputation and positive sentiment'
      };
    } else if (score >= 60) {
      return {
        score,
        level: 'Good',
        color: 'text-blue-500',
        description: 'Brand has good reputation with room for improvement'
      };
    } else if (score >= 40) {
      return {
        score,
        level: 'Fair',
        color: 'text-yellow-500',
        description: 'Brand reputation needs attention and improvement'
      };
    } else if (score >= 20) {
      return {
        score,
        level: 'Poor',
        color: 'text-orange-500',
        description: 'Brand reputation is poor and requires immediate action'
      };
    } else {
      return {
        score,
        level: 'Critical',
        color: 'text-red-500',
        description: 'Brand reputation is critical and needs crisis management'
      };
    }
  }

  /**
   * Get sentiment color based on score
   */
  getSentimentColor(sentimentScore: number): string {
    if (sentimentScore > 0.1) return 'text-green-500';
    if (sentimentScore < -0.1) return 'text-red-500';
    return 'text-gray-500';
  }

  /**
   * Get trend icon based on direction
   */
  getTrendDirection(direction: string): {
    icon: string;
    color: string;
    label: string;
  } {
    switch (direction) {
      case 'increasing':
      case 'improving':
        return {
          icon: 'trending-up',
          color: 'text-green-500',
          label: 'Improving'
        };
      case 'decreasing':
      case 'declining':
        return {
          icon: 'trending-down',
          color: 'text-red-500',
          label: 'Declining'
        };
      default:
        return {
          icon: 'minus',
          color: 'text-gray-500',
          label: 'Stable'
        };
    }
  }

  /**
   * Format mention volume for display
   */
  formatMentionVolume(mentions: number): string {
    if (mentions >= 1000000) {
      return `${(mentions / 1000000).toFixed(1)}M`;
    } else if (mentions >= 1000) {
      return `${(mentions / 1000).toFixed(1)}K`;
    }
    return mentions.toString();
  }

  /**
   * Calculate engagement rate category
   */
  getEngagementCategory(engagementRate: number): {
    category: string;
    color: string;
  } {
    if (engagementRate >= 50) {
      return { category: 'High', color: 'text-green-500' };
    } else if (engagementRate >= 20) {
      return { category: 'Medium', color: 'text-yellow-500' };
    } else {
      return { category: 'Low', color: 'text-red-500' };
    }
  }
}

export const brandMonitoringService = new BrandMonitoringService();