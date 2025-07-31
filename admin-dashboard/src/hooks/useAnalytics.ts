import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedKeywords: string[];
  selectedSubreddits: string[];
  refreshInterval: number;
}

interface TrendData {
  date: string;
  value: number;
  keyword?: string;
}

interface KeywordFrequencyData {
  keyword: string;
  frequency: number;
  posts: number;
  trend?: 'up' | 'down' | 'stable';
}

interface SubredditData {
  subreddit: string;
  postCount: number;
  percentage: number;
  avgScore: number;
  totalComments: number;
}

interface TopPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  createdAt: string;
  url: string;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface AnalyticsData {
  trendData: TrendData[] | null;
  keywordFrequencyData: KeywordFrequencyData[] | null;
  subredditDistributionData: SubredditData[] | null;
  topPostsData: TopPost[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAnalytics = (filters: AnalyticsFilters): AnalyticsData => {
  const [trendData, setTrendData] = useState<TrendData[] | null>(null);
  const [keywordFrequencyData, setKeywordFrequencyData] = useState<KeywordFrequencyData[] | null>(null);
  const [subredditDistributionData, setSubredditDistributionData] = useState<SubredditData[] | null>(null);
  const [topPostsData, setTopPostsData] = useState<TopPost[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all analytics data in parallel
      const [
        trendsResponse,
        keywordFrequencyResponse,
        subredditDistributionResponse,
        topPostsResponse,
      ] = await Promise.all([
        analyticsService.getTrends({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          keywords: filters.selectedKeywords,
        }),
        analyticsService.getKeywordFrequency({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          keywords: filters.selectedKeywords,
        }),
        analyticsService.getSubredditDistribution({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          keywords: filters.selectedKeywords,
        }),
        analyticsService.getTopPosts({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          keywords: filters.selectedKeywords,
          subreddits: filters.selectedSubreddits,
          limit: 50,
        }),
      ]);

      setTrendData(trendsResponse.data);
      setKeywordFrequencyData(keywordFrequencyResponse.data);
      setSubredditDistributionData(subredditDistributionResponse.data);
      setTopPostsData(topPostsResponse.data);
    } catch (err) {
      console.error('Analytics data fetch error:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch data when filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const refetch = useCallback(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    trendData,
    keywordFrequencyData,
    subredditDistributionData,
    topPostsData,
    isLoading,
    error,
    refetch,
  };
};