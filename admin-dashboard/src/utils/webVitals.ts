// Temporarily disabled to fix build issues
// import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
// import { captureMessage, setContext } from '../lib/sentry';

type Metric = {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  entries: any[];
  navigationType: string;
};

// Web Vitals thresholds (in milliseconds or score)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

// Performance rating helper
const getPerformanceRating = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (metric.value <= threshold.good) return 'good';
  if (metric.value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Send metric to analytics
const sendToAnalytics = (metric: Metric) => {
  const rating = getPerformanceRating(metric);
  
  // Sentry monitoring temporarily disabled
  // setContext('webVitals', {
  //   name: metric.name,
  //   value: metric.value,
  //   rating,
  //   id: metric.id,
  //   delta: metric.delta,
  //   navigationType: metric.navigationType,
  // });
  
  // if (rating === 'poor') {
  //   captureMessage(`Poor Web Vital: ${metric.name} = ${metric.value}`, 'warning');
  // }
  
  // Send to Google Analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
  
  // Send to custom analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web-vital',
        metric: {
          name: metric.name,
          value: metric.value,
          rating,
          id: metric.id,
          delta: metric.delta,
          navigationType: metric.navigationType,
        },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(error => {
      console.warn('Failed to send web vital to analytics:', error);
    });
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`Web Vital - ${metric.name}:`, {
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
    });
  }
};

// Initialize Web Vitals monitoring - temporarily disabled
export const initWebVitals = () => {
  console.log('Web Vitals monitoring disabled for build compatibility');
  // Temporarily disabled to fix build issues
  // if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'true') {
  //   return;
  // }
  
  // try {
  //   getCLS(sendToAnalytics);
  //   getFID(sendToAnalytics);
  //   getFCP(sendToAnalytics);
  //   getLCP(sendToAnalytics);
  //   getTTFB(sendToAnalytics);
  //   console.log('Web Vitals monitoring initialized');
  // } catch (error) {
  //   console.warn('Failed to initialize Web Vitals monitoring:', error);
  // }
};

// Manual performance measurement
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  const start = performance.now();
  
  const finish = () => {
    const duration = performance.now() - start;
    
    // Send custom timing to analytics
    sendToAnalytics({
      name: `custom_${name}`,
      value: duration,
      rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
      delta: duration,
      id: `${name}_${Date.now()}`,
      entries: [],
      navigationType: 'navigate',
    } as Metric);
  };
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(finish);
    } else {
      finish();
      return result;
    }
  } catch (error) {
    finish();
    throw error;
  }
};

// Performance observer for custom metrics
export const observePerformance = () => {
  if (!('PerformanceObserver' in window)) {
    return;
  }
  
  try {
    // Observe navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // Custom metrics
          const metrics = {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            domInteractive: navEntry.domInteractive - navEntry.navigationStart,
            dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcpConnect: navEntry.connectEnd - navEntry.connectStart,
            serverResponse: navEntry.responseEnd - navEntry.requestStart,
          };
          
          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              sendToAnalytics({
                name: `custom_${name}`,
                value,
                rating: 'good',
                delta: value,
                id: `${name}_${Date.now()}`,
                entries: [],
                navigationType: 'navigate',
              } as Metric);
            }
          });
        }
      }
    });
    
    navObserver.observe({ entryTypes: ['navigation'] });
    
    // Observe resource timing for large resources
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Only track large resources or slow loading resources
        if (resourceEntry.transferSize > 100000 || resourceEntry.duration > 1000) {
          sendToAnalytics({
            name: 'custom_large_resource',
            value: resourceEntry.duration,
            rating: resourceEntry.duration < 500 ? 'good' : resourceEntry.duration < 1000 ? 'needs-improvement' : 'poor',
            delta: resourceEntry.duration,
            id: `resource_${Date.now()}`,
            entries: [],
            navigationType: 'navigate',
          } as Metric);
        }
      }
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    
  } catch (error) {
    console.warn('Failed to set up performance observers:', error);
  }
};

// Export for use in main.tsx
export { sendToAnalytics };