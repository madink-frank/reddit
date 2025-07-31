import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crawlingService, type CrawlingStartRequest } from '../services/crawlingService';
import { queryKeys, queryErrorHandler } from '../lib/react-query';

// Query hooks
export const useCrawlingStatus = () => {
  return useQuery({
    queryKey: queryKeys.crawling.status(),
    queryFn: crawlingService.getCrawlingStatus,
    staleTime: 10 * 1000, // 10 seconds - frequent updates for real-time status
    refetchInterval: 5 * 1000, // Refetch every 5 seconds when component is focused
    throwOnError: queryErrorHandler,
  });
};

export const useCrawlingJob = (jobId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.crawling.job(jobId),
    queryFn: () => crawlingService.getCrawlingJob(jobId),
    enabled: enabled && jobId.length > 0,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: (data) => {
      // Stop refetching if job is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 3 * 1000; // 3 seconds for active jobs
    },
    throwOnError: queryErrorHandler,
  });
};

export const useCrawlingHistory = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  keyword_id?: number;
  date_from?: string;
  date_to?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.crawling.history(params),
    queryFn: () => crawlingService.getCrawlingHistory(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    throwOnError: queryErrorHandler,
  });
};

export const useCrawlingStats = () => {
  return useQuery({
    queryKey: queryKeys.crawling.stats(),
    queryFn: crawlingService.getCrawlingStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useQueueStatus = () => {
  return useQuery({
    queryKey: queryKeys.crawling.queue(),
    queryFn: crawlingService.getQueueStatus,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    throwOnError: queryErrorHandler,
  });
};

export const useCrawlingLogs = (jobId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.crawling.logs(jobId),
    queryFn: () => crawlingService.getCrawlingLogs(jobId),
    enabled: enabled && jobId.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    throwOnError: queryErrorHandler,
  });
};

// Mutation hooks
export const useStartCrawling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CrawlingStartRequest) => crawlingService.startCrawling(request),
    onSuccess: () => {
      // Invalidate crawling status and history
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.history() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.queue() });
    },
    onError: queryErrorHandler,
  });
};

export const useStartFullCrawling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crawlingService.startFullCrawling,
    onSuccess: () => {
      // Invalidate crawling status and history
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.history() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.queue() });
    },
    onError: queryErrorHandler,
  });
};

export const useCancelCrawlingJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => crawlingService.cancelCrawlingJob(jobId),
    onSuccess: (_, jobId) => {
      // Invalidate specific job and general status
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.job(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.queue() });
    },
    onError: queryErrorHandler,
  });
};

export const usePauseCrawlingJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => crawlingService.pauseCrawlingJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.job(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.status() });
    },
    onError: queryErrorHandler,
  });
};

export const useResumeCrawlingJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => crawlingService.resumeCrawlingJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.job(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.status() });
    },
    onError: queryErrorHandler,
  });
};

export const useRetryCrawlingJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => crawlingService.retryCrawlingJob(jobId),
    onSuccess: () => {
      // Invalidate all crawling queries since we have a new job
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.all });
    },
    onError: queryErrorHandler,
  });
};

export const useClearCompletedJobs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crawlingService.clearCompletedJobs,
    onSuccess: () => {
      // Invalidate history and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.history() });
      queryClient.invalidateQueries({ queryKey: queryKeys.crawling.stats() });
    },
    onError: queryErrorHandler,
  });
};