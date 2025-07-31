/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe paint metrics (FCP, LCP)
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Calculate TTFB
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Log performance metrics to console
   */
  logMetrics(): void {
    console.group('Performance Metrics');
    console.log('First Contentful Paint (FCP):', this.metrics.fcp?.toFixed(2), 'ms');
    console.log('Largest Contentful Paint (LCP):', this.metrics.lcp?.toFixed(2), 'ms');
    console.log('First Input Delay (FID):', this.metrics.fid?.toFixed(2), 'ms');
    console.log('Cumulative Layout Shift (CLS):', this.metrics.cls?.toFixed(4));
    console.log('Time to First Byte (TTFB):', this.metrics.ttfb?.toFixed(2), 'ms');
    console.groupEnd();
  }

  /**
   * Send metrics to analytics service
   */
  sendMetrics(endpoint?: string): void {
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(error => console.warn('Failed to send metrics:', error));
    }
  }

  /**
   * Cleanup observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Resource loading performance utilities
 */
export class ResourcePerformance {
  /**
   * Measure resource loading time
   */
  static measureResourceLoad(url: string): Promise<number> {
    const startTime = performance.now();
    
    return fetch(url, { method: 'HEAD' })
      .then(() => performance.now() - startTime)
      .catch(() => -1);
  }

  /**
   * Get resource timing information
   */
  static getResourceTiming(url: string): PerformanceResourceTiming | null {
    const entries = performance.getEntriesByName(url) as PerformanceResourceTiming[];
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }

  /**
   * Analyze bundle sizes
   */
  static analyzeBundleSizes(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bundles = resources.filter(resource => 
      resource.name.includes('.js') || resource.name.includes('.css')
    );

    console.group('Bundle Analysis');
    bundles.forEach(bundle => {
      const size = bundle.transferSize || bundle.encodedBodySize || 0;
      const loadTime = bundle.responseEnd - bundle.requestStart;
      console.log(`${bundle.name}: ${(size / 1024).toFixed(2)}KB, ${loadTime.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  /**
   * Get current memory usage (if available)
   */
  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }

  /**
   * Log memory usage
   */
  static logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`Memory Usage: ${memory.used}MB / ${memory.total}MB (Limit: ${memory.limit}MB)`);
    }
  }

  /**
   * Monitor memory usage over time
   */
  static startMemoryMonitoring(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.logMemoryUsage();
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

/**
 * Frame rate monitoring
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private isRunning = false;

  /**
   * Start monitoring frame rate
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.measureFrame();
  }

  /**
   * Stop monitoring frame rate
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  private measureFrame = (): void => {
    if (!this.isRunning) return;

    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(this.measureFrame);
  };
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): PerformanceMonitor {
  const monitor = new PerformanceMonitor();

  // Log metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitor.logMetrics();
      ResourcePerformance.analyzeBundleSizes();
      MemoryMonitor.logMemoryUsage();
    }, 2000);
  });

  // Monitor memory usage in development
  if (process.env.NODE_ENV === 'development') {
    MemoryMonitor.startMemoryMonitoring();
  }

  return monitor;
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private static budgets = {
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    ttfb: 800  // 800ms
  };

  /**
   * Check if metrics meet performance budget
   */
  static checkBudget(metrics: Partial<PerformanceMetrics>): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    Object.entries(this.budgets).forEach(([metric, budget]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (value !== undefined && value > budget) {
        violations.push(`${metric.toUpperCase()}: ${value} > ${budget}`);
      }
    });

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Set custom performance budgets
   */
  static setBudgets(budgets: Partial<typeof PerformanceBudget.budgets>): void {
    Object.assign(this.budgets, budgets);
  }
}