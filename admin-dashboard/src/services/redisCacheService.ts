import { createHash } from 'crypto-browserify';
import {
  CacheConfig,
  CacheEntry,
  CacheStats,
  CacheMetrics,
  AnalysisType,
  AnalysisCacheKey
} from './cacheService';
import { Buffer } from 'buffer';

// Redis client interface (to be implemented with actual Redis client)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<boolean>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  flushall(): Promise<void>;
  info(section?: string): Promise<string>;
}

// Mock Redis client for development
class MockRedisClient implements RedisClient {
  private store: Map<string, { value: string; expiresAt: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    const expiresAt = ttl ? Date.now() + (ttl * 1000) : Date.now() + (3600 * 1000);
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;

    const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }

  async flushall(): Promise<void> {
    this.store.clear();
  }

  async info(section?: string): Promise<string> {
    return `# Memory\nused_memory:${this.store.size * 100}\nused_memory_human:${this.store.size * 100}B`;
  }
}

export class RedisCacheService {
  private redis: RedisClient;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(redisClient?: RedisClient, config: Partial<CacheConfig> = {}) {
    this.redis = redisClient || new MockRedisClient();
    this.config = {
      defaultTTL: 3600, // 1 hour
      maxMemoryUsage: 100, // 100MB
      compressionEnabled: true,
      keyPrefix: 'analysis_cache:',
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      currentMemoryUsage: 0
    };

    this.startMetricsCollection();
  }

  /**
   * Generate cache key for analysis results
   */
  generateCacheKey(cacheKey: AnalysisCacheKey): string {
    const keyData = {
      type: cacheKey.type,
      contentHash: cacheKey.contentHash,
      options: cacheKey.options || {}
    };

    const keyString = JSON.stringify(keyData);
    const hash = createHash('sha256').update(keyString).digest('hex').substring(0, 16);

    return `${this.config.keyPrefix}${cacheKey.type}:${hash}`;
  }

  /**
   * Generate content hash for caching
   */
  generateContentHash(content: string | Buffer | object): string {
    let contentString: string;

    if (typeof content === 'string') {
      contentString = content;
    } else if (Buffer.isBuffer(content)) {
      contentString = content.toString('utf8');
    } else {
      contentString = JSON.stringify(content);
    }

    return createHash('sha256').update(contentString).digest('hex');
  }

  /**
   * Get cached analysis result
   */
  async get<T>(cacheKey: AnalysisCacheKey): Promise<T | null> {
    const startTime = Date.now();
    const key = this.generateCacheKey(cacheKey);

    try {
      const cachedValue = await this.redis.get(key);

      if (!cachedValue) {
        this.metrics.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cachedValue);

      // Update access statistics (store back to Redis)
      entry.accessCount++;
      entry.lastAccessed = new Date();

      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        await this.redis.set(key, JSON.stringify(entry), ttl);
      }

      this.metrics.hits++;
      this.updateResponseTime(Date.now() - startTime);

      return entry.value;
    } catch (error) {
      console.error('Redis cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set cached analysis result
   */
  async set<T>(cacheKey: AnalysisCacheKey, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    const key = this.generateCacheKey(cacheKey);
    const now = new Date();
    const cacheTTL = ttl || this.config.defaultTTL;

    try {
      // Calculate entry size
      const valueString = JSON.stringify(value);
      const size = Buffer.byteLength(valueString, 'utf8');

      const entry: CacheEntry<T> = {
        key,
        value,
        hash: cacheKey.contentHash,
        createdAt: now,
        expiresAt: new Date(now.getTime() + cacheTTL * 1000),
        accessCount: 0,
        lastAccessed: now,
        size,
        compressed: false // TODO: Implement compression
      };

      const success = await this.redis.set(key, JSON.stringify(entry), cacheTTL);

      if (success) {
        this.metrics.sets++;
        this.updateResponseTime(Date.now() - startTime);
      }

      return success;
    } catch (error) {
      console.error('Redis cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached entry
   */
  async delete(cacheKey: AnalysisCacheKey): Promise<boolean> {
    const key = this.generateCacheKey(cacheKey);

    try {
      const deleted = await this.redis.del(key);
      if (deleted > 0) {
        this.metrics.deletes++;
      }
      return deleted > 0;
    } catch (error) {
      console.error('Redis cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushall();
      this.metrics.currentMemoryUsage = 0;
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
      const totalEntries = keys.length;

      // Get memory info from Redis
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const totalSize = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      // Calculate hit/miss rates
      const totalRequests = this.metrics.hits + this.metrics.misses;

      // Get oldest and newest entries (sample approach)
      let oldestEntry: Date | undefined;
      let newestEntry: Date | undefined;

      if (keys.length > 0) {
        const sampleKeys = keys.slice(0, Math.min(10, keys.length));
        const entries: Date[] = [];

        for (const key of sampleKeys) {
          const value = await this.redis.get(key);
          if (value) {
            try {
              const entry: CacheEntry = JSON.parse(value);
              entries.push(entry.createdAt);
            } catch (e) {
              // Skip invalid entries
            }
          }
        }

        if (entries.length > 0) {
          oldestEntry = new Date(Math.min(...entries.map(d => d.getTime())));
          newestEntry = new Date(Math.max(...entries.map(d => d.getTime())));
        }
      }

      return {
        totalEntries,
        totalSize,
        hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0,
        missRate: totalRequests > 0 ? (this.metrics.misses / totalRequests) * 100 : 0,
        evictionCount: this.metrics.evictions,
        memoryUsage: this.metrics.currentMemoryUsage,
        oldestEntry,
        newestEntry
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}${pattern}*`);
      let invalidatedCount = 0;

      for (const key of keys) {
        const deleted = await this.redis.del(key);
        if (deleted > 0) {
          invalidatedCount++;
        }
      }

      return invalidatedCount;
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache entries by analysis type
   */
  async invalidateByType(type: AnalysisType): Promise<number> {
    return this.invalidateByPattern(`${type}:`);
  }

  /**
   * Invalidate cache entries by content hash
   */
  async invalidateByContentHash(contentHash: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
      let invalidatedCount = 0;

      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            if (entry.hash === contentHash) {
              const deleted = await this.redis.del(key);
              if (deleted > 0) {
                invalidatedCount++;
              }
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      }

      return invalidatedCount;
    } catch (error) {
      console.error('Redis cache invalidation by hash error:', error);
      return 0;
    }
  }

  /**
   * Get cache entry information
   */
  async getEntryInfo(cacheKey: AnalysisCacheKey): Promise<{
    exists: boolean;
    ttl: number;
    size?: number;
    accessCount?: number;
    lastAccessed?: Date;
  }> {
    const key = this.generateCacheKey(cacheKey);

    try {
      const exists = await this.redis.exists(key);
      const ttl = await this.redis.ttl(key);

      if (!exists) {
        return { exists: false, ttl: -2 };
      }

      const value = await this.redis.get(key);
      if (value) {
        try {
          const entry: CacheEntry = JSON.parse(value);
          return {
            exists: true,
            ttl,
            size: entry.size,
            accessCount: entry.accessCount,
            lastAccessed: entry.lastAccessed
          };
        } catch (e) {
          return { exists: true, ttl };
        }
      }

      return { exists: true, ttl };
    } catch (error) {
      console.error('Error getting cache entry info:', error);
      return { exists: false, ttl: -2 };
    }
  }

  /**
   * Update average response time
   */
  private updateResponseTime(responseTime: number): void {
    const totalOperations = this.metrics.hits + this.metrics.misses + this.metrics.sets;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalOperations - 1) + responseTime) / totalOperations;
  }

  /**
   * Start metrics collection interval
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const info = await this.redis.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        const currentMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

        this.metrics.currentMemoryUsage = currentMemory;
        this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, currentMemory);
      } catch (error) {
        console.error('Error collecting cache metrics:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Destroy cache service and cleanup resources
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Create singleton instance
export const redisCacheService = new RedisCacheService();

export default redisCacheService;