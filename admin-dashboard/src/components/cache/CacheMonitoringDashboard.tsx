import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Activity, 
  Clock, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  BarChart3,
  Zap,
  HardDrive,
  Timer
} from 'lucide-react';
import { useCacheMetrics } from '@/hooks/useAnalysisCache';

interface CacheMonitoringDashboardProps {
  useRedis?: boolean;
  refreshInterval?: number;
}

export function CacheMonitoringDashboard({ 
  useRedis = false, 
  refreshInterval = 30000 
}: CacheMonitoringDashboardProps) {
  const { metrics, stats, isLoading, refreshMetrics } = useCacheMetrics({ useRedis });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshMetrics]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getHitRateColor = (hitRate: number): string => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryUsageColor = (usage: number, max: number): string => {
    const percentage = (usage / max) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading cache metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cache Monitoring
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {useRedis ? 'Redis' : 'In-Memory'} cache performance and statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Hit Rate
                </p>
                <p className={`text-2xl font-bold ${getHitRateColor(stats?.hitRate || 0)}`}>
                  {stats?.hitRate?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Entries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalEntries?.toLocaleString() || 0}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Memory Usage
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatBytes(stats?.totalSize || 0)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Response
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(metrics?.averageResponseTime || 0)}
                </p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cache Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cache Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={stats?.hitRate || 0} 
                      className="w-20" 
                    />
                    <span className={`text-sm font-medium ${getHitRateColor(stats?.hitRate || 0)}`}>
                      {stats?.hitRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Miss Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={stats?.missRate || 0} 
                      className="w-20" 
                    />
                    <span className="text-sm font-medium text-red-600">
                      {stats?.missRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Entries</span>
                  <span className="text-sm font-medium">
                    {stats?.totalEntries?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Evictions</span>
                  <span className="text-sm font-medium text-orange-600">
                    {stats?.evictionCount?.toLocaleString() || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Usage</span>
                    <span className="font-medium">
                      {formatBytes(metrics?.currentMemoryUsage || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((metrics?.currentMemoryUsage || 0) / (100 * 1024 * 1024)) * 100} 
                    className="w-full"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peak Usage</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatBytes(metrics?.peakMemoryUsage || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Size</span>
                  <span className="text-sm font-medium">
                    {formatBytes(stats?.totalSize || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Entry Size</span>
                  <span className="text-sm font-medium">
                    {stats?.totalEntries ? 
                      formatBytes((stats.totalSize || 0) / stats.totalEntries) : 
                      '0 B'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cache Age Information */}
          {(stats?.oldestEntry || stats?.newestEntry) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Cache Age Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.oldestEntry && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Oldest Entry</p>
                      <p className="text-lg font-medium">
                        {new Date(stats.oldestEntry).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {stats.newestEntry && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Newest Entry</p>
                      <p className="text-lg font-medium">
                        {new Date(stats.newestEntry).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(metrics?.averageResponseTime || 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average Response Time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {metrics?.hits?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cache Hits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {metrics?.misses?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cache Misses
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance statistics for cache operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-blue-600">
                      {metrics?.sets?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sets</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-purple-600">
                      {metrics?.deletes?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Deletes</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-orange-600">
                      {metrics?.evictions?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Evictions</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-600">
                      {((metrics?.hits || 0) + (metrics?.misses || 0)).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Current Memory Usage</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatBytes(metrics?.currentMemoryUsage || 0)} / 100 MB
                    </span>
                  </div>
                  <Progress 
                    value={((metrics?.currentMemoryUsage || 0) / (100 * 1024 * 1024)) * 100}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Memory Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Peak Usage:</span>
                        <span className="font-medium">
                          {formatBytes(metrics?.peakMemoryUsage || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Entries:</span>
                        <span className="font-medium">
                          {stats?.totalEntries?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Avg Entry Size:</span>
                        <span className="font-medium">
                          {stats?.totalEntries ? 
                            formatBytes((stats.totalSize || 0) / stats.totalEntries) : 
                            '0 B'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Cache Health</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          (stats?.hitRate || 0) >= 80 ? 'bg-green-500' : 
                          (stats?.hitRate || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm">
                          Hit Rate: {stats?.hitRate?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          ((metrics?.currentMemoryUsage || 0) / (100 * 1024 * 1024)) < 0.7 ? 'bg-green-500' : 
                          ((metrics?.currentMemoryUsage || 0) / (100 * 1024 * 1024)) < 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm">
                          Memory: {(((metrics?.currentMemoryUsage || 0) / (100 * 1024 * 1024)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cache Operations</CardTitle>
              <CardDescription>
                Manage and monitor cache operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Export Stats
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics?.sets?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Sets</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {metrics?.hits?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Gets</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {metrics?.deletes?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Deletes</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {metrics?.evictions?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Evictions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CacheMonitoringDashboard;