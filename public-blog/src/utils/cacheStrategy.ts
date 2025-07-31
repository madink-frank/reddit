// Content caching strategy for the public blog
import React from 'react';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class ContentCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      strategy: 'lru',
      ...config,
    };
  }

  set(key: string, data: T): void {
    const now = Date.now();
    
    // Remove expired items before adding new one
    this.cleanup();
    
    // If cache is full, evict based on strategy
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item !== undefined && !this.isExpired(item);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > this.config.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;

    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        keyToEvict = this.findLRU();
        break;
      case 'lfu': // Least Frequently Used
        keyToEvict = this.findLFU();
        break;
      case 'fifo': // First In, First Out
      default:
        const firstKey = this.cache.keys().next().value;
        keyToEvict = firstKey || '';
        break;
    }

    this.cache.delete(keyToEvict);
  }

  private findLRU(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastCount) {
        leastCount = item.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }
}

// Specialized caches for different content types
export const blogPostCache = new ContentCache({
  ttl: 10 * 60 * 1000, // 10 minutes for blog posts
  maxSize: 50,
  strategy: 'lru',
});

export const searchResultsCache = new ContentCache({
  ttl: 5 * 60 * 1000, // 5 minutes for search results
  maxSize: 20,
  strategy: 'lru',
});

export const apiResponseCache = new ContentCache({
  ttl: 2 * 60 * 1000, // 2 minutes for API responses
  maxSize: 100,
  strategy: 'lfu',
});

// Browser storage cache utilities
export class BrowserStorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(type: 'localStorage' | 'sessionStorage' = 'localStorage', prefix = 'blog_cache_') {
    this.storage = type === 'localStorage' ? localStorage : sessionStorage;
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 5 * 60 * 1000, // Default 5 minutes
    };

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache item in browser storage:', error);
      // Handle quota exceeded error by clearing old items
      this.cleanup();
      try {
        this.storage.setItem(this.prefix + key, JSON.stringify(item));
      } catch (retryError) {
        console.error('Failed to cache item after cleanup:', retryError);
      }
    }
  }

  get<T>(key: string): T | null {
    try {
      const itemStr = this.storage.getItem(this.prefix + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.storage.removeItem(this.prefix + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached item:', error);
      return null;
    }
  }

  delete(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }

  private cleanup(): void {
    const keys = Object.keys(this.storage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const itemStr = this.storage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (now - item.timestamp > item.ttl) {
              this.storage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          this.storage.removeItem(key);
        }
      }
    });
  }
}

// Global browser storage cache instances
export const persistentCache = new BrowserStorageCache('localStorage', 'blog_persistent_');
export const sessionCache = new BrowserStorageCache('sessionStorage', 'blog_session_');

// Cache key generators
export const generateCacheKey = (...parts: (string | number)[]): string => {
  return parts.map(part => String(part)).join(':');
};

// React hook for cached data
export const useCachedData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: ContentCache<T> = apiResponseCache as ContentCache<T>
) => {
  const [data, setData] = React.useState<T | null>(cache.get(key));
  const [loading, setLoading] = React.useState(!data);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const cachedData = cache.get(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetcher()
      .then(result => {
        cache.set(key, result);
        setData(result);
        setError(null);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key]);

  return { data, loading, error };
};