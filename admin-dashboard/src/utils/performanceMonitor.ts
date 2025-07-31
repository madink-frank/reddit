/**
 * Performance Monitoring Utilities
 * Real-time performance tracking and optimization
 */

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  tti?: number; // Time to Interactive
}

interface ResourceTiming {
  name: string;
  duration: number;
  size?: number;
  type: string;
}

interface PerformanceReport {
  timestamp: number;
  url: string;
  metrics: PerformanceMetrics;
  resources: ResourceTiming[];
  recommendations: string[];
}

class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {};
  private isMonitoring = false;

  constructor() {
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });
    } catch (error) {
      console.error('Failed to initialize PerformanceObserver:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.processLCPEntry(entry as any);
        break;
      case 'first-input':
        this.processFIDEntry(entry as any);
        break;
      case 'layout-shift':
        this.processCLSEntry(entry as any);
        break;
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
    }
  }

  private processPaintEntry(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.metrics.fcp = entry.startTime;
    }
  }

  private processLCPEntry(entry: any): void {
    this.metrics.lcp = entry.startTime;
  }

  private processFIDEntry(entry: any): void {
    this.metrics.fid = entry.processingStart - entry.startTime;
  }

  private processCLSEntry(entry: any): void {
    if (!entry.hadRecentInput) {
      this.metrics.cls = (this.metrics.cls || 0) + entry.value;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.ttfb = entry.responseStart - entry.requestStart;
  }

  public startMonitoring(): void {
    if (!this.observer || this.isMonitoring) return;

    try {
      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['paint'] });
      this.observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observer.observe({ entryTypes: ['first-input'] });
      this.observer.observe({ entryTypes: ['layout-shift'] });
      this.observer.observe({ entryTypes: ['navigation'] });
      
      this.isMonitoring = true;
      console.log('Performance monitoring started');
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
    }
  }

  public stopMonitoring(): void {
    if (this.observer && this.isMonitoring) {
      this.observer.disconnect();
      this.isMonitoring = false;
      console.log('Performance monitoring stopped');
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getResourceTimings(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: (resource as any).transferSize || 0,
      type: this.getResourceType(resource.name)
    }));
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    if (['js', 'mjs', 'jsx'].includes(extension)) return 'script';
    if (['css', 'scss'].includes(extension)) return 'stylesheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) return 'font';
    if (['json', 'xml'].includes(extension)) return 'data';
    
    return 'other';
  }

  public generateReport(): PerformanceReport {
    const recommendations = this.generateRecommendations();
    
    return {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: this.getMetrics(),
      resources: this.getResourceTimings(),
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    // FCP recommendations
    if (metrics.fcp && metrics.fcp > 2000) {
      recommendations.push('First Contentful Paint is slow (>2s). Consider optimizing critical resources.');
    }

    // LCP recommendations
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Largest Contentful Paint is slow (>2.5s). Optimize images and critical resources.');
    }

    // FID recommendations
    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('First Input Delay is high (>100ms). Reduce JavaScript execution time.');
    }

    // CLS recommendations
    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high (>0.1). Add size attributes to images and reserve space for dynamic content.');
    }

    // Resource-based recommendations
    const resources = this.getResourceTimings();
    const largeResources = resources.filter(r => r.size && r.size > 500 * 1024);
    
    if (largeResources.length > 0) {
      recommendations.push(`Found ${largeResources.length} large resources (>500KB). Consider optimization or lazy loading.`);
    }

    const slowResources = resources.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      recommendations.push(`Found ${slowResources.length} slow-loading resources (>1s). Check network optimization.`);
    }

    return recommendations;
  }

  public measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    console.log(`${name} took ${(endTime - startTime).toFixed(2)}ms`);
    
    // Mark the measurement
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    return result;
  }

  public async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    console.log(`${name} took ${(endTime - startTime).toFixed(2)}ms`);
    
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    return result;
  }

  public logPerformanceReport(): void {
    const report = this.generateReport();
    
    console.group('🚀 Performance Report');
    console.log('📊 Core Web Vitals:');
    console.log(`  FCP: ${report.metrics.fcp?.toFixed(0)}ms`);
    console.log(`  LCP: ${report.metrics.lcp?.toFixed(0)}ms`);
    console.log(`  FID: ${report.metrics.fid?.toFixed(0)}ms`);
    console.log(`  CLS: ${report.metrics.cls?.toFixed(3)}`);
    
    console.log('📈 Resource Summary:');
    const resourcesByType = report.resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(resourcesByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} resources`);
    });
    
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    console.groupEnd();
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private monitor: PerformanceMonitor;

  private constructor() {
    this.monitor = new PerformanceMonitor();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  public startMonitoring(): void {
    this.monitor.startMonitoring();
  }

  public stopMonitoring(): void {
    this.monitor.stopMonitoring();
  }

  public getReport(): PerformanceReport {
    return this.monitor.generateReport();
  }

  public logReport(): void {
    this.monitor.logPerformanceReport();
  }

  // Lazy loading utility
  public static createLazyLoader<T>(
    loader: () => Promise<T>,
    _fallback?: T
  ): () => Promise<T> {
    let cached: T | null = null;
    let loading: Promise<T> | null = null;

    return async (): Promise<T> => {
      if (cached) return cached;
      if (loading) return loading;

      loading = loader().then(result => {
        cached = result;
        loading = null;
        return result;
      });

      return loading;
    };
  }

  // Debounce utility for performance
  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle utility for performance
  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Export the monitor instance
export const performanceMonitor = new PerformanceMonitor();
export default PerformanceOptimizer;