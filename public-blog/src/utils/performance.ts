// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

// Web Vitals measurement
export class WebVitalsMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // First Contentful Paint
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
        this.reportMetric('FCP', fcpEntry.startTime);
      }
    }

    // Time to First Byte
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing as any;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;
      this.reportMetric('TTFB', this.metrics.ttfb);
    }
  }

  private reportMetric(name: string, value: number): void {
    console.log(`${name}: ${value.toFixed(2)}ms`);
    
    // Send to analytics service if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      });
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Resource loading performance
export class ResourceMonitor {
  getResourceTimings(): ResourceTiming[] {
    if (!('performance' in window) || !('getEntriesByType' in performance)) {
      return [];
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: this.getResourceType(resource.name),
    }));
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(css)$/i)) return 'stylesheet';
    if (url.match(/\.(js)$/i)) return 'script';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  getLargestResources(limit: number = 10): ResourceTiming[] {
    return this.getResourceTimings()
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  getSlowestResources(limit: number = 10): ResourceTiming[] {
    return this.getResourceTimings()
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  getMemoryUsage(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }
    return null;
  }

  startMemoryMonitoring(interval: number = 5000): () => void {
    const intervalId = setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage && usage.percentage > 80) {
        console.warn('High memory usage detected:', usage);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }
}

// Performance budget checker
export interface PerformanceBudget {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  totalSize: number;
  imageSize: number;
  scriptSize: number;
  styleSize: number;
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  fcp: 1800, // 1.8s
  lcp: 2500, // 2.5s
  fid: 100,  // 100ms
  cls: 0.1,  // 0.1
  ttfb: 800, // 800ms
  totalSize: 2000000, // 2MB
  imageSize: 1000000, // 1MB
  scriptSize: 500000,  // 500KB
  styleSize: 100000,   // 100KB
};

export class PerformanceBudgetChecker {
  private budget: PerformanceBudget;
  private webVitals: WebVitalsMonitor;
  private resourceMonitor: ResourceMonitor;

  constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget;
    this.webVitals = new WebVitalsMonitor();
    this.resourceMonitor = new ResourceMonitor();
  }

  checkBudget(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    const metrics = this.webVitals.getMetrics();
    const resources = this.resourceMonitor.getResourceTimings();

    // Check Web Vitals
    if (metrics.fcp && metrics.fcp > this.budget.fcp) {
      violations.push(`FCP exceeded budget: ${metrics.fcp.toFixed(2)}ms > ${this.budget.fcp}ms`);
    }
    if (metrics.lcp && metrics.lcp > this.budget.lcp) {
      violations.push(`LCP exceeded budget: ${metrics.lcp.toFixed(2)}ms > ${this.budget.lcp}ms`);
    }
    if (metrics.fid && metrics.fid > this.budget.fid) {
      violations.push(`FID exceeded budget: ${metrics.fid.toFixed(2)}ms > ${this.budget.fid}ms`);
    }
    if (metrics.cls && metrics.cls > this.budget.cls) {
      violations.push(`CLS exceeded budget: ${metrics.cls.toFixed(3)} > ${this.budget.cls}`);
    }
    if (metrics.ttfb && metrics.ttfb > this.budget.ttfb) {
      violations.push(`TTFB exceeded budget: ${metrics.ttfb.toFixed(2)}ms > ${this.budget.ttfb}ms`);
    }

    // Check resource sizes
    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    if (totalSize > this.budget.totalSize) {
      violations.push(`Total size exceeded budget: ${(totalSize / 1024).toFixed(2)}KB > ${(this.budget.totalSize / 1024).toFixed(2)}KB`);
    }

    const imageSize = resources
      .filter(r => r.type === 'image')
      .reduce((sum, resource) => sum + resource.size, 0);
    if (imageSize > this.budget.imageSize) {
      violations.push(`Image size exceeded budget: ${(imageSize / 1024).toFixed(2)}KB > ${(this.budget.imageSize / 1024).toFixed(2)}KB`);
    }

    const scriptSize = resources
      .filter(r => r.type === 'script')
      .reduce((sum, resource) => sum + resource.size, 0);
    if (scriptSize > this.budget.scriptSize) {
      violations.push(`Script size exceeded budget: ${(scriptSize / 1024).toFixed(2)}KB > ${(this.budget.scriptSize / 1024).toFixed(2)}KB`);
    }

    const styleSize = resources
      .filter(r => r.type === 'stylesheet')
      .reduce((sum, resource) => sum + resource.size, 0);
    if (styleSize > this.budget.styleSize) {
      violations.push(`Style size exceeded budget: ${(styleSize / 1024).toFixed(2)}KB > ${(this.budget.styleSize / 1024).toFixed(2)}KB`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

// Global performance monitoring instances
export const webVitalsMonitor = new WebVitalsMonitor();
export const resourceMonitor = new ResourceMonitor();
export const memoryMonitor = new MemoryMonitor();
export const performanceBudgetChecker = new PerformanceBudgetChecker();

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): void => {
  // Start monitoring on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const budgetCheck = performanceBudgetChecker.checkBudget();
        if (!budgetCheck.passed) {
          console.warn('Performance budget violations:', budgetCheck.violations);
        }
      }, 5000); // Check after 5 seconds
    });
  } else {
    setTimeout(() => {
      const budgetCheck = performanceBudgetChecker.checkBudget();
      if (!budgetCheck.passed) {
        console.warn('Performance budget violations:', budgetCheck.violations);
      }
    }, 5000);
  }
};