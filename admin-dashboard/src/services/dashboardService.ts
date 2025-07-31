import { apiClient } from './api';
import type { DashboardStats } from '../types';

export interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  redis: 'healthy' | 'warning' | 'critical';
  celery: 'healthy' | 'warning' | 'critical';
  reddit_api: 'healthy' | 'warning' | 'critical';
  overall: 'healthy' | 'warning' | 'critical';
  details: {
    database_latency?: number;
    redis_latency?: number;
    active_workers?: number;
    total_workers?: number;
    api_rate_limit?: {
      remaining: number;
      reset_time: string;
    };
  };
}

export interface RecentActivity {
  id: string;
  type: 'keyword_added' | 'crawling_completed' | 'content_generated' | 'crawling_started' | 'crawling_failed';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/analytics/dashboard');
      return response;
    } catch (error) {
      // Return mock data if API fails (for development)
      console.warn('Dashboard API failed, using mock data:', error);
      return {
        active_keywords_count: 24,
        active_keywords_change: 12,
        total_posts_count: 1247,
        total_posts_change: 8,
        active_crawling_count: 3,
        active_crawling_change: 0,
        generated_content_count: 18,
        generated_content_change: 25,
        trending_keywords: [
          { keyword: 'AI', mentions: 156, change: 23 },
          { keyword: 'React', mentions: 89, change: -5 },
          { keyword: 'Python', mentions: 67, change: 12 }
        ]
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get<SystemHealth>('/health');
      return response;
    } catch (error) {
      // Return mock data if API fails
      console.warn('Health API failed, using mock data:', error);
      return {
        database: 'healthy',
        redis: 'warning',
        celery: 'healthy',
        reddit_api: 'healthy',
        overall: 'healthy',
        details: {
          database_latency: 45,
          redis_latency: 12,
          active_workers: 3,
          total_workers: 4
        }
      };
    }
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get<RecentActivity[]>('/dashboard/activity', {
        params: { limit }
      });
      return response;
    } catch (error) {
      // Return mock data if API fails
      console.warn('Activity API failed, using mock data:', error);
      return [
        {
          id: '1',
          type: 'keyword_added',
          title: 'New keyword added: "AI trends"',
          description: 'Started tracking AI trends in technology subreddits',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: '2',
          type: 'crawling_completed',
          title: 'Crawling completed for r/programming',
          description: 'Found 45 new posts matching tracked keywords',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: '3',
          type: 'content_generated',
          title: 'Blog post generated',
          description: 'Generated content about React best practices',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
    }
  }

  async getTrendingKeywords(limit: number = 5): Promise<Array<{
    keyword: string;
    mentions: number;
    change_percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    const response = await apiClient.get('/api/v1/dashboard/trending-keywords', {
      params: { limit }
    });
    return response.data;
  }

  async getQuickStats(): Promise<{
    posts_today: number;
    avg_posts_per_hour: number;
    top_subreddit: string;
    success_rate: number;
  }> {
    const response = await apiClient.get('/api/v1/dashboard/quick-stats');
    return response.data;
  }
}

export const dashboardService = new DashboardService();