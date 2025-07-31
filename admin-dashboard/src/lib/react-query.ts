import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import type { ApiError } from '../services/api';

// Default query options
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time - how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache time - how long data stays in cache after component unmounts
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Retry configuration
    retry: (failureCount, error) => {
      const apiError = error as ApiError;
      
      // Don't retry on 4xx errors (client errors)
      if (apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus for critical data
    refetchOnWindowFocus: false,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Refetch on mount if data is stale
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error) => {
      const apiError = error as ApiError;
      
      // Only retry on network errors
      if (apiError.status === 0 || apiError.code === 'NETWORK_ERROR') {
        return failureCount < 1;
      }
      
      return false;
    },
    
    // Retry delay for mutations
    retryDelay: 1000,
  },
};

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Auth keys
  auth: {
    user: ['auth', 'user'] as const,
    adminCheck: ['auth', 'admin-check'] as const,
    verify: ['auth', 'verify'] as const,
  },
  
  // Keywords keys
  keywords: {
    all: ['keywords'] as const,
    lists: () => [...queryKeys.keywords.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.keywords.lists(), params] as const,
    details: () => [...queryKeys.keywords.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.keywords.details(), id] as const,
    stats: () => [...queryKeys.keywords.all, 'stats'] as const,
    stat: (id: number) => [...queryKeys.keywords.stats(), id] as const,
  },
  
  // Posts keys
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
    trending: (params?: Record<string, unknown>) => [...queryKeys.posts.all, 'trending', params] as const,
    search: (query: string, params?: Record<string, unknown>) => [...queryKeys.posts.all, 'search', query, params] as const,
    byKeyword: (keywordId: number, params?: Record<string, unknown>) => [...queryKeys.posts.all, 'keyword', keywordId, params] as const,
    bySubreddit: (subreddit: string, params?: Record<string, unknown>) => [...queryKeys.posts.all, 'subreddit', subreddit, params] as const,
    stats: () => [...queryKeys.posts.all, 'stats'] as const,
    subreddits: () => [...queryKeys.posts.all, 'subreddits'] as const,
  },
  
  // Crawling keys
  crawling: {
    all: ['crawling'] as const,
    status: () => [...queryKeys.crawling.all, 'status'] as const,
    job: (jobId: string) => [...queryKeys.crawling.all, 'job', jobId] as const,
    history: (params?: Record<string, unknown>) => [...queryKeys.crawling.all, 'history', params] as const,
    stats: () => [...queryKeys.crawling.all, 'stats'] as const,
    queue: () => [...queryKeys.crawling.all, 'queue'] as const,
    logs: (jobId: string) => [...queryKeys.crawling.all, 'logs', jobId] as const,
  },
  
  // Analytics keys
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    trends: (params?: Record<string, unknown>) => [...queryKeys.analytics.all, 'trends', params] as const,
    keyword: (id: number) => [...queryKeys.analytics.all, 'keyword', id] as const,
    timeSeries: (params?: Record<string, unknown>) => [...queryKeys.analytics.all, 'timeseries', params] as const,
    subredditDistribution: (params?: Record<string, unknown>) => [...queryKeys.analytics.all, 'subreddit-distribution', params] as const,
    sentiment: (params?: Record<string, unknown>) => [...queryKeys.analytics.all, 'sentiment', params] as const,
    engagement: (params?: Record<string, unknown>) => [...queryKeys.analytics.all, 'engagement', params] as const,
    correlations: (keywordId: number) => [...queryKeys.analytics.all, 'correlations', keywordId] as const,
    heatmap: (params?: Record<string, unknown>) => [...queryKeys.analytics.all, 'heatmap', params] as const,
    compare: (keywordIds: number[]) => [...queryKeys.analytics.all, 'compare', keywordIds] as const,
  },
  
  // Content keys
  content: {
    all: ['content'] as const,
    lists: () => [...queryKeys.content.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.content.lists(), params] as const,
    details: () => [...queryKeys.content.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.content.details(), id] as const,
    generation: (jobId: string) => [...queryKeys.content.all, 'generation', jobId] as const,
    templates: () => [...queryKeys.content.all, 'templates'] as const,
    template: (id: number) => [...queryKeys.content.all, 'template', id] as const,
    stats: () => [...queryKeys.content.all, 'stats'] as const,
    history: (id: number) => [...queryKeys.content.all, 'history', id] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific domain
  invalidateKeywords: () => queryClient.invalidateQueries({ queryKey: queryKeys.keywords.all }),
  invalidatePosts: () => queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
  invalidateCrawling: () => queryClient.invalidateQueries({ queryKey: queryKeys.crawling.all }),
  invalidateAnalytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  invalidateContent: () => queryClient.invalidateQueries({ queryKey: queryKeys.content.all }),
  
  // Remove specific queries from cache
  removeKeyword: (id: number) => queryClient.removeQueries({ queryKey: queryKeys.keywords.detail(id) }),
  removePost: (id: number) => queryClient.removeQueries({ queryKey: queryKeys.posts.detail(id) }),
  removeContent: (id: number) => queryClient.removeQueries({ queryKey: queryKeys.content.detail(id) }),
  
  // Prefetch commonly used data
  prefetchDashboard: () => queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.dashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  }),
  
  // Clear all cache
  clearAll: () => queryClient.clear(),
  
  // Get cached data without triggering a fetch
  getKeywords: () => queryClient.getQueryData(queryKeys.keywords.lists()),
  getPosts: (params?: Record<string, unknown>) => queryClient.getQueryData(queryKeys.posts.list(params)),
  getDashboard: () => queryClient.getQueryData(queryKeys.analytics.dashboard()),
};

// Error handling utilities
export const queryErrorHandler = (error: unknown) => {
  const apiError = error as ApiError;
  
  // Log error for debugging
  console.error('Query Error:', apiError);
  
  // Handle specific error cases
  if (apiError.status === 401) {
    // Handle authentication errors
    window.dispatchEvent(new CustomEvent('auth:logout', { 
      detail: { reason: 'unauthorized' } 
    }));
  } else if (apiError.status === 403) {
    // Handle authorization errors
    console.warn('Access denied:', apiError.message);
  } else if (apiError.status === 0) {
    // Handle network errors
    console.error('Network error - check connection');
  }
  
  return apiError;
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Update keyword in cache optimistically
  updateKeyword: (id: number, updates: Partial<any>) => {
    queryClient.setQueryData(queryKeys.keywords.detail(id), (old: any) => ({
      ...old,
      ...updates,
    }));
  },
  
  // Add new keyword to list optimistically
  addKeyword: (newKeyword: any) => {
    queryClient.setQueryData(queryKeys.keywords.lists(), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: [newKeyword, ...old.data],
        total: old.total + 1,
      };
    });
  },
  
  // Remove keyword from list optimistically
  removeKeyword: (id: number) => {
    queryClient.setQueryData(queryKeys.keywords.lists(), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.filter((item: any) => item.id !== id),
        total: old.total - 1,
      };
    });
  },
};