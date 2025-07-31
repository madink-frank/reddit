import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RealTimePerformanceDashboard } from '../components/charts/RealTimePerformanceDashboard';
import { SystemHealthHeatmap } from '../components/charts/SystemHealthHeatmap';
import { LiveMetricsDisplay } from '../components/monitoring/LiveMetricsDisplay';
import { CrawlingProgressBars } from '../components/monitoring/CrawlingProgressBars';
import { ManualTriggerButtons } from '../components/monitoring/ManualTriggerButtons';
import {
  Activity,
  Server,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import type {
  PerformanceMetric,
  SystemAlert,
  HeatmapDataPoint,
  SystemHealthData
} from '../components/charts';
import type { CrawlingJob } from '../hooks/useCrawlingMonitoring';

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    api: 'online' | 'offline' | 'degraded';
    database: 'online' | 'offline' | 'degraded';
    redis: 'online' | 'offline' | 'degraded';
    crawler: 'online' | 'offline' | 'degraded';
  };
  uptime: number;
  lastUpdate: Date;
}

const RealTimeMonitoringPage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    services: {
      api: 'online',
      database: 'online',
      redis: 'online',
      crawler: 'online'
    },
    uptime: 99.8,
    lastUpdate: new Date()
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isConnected] = useState(true);
  const [keywords] = useState([
    { id: 1, keyword: 'artificial intelligence', is_active: true },
    { id: 2, keyword: 'machine learning', is_active: true },
    { id: 3, keyword: 'data science', is_active: false },
    { id: 4, keyword: 'technology trends', is_active: true },
  ]);

  const [crawlingJobs, setCrawlingJobs] = useState<CrawlingJob[]>([
    {
      id: 'job_1',
      name: 'AI Keyword Crawl',
      status: 'running',
      progress: {
        collected: 1250,
        total: 2000,
        percentage: 62.5
      },
      startTime: new Date(Date.now() - 300000), // 5 minutes ago
      elapsedTime: 300, // 5 minutes in seconds
      speed: 4.17, // items per minute
      pointsConsumed: 25,
      retryCount: 0,
      subreddits: ['MachineLearning', 'artificial'],
      keywords: ['artificial intelligence', 'AI', 'machine learning']
    },
    {
      id: 'job_2',
      name: 'Trending Posts Crawl',
      status: 'completed',
      progress: {
        collected: 500,
        total: 500,
        percentage: 100
      },
      startTime: new Date(Date.now() - 600000), // 10 minutes ago
      endTime: new Date(Date.now() - 60000), // 1 minute ago
      elapsedTime: 540, // 9 minutes in seconds
      speed: 0.93, // items per minute
      pointsConsumed: 15,
      retryCount: 0,
      subreddits: ['all', 'popular'],
      keywords: ['trending', 'popular', 'hot']
    },
    {
      id: 'job_3',
      name: 'Data Science Crawl',
      status: 'failed',
      progress: {
        collected: 125,
        total: 500,
        percentage: 25
      },
      startTime: new Date(Date.now() - 900000), // 15 minutes ago
      endTime: new Date(Date.now() - 800000), // 13 minutes ago
      elapsedTime: 100, // stopped after 100 seconds
      speed: 1.25, // items per minute
      pointsConsumed: 5,
      retryCount: 2,
      errorMessage: 'Rate limit exceeded',
      subreddits: ['datascience', 'MachineLearning'],
      keywords: ['data science', 'analytics', 'statistics']
    }
  ]);

  // Mock system health heatmap data
  const [heatmapData, setHeatmapData] = useState<SystemHealthData[]>([]);

  useEffect(() => {
    // Generate mock heatmap data
    const generateHeatmapData = (): SystemHealthData[] => {
      const metrics = ['cpuUsage', 'memoryUsage', 'responseTime', 'errorRate', 'requestCount'];

      return metrics.map(metric => {
        const data: HeatmapDataPoint[] = [];

        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            let baseValue = 50;

            // Business hours pattern
            if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) {
              baseValue += 20;
            }

            // Weekend pattern
            if (day === 0 || day === 6) {
              baseValue -= 15;
            }

            // Night pattern
            if (hour >= 22 || hour <= 6) {
              baseValue -= 25;
            }

            const value = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 30));

            const timestamp = new Date();
            timestamp.setDate(timestamp.getDate() - (6 - day));
            timestamp.setHours(hour, 0, 0, 0);

            data.push({
              x: hour,
              y: day,
              value,
              timestamp,
              details: {
                cpuUsage: value + (Math.random() - 0.5) * 10,
                memoryUsage: value + (Math.random() - 0.5) * 15,
                responseTime: (100 - value) * 10 + Math.random() * 200,
                errorRate: Math.max(0, (value - 70) * 0.1 + Math.random() * 2),
                requestCount: value * 10 + Math.random() * 500
              }
            });
          }
        }

        const values = data.map(p => p.value);
        return {
          metric,
          data,
          min: Math.min(...values),
          max: Math.max(...values),
          average: values.reduce((sum, v) => sum + v, 0) / values.length
        };
      });
    };

    setHeatmapData(generateHeatmapData());
  }, []);

  const handleAlert = (alert: SystemAlert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50));

    // Update system status based on alert
    if (alert.type === 'error') {
      setSystemStatus(prev => ({
        ...prev,
        overall: 'critical',
        lastUpdate: new Date()
      }));
    } else if (alert.type === 'warning' && systemStatus.overall === 'healthy') {
      setSystemStatus(prev => ({
        ...prev,
        overall: 'warning',
        lastUpdate: new Date()
      }));
    }

    // Show browser notification if enabled
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`System Alert: ${alert.type}`, {
        body: alert.message,
        icon: '/favicon.ico'
      });
    }
  };

  const handleExportPerformanceData = (data: PerformanceMetric[]) => {
    console.log('Exporting performance data:', data);
    // Implement actual export logic here
  };

  const handleExportHeatmapData = (data: SystemHealthData[]) => {
    console.log('Exporting heatmap data:', data);
    // Implement actual export logic here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-500';
      case 'warning':
      case 'degraded':
        return 'text-yellow-500';
      case 'critical':
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  // Handler functions for manual triggers
  const handleTriggerKeywordCrawl = async (keywordId: number, limit?: number, priority?: string) => {
    try {
      // Mock API call - replace with actual implementation
      console.log('Triggering keyword crawl:', { keywordId, limit, priority });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful response
      return {
        job_id: `job_${Date.now()}`,
        status: 'started',
        keyword_id: keywordId,
        limit,
        priority
      };
    } catch (error) {
      throw new Error('Failed to start keyword crawl');
    }
  };

  const handleTriggerTrendingCrawl = async (limit?: number, priority?: string) => {
    try {
      // Mock API call - replace with actual implementation
      console.log('Triggering trending crawl:', { limit, priority });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful response
      return {
        job_id: `trending_${Date.now()}`,
        status: 'started',
        limit,
        priority
      };
    } catch (error) {
      throw new Error('Failed to start trending crawl');
    }
  };

  const handleTriggerAllKeywordsCrawl = async (priority?: string) => {
    try {
      // Mock API call - replace with actual implementation
      console.log('Triggering all keywords crawl:', { priority });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful response
      return {
        job_id: `all_keywords_${Date.now()}`,
        status: 'started',
        keyword_count: keywords.filter(k => k.is_active).length,
        priority
      };
    } catch (error) {
      throw new Error('Failed to start all keywords crawl');
    }
  };

  // Handler functions for crawling job management
  const handleCancelJob = async (jobId: number): Promise<void> => {
    try {
      console.log('Cancelling job:', jobId);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Update job status to cancelled
      setCrawlingJobs(prev =>
        prev.map(job =>
          job.id === jobId.toString()
            ? {
              ...job,
              status: 'failed', // Use 'failed' since 'cancelled' is not in the interface
              endTime: new Date(),
              errorMessage: 'Job cancelled by user'
            }
            : job
        )
      );
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  };

  const handleRetryJob = async (jobId: number): Promise<void> => {
    try {
      console.log('Retrying job:', jobId);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Update job status to running and reset progress
      setCrawlingJobs(prev =>
        prev.map(job =>
          job.id === jobId.toString()
            ? {
              ...job,
              status: 'running',
              progress: {
                collected: 0,
                total: job.progress.total,
                percentage: 0
              },
              startTime: new Date(),
              endTime: undefined,
              elapsedTime: 0,
              errorMessage: undefined,
              retryCount: job.retryCount + 1
            }
            : job
        )
      );
    } catch (error) {
      console.error('Failed to retry job:', error);
      throw error;
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real-Time Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor system performance, health metrics, and crawling operations in real-time
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>

          <Badge variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Overall Status */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3">
                {getStatusIcon(systemStatus.overall)}
                <div>
                  <p className="font-medium">Overall Status</p>
                  <p className={`text-lg font-bold capitalize ${getStatusColor(systemStatus.overall)}`}>
                    {systemStatus.overall}
                  </p>
                </div>
              </div>
            </div>

            {/* Service Status */}
            {Object.entries(systemStatus.services).map(([service, status]) => (
              <div key={service} className="flex items-center space-x-2">
                {getStatusIcon(status)}
                <div>
                  <p className="text-sm font-medium capitalize">{service}</p>
                  <p className={`text-sm capitalize ${getStatusColor(status)}`}>
                    {status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Uptime: {systemStatus.uptime}%</span>
              <span>Last updated: {systemStatus.lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Monitoring Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="heatmap">Health Map</TabsTrigger>
          <TabsTrigger value="crawling">Crawling</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Live Metrics */}
          <LiveMetricsDisplay />

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No alerts - system is running smoothly</p>
                  </div>
                ) : (
                  alerts.slice(0, 10).map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${alert.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' :
                          'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {alert.type === 'error' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          ) : alert.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {alert.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alert.metric}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <RealTimePerformanceDashboard
            title="Real-Time Performance Metrics"
            height={500}
            refreshInterval={5000}
            maxDataPoints={100}
            onAlert={handleAlert}
            onExport={handleExportPerformanceData}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <SystemHealthHeatmap
            data={heatmapData}
            title="System Health Heatmap - 7 Day View"
            height={600}
            width={1000}
            onCellClick={(dataPoint) => {
              console.log('Heatmap cell clicked:', dataPoint);
            }}
            onExport={handleExportHeatmapData}
          />
        </TabsContent>

        <TabsContent value="crawling" className="space-y-6">
          {/* Manual Trigger Buttons */}
          <ManualTriggerButtons
            onTriggerKeywordCrawl={handleTriggerKeywordCrawl}
            onTriggerTrendingCrawl={handleTriggerTrendingCrawl}
            onTriggerAllKeywordsCrawl={handleTriggerAllKeywordsCrawl}
            keywords={keywords}
            isConnected={isConnected}
          />

          {/* Crawling Progress */}
          <CrawlingProgressBars
            jobs={crawlingJobs}
            onCancelJob={handleCancelJob}
            onRetryJob={handleRetryJob}
          />

          {/* Crawling Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">3</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">98.5%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Items Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">12,847</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeMonitoringPage;