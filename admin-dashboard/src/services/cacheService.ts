import { createHash } from 'crypto-browserify';
import { Buffer } from 'buffer';

// Cache configuration
export interface CacheConfig {
  defaultTTL: number; // Time to live in seconds
  maxMemoryUsage: number; // Maximum memory usage in MB
  compressionEnabled: boolean;
  keyPrefix: string;
}

// Cache entry interface
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  hash: string;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number; // Size in bytes
  compressed: boolean;
}

// Cache statistics
export interface CacheStats {
  totalEntries: number;
  totalSize: number; // Total size in bytes
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

// Cache performance metrics
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  averageResponseTime: number;
  peakMemoryUsage: number;
  currentMemoryUsage: number;
}

// Analysis cache types
export type AnalysisType = 'nlp' | 'image' | 'sentiment' | 'morphological' | 'keywords' | 'ocr' | 'objects';

export interface AnalysisCacheKey {
  type: AnalysisType;
  contentHash: string;
  options?: Record<string, any>;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
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

    this.startCleanupInterval();
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
      const entry = this.cache.get(key);

      if (!entry) {
        this.metrics.misses++;
        return null;
      }

      // Check if entry has expired
      if (entry.expiresAt < new Date()) {
        this.cache.delete(key);
        this.metrics.misses++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = new Date();

      this.metrics.hits++;
      this.updateResponseTime(Date.now() - startTime);

      return entry.value as T;
    } catch (error) {
      console.error('Cache get error:', error);
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
    const expiresAt = new Date(now.getTime() + (ttl || this.config.defaultTTL) * 1000);

    try {
      // Calculate entry size
      const valueString = JSON.stringify(value);
      const size = Buffer.byteLength(valueString, 'utf8');

      // Check memory limits
      if (!this.checkMemoryLimit(size)) {
        await this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        hash: cacheKey.contentHash,
        createdAt: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
        size,
        compressed: false // TODO: Implement compression
      };

      this.cache.set(key, entry);
      this.metrics.sets++;
      this.updateMemoryUsage();
      this.updateResponseTime(Date.now() - startTime);

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached entry
   */
  async delete(cacheKey: AnalysisCacheKey): Promise<boolean> {
    const key = this.generateCacheKey(cacheKey);

    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.metrics.deletes++;
        this.updateMemoryUsage();
      }
      return deleted;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.metrics.currentMemoryUsage = 0;
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalRequests = this.metrics.hits + this.metrics.misses;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.metrics.misses / totalRequests) * 100 : 0,
      evictionCount: this.metrics.evictions,
      memoryUsage: this.metrics.currentMemoryUsage,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.createdAt.getTime()))) : undefined,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.createdAt.getTime()))) : undefined
    };
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
    let invalidatedCount = 0;

    try {
      const keysToDelete: string[] = [];

      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.cache.delete(key);
        invalidatedCount++;
      }

      this.updateMemoryUsage();
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    return invalidatedCount;
  }

  /**
   * Invalidate cache entries by analysis type
   */
  async invalidateByType(type: AnalysisType): Promise<number> {
    return this.invalidateByPattern(`${this.config.keyPrefix}${type}:`);
  }

  /**
   * Check if memory limit allows new entry
   */
  private checkMemoryLimit(newEntrySize: number): boolean {
    const maxBytes = this.config.maxMemoryUsage * 1024 * 1024; // Convert MB to bytes
    return (this.metrics.currentMemoryUsage + newEntrySize) <= maxBytes;
  }

  /**
   * Evict least recently used entries
   */
  private async evictLRU(): Promise<void> {
    const entries = Array.from(this.cache.entries());

    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Evict oldest 25% of entries
    const evictCount = Math.max(1, Math.floor(entries.length * 0.25));

    for (let i = 0; i < evictCount && i < entries.length; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.metrics.evictions++;
    }

    this.updateMemoryUsage();
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    this.metrics.currentMemoryUsage = totalSize;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, totalSize);
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
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.updateMemoryUsage();
    }
  }

  /**
   * Destroy cache service and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  defaultTTL: 3600, // 1 hour
  maxMemoryUsage: 100, // 100MB
  compressionEnabled: true,
  keyPrefix: 'reddit_analysis:'
});

export default cacheService;