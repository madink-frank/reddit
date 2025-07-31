import { cacheService, AnalysisType } from './cacheService';
import { redisCacheService } from './redisCacheService';

// Cache invalidation strategies
export type InvalidationStrategy =
  | 'immediate'     // Invalidate immediately
  | 'lazy'          // Invalidate on next access
  | 'scheduled'     // Invalidate at scheduled time
  | 'ttl-based'     // Let TTL handle expiration
  | 'manual';       // Manual invalidation only

// Invalidation trigger types
export type InvalidationTrigger =
  | 'content-update'    // Content was updated
  | 'user-request'      // User requested invalidation
  | 'system-maintenance' // System maintenance
  | 'data-corruption'   // Data integrity issues
  | 'policy-change';    // Cache policy changed

// Invalidation rule interface
export interface InvalidationRule {
  id: string;
  name: string;
  description: string;
  strategy: InvalidationStrategy;
  triggers: InvalidationTrigger[];
  analysisTypes: AnalysisType[];
  conditions?: {
    contentHashPattern?: string;
    ageThreshold?: number; // in seconds
    accessCountThreshold?: number;
    confidenceThreshold?: number;
  };
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6, Sunday = 0
  };
  isActive: boolean;
  createdAt: Date;
  lastExecuted?: Date;
}

// Invalidation result
export interface InvalidationResult {
  ruleId: string;
  trigger: InvalidationTrigger;
  strategy: InvalidationStrategy;
  entriesInvalidated: number;
  executionTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export class CacheInvalidationService {
  private static instance: CacheInvalidationService;
  private rules: Map<string, InvalidationRule> = new Map();
  private scheduledJobs: Map<string, ReturnType<typeof setInterval>> = new Map();
  private invalidationHistory: InvalidationResult[] = [];
  private useRedis: boolean = false;

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): CacheInvalidationService {
    if (!CacheInvalidationService.instance) {
      CacheInvalidationService.instance = new CacheInvalidationService();
    }
    return CacheInvalidationService.instance;
  }

  /**
   * Configure cache service type
   */
  setRedisMode(useRedis: boolean): void {
    this.useRedis = useRedis;
  }

  /**
   * Get cache service instance
   */
  private getCacheService() {
    return this.useRedis ? redisCacheService : cacheService;
  }

  /**
   * Add invalidation rule
   */
  addRule(rule: Omit<InvalidationRule, 'id' | 'createdAt'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: InvalidationRule = {
      ...rule,
      id,
      createdAt: new Date()
    };

    this.rules.set(id, fullRule);

    // Schedule if needed
    if (fullRule.strategy === 'scheduled' && fullRule.schedule && fullRule.isActive) {
      this.scheduleRule(fullRule);
    }

    return id;
  }

  /**
   * Update invalidation rule
   */
  updateRule(id: string, updates: Partial<InvalidationRule>): boolean {
    const rule = this.rules.get(id);
    if (!rule) return false;

    // Clear existing schedule
    this.clearSchedule(id);

    // Update rule
    const updatedRule = { ...rule, ...updates };
    this.rules.set(id, updatedRule);

    // Reschedule if needed
    if (updatedRule.strategy === 'scheduled' && updatedRule.schedule && updatedRule.isActive) {
      this.scheduleRule(updatedRule);
    }

    return true;
  }

  /**
   * Remove invalidation rule
   */
  removeRule(id: string): boolean {
    this.clearSchedule(id);
    return this.rules.delete(id);
  }

  /**
   * Get all invalidation rules
   */
  getRules(): InvalidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get invalidation rule by ID
   */
  getRule(id: string): InvalidationRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Execute invalidation based on trigger
   */
  async executeInvalidation(
    trigger: InvalidationTrigger,
    context?: {
      contentHash?: string;
      analysisType?: AnalysisType;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<InvalidationResult[]> {
    const results: InvalidationResult[] = [];
    const applicableRules = this.getApplicableRules(trigger, context);

    for (const rule of applicableRules) {
      const result = await this.executeRule(rule, trigger, context);
      results.push(result);
      this.invalidationHistory.push(result);
    }

    // Keep only last 1000 history entries
    if (this.invalidationHistory.length > 1000) {
      this.invalidationHistory = this.invalidationHistory.slice(-1000);
    }

    return results;
  }

  /**
   * Execute specific rule
   */
  async executeRule(
    rule: InvalidationRule,
    trigger: InvalidationTrigger,
    context?: any
  ): Promise<InvalidationResult> {
    const startTime = Date.now();
    let entriesInvalidated = 0;
    let success = false;
    let error: string | undefined;

    try {
      const cacheInstance = this.getCacheService();

      switch (rule.strategy) {
        case 'immediate':
          entriesInvalidated = await this.executeImmediateInvalidation(rule, context);
          break;

        case 'lazy':
          // Mark entries for lazy invalidation (implementation depends on cache service)
          entriesInvalidated = await this.markForLazyInvalidation(rule, context);
          break;

        case 'scheduled':
          entriesInvalidated = await this.executeScheduledInvalidation(rule, context);
          break;

        case 'ttl-based':
          // TTL-based invalidation is handled by the cache service itself
          entriesInvalidated = 0;
          break;

        case 'manual':
          // Manual invalidation - only execute if explicitly requested
          if (trigger === 'user-request') {
            entriesInvalidated = await this.executeManualInvalidation(rule, context);
          }
          break;
      }

      success = true;

      // Update rule's last executed time
      rule.lastExecuted = new Date();
      this.rules.set(rule.id, rule);

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Cache invalidation error for rule ${rule.id}:`, err);
    }

    return {
      ruleId: rule.id,
      trigger,
      strategy: rule.strategy,
      entriesInvalidated,
      executionTime: Date.now() - startTime,
      success,
      error,
      timestamp: new Date()
    };
  }

  /**
   * Get invalidation history
   */
  getInvalidationHistory(limit: number = 100): InvalidationResult[] {
    return this.invalidationHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear invalidation history
   */
  clearHistory(): void {
    this.invalidationHistory = [];
  }

  /**
   * Get invalidation statistics
   */
  getStatistics(): {
    totalRules: number;
    activeRules: number;
    totalInvalidations: number;
    successRate: number;
    averageExecutionTime: number;
    invalidationsByTrigger: Record<InvalidationTrigger, number>;
    invalidationsByStrategy: Record<InvalidationStrategy, number>;
  } {
    const totalRules = this.rules.size;
    const activeRules = Array.from(this.rules.values()).filter(r => r.isActive).length;
    const totalInvalidations = this.invalidationHistory.length;
    const successfulInvalidations = this.invalidationHistory.filter(r => r.success).length;
    const successRate = totalInvalidations > 0 ? (successfulInvalidations / totalInvalidations) * 100 : 0;

    const totalExecutionTime = this.invalidationHistory.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = totalInvalidations > 0 ? totalExecutionTime / totalInvalidations : 0;

    const invalidationsByTrigger: Record<InvalidationTrigger, number> = {
      'content-update': 0,
      'user-request': 0,
      'system-maintenance': 0,
      'data-corruption': 0,
      'policy-change': 0
    };

    const invalidationsByStrategy: Record<InvalidationStrategy, number> = {
      'immediate': 0,
      'lazy': 0,
      'scheduled': 0,
      'ttl-based': 0,
      'manual': 0
    };

    this.invalidationHistory.forEach(result => {
      invalidationsByTrigger[result.trigger]++;
      invalidationsByStrategy[result.strategy]++;
    });

    return {
      totalRules,
      activeRules,
      totalInvalidations,
      successRate,
      averageExecutionTime,
      invalidationsByTrigger,
      invalidationsByStrategy
    };
  }

  // Private methods

  private initializeDefaultRules(): void {
    // Default rule: Immediate invalidation on content update
    this.addRule({
      name: 'Content Update Invalidation',
      description: 'Immediately invalidate cache when content is updated',
      strategy: 'immediate',
      triggers: ['content-update'],
      analysisTypes: ['nlp', 'sentiment', 'morphological', 'keywords', 'objects', 'ocr', 'image'],
      isActive: true
    });

    // Default rule: Daily cleanup of old entries
    this.addRule({
      name: 'Daily Cache Cleanup',
      description: 'Clean up old cache entries daily at 2 AM',
      strategy: 'scheduled',
      triggers: ['system-maintenance'],
      analysisTypes: ['nlp', 'sentiment', 'morphological', 'keywords', 'objects', 'ocr', 'image'],
      conditions: {
        ageThreshold: 86400 * 7 // 7 days
      },
      schedule: {
        frequency: 'daily',
        time: '02:00'
      },
      isActive: true
    });

    // Default rule: Manual invalidation for user requests
    this.addRule({
      name: 'Manual User Invalidation',
      description: 'Allow users to manually invalidate specific cache entries',
      strategy: 'manual',
      triggers: ['user-request'],
      analysisTypes: ['nlp', 'sentiment', 'morphological', 'keywords', 'objects', 'ocr', 'image'],
      isActive: true
    });
  }

  private getApplicableRules(
    trigger: InvalidationTrigger,
    context?: any
  ): InvalidationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.isActive) return false;
      if (!rule.triggers.includes(trigger)) return false;

      // Check conditions if specified
      if (rule.conditions && context) {
        if (rule.conditions.contentHashPattern && context.contentHash) {
          const pattern = new RegExp(rule.conditions.contentHashPattern);
          if (!pattern.test(context.contentHash)) return false;
        }
      }

      return true;
    });
  }

  private async executeImmediateInvalidation(
    rule: InvalidationRule,
    context?: any
  ): Promise<number> {
    const cacheInstance = this.getCacheService();
    let totalInvalidated = 0;

    for (const analysisType of rule.analysisTypes) {
      const count = await cacheInstance.invalidateByType(analysisType);
      totalInvalidated += count;
    }

    return totalInvalidated;
  }

  private async markForLazyInvalidation(
    rule: InvalidationRule,
    context?: any
  ): Promise<number> {
    // For lazy invalidation, we would mark entries as stale
    // This is a simplified implementation
    return 0;
  }

  private async executeScheduledInvalidation(
    rule: InvalidationRule,
    context?: any
  ): Promise<number> {
    // Execute based on conditions
    const cacheInstance = this.getCacheService();
    let totalInvalidated = 0;

    if (rule.conditions?.ageThreshold) {
      // This would require cache service to support age-based invalidation
      // For now, we'll invalidate by type
      for (const analysisType of rule.analysisTypes) {
        const count = await cacheInstance.invalidateByType(analysisType);
        totalInvalidated += count;
      }
    }

    return totalInvalidated;
  }

  private async executeManualInvalidation(
    rule: InvalidationRule,
    context?: any
  ): Promise<number> {
    const cacheInstance = this.getCacheService();
    let totalInvalidated = 0;

    if (context?.contentHash) {
      // Invalidate specific content
      if (this.useRedis && 'invalidateByContentHash' in cacheInstance) {
        totalInvalidated = await (cacheInstance as any).invalidateByContentHash(context.contentHash);
      }
    } else if (context?.analysisType) {
      // Invalidate specific analysis type
      totalInvalidated = await cacheInstance.invalidateByType(context.analysisType);
    } else {
      // Invalidate all specified types
      for (const analysisType of rule.analysisTypes) {
        const count = await cacheInstance.invalidateByType(analysisType);
        totalInvalidated += count;
      }
    }

    return totalInvalidated;
  }

  private scheduleRule(rule: InvalidationRule): void {
    if (!rule.schedule) return;

    const scheduleJob = () => {
      this.executeRule(rule, 'system-maintenance');
    };

    let interval: number;
    switch (rule.schedule.frequency) {
      case 'hourly':
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case 'daily':
        interval = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'weekly':
        interval = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      default:
        return;
    }

    const timeoutId = setInterval(scheduleJob, interval);
    this.scheduledJobs.set(rule.id, timeoutId);
  }

  private clearSchedule(ruleId: string): void {
    const timeoutId = this.scheduledJobs.get(ruleId);
    if (timeoutId) {
      clearInterval(timeoutId);
      this.scheduledJobs.delete(ruleId);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all scheduled jobs
    for (const timeoutId of this.scheduledJobs.values()) {
      clearInterval(timeoutId);
    }
    this.scheduledJobs.clear();
    this.rules.clear();
    this.invalidationHistory = [];
  }
}

// Export singleton instance
export const cacheInvalidationService = CacheInvalidationService.getInstance();
export default cacheInvalidationService;