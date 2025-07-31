import React, { useState, useEffect } from 'react';
import { webVitalsMonitor, resourceMonitor, memoryMonitor, performanceBudgetChecker } from '../../utils/performance';
import { errorTracker } from '../../utils/errorTracking';
import { analytics } from '../../utils/analytics';

interface MonitoringDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'errors' | 'analytics'>('performance');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      updateData();
      const interval = setInterval(updateData, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isVisible]);

  const updateData = () => {
    // Performance data
    const metrics = webVitalsMonitor.getMetrics();
    const resources = resourceMonitor.getResourceTimings();
    const memory = memoryMonitor.getMemoryUsage();
    const budgetCheck = performanceBudgetChecker.checkBudget();

    setPerformanceData({
      metrics,
      resources: resources.slice(0, 10), // Top 10 resources
      memory,
      budgetCheck,
      largestResources: resourceMonitor.getLargestResources(5),
      slowestResources: resourceMonitor.getSlowestResources(5),
    });

    // Error data
    setErrorData(errorTracker.getErrorStats());

    // Analytics data
    setAnalyticsData(analytics.getStatus());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Monitoring Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['performance', 'errors', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'performance' && (
            <PerformanceTab data={performanceData} />
          )}
          {activeTab === 'errors' && (
            <ErrorsTab data={errorData} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab data={analyticsData} />
          )}
        </div>
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading performance data...</div>;

  const { metrics, memory, budgetCheck, largestResources, slowestResources } = data;

  return (
    <div className="space-y-6">
      {/* Web Vitals */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Core Web Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600 uppercase">{key}</div>
              <div className="text-lg font-semibold">
                {typeof value === 'number' ? `${value.toFixed(2)}ms` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Budget */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Performance Budget</h3>
        <div className={`p-3 rounded ${budgetCheck.passed ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`font-semibold ${budgetCheck.passed ? 'text-green-800' : 'text-red-800'}`}>
            {budgetCheck.passed ? '✅ Budget Passed' : '❌ Budget Violations'}
          </div>
          {budgetCheck.violations.length > 0 && (
            <ul className="mt-2 text-sm text-red-700">
              {budgetCheck.violations.map((violation: string, index: number) => (
                <li key={index}>• {violation}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Memory Usage */}
      {memory && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Memory Usage</h3>
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <span>Used: {(memory.used / 1024 / 1024).toFixed(2)} MB</span>
              <span>Total: {(memory.total / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  memory.percentage > 80 ? 'bg-red-500' : 
                  memory.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${memory.percentage}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {memory.percentage.toFixed(1)}% used
            </div>
          </div>
        </div>
      )}

      {/* Resource Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Largest Resources</h3>
          <div className="space-y-2">
            {largestResources.map((resource: any, index: number) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                <div className="font-medium truncate">{resource.name.split('/').pop()}</div>
                <div className="text-gray-600">
                  {(resource.size / 1024).toFixed(2)} KB • {resource.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Slowest Resources</h3>
          <div className="space-y-2">
            {slowestResources.map((resource: any, index: number) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                <div className="font-medium truncate">{resource.name.split('/').pop()}</div>
                <div className="text-gray-600">
                  {resource.duration.toFixed(2)}ms • {resource.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorsTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading error data...</div>;

  const { totalErrors, recentErrors, errorsByType, performanceIssues } = data;

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Error Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Errors</div>
            <div className="text-2xl font-semibold text-red-600">{totalErrors}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Performance Issues</div>
            <div className="text-2xl font-semibold text-yellow-600">{performanceIssues.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Error Types</div>
            <div className="text-2xl font-semibold">{Object.keys(errorsByType).length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Session Health</div>
            <div className={`text-2xl font-semibold ${totalErrors === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalErrors === 0 ? '✅' : '❌'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Types */}
      {Object.keys(errorsByType).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Errors by Type</h3>
          <div className="space-y-2">
            {Object.entries(errorsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="font-medium">{type}</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Errors</h3>
          <div className="space-y-3">
            {recentErrors.map((error: any, index: number) => (
              <div key={index} className="bg-red-50 border border-red-200 p-3 rounded">
                <div className="font-medium text-red-800">{error.message}</div>
                <div className="text-sm text-red-600 mt-1">
                  {new Date(error.timestamp).toLocaleString()}
                </div>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-600 cursor-pointer">Stack trace</summary>
                    <pre className="text-xs text-red-700 mt-1 overflow-x-auto">{error.stack}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Issues */}
      {performanceIssues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Performance Issues</h3>
          <div className="space-y-2">
            {performanceIssues.map((issue: any, index: number) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <div className="font-medium text-yellow-800 capitalize">{issue.type.replace('_', ' ')}</div>
                <div className="text-sm text-yellow-700">
                  {issue.component && `Component: ${issue.component}`}
                  {issue.duration && ` • Duration: ${issue.duration.toFixed(2)}ms`}
                  {issue.apiEndpoint && ` • Endpoint: ${issue.apiEndpoint}`}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  {new Date(issue.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading analytics data...</div>;

  const { initialized, config } = data;

  return (
    <div className="space-y-6">
      {/* Analytics Status */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Analytics Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Status</div>
            <div className={`text-lg font-semibold ${initialized ? 'text-green-600' : 'text-red-600'}`}>
              {initialized ? '✅ Initialized' : '❌ Not Initialized'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Google Analytics</div>
            <div className={`text-lg font-semibold ${config.googleAnalyticsId ? 'text-green-600' : 'text-gray-600'}`}>
              {config.googleAnalyticsId ? '✅ Configured' : '⚪ Not Set'}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Configuration</h3>
        <div className="bg-gray-50 p-3 rounded">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Google Analytics ID:</span>
              <span className="font-mono">{config.googleAnalyticsId || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>Google Tag Manager ID:</span>
              <span className="font-mono">{config.googleTagManagerId || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>Debug Mode:</span>
              <span>{config.enableDebug ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Performance Tracking:</span>
              <span>{config.enablePerformanceTracking ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Error Tracking:</span>
              <span>{config.enableErrorTracking ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Test Analytics</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'gtag' in window) {
                const gtag = (window as any).gtag;
                gtag('event', 'test_event', {
                  event_category: 'Monitoring',
                  event_label: 'Dashboard Test',
                  value: 1,
                });
                alert('Test event sent to Google Analytics');
              } else {
                alert('Google Analytics not available');
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send Test Event
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'gtag' in window) {
                const gtag = (window as any).gtag;
                gtag('event', 'page_view', {
                  page_title: 'Monitoring Dashboard',
                  page_location: window.location.href,
                  page_path: '/monitoring-dashboard',
                });
                alert('Test page view sent to Google Analytics');
              } else {
                alert('Google Analytics not available');
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
          >
            Send Test Page View
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;