/**
 * Live Metrics Display Component
 * 
 * Displays real-time crawling metrics with WebSocket integration.
 */

import React from 'react';
import { useCrawlingMonitoring } from '../../hooks/useCrawlingMonitoring';
import {
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Database,
  BarChart3
} from 'lucide-react';

// Import types directly since the hook might not be ready yet
interface DashboardStats {
  active_crawling_schedules: number;
  active_jobs: number;
  success_rate: number;
  failed_jobs_24h: number;
  collection_speed: number;
  total_items_processed_1h: number;
  points_consumed_24h: number;
  queue_statistics: {
    total_queue_length: number;
    urgent_queue_length: number;
    high_queue_length: number;
    normal_queue_length: number;
    low_queue_length: number;
    active_jobs_count: number;
  };
  last_updated: string;
}

interface QueueStatistics {
  total_queue_length: number;
  active_jobs_count: number;
  enqueued_count: number;
  dequeued_count: number;
  urgent_queue_length: number;
  high_queue_length: number;
  normal_queue_length: number;
  low_queue_length: number;
}

interface LiveMetricsDisplayProps {
  className?: string;
}

export const LiveMetricsDisplay: React.FC<LiveMetricsDisplayProps> = ({ className }) => {
  const { dashboardStats, queueStats, isConnected, isLoading, error } = useCrawlingMonitoring();

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load metrics: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Metrics</h2>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${isConnected
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            <span>{isConnected ? 'Real-time' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Schedules"
          value={dashboardStats?.active_crawling_schedules || 0}
          icon={<Clock className="h-5 w-5" />}
          color="blue"
          tooltip="Number of active crawling schedules"
        />

        <MetricCard
          title="Running Jobs"
          value={dashboardStats?.active_jobs || 0}
          icon={<Activity className="h-5 w-5" />}
          color="green"
          tooltip="Currently running crawling jobs"
        />

        <MetricCard
          title="Success Rate"
          value={`${dashboardStats?.success_rate || 0}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          color="emerald"
          tooltip="Success rate over the last 24 hours"
        />

        <MetricCard
          title="Collection Speed"
          value={`${dashboardStats?.collection_speed || 0}/hr`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
          tooltip="Items processed per hour"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Queue Statistics</span>
            </h3>
          </div>
          <div className="p-6">
            <QueueStatsDisplay stats={queueStats} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Metrics</span>
            </h3>
          </div>
          <div className="p-6">
            <PerformanceMetricsDisplay stats={dashboardStats} />
          </div>
        </div>
      </div>

      {/* Real-time Updates Indicator */}
      {dashboardStats?.last_updated && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Last updated: {new Date(dashboardStats.last_updated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'emerald' | 'purple' | 'red' | 'yellow';
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, tooltip }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
  };

  const content = (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <div title={tooltip}>
        {content}
      </div>
    );
  }

  return content;
};

interface QueueStatsDisplayProps {
  stats: QueueStatistics | null;
}

const QueueStatsDisplay: React.FC<QueueStatsDisplayProps> = ({ stats }) => {
  if (!stats) {
    return <div className="text-gray-500">No queue data available</div>;
  }

  const queueData = [
    { label: 'Urgent', value: stats.urgent_queue_length, color: 'bg-red-500' },
    { label: 'High', value: stats.high_queue_length, color: 'bg-orange-500' },
    { label: 'Normal', value: stats.normal_queue_length, color: 'bg-blue-500' },
    { label: 'Low', value: stats.low_queue_length, color: 'bg-gray-500' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900 dark:text-white">Total Queue Length</span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          {stats.total_queue_length}
        </span>
      </div>

      <div className="space-y-2">
        {queueData.map((queue) => (
          <div key={queue.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${queue.color}`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{queue.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{queue.value}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Active Jobs</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300">
            {stats.active_jobs_count}
          </span>
        </div>
      </div>
    </div>
  );
};

interface PerformanceMetricsDisplayProps {
  stats: DashboardStats | null;
}

const PerformanceMetricsDisplay: React.FC<PerformanceMetricsDisplayProps> = ({ stats }) => {
  if (!stats) {
    return <div className="text-gray-500">No performance data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Success Rate (24h)</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.success_rate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.min(Math.max(stats.success_rate, 0), 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.total_items_processed_1h}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Items (1h)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed_jobs_24h}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Failed (24h)</div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Points Consumed (24h)</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300">
            {stats.points_consumed_24h}
          </span>
        </div>
      </div>
    </div>
  );
};