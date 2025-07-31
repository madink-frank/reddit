import { SentimentTimelineData } from '../components/charts/SentimentTimelineChart';

export interface SentimentTimelineFilters {
  startDate?: Date;
  endDate?: Date;
  keywords?: string[];
  subreddits?: string[];
  minVolume?: number;
}

export interface SentimentTimelineResponse {
  data: SentimentTimelineData[];
  totalCount: number;
  aggregatedStats: {
    avgPositive: number;
    avgNegative: number;
    avgNeutral: number;
    totalVolume: number;
    avgEngagement: number;
    peakSentiment: {
      timestamp: Date;
      sentiment: 'positive' | 'negative' | 'neutral';
      value: number;
    };
  };
}

class SentimentTimelineService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Fetch sentiment timeline data
  async getSentimentTimeline(filters: SentimentTimelineFilters = {}): Promise<SentimentTimelineResponse> {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('start_date', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('end_date', filters.endDate.toISOString());
    }
    if (filters.keywords?.length) {
      params.append('keywords', filters.keywords.join(','));
    }
    if (filters.subreddits?.length) {
      params.append('subreddits', filters.subreddits.join(','));
    }
    if (filters.minVolume) {
      params.append('min_volume', filters.minVolume.toString());
    }

    const response = await this.makeRequest<any>(`/analytics/sentiment-timeline?${params}`);
    
    // Transform API response to match our interface
    return {
      data: response.data.map((item: any) => ({
        timestamp: new Date(item.timestamp),
        positive: item.positive,
        negative: item.negative,
        neutral: item.neutral,
        volume: item.volume,
        engagement: item.engagement,
        subreddit: item.subreddit,
        keyword: item.keyword,
      })),
      totalCount: response.total_count,
      aggregatedStats: {
        avgPositive: response.stats.avg_positive,
        avgNegative: response.stats.avg_negative,
        avgNeutral: response.stats.avg_neutral,
        totalVolume: response.stats.total_volume,
        avgEngagement: response.stats.avg_engagement,
        peakSentiment: {
          timestamp: new Date(response.stats.peak_sentiment.timestamp),
          sentiment: response.stats.peak_sentiment.sentiment,
          value: response.stats.peak_sentiment.value,
        },
      },
    };
  }

  // Get real-time sentiment updates
  async getRealtimeSentimentUpdates(): Promise<SentimentTimelineData[]> {
    const response = await this.makeRequest<any>('/analytics/sentiment-timeline/realtime');
    
    return response.data.map((item: any) => ({
      timestamp: new Date(item.timestamp),
      positive: item.positive,
      negative: item.negative,
      neutral: item.neutral,
      volume: item.volume,
      engagement: item.engagement,
      subreddit: item.subreddit,
      keyword: item.keyword,
    }));
  }

  // Get sentiment correlation with engagement
  async getSentimentEngagementCorrelation(filters: SentimentTimelineFilters = {}): Promise<{
    correlation: number;
    data: Array<{
      sentiment: number;
      engagement: number;
      volume: number;
      timestamp: Date;
    }>;
  }> {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('start_date', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('end_date', filters.endDate.toISOString());
    }

    const response = await this.makeRequest<any>(`/analytics/sentiment-engagement-correlation?${params}`);
    
    return {
      correlation: response.correlation,
      data: response.data.map((item: any) => ({
        sentiment: item.sentiment,
        engagement: item.engagement,
        volume: item.volume,
        timestamp: new Date(item.timestamp),
      })),
    };
  }

  // Export sentiment timeline data
  async exportSentimentData(
    data: SentimentTimelineData[],
    format: 'csv' | 'excel' | 'json' = 'csv'
  ): Promise<Blob> {
    const response = await this.makeRequest<Blob>('/analytics/sentiment-timeline/export', {
      method: 'POST',
      body: JSON.stringify({
        data: data.map(item => ({
          timestamp: item.timestamp.toISOString(),
          positive: item.positive,
          negative: item.negative,
          neutral: item.neutral,
          volume: item.volume,
          engagement: item.engagement,
          subreddit: item.subreddit,
          keyword: item.keyword,
        })),
        format,
      }),
    });

    return response;
  }

  // Generate mock data for development/testing
  generateMockData(days: number = 7): SentimentTimelineData[] {
    const data: SentimentTimelineData[] = [];
    const now = new Date();
    const msPerHour = 60 * 60 * 1000;
    
    for (let i = days * 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * msPerHour);
      
      // Generate realistic sentiment patterns
      const timeOfDay = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();
      
      // Higher activity during business hours and weekdays
      const baseVolume = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 100 : 60;
      const hourMultiplier = (timeOfDay >= 9 && timeOfDay <= 17) ? 1.5 : 0.8;
      const volume = Math.floor(baseVolume * hourMultiplier * (0.8 + Math.random() * 0.4));
      
      // Sentiment tends to be more positive during business hours
      const positiveBase = (timeOfDay >= 9 && timeOfDay <= 17) ? 0.6 : 0.5;
      const positive = Math.max(0.1, Math.min(0.9, positiveBase + (Math.random() - 0.5) * 0.3));
      
      const negativeBase = 0.3 - (positive - 0.5) * 0.5;
      const negative = Math.max(0.05, Math.min(0.8, negativeBase + (Math.random() - 0.5) * 0.2));
      
      const neutral = Math.max(0.05, 1 - positive - negative);
      
      // Engagement correlates with sentiment and volume
      const sentimentScore = positive - negative;
      const engagement = Math.max(20, Math.min(100, 
        50 + sentimentScore * 30 + (volume / 200) * 20 + (Math.random() - 0.5) * 20
      ));
      
      data.push({
        timestamp,
        positive,
        negative,
        neutral,
        volume,
        engagement: Math.round(engagement),
        subreddit: ['technology', 'programming', 'webdev', 'javascript'][Math.floor(Math.random() * 4)],
        keyword: ['react', 'typescript', 'nodejs', 'python'][Math.floor(Math.random() * 4)],
      });
    }
    
    return data;
  }

  // Get sentiment trends for specific keywords
  async getKeywordSentimentTrends(keywords: string[], timeRange: string = '24h'): Promise<{
    [keyword: string]: SentimentTimelineData[];
  }> {
    const params = new URLSearchParams();
    params.append('keywords', keywords.join(','));
    params.append('time_range', timeRange);

    const response = await this.makeRequest<any>(`/analytics/keyword-sentiment-trends?${params}`);
    
    const result: { [keyword: string]: SentimentTimelineData[] } = {};
    
    for (const [keyword, data] of Object.entries(response.data)) {
      result[keyword] = (data as any[]).map(item => ({
        timestamp: new Date(item.timestamp),
        positive: item.positive,
        negative: item.negative,
        neutral: item.neutral,
        volume: item.volume,
        engagement: item.engagement,
        keyword,
      }));
    }
    
    return result;
  }

  // Get sentiment heatmap data for visualization
  async getSentimentHeatmap(filters: SentimentTimelineFilters = {}): Promise<{
    data: Array<{
      hour: number;
      day: number;
      sentiment: number;
      volume: number;
    }>;
    maxSentiment: number;
    minSentiment: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('start_date', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('end_date', filters.endDate.toISOString());
    }

    const response = await this.makeRequest<any>(`/analytics/sentiment-heatmap?${params}`);
    
    return {
      data: response.data.map((item: any) => ({
        hour: item.hour,
        day: item.day,
        sentiment: item.sentiment,
        volume: item.volume,
      })),
      maxSentiment: response.max_sentiment,
      minSentiment: response.min_sentiment,
    };
  }
}

export const sentimentTimelineService = new SentimentTimelineService();
export default sentimentTimelineService;