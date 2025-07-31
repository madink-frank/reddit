import { apiClient } from './api';

export interface CrawlingJobConfig {
  name: string;
  subreddits: string[];
  keywords: string[];
  maxPosts?: number;
  includeComments?: boolean;
  enableNLP?: boolean;
  enableImageAnalysis?: boolean;
}

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
  speed: number;
  pointsConsumed: number;
  retryCount: number;
  errorMessage?: string;
  subreddits: string[];
  keywords: string[];
}

class CrawlingService {
  private baseUrl = '/api/v1/crawling';

  async getMetrics(): Promise<{ data: CrawlingMetrics }> {
    try {
      const response = await apiClient.get<{ data: CrawlingMetrics }>(`${this.baseUrl}/metrics`);
      return response;
    } catch (error) {
      console.error('Failed to fetch crawling metrics:', error);
      throw error;
    }
  }

  async getJobs(): Promise<{ data: CrawlingJob[] }> {
    try {
      const response = await apiClient.get<{ data: CrawlingJob[] }>(`${this.baseUrl}/jobs`);
      return response;
    } catch (error) {
      console.error('Failed to fetch crawling jobs:', error);
      throw error;
    }
  }

  async getJob(jobId: string): Promise<{ data: CrawlingJob }> {
    try {
      const response = await apiClient.get<{ data: CrawlingJob }>(`${this.baseUrl}/jobs/${jobId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch crawling job ${jobId}:`, error);
      throw error;
    }
  }

  async startJob(config: CrawlingJobConfig): Promise<{ data: CrawlingJob }> {
    try {
      const response = await apiClient.post<{ data: CrawlingJob }>(`${this.baseUrl}/jobs`, config);
      return response;
    } catch (error) {
      console.error('Failed to start crawling job:', error);
      throw error;
    }
  }

  async pauseJob(jobId: string): Promise<{ data: { success: boolean } }> {
    try {
      const response = await apiClient.post<{ data: { success: boolean } }>(`${this.baseUrl}/jobs/${jobId}/pause`);
      return response;
    } catch (error) {
      console.error(`Failed to pause crawling job ${jobId}:`, error);
      throw error;
    }
  }

  async resumeJob(jobId: string): Promise<{ data: { success: boolean } }> {
    try {
      const response = await apiClient.post<{ data: { success: boolean } }>(`${this.baseUrl}/jobs/${jobId}/resume`);
      return response;
    } catch (error) {
      console.error(`Failed to resume crawling job ${jobId}:`, error);
      throw error;
    }
  }

  async stopJob(jobId: string): Promise<{ data: { success: boolean } }> {
    try {
      const response = await apiClient.post<{ data: { success: boolean } }>(`${this.baseUrl}/jobs/${jobId}/stop`);
      return response;
    } catch (error) {
      console.error(`Failed to stop crawling job ${jobId}:`, error);
      throw error;
    }
  }

  async deleteJob(jobId: string): Promise<{ data: { success: boolean } }> {
    try {
      const response = await apiClient.delete<{ data: { success: boolean } }>(`${this.baseUrl}/jobs/${jobId}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete crawling job ${jobId}:`, error);
      throw error;
    }
  }

  async getJobLogs(jobId: string, limit = 100): Promise<{ data: any[] }> {
    try {
      const response = await apiClient.get<{ data: any[] }>(`${this.baseUrl}/jobs/${jobId}/logs?limit=${limit}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch logs for job ${jobId}:`, error);
      throw error;
    }
  }

  async getJobStats(jobId: string): Promise<{ data: any }> {
    try {
      const response = await apiClient.get<{ data: any }>(`${this.baseUrl}/jobs/${jobId}/stats`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch stats for job ${jobId}:`, error);
      throw error;
    }
  }

  async scheduleJob(config: CrawlingJobConfig & {
    schedule: {
      frequency: 'hourly' | 'daily' | 'weekly';
      time?: string;
      days?: string[];
    }
  }): Promise<{ data: CrawlingJob }> {
    try {
      const response = await apiClient.post<{ data: CrawlingJob }>(`${this.baseUrl}/jobs/schedule`, config);
      return response;
    } catch (error) {
      console.error('Failed to schedule crawling job:', error);
      throw error;
    }
  }

  async getScheduledJobs(): Promise<{ data: CrawlingJob[] }> {
    try {
      const response = await apiClient.get<{ data: CrawlingJob[] }>(`${this.baseUrl}/jobs/scheduled`);
      return response;
    } catch (error) {
      console.error('Failed to fetch scheduled jobs:', error);
      throw error;
    }
  }

  async updateJobConfig(jobId: string, config: Partial<CrawlingJobConfig>): Promise<{ data: CrawlingJob }> {
    try {
      const response = await apiClient.patch<{ data: CrawlingJob }>(`${this.baseUrl}/jobs/${jobId}`, config);
      return response;
    } catch (error) {
      console.error(`Failed to update job ${jobId}:`, error);
      throw error;
    }
  }

  async retryJob(jobId: string): Promise<{ data: CrawlingJob }> {
    try {
      const response = await apiClient.post<{ data: CrawlingJob }>(`${this.baseUrl}/jobs/${jobId}/retry`);
      return response;
    } catch (error) {
      console.error(`Failed to retry job ${jobId}:`, error);
      throw error;
    }
  }

  async getSystemStatus(): Promise<{ data: any }> {
    try {
      const response = await apiClient.get<{ data: any }>(`${this.baseUrl}/system/status`);
      return response;
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      throw error;
    }
  }

  async getQueueStatus(): Promise<{ data: any }> {
    try {
      const response = await apiClient.get<{ data: any }>(`${this.baseUrl}/queue/status`);
      return response;
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
      throw error;
    }
  }
}

export const crawlingService = new CrawlingService();