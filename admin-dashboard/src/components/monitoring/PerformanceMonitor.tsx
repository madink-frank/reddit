import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  unit: string;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  lastUpdated: Date;
}

const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25, unit: 'score' },
  FID: { good: 100, poor: 300, unit: 'ms' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
};

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const shouldShow = import.meta.env.DEV || 
                      import.meta.env.VITE_ENABLE_PERFORMANCE_MONITOR === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    // Collect current performance metrics
    const collectMetrics = () => {
      const metrics: PerformanceMetric[] = [];
      
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // Calculate basic metrics
        const fcp = navigation.responseEnd - navigation.navigationStart;
        const lcp = navigation.loadEventEnd - navigation.navigationStart;
        const ttfb = navigation.responseStart - navigation.navigationStart;
        
        metrics.push(
          {
            name: 'FCP',
            value: fcp,
            rating: fcp <= PERFORMANCE_THRESHOLDS.FCP.good ? 'good' : 
                   fcp <= PERFORMANCE_THRESHOLDS.FCP.poor ? 'needs-improvement' : 'poor',
            threshold: PERFORMANCE_THRESHOLDS.FCP,
            unit: PERFORMANCE_THRESHOLDS.FCP.unit,
          },
          {
            name: 'LCP',
            value: lcp,
            rating: lcp <= PERFORMANCE_THRESHOLDS.LCP.good ? 'good' : 
                   lcp <= PERFORMANCE_THRESHOLDS.LCP.poor ? 'needs-improvement' : 'poor',
            threshold: PERFORMANCE_THRESHOLDS.LCP,
            unit: PERFORMANCE_THRESHOLDS.LCP.unit,
          },
          {
            name: 'TTFB',
            value: ttfb,
            rating: ttfb <= PERFORMANCE_THRESHOLDS.TTFB.good ? 'good' : 
                   ttfb <= PERFORMANCE_THRESHOLDS.TTFB.poor ? 'needs-improvement' : 'poor',
            threshold: PERFORMANCE_THRESHOLDS.TTFB,
            unit: PERFORMANCE_THRESHOLDS.TTFB.unit,
          }
        );
      }

      setPerformanceData({
        metrics,
        lastUpdated: new Date(),
      });
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 1000);
      });
    }

    // Update metrics periodically
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !performanceData) {
    return null;
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'needs-improvement':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    } else if (unit === 'score') {
      return value.toFixed(3);
    }
    return value.toString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-900">Performance</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2">
          {performanceData.metrics.map((metric) => (
            <div
              key={metric.name}
              className={`flex items-center justify-between p-2 rounded border ${getRatingColor(metric.rating)}`}
            >
              <div className="flex items-center space-x-2">
                {getRatingIcon(metric.rating)}
                <span className="text-xs font-medium">{metric.name}</span>
              </div>
              <span className="text-xs font-mono">
                {formatValue(metric.value, metric.unit)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Updated: {performanceData.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;