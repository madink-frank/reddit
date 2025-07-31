/**
 * API response caching utilities
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  skipCache?: boolean; // Skip cache for this request
}

/**
 * In-memory cache for API responses
 */
class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from URL and options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached response
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && this.isValid(entry)) {
      return entry.data;
    }
    
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Set cached response
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Delete cached response
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached responses
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

/**
 * Global API cache instance
 */
export const apiCache = new ApiCache();

/**
 * Enhanced fetch with caching
 */
export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit & CacheOptions
): Promise<T> {
  const { ttl, key: customKey, skipCache, ...fetchOptions } = options || {};
  
  // Skip cache if requested or for non-GET requests
  if (skipCache || (fetchOptions.method && fetchOptions.method !== 'GET')) {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  const cacheKey = customKey || apiCache['generateKey'](url, fetchOptions);
  
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log('Cache hit:', cacheKey);
    return cached;
  }

  // Fetch from network
  console.log('Cache miss, fetching:', cacheKey);
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache successful responses
  apiCache.set(cacheKey, data, ttl);
  
  return data;
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string | RegExp): number {
  const stats = apiCache.getStats();
  let invalidated = 0;
  
  for (const key of stats.keys) {
    const matches = typeof pattern === 'string' 
      ? key.includes(pattern)
      : pattern.test(key);
      
    if (matches) {
      apiCache.delete(key);
      invalidated++;
    }
  }
  
  console.log(`Invalidated ${invalidated} cache entries matching:`, pattern);
  return invalidated;
}

/**
 * Cache warming - preload frequently accessed data
 */
export async function warmCache(urls: Array<{ url: string; options?: CacheOptions }>): Promise<void> {
  console.log('Warming cache with', urls.length, 'requests');
  
  const promises = urls.map(({ url, options }) => 
    cachedFetch(url, options).catch(error => {
      console.warn('Cache warming failed for', url, error);
    })
  );
  
  await Promise.allSettled(promises);
  console.log('Cache warming completed');
}

/**
 * Periodic cache cleanup
 */
export function startCacheCleanup(intervalMs: number = 10 * 60 * 1000): () => void {
  const interval = setInterval(() => {
    const cleaned = apiCache.cleanup();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

/**
 * Cache middleware for React Query
 */
export const createCacheMiddleware = (defaultTTL: number = 5 * 60 * 1000) => {
  return {
    queryFn: async ({ queryKey, meta }: any) => {
      const url = meta?.url;
      const options = meta?.options || {};
      
      if (!url) {
        throw new Error('URL is required for cached queries');
      }
      
      return cachedFetch(url, { ttl: defaultTTL, ...options });
    }
  };
};