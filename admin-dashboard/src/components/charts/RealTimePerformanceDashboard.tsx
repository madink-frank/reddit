import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Server, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Download,
  Maximize2
} from 'lucide-react';

export interface PerformanceMetric {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTime: number;
  activeConnections: number;
  queueSize: number;
  throughput: number;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
}

export interface PerformanceThresholds {
  cpuUsage: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  diskUsage: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  networkLatency: { warning: number; critical: number };
}

interface RealTimePerformanceDashboardProps {
  title?: string;
  className?: string;
  height?: number;
  refreshInterval?: number;
  maxDataPoints?: number;
  thresholds?: Partial<PerformanceThresholds>;
  onAlert?: (alert: SystemAlert) => void;
  onExport?: (data: PerformanceMetric[]) => void;
  isLoading?: boolean;
  error?: string;
}

type ViewMode = 'overview' | 'detailed' | 'heatmap' | 'alerts';
type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  cpuUsage: { warning: 70, critical: 90 },
  memoryUsage: { warning: 80, critical: 95 },
  diskUsage: { warning: 85, critical: 95 },
  responseTime: { warning: 1000, critical: 3000 },
  errorRate: { warning: 1, critical: 5 },
  networkLatency: { warning: 100, critical: 500 }
};

export const RealTimePerformanceDashboard: React.FC<RealTimePerformanceDashboardProps> = ({
  title = "Real-Time Performance Dashboard",
  className = '',
  height = 400,
  refreshInterval = 5000,
  maxDataPoints = 100,
  thresholds = {},
  onAlert,
  onExport,
  isLoading = false,
  error
}) => {
  const [data, setData] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('15m');
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'cpuUsage', 'memoryUsage', 'responseTime', 'requestsPerSecond'
  ]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Generate mock real-time data
  const generateMockData = (): PerformanceMetric => {
    const now = new Date();
    const baseValues = data.length > 0 ? data[data.length - 1] : {
      cpuUsage: 30,
      memoryUsage: 45,
      diskUsage: 60,
      networkLatency: 50,
      requestsPerSecond: 100,
      errorRate: 0.5,
      responseTime: 200,
      activeConnections: 50,
      queueSize: 10,
      throughput: 1000
    };

    // Add some realistic variation
    const variation = (base: number, range: number) => 
      Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range));

    return {
      timestamp: now,
      cpuUsage: variation(baseValues.cpuUsage, 20),
      memoryUsage: variation(baseValues.memoryUsage, 15),
      diskUsage: variation(baseValues.diskUsage, 5),
      networkLatency: Math.max(10, baseValues.networkLatency + (Math.random() - 0.5) * 50),
      requestsPerSecond: Math.max(0, baseValues.requestsPerSecond + (Math.random() - 0.5) * 50),
      errorRate: Math.max(0, Math.min(10, baseValues.errorRate + (Math.random() - 0.5) * 2)),
      responseTime: Math.max(50, baseValues.responseTime + (Math.random() - 0.5) * 200),
      activeConnections: Math.max(0, baseValues.activeConnections + Math.floor((Math.random() - 0.5) * 20)),
      queueSize: Math.max(0, baseValues.queueSize + Math.floor((Math.random() - 0.5) * 10)),
      throughput: Math.max(0, baseValues.throughput + (Math.random() - 0.5) * 200)
    };
  };

  // Check for threshold violations and generate alerts
  const checkThresholds = (metric: PerformanceMetric) => {
    const newAlerts: SystemAlert[] = [];

    Object.entries(mergedThresholds).forEach(([key, threshold]) => {
      const value = metric[key as keyof PerformanceMetric] as number;
      
      if (value >= threshold.critical) {
        newAlerts.push({
          id: `${key}-${Date.now()}`,
          type: 'error',
          message: `${key} is critically high: ${value.toFixed(1)}%`,
          timestamp: new Date(),
          metric: key,
          value,
          threshold: threshold.critical
        });
      } else if (value >= threshold.warning) {
        newAlerts.push({
          id: `${key}-${Date.now()}`,
          type: 'warning',
          message: `${key} is above warning threshold: ${value.toFixed(1)}%`,
          timestamp: new Date(),
          metric: key,
          value,
          threshold: threshold.warning
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
      newAlerts.forEach(alert => onAlert?.(alert));
    }
  };

  // Start real-time data collection
  useEffect(() => {
    if (isPaused) return;

    const collectData = () => {
      const newMetric = generateMockData();
      
      setData(prev => {
        const updated = [...prev, newMetric];
        return updated.slice(-maxDataPoints);
      });
      
      checkThresholds(newMetric);
    };

    // Initial data point
    collectData();

    // Set up interval for regular updates
    intervalRef.current = setInterval(collectData, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, refreshInterval, maxDataPoints]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case '5m':
        cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case '15m':
        cutoffTime = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }
    
    return data.filter(item => item.timestamp >= cutoffTime);
  }, [data, timeRange]);

  // Format data for charts
  const chartData = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      time: item.timestamp.toLocaleTimeString(),
      timestamp: item.timestamp.getTime()
    }));
  }, [filteredData]);

  // Calculate current statistics
  const currentStats = useMemo(() => {
    if (!chartData.length) return null;
    
    const latest = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : latest;
    
    return {
      current: latest,
      trends: {
        cpuUsage: latest.cpuUsage - previous.cpuUsage,
        memoryUsage: latest.memoryUsage - previous.memoryUsage,
        responseTime: latest.responseTime - previous.responseTime,
        requestsPerSecond: latest.requestsPerSecond - previous.requestsPerSecond,
        errorRate: latest.errorRate - previous.errorRate
      }
    };
  }, [chartData]);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredData);
    } else {
      // Default CSV export
      const csvContent = [
        'Timestamp,CPU Usage,Memory Usage,Disk Usage,Network Latency,Requests/sec,Error Rate,Response Time',
        ...filteredData.map(item => 
          `${item.timestamp.toISOString()},${item.cpuUsage},${item.memoryUsage},${item.diskUsage},${item.networkLatency},${item.requestsPerSecond},${item.errorRate},${item.responseTime}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'performance-metrics.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (value >= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-green-500" />;
    return <div className="h-3 w-3" />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value.toFixed(1)}${entry.name.includes('Usage') ? '%' : entry.name.includes('Time') ? 'ms' : ''}`}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderOverviewCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            System Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              
              <ReferenceLine y={mergedThresholds.cpuUsage.warning} stroke="#F59E0B" strokeDasharray="2 2" />
              <ReferenceLine y={mergedThresholds.cpuUsage.critical} stroke="#EF4444" strokeDasharray="2 2" />
              
              <Area
                type="monotone"
                dataKey="cpuUsage"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="CPU Usage"
              />
              <Area
                type="monotone"
                dataKey="memoryUsage"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Memory Usage"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar yAxisId="left" dataKey="requestsPerSecond" fill="#8B5CF6" name="Requests/sec" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Response Time"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="errorRate" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Error Rate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlerts = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No alerts - system is running smoothly</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
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
                      <p className="text-xs text-gray-600">
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
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading performance data</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
              {!isPaused && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Time Range Selector */}
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="6h">6h</SelectItem>
                  <SelectItem value="24h">24h</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Control Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Current Status */}
          {currentStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentStats.current.cpuUsage, mergedThresholds.cpuUsage)}
                <div>
                  <p className="text-sm font-medium">CPU</p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-lg font-bold ${getStatusColor(currentStats.current.cpuUsage, mergedThresholds.cpuUsage)}`}>
                      {currentStats.current.cpuUsage.toFixed(1)}%
                    </span>
                    {getTrendIcon(currentStats.trends.cpuUsage)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentStats.current.memoryUsage, mergedThresholds.memoryUsage)}
                <div>
                  <p className="text-sm font-medium">Memory</p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-lg font-bold ${getStatusColor(currentStats.current.memoryUsage, mergedThresholds.memoryUsage)}`}>
                      {currentStats.current.memoryUsage.toFixed(1)}%
                    </span>
                    {getTrendIcon(currentStats.trends.memoryUsage)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Response</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-blue-600">
                      {currentStats.current.responseTime.toFixed(0)}ms
                    </span>
                    {getTrendIcon(currentStats.trends.responseTime)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Requests</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-purple-600">
                      {currentStats.current.requestsPerSecond.toFixed(0)}/s
                    </span>
                    {getTrendIcon(currentStats.trends.requestsPerSecond)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentStats.current.errorRate, mergedThresholds.errorRate)}
                <div>
                  <p className="text-sm font-medium">Errors</p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-lg font-bold ${getStatusColor(currentStats.current.errorRate, mergedThresholds.errorRate)}`}>
                      {currentStats.current.errorRate.toFixed(1)}%
                    </span>
                    {getTrendIcon(currentStats.trends.errorRate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content */}
      {viewMode === 'overview' && renderOverviewCharts()}
      {viewMode === 'alerts' && renderAlerts()}
      
      {/* Always show alerts if there are any */}
      {viewMode !== 'alerts' && alerts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'overview' && renderOverviewCharts()}
          </div>
          <div>
            {renderAlerts()}
          </div>
        </div>
      )}
    </div>
  );
};