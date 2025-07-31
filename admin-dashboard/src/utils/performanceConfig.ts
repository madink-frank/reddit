/**
 * Performance Configuration
 * Centralized configuration for performance optimization
 */

export interface PerformanceThresholds {
  // Core Web Vitals
  fcp: { good: number; poor: number }; // First Contentful Paint
  lcp: { good: number; poor: number }; // Largest Contentful Paint
  fid: { good: number; poor: number }; // First Input Delay
  cls: { good: number; poor: number }; // Cumulative Layout Shift
  
  // Additional metrics
  ttfb: { good: number; poor: number }; // Time to First Byte
  tti: { good: number; poor: number };  // Time to Interactive
  
  // Resource thresholds
  bundleSize: {
    total: number;
    javascript: number;
    css: number;
    images: number;
    fonts: number;
  };
  
  // Individual file size limits
  fileSize: {
    javascript: number;
    css: number;
    image: number;
    font: number;
  };
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  // Core Web Vitals (based on Google's recommendations)
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  
  // Additional metrics
  ttfb: { good: 800, poor: 1800 },
  tti: { good: 3800, poor: 7300 },
  
  // Bundle size limits (in bytes)
  bundleSize: {
    total: 2 * 1024 * 1024,      // 2MB total
    javascript: 1024 * 1024,     // 1MB JS
    css: 256 * 1024,             // 256KB CSS
    images: 512 * 1024,          // 512KB images
    fonts: 128 * 1024            // 128KB fonts
  },
  
  // Individual file size limits
  fileSize: {
    javascript: 500 * 1024,      // 500KB per JS file
    css: 100 * 1024,             // 100KB per CSS file
    image: 200 * 1024,           // 200KB per image
    font: 50 * 1024              // 50KB per font
  }
};

export interface OptimizationSettings {
  // Image optimization
  images: {
    enableWebP: boolean;
    enableLazyLoading: boolean;
    compressionQuality: number;
    maxWidth: number;
    maxHeight: number;
  };
  
  // Code splitting
  codeSplitting: {
    enableChunkSplitting: boolean;
    vendorChunkThreshold: number;
    asyncChunkThreshold: number;
  };
  
  // Caching
  caching: {
    enableServiceWorker: boolean;
    cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxCacheAge: number;
  };
  
  // Compression
  compression: {
    enableGzip: boolean;
    enableBrotli: boolean;
    compressionLevel: number;
  };
  
  // Monitoring
  monitoring: {
    enableRealTimeMonitoring: boolean;
    sampleRate: number;
    reportingInterval: number;
  };
}

export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  images: {
    enableWebP: true,
    enableLazyLoading: true,
    compressionQuality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080
  },
  
  codeSplitting: {
    enableChunkSplitting: true,
    vendorChunkThreshold: 100 * 1024, // 100KB
    asyncChunkThreshold: 50 * 1024    // 50KB
  },
  
  caching: {
    enableServiceWorker: true,
    cacheStrategy: 'stale-while-revalidate',
    maxCacheAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  compression: {
    enableGzip: true,
    enableBrotli: true,
    compressionLevel: 6
  },
  
  monitoring: {
    enableRealTimeMonitoring: true,
    sampleRate: 0.1, // 10% of users
    reportingInterval: 30000 // 30 seconds
  }
};

export interface PerformanceBudget {
  category: string;
  metric: string;
  budget: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
}

export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Timing budgets
  { category: 'timing', metric: 'first-contentful-paint', budget: 1800, unit: 'ms', priority: 'high' },
  { category: 'timing', metric: 'largest-contentful-paint', budget: 2500, unit: 'ms', priority: 'high' },
  { category: 'timing', metric: 'first-input-delay', budget: 100, unit: 'ms', priority: 'high' },
  { category: 'timing', metric: 'cumulative-layout-shift', budget: 0.1, unit: 'score', priority: 'high' },
  { category: 'timing', metric: 'time-to-interactive', budget: 3800, unit: 'ms', priority: 'medium' },
  
  // Resource size budgets
  { category: 'resource', metric: 'total-size', budget: 2048, unit: 'KB', priority: 'high' },
  { category: 'resource', metric: 'javascript-size', budget: 1024, unit: 'KB', priority: 'high' },
  { category: 'resource', metric: 'css-size', budget: 256, unit: 'KB', priority: 'medium' },
  { category: 'resource', metric: 'image-size', budget: 512, unit: 'KB', priority: 'medium' },
  { category: 'resource', metric: 'font-size', budget: 128, unit: 'KB', priority: 'low' },
  
  // Resource count budgets
  { category: 'count', metric: 'total-requests', budget: 50, unit: 'requests', priority: 'medium' },
  { category: 'count', metric: 'javascript-requests', budget: 10, unit: 'requests', priority: 'medium' },
  { category: 'count', metric: 'css-requests', budget: 5, unit: 'requests', priority: 'low' },
  { category: 'count', metric: 'image-requests', budget: 20, unit: 'requests', priority: 'low' }
];

export class PerformanceConfigManager {
  private static instance: PerformanceConfigManager;
  private thresholds: PerformanceThresholds;
  private settings: OptimizationSettings;
  private budgets: PerformanceBudget[];

  private constructor() {
    this.thresholds = { ...PERFORMANCE_THRESHOLDS };
    this.settings = { ...DEFAULT_OPTIMIZATION_SETTINGS };
    this.budgets = [...PERFORMANCE_BUDGETS];
  }

  public static getInstance(): PerformanceConfigManager {
    if (!PerformanceConfigManager.instance) {
      PerformanceConfigManager.instance = new PerformanceConfigManager();
    }
    return PerformanceConfigManager.instance;
  }

  public getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  public getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  public getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  public updateThresholds(updates: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...updates };
  }

  public updateSettings(updates: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  public addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  public removeBudget(category: string, metric: string): void {
    this.budgets = this.budgets.filter(
      budget => !(budget.category === category && budget.metric === metric)
    );
  }

  public validateMetric(metric: string, value: number): {
    status: 'good' | 'needs-improvement' | 'poor';
    threshold: { good: number; poor: number } | null;
  } {
    const thresholdMap: Record<string, { good: number; poor: number }> = {
      'first-contentful-paint': this.thresholds.fcp,
      'largest-contentful-paint': this.thresholds.lcp,
      'first-input-delay': this.thresholds.fid,
      'cumulative-layout-shift': this.thresholds.cls,
      'time-to-first-byte': this.thresholds.ttfb,
      'time-to-interactive': this.thresholds.tti
    };

    const threshold = thresholdMap[metric];
    if (!threshold) {
      return { status: 'good', threshold: null };
    }

    if (value <= threshold.good) {
      return { status: 'good', threshold };
    } else if (value <= threshold.poor) {
      return { status: 'needs-improvement', threshold };
    } else {
      return { status: 'poor', threshold };
    }
  }

  public checkBudget(category: string, metric: string, value: number): {
    withinBudget: boolean;
    budget: PerformanceBudget | null;
    overage: number;
  } {
    const budget = this.budgets.find(
      b => b.category === category && b.metric === metric
    );

    if (!budget) {
      return { withinBudget: true, budget: null, overage: 0 };
    }

    const withinBudget = value <= budget.budget;
    const overage = withinBudget ? 0 : value - budget.budget;

    return { withinBudget, budget, overage };
  }

  public generateOptimizationRecommendations(
    metrics: Record<string, number>
  ): Array<{
    type: 'critical' | 'warning' | 'info';
    category: string;
    message: string;
    suggestions: string[];
  }> {
    const recommendations: Array<{
      type: 'critical' | 'warning' | 'info';
      category: string;
      message: string;
      suggestions: string[];
    }> = [];

    // Check Core Web Vitals
    Object.entries(metrics).forEach(([metric, value]) => {
      const validation = this.validateMetric(metric, value);
      
      if (validation.status === 'poor') {
        recommendations.push({
          type: 'critical',
          category: 'core-web-vitals',
          message: `${metric} is poor (${value}ms)`,
          suggestions: this.getMetricSuggestions(metric)
        });
      } else if (validation.status === 'needs-improvement') {
        recommendations.push({
          type: 'warning',
          category: 'core-web-vitals',
          message: `${metric} needs improvement (${value}ms)`,
          suggestions: this.getMetricSuggestions(metric)
        });
      }
    });

    return recommendations;
  }

  private getMetricSuggestions(metric: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      'first-contentful-paint': [
        'Optimize critical resources',
        'Reduce server response time',
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript'
      ],
      'largest-contentful-paint': [
        'Optimize images',
        'Preload important resources',
        'Reduce server response time',
        'Remove unused CSS and JavaScript'
      ],
      'first-input-delay': [
        'Reduce JavaScript execution time',
        'Remove unused JavaScript',
        'Split long tasks',
        'Use web workers for heavy computations'
      ],
      'cumulative-layout-shift': [
        'Add size attributes to images',
        'Reserve space for dynamic content',
        'Avoid inserting content above existing content',
        'Use CSS aspect-ratio for responsive images'
      ]
    };

    return suggestionMap[metric] || ['Review and optimize this metric'];
  }

  public exportConfig(): string {
    return JSON.stringify({
      thresholds: this.thresholds,
      settings: this.settings,
      budgets: this.budgets
    }, null, 2);
  }

  public importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      
      if (config.thresholds) {
        this.thresholds = { ...this.thresholds, ...config.thresholds };
      }
      
      if (config.settings) {
        this.settings = { ...this.settings, ...config.settings };
      }
      
      if (config.budgets) {
        this.budgets = config.budgets;
      }
    } catch (error) {
      console.error('Failed to import performance config:', error);
      throw new Error('Invalid configuration format');
    }
  }
}

// Export singleton instance
export const performanceConfig = PerformanceConfigManager.getInstance();