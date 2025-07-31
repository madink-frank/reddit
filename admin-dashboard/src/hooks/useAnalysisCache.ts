import { useState, useEffect, useCallback } from 'react';
import { cacheService, AnalysisCacheKey, AnalysisType } from '../services/cacheService';
import { redisCacheService } from '../services/redisCacheService';

// Cache configuration
interface CacheHookConfig {
  useRedis?: boolean;
  defaultTTL?: number;
  enableMetrics?: boolean;
}

// Cache hook return type
interface AnalysisCacheHook {
  getCachedResult: <T>(key: AnalysisCacheKey) => Promise<T | null>;
  setCachedResult: <T>(key: AnalysisCacheKey, value: T, ttl?: number) => Promise<boolean>;
  invalidateCache: (key: AnalysisCacheKey) => Promise<boolean>;
  invalidateByType: (type: AnalysisType) => Promise<number>;
  invalidateByContentHash: (contentHash: string) => Promise<number>;
  generateContentHash: (content: string | object) => string;
  getCacheStats: () => Promise<any>;
  isLoading: boolean;
  error: string | null;
}

// Analysis cache hook
export function useAnalysisCache(config: CacheHookConfig = {}): AnalysisCacheHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheInstance = config.useRedis ? redisCacheService : cacheService;

  const getCachedResult = useCallback(async <T>(key: AnalysisCacheKey): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await cacheInstance.get<T>(key);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get cached result';
      setError(errorMessage);
      console.error('Cache get error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance]);

  const setCachedResult = useCallback(async <T>(
    key: AnalysisCacheKey, 
    value: T, 
    ttl?: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await cacheInstance.set(key, value, ttl || config.defaultTTL);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set cached result';
      setError(errorMessage);
      console.error('Cache set error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance, config.defaultTTL]);

  const invalidateCache = useCallback(async (key: AnalysisCacheKey): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await cacheInstance.delete(key);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache';
      setError(errorMessage);
      console.error('Cache invalidation error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance]);

  const invalidateByType = useCallback(async (type: AnalysisType): Promise<number> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const count = await cacheInstance.invalidateByType(type);
      return count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache by type';
      setError(errorMessage);
      console.error('Cache type invalidation error:', err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance]);

  const invalidateByContentHash = useCallback(async (contentHash: string): Promise<number> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For Redis cache service, use the specific method
      if (config.useRedis && 'invalidateByContentHash' in cacheInstance) {
        const count = await (cacheInstance as any).invalidateByContentHash(contentHash);
        return count;
      }
      
      // For in-memory cache, we need to implement this differently
      // This is a simplified approach - in production, you'd want a more efficient method
      return 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache by content hash';
      setError(errorMessage);
      console.error('Cache content hash invalidation error:', err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance, config.useRedis]);

  const generateContentHash = useCallback((content: string | object): string => {
    return cacheInstance.generateContentHash(content);
  }, [cacheInstance]);

  const getCacheStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if ('getStats' in cacheInstance) {
        const stats = await (cacheInstance as any).getStats();
        return stats;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get cache stats';
      setError(errorMessage);
      console.error('Cache stats error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance]);

  return {
    getCachedResult,
    setCachedResult,
    invalidateCache,
    invalidateByType,
    invalidateByContentHash,
    generateContentHash,
    getCacheStats,
    isLoading,
    error
  };
}

// Specialized hook for NLP analysis caching
export function useNLPCache(config: CacheHookConfig = {}) {
  const cache = useAnalysisCache({ ...config, defaultTTL: 3600 }); // 1 hour default

  const getCachedNLPResult = useCallback(async <T>(
    content: string,
    analysisType: 'sentiment' | 'morphological' | 'keywords',
    options?: Record<string, any>
  ): Promise<T | null> => {
    const contentHash = cache.generateContentHash(content);
    const cacheKey: AnalysisCacheKey = {
      type: analysisType,
      contentHash,
      options
    };
    
    return cache.getCachedResult<T>(cacheKey);
  }, [cache]);

  const setCachedNLPResult = useCallback(async <T>(
    content: string,
    analysisType: 'sentiment' | 'morphological' | 'keywords',
    result: T,
    options?: Record<string, any>,
    ttl?: number
  ): Promise<boolean> => {
    const contentHash = cache.generateContentHash(content);
    const cacheKey: AnalysisCacheKey = {
      type: analysisType,
      contentHash,
      options
    };
    
    return cache.setCachedResult(cacheKey, result, ttl);
  }, [cache]);

  return {
    ...cache,
    getCachedNLPResult,
    setCachedNLPResult
  };
}

// Specialized hook for image analysis caching
export function useImageCache(config: CacheHookConfig = {}) {
  const cache = useAnalysisCache({ ...config, defaultTTL: 7200 }); // 2 hours default

  const getCachedImageResult = useCallback(async <T>(
    imageUrl: string,
    analysisType: 'objects' | 'ocr',
    options?: Record<string, any>
  ): Promise<T | null> => {
    const contentHash = cache.generateContentHash(imageUrl);
    const cacheKey: AnalysisCacheKey = {
      type: analysisType,
      contentHash,
      options
    };
    
    return cache.getCachedResult<T>(cacheKey);
  }, [cache]);

  const setCachedImageResult = useCallback(async <T>(
    imageUrl: string,
    analysisType: 'objects' | 'ocr',
    result: T,
    options?: Record<string, any>,
    ttl?: number
  ): Promise<boolean> => {
    const contentHash = cache.generateContentHash(imageUrl);
    const cacheKey: AnalysisCacheKey = {
      type: analysisType,
      contentHash,
      options
    };
    
    return cache.setCachedResult(cacheKey, result, ttl);
  }, [cache]);

  return {
    ...cache,
    getCachedImageResult,
    setCachedImageResult
  };
}

// Cache performance monitoring hook
export function useCacheMetrics(config: CacheHookConfig = {}) {
  const [metrics, setMetrics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const cacheInstance = config.useRedis ? redisCacheService : cacheService;

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const [metricsData, statsData] = await Promise.all([
        cacheInstance.getMetrics(),
        'getStats' in cacheInstance ? (cacheInstance as any).getStats() : null
      ]);
      
      setMetrics(metricsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing cache metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cacheInstance]);

  useEffect(() => {
    refreshMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    metrics,
    stats,
    isLoading,
    refreshMetrics
  };
}

export default useAnalysisCache;