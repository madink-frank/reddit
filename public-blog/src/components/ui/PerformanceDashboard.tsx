import React, { useState, useEffect } from 'react';
import { 
  webVitalsMonitor, 
  resourceMonitor, 
  memoryMonitor, 
  performanceBudgetChecker,
  type PerformanceMetrics 
} from '@utils/performance';

// Performance dashboard for development mode
export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [budgetCheck, setBudgetCheck] = useState<{ passed: boolean; violations: string[] }>({ passed: true, violations: [] });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') return;

    const updateMetrics = () => {
      setMetrics(webVitalsMonitor.getMetrics());
      setMemoryUsage(memoryMonitor.getMemoryUsage());
      setBudgetCheck(performanceBudgetChecker.checkBudget());
    };

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Performance Dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Web Vitals */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-700">Web Vitals</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MetricItem 
            label="FCP" 
            value={metrics.fcp} 
            unit="ms" 
            threshold={1800}
          />
          <MetricItem 
            label="LCP" 
            value={metrics.lcp} 
            unit="ms" 
            threshold={2500}
          />
          <MetricItem 
            label="FID" 
            value={metrics.fid} 
            unit="ms" 
            threshold={100}
          />
          <MetricItem 
            label="CLS" 
            value={metrics.cls} 
            unit="" 
            threshold={0.1}
          />
        </div>
      </div>

      {/* Memory Usage */}
      {memoryUsage && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-gray-700">Memory</h4>
          <div className="text-xs">
            <div className="flex justify-between">
              <span>Used:</span>
              <span>{(memoryUsage.used / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Usage:</span>
              <span className={memoryUsage.percentage > 80 ? 'text-red-600' : 'text-green-600'}>
                {memoryUsage.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Budget Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Budget</h4>
        <div className={`text-xs px-2 py-1 rounded ${
          budgetCheck.passed 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {budgetCheck.passed ? '✅ Passed' : `❌ ${budgetCheck.violations.length} violations`}
        </div>
        {budgetCheck.violations.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600">View violations</summary>
            <ul className="mt-1 space-y-1 text-red-600">
              {budgetCheck.violations.map((violation, index) => (
                <li key={index} className="text-xs">{violation}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Resource Info */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <ResourceInfo />
      </div>
    </div>
  );
};

// Metric item component
interface MetricItemProps {
  label: string;
  value: number | undefined;
  unit: string;
  threshold: number;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, unit, threshold }) => {
  if (value === undefined) {
    return (
      <div className="flex justify-between">
        <span className="text-gray-500">{label}:</span>
        <span className="text-gray-400">-</span>
      </div>
    );
  }

  const isGood = value <= threshold;
  
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className={isGood ? 'text-green-600' : 'text-red-600'}>
        {value.toFixed(value < 1 ? 3 : 0)}{unit}
      </span>
    </div>
  );
};

// Resource information component
const ResourceInfo: React.FC = () => {
  const [resourceStats, setResourceStats] = useState<{
    total: number;
    images: number;
    scripts: number;
    styles: number;
  }>({ total: 0, images: 0, scripts: 0, styles: 0 });

  useEffect(() => {
    const resources = resourceMonitor.getResourceTimings();
    const stats = {
      total: resources.length,
      images: resources.filter(r => r.type === 'image').length,
      scripts: resources.filter(r => r.type === 'script').length,
      styles: resources.filter(r => r.type === 'stylesheet').length,
    };
    setResourceStats(stats);
  }, []);

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-gray-700">Resources</h4>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Total:</span>
          <span>{resourceStats.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Images:</span>
          <span>{resourceStats.images}</span>
        </div>
        <div className="flex justify-between">
          <span>Scripts:</span>
          <span>{resourceStats.scripts}</span>
        </div>
        <div className="flex justify-between">
          <span>Styles:</span>
          <span>{resourceStats.styles}</span>
        </div>
      </div>
    </div>
  );
};