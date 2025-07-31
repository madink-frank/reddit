import { useEffect, useCallback, useRef } from 'react';
import { webVitalsMonitor, resourceMonitor, memoryMonitor } from '@/utils/performance';
import { trackEvent } from '@/utils/analytics';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

interface UsePerformanceMonitoringOptions {
  enableWebVitals?: boolean;
  enableResourceMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableAnalytics?: boolean;
  thresholds?: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
  };
}

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const {
    enableWebVitals = true,
    enableResourceMonitoring = true,
    enableMemoryMonitoring = true,
    enableAnalytics = true,
    thresholds = {
      fcp: 1800,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      ttfb: 800,
    }
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({});
  const observersRef = useRef<PerformanceObserver[]>([]);

  // Report metric to analytics
  const reportMetric = useCallback((name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
    if (enableAnalytics) {
      trackEvent({
        event_name: 'web_vitals',
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        custom_parameters: {
          metric_name: name,
          metric_value: value,
          metric_rating: rating,
          page_path: window.location.pathname,
        }
      });
    }
  }, [enableAnalytics]);

  // Get rating for a metric
  const getRating = useCallback((name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (name === 'cls') {
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    }

    return value <= threshold ? 'good' : value <= threshold * 1.5 ? 'needs-improvement' : 'poor';
  }, [thresholds]);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (!enableWebVitals || typeof window === 'undefined') return;

    const observers: PerformanceObserver[] = [];

    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            const value = fcpEntry.startTime;
            metricsRef.current.fcp = value;
            reportMetric('FCP', value, getRating('fcp', value));
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            const value = lastEntry.startTime;
            metricsRef.current.lcp = value;
            reportMetric('LCP', value, getRating('lcp', value));
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const value = entry.processingStart - entry.startTime;
            metricsRef.current.fid = value;
            reportMetric('FID', value, getRating('fid', value));
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metricsRef.current.cls = clsValue;
          reportMetric('CLS', clsValue, getRating('cls', clsValue));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Time to First Byte
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        const value = entry.responseStart - entry.fetchStart;
        metricsRef.current.ttfb = value;
        reportMetric('TTFB', value, getRating('ttfb', value));
      }
    }

    observersRef.current = observers;

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [enableWebVitals, reportMetric, getRating]);

  // Resource monitoring
  useEffect(() => {
    if (!enableResourceMonitoring || typeof window === 'undefined') return;

    const monitorResources = () => {
      const resources = resourceMonitor.getResourceTimings();
      const largestResources = resourceMonitor.getLargestResources(5);
      const slowestResources = resourceMonitor.getSlowestResources(5);

      // Report large resources
      largestResources.forEach(resource => {
        if (resource.size > 500000) { // > 500KB
          trackEvent({
            event_name: 'large_resource',
            event_category: 'Performance',
            event_label: resource.name,
            value: Math.round(resource.size / 1024), // KB
            custom_parameters: {
              resource_type: resource.type,
              resource_size: resource.size,
            }
          });
        }
      });

      // Report slow resources
      slowestResources.forEach(resource => {
        if (resource.duration > 1000) { // > 1s
          trackEvent({
            event_name: 'slow_resource',
            event_category: 'Performance',
            event_label: resource.name,
            value: Math.round(resource.duration),
            custom_parameters: {
              resource_type: resource.type,
              resource_duration: resource.duration,
            }
          });
        }
      });
    };

    // Monitor resources after page load
    if (document.readyState === 'complete') {
      setTimeout(monitorResources, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(monitorResources, 1000);
      });
    }
  }, [enableResourceMonitoring]);

  // Memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring || typeof window === 'undefined') return;

    const monitorMemory = () => {
      const memoryUsage = memoryMonitor.getMemoryUsage();
      if (memoryUsage && memoryUsage.percentage > 80) {
        trackEvent({
          event_name: 'high_memory_usage',
          event_category: 'Performance',
          event_label: 'Memory Warning',
          value: Math.round(memoryUsage.percentage),
          custom_parameters: {
            memory_used: memoryUsage.used,
            memory_total: memoryUsage.total,
            memory_percentage: memoryUsage.percentage,
          }
        });
      }
    };

    const interval = setInterval(monitorMemory, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableMemoryMonitoring]);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Manual performance mark
  const mark = useCallback((name: string) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }, []);

  // Manual performance measure
  const measure = useCallback((name: string, startMark?: string, endMark?: string) => {
    if ('performance' in window && 'measure' in performance) {
      try {
        const measurement = performance.measure(name, startMark, endMark);
        
        if (enableAnalytics) {
          trackEvent({
            event_name: 'custom_timing',
            event_category: 'Performance',
            event_label: name,
            value: Math.round(measurement.duration),
            custom_parameters: {
              timing_name: name,
              timing_duration: measurement.duration,
            }
          });
        }
        
        return measurement;
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  }, [enableAnalytics]);

  // Report custom metric
  const reportCustomMetric = useCallback((name: string, value: number, unit: string = 'ms') => {
    if (enableAnalytics) {
      trackEvent({
        event_name: 'custom_metric',
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        custom_parameters: {
          metric_name: name,
          metric_value: value,
          metric_unit: unit,
        }
      });
    }
  }, [enableAnalytics]);

  return {
    metrics: metricsRef.current,
    getMetrics,
    mark,
    measure,
    reportCustomMetric,
  };
};

// Hook for component-level performance monitoring
export const useComponentPerformance = (componentName: string) => {
  const mountTimeRef = useRef<number>();
  const { mark, measure, reportCustomMetric } = usePerformanceMonitoring();

  useEffect(() => {
    mountTimeRef.current = performance.now();
    mark(`${componentName}-mount-start`);

    return () => {
      if (mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        mark(`${componentName}-mount-end`);
        measure(`${componentName}-mount`, `${componentName}-mount-start`, `${componentName}-mount-end`);
        
        // Report slow component mounts
        if (mountDuration > 100) { // > 100ms
          reportCustomMetric(`${componentName}-slow-mount`, mountDuration);
        }
      }
    };
  }, [componentName, mark, measure, reportCustomMetric]);

  const measureRender = useCallback((renderName: string = 'render') => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      reportCustomMetric(`${componentName}-${renderName}`, duration);
    };
  }, [componentName, reportCustomMetric]);

  return {
    measureRender,
  };
};

export default usePerformanceMonitoring;