/**
 * Performance Dashboard Component
 * Real-time performance monitoring and optimization tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Activity,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { performanceMonitor, PerformanceOptimizer } from '../../utils/performanceMonitor';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

interface ResourceInfo {
  name: string;
  duration: number;
  size?: number;
  type: string;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const optimizer = PerformanceOptimizer.getInstance();

  const updateMetrics = useCallback(() => {
    const currentMetrics = performanceMonitor.getMetrics();
    const currentResources = performanceMonitor.getResourceTimings();
    const report = performanceMonitor.generateReport();

    setMetrics(currentMetrics);
    setResources(currentResources);
    setRecommendations(report.recommendations);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    let interval: number;

    if (isMonitoring) {
      optimizer.startMonitoring();
      updateMetrics();

      // Update metrics every 5 seconds
      interval = setInterval(updateMetrics, 5000);
    } else {
      optimizer.stopMonitoring();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, optimizer, updateMetrics]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const refreshMetrics = () => {
    updateMetrics();
  };

  const downloadReport = () => {
    const report = optimizer.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetricStatus = (value: number | undefined, thresholds: { good: number; poor: number }) => {
    if (!value) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (!value) return 'N/A';
    return `${value.toFixed(0)}${unit}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const coreWebVitals = [
    {
      name: 'First Contentful Paint',
      key: 'fcp',
      value: metrics.fcp,
      thresholds: { good: 1800, poor: 3000 },
      description: 'Time until first content appears'
    },
    {
      name: 'Largest Contentful Paint',
      key: 'lcp',
      value: metrics.lcp,
      thresholds: { good: 2500, poor: 4000 },
      description: 'Time until largest content appears'
    },
    {
      name: 'First Input Delay',
      key: 'fid',
      value: metrics.fid,
      thresholds: { good: 100, poor: 300 },
      description: 'Time until page becomes interactive'
    },
    {
      name: 'Cumulative Layout Shift',
      key: 'cls',
      value: metrics.cls,
      thresholds: { good: 0.1, poor: 0.25 },
      description: 'Visual stability of the page'
    }
  ];

  const resourcesByType = resources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalResourceSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time performance monitoring and optimization</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isMonitoring ? "destructive" : "primary"}
            onClick={toggleMonitoring}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>

          <Button variant="outline" onClick={refreshMetrics} aria-label="Refresh metrics">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={downloadReport} aria-label="Download report">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium">
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </span>
        </div>

        {lastUpdate && (
          <span className="text-sm text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreWebVitals.map((vital) => {
          const status = getMetricStatus(vital.value, vital.thresholds);
          const unit = vital.key === 'cls' ? '' : 'ms';

          return (
            <Card key={vital.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {vital.name}
                  </CardTitle>
                  <Badge className={`${getStatusColor(status)} border-0`}>
                    {getStatusIcon(status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatMetric(vital.value, unit)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {vital.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resource Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Resource Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Resources</span>
                <span className="text-lg font-bold">{resources.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Size</span>
                <span className="text-lg font-bold">{formatBytes(totalResourceSize)}</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">By Type</h4>
                {Object.entries(resourcesByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Largest Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources
                .sort((a, b) => (b.size || 0) - (a.size || 0))
                .slice(0, 5)
                .map((resource, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {resource.name.split('/').pop()}
                      </div>
                      <div className="text-gray-500 capitalize">
                        {resource.type}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-medium">
                        {formatBytes(resource.size || 0)}
                      </div>
                      <div className="text-gray-500">
                        {resource.duration.toFixed(0)}ms
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Loading Performance</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Optimize images with WebP format</li>
                <li>• Implement lazy loading for images</li>
                <li>• Use code splitting for JavaScript</li>
                <li>• Enable compression (gzip/brotli)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Runtime Performance</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Minimize DOM manipulations</li>
                <li>• Use CSS transforms for animations</li>
                <li>• Debounce expensive operations</li>
                <li>• Optimize React re-renders</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;