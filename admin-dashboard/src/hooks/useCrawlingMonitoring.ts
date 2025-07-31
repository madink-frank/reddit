import { useQuery } from '@tanstack/react-query';
import { crawlingService } from '../services/crawlingService';

export interface CrawlingMetrics {
  activeJobs: number;
  completedToday: number;
  successRate: number;
  avgSpeed: number;
  queueSize: number;
  totalJobsThisWeek: number;
  failedJobs: number;
  avgProcessingTime: number;
}

export interface CrawlingJob {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'paused';
  progress: {
    collected: number;
    total: number;
    percentage: number;
  };
  startTime: Date;
  endTime?: Date;
  elapsedTime: number;
  speed: number; // items per minute
  pointsConsumed: number;
  retryCount: number;
  errorMessage?: string;
  subreddits: string[];
  keywords: string[];
}

export const useCrawlingMonitoring = () => {
  return useQuery({
    queryKey: ['crawling-monitoring'],
    queryFn: async (): Promise<CrawlingMetrics> => {
      try {
        const response = await crawlingService.getMetrics();
        return response.data;
      } catch (error) {
        // Return mock data for development
        return {
          activeJobs: Math.floor(Math.random() * 5) + 1,
          completedToday: Math.floor(Math.random() * 100) + 50,
          successRate: Math.floor(Math.random() * 10) + 90,
          avgSpeed: Math.floor(Math.random() * 50) + 20,
          queueSize: Math.floor(Math.random() * 20),
          totalJobsThisWeek: Math.floor(Math.random() * 500) + 200,
          failedJobs: Math.floor(Math.random() * 10),
          avgProcessingTime: Math.floor(Math.random() * 300) + 60
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
};

export const useCrawlingJobs = () => {
  return useQuery({
    queryKey: ['crawling-jobs'],
    queryFn: async (): Promise<CrawlingJob[]> => {
      try {
        const response = await crawlingService.getJobs();
        return response.data;
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: '1',
            name: 'Technology Trends',
            status: 'running',
            progress: {
              collected: 75,
              total: 100,
              percentage: 75
            },
            startTime: new Date(Date.now() - 15 * 60 * 1000),
            elapsedTime: 15 * 60,
            speed: 5,
            pointsConsumed: 25,
            retryCount: 0,
            subreddits: ['technology', 'programming'],
            keywords: ['AI', 'machine learning', 'blockchain']
          },
          {
            id: '2',
            name: 'Gaming News',
            status: 'completed',
            progress: {
              collected: 150,
              total: 150,
              percentage: 100
            },
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 30 * 60 * 1000),
            elapsedTime: 90 * 60,
            speed: 1.67,
            pointsConsumed: 50,
            retryCount: 1,
            subreddits: ['gaming', 'pcgaming'],
            keywords: ['gaming', 'console', 'PC']
          },
          {
            id: '3',
            name: 'Crypto Discussion',
            status: 'failed',
            progress: {
              collected: 25,
              total: 200,
              percentage: 12.5
            },
            startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
            elapsedTime: 30 * 60,
            speed: 0.83,
            pointsConsumed: 10,
            retryCount: 3,
            errorMessage: 'Rate limit exceeded',
            subreddits: ['cryptocurrency', 'bitcoin'],
            keywords: ['bitcoin', 'ethereum', 'crypto']
          }
        ];
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds for active jobs
    staleTime: 5000,
  });
};

export const useStartCrawlingJob = () => {
  return {
    mutate: async (jobConfig: {
      name: string;
      subreddits: string[];
      keywords: string[];
      maxPosts?: number;
    }) => {
      try {
        const response = await crawlingService.startJob(jobConfig);
        return response.data;
      } catch (error) {
        console.error('Failed to start crawling job:', error);
        throw error;
      }
    },
    isLoading: false,
    error: null
  };
};

export const usePauseCrawlingJob = () => {
  return {
    mutate: async (jobId: string) => {
      try {
        const response = await crawlingService.pauseJob(jobId);
        return response.data;
      } catch (error) {
        console.error('Failed to pause crawling job:', error);
        throw error;
      }
    },
    isLoading: false,
    error: null
  };
};

export const useResumeCrawlingJob = () => {
  return {
    mutate: async (jobId: string) => {
      try {
        const response = await crawlingService.resumeJob(jobId);
        return response.data;
      } catch (error) {
        console.error('Failed to resume crawling job:', error);
        throw error;
      }
    },
    isLoading: false,
    error: null
  };
};

export const useStopCrawlingJob = () => {
  return {
    mutate: async (jobId: string) => {
      try {
        const response = await crawlingService.stopJob(jobId);
        return response.data;
      } catch (error) {
        console.error('Failed to stop crawling job:', error);
        throw error;
      }
    },
    isLoading: false,
    error: null
  };
};