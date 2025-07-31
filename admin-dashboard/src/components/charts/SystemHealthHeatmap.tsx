import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Cpu,
  Download,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export interface HeatmapDataPoint {
  x: number; // Hour of day (0-23)
  y: number; // Day of week (0-6, Sunday = 0)
  value: number; // Metric value (0-100)
  timestamp: Date;
  details?: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
    requestCount: number;
  };
}

export interface SystemHealthData {
  metric: string;
  data: HeatmapDataPoint[];
  min: number;
  max: number;
  average: number;
}

interface SystemHealthHeatmapProps {
  data: SystemHealthData[];
  title?: string;
  className?: string;
  height?: number;
  width?: number;
  onCellClick?: (dataPoint: HeatmapDataPoint) => void;
  onExport?: (data: SystemHealthData[]) => void;
  isLoading?: boolean;
  error?: string;
}

type MetricType = 'cpuUsage' | 'memoryUsage' | 'responseTime' | 'errorRate' | 'requestCount';
type ViewMode = 'heatmap' | 'trends' | 'anomalies';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

export const SystemHealthHeatmap: React.FC<SystemHealthHeatmapProps> = ({
  data,
  title = "System Health Heatmap",
  className = '',
  height = 400,
  width = 800,
  onCellClick,
  onExport,
  isLoading = false,
  error
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('cpuUsage');
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [selectedCell, setSelectedCell] = useState<HeatmapDataPoint | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get current metric data
  const currentMetricData = useMemo(() => {
    return data.find(d => d.metric === selectedMetric) || {
      metric: selectedMetric,
      data: [],
      min: 0,
      max: 100,
      average: 50
    };
  }, [data, selectedMetric]);

  // Generate mock data if none provided
  const mockData = useMemo(() => {
    if (data.length > 0) return data;

    const generateMetricData = (metric: MetricType): SystemHealthData => {
      const dataPoints: HeatmapDataPoint[] = [];
      
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          // Create realistic patterns
          let baseValue = 50;
          
          // Business hours pattern (higher activity 9-17)
          if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) {
            baseValue += 20;
          }
          
          // Weekend pattern (lower activity)
          if (day === 0 || day === 6) {
            baseValue -= 15;
          }
          
          // Night pattern (lower activity 22-6)
          if (hour >= 22 || hour <= 6) {
            baseValue -= 25;
          }
          
          // Add some randomness
          const value = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 30));
          
          const timestamp = new Date();
          timestamp.setDate(timestamp.getDate() - (6 - day));
          timestamp.setHours(hour, 0, 0, 0);
          
          dataPoints.push({
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
      
      const values = dataPoints.map(p => p.value);
      return {
        metric,
        data: dataPoints,
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((sum, v) => sum + v, 0) / values.length
      };
    };

    return [
      generateMetricData('cpuUsage'),
      generateMetricData('memoryUsage'),
      generateMetricData('responseTime'),
      generateMetricData('errorRate'),
      generateMetricData('requestCount')
    ];
  }, [data]);

  const workingData = data.length > 0 ? data : mockData;
  const currentData = workingData.find(d => d.metric === selectedMetric) || workingData[0];

  // Create heatmap grid
  const heatmapGrid = useMemo(() => {
    const grid: (HeatmapDataPoint | null)[][] = Array(7).fill(null).map(() => Array(24).fill(null));
    
    currentData.data.forEach(point => {
      if (point.y >= 0 && point.y < 7 && point.x >= 0 && point.x < 24) {
        grid[point.y][point.x] = point;
      }
    });
    
    return grid;
  }, [currentData]);

  // Color scale for heatmap
  const getHeatmapColor = (value: number, min: number, max: number): string => {
    const normalized = (value - min) / (max - min);
    
    if (selectedMetric === 'errorRate') {
      // Red scale for error rates (higher = worse)
      const intensity = Math.floor(normalized * 255);
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    } else if (selectedMetric === 'responseTime') {
      // Orange to red scale for response time (higher = worse)
      const intensity = Math.floor(normalized * 255);
      return `rgb(255, ${255 - intensity * 0.5}, 0)`;
    } else {
      // Blue scale for CPU, memory, requests (higher = more active)
      const intensity = Math.floor(normalized * 255);
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    }
  };

  // Detect anomalies
  const anomalies = useMemo(() => {
    const threshold = currentData.average + (currentData.max - currentData.average) * 0.7;
    return currentData.data.filter(point => 
      point.value > threshold || point.value < currentData.average * 0.3
    );
  }, [currentData]);

  const handleCellClick = (dataPoint: HeatmapDataPoint) => {
    setSelectedCell(selectedCell?.timestamp === dataPoint.timestamp ? null : dataPoint);
    onCellClick?.(dataPoint);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(workingData);
    } else {
      // Default CSV export
      const csvContent = [
        'Metric,Day,Hour,Value,Timestamp',
        ...workingData.flatMap(metricData =>
          metricData.data.map(point => 
            `${metricData.metric},${DAYS[point.y]},${point.x},${point.value},${point.timestamp.toISOString()}`
          )
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'system-health-heatmap.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderHeatmap = () => (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-25 gap-1" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
            {/* Header row with hours */}
            <div></div>
            {HOURS.map(hour => (
              <div key={hour} className="text-xs text-center font-medium p-1">
                {hour}
              </div>
            ))}
            
            {/* Data rows */}
            {DAYS.map((day, dayIndex) => (
              <React.Fragment key={day}>
                <div className="text-xs font-medium p-2 flex items-center">
                  {day}
                </div>
                {heatmapGrid[dayIndex].map((dataPoint, hourIndex) => (
                  <div
                    key={`${dayIndex}-${hourIndex}`}
                    className={`aspect-square border border-gray-200 cursor-pointer hover:border-gray-400 transition-all ${
                      selectedCell?.x === hourIndex && selectedCell?.y === dayIndex 
                        ? 'ring-2 ring-blue-500' 
                        : ''
                    }`}
                    style={{
                      backgroundColor: dataPoint 
                        ? getHeatmapColor(dataPoint.value, currentData.min, currentData.max)
                        : '#f3f4f6'
                    }}
                    onClick={() => dataPoint && handleCellClick(dataPoint)}
                    title={dataPoint 
                      ? `${day} ${hourIndex}:00 - ${selectedMetric}: ${dataPoint.value.toFixed(1)}`
                      : 'No data'
                    }
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Color Legend */}
      <div className="flex items-center justify-center space-x-4">
        <span className="text-sm text-gray-600">Low</span>
        <div className="flex space-x-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 border border-gray-300"
              style={{
                backgroundColor: getHeatmapColor(
                  currentData.min + (i / 9) * (currentData.max - currentData.min),
                  currentData.min,
                  currentData.max
                )
              }}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">High</span>
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {anomalies.map((anomaly, index) => (
          <Card key={index} className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Anomaly Detected</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {DAYS[anomaly.y]} at {anomaly.x.toString().padStart(2, '0')}:00
                  </p>
                  <p className="text-lg font-bold text-red-600 mt-2">
                    {anomaly.value.toFixed(1)}
                    {selectedMetric.includes('Usage') ? '%' : 
                     selectedMetric === 'responseTime' ? 'ms' : 
                     selectedMetric === 'errorRate' ? '%' : ''}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedMetric}
                </Badge>
              </div>
              
              {anomaly.details && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>CPU: {anomaly.details.cpuUsage.toFixed(1)}%</div>
                    <div>Memory: {anomaly.details.memoryUsage.toFixed(1)}%</div>
                    <div>Response: {anomaly.details.responseTime.toFixed(0)}ms</div>
                    <div>Errors: {anomaly.details.errorRate.toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {anomalies.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>No anomalies detected in the current time period</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading heatmap data...</span>
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
            <p className="text-red-500 mb-2">Error loading heatmap data</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Metric Selector */}
            <Select value={selectedMetric} onValueChange={(value: MetricType) => setSelectedMetric(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpuUsage">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Usage
                  </div>
                </SelectItem>
                <SelectItem value="memoryUsage">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Memory Usage
                  </div>
                </SelectItem>
                <SelectItem value="responseTime">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Response Time
                  </div>
                </SelectItem>
                <SelectItem value="errorRate">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Error Rate
                  </div>
                </SelectItem>
                <SelectItem value="requestCount">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Request Count
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heatmap">Heatmap</SelectItem>
                <SelectItem value="anomalies">Anomalies</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Action Buttons */}
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
        
        {/* Statistics */}
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline">
            Min: {currentData.min.toFixed(1)}
            {selectedMetric.includes('Usage') ? '%' : 
             selectedMetric === 'responseTime' ? 'ms' : 
             selectedMetric === 'errorRate' ? '%' : ''}
          </Badge>
          <Badge variant="outline">
            Max: {currentData.max.toFixed(1)}
            {selectedMetric.includes('Usage') ? '%' : 
             selectedMetric === 'responseTime' ? 'ms' : 
             selectedMetric === 'errorRate' ? '%' : ''}
          </Badge>
          <Badge variant="outline">
            Avg: {currentData.average.toFixed(1)}
            {selectedMetric.includes('Usage') ? '%' : 
             selectedMetric === 'responseTime' ? 'ms' : 
             selectedMetric === 'errorRate' ? '%' : ''}
          </Badge>
          <Badge variant="outline">
            Anomalies: {anomalies.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
          {viewMode === 'heatmap' && renderHeatmap()}
          {viewMode === 'anomalies' && renderAnomalies()}
        </div>
        
        {/* Selected Cell Details */}
        {selectedCell && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">
              {DAYS[selectedCell.y]} at {selectedCell.x.toString().padStart(2, '0')}:00
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Value:</span>
                <p className="font-medium">
                  {selectedCell.value.toFixed(1)}
                  {selectedMetric.includes('Usage') ? '%' : 
                   selectedMetric === 'responseTime' ? 'ms' : 
                   selectedMetric === 'errorRate' ? '%' : ''}
                </p>
              </div>
              {selectedCell.details && (
                <>
                  <div>
                    <span className="text-gray-600">CPU:</span>
                    <p className="font-medium">{selectedCell.details.cpuUsage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Memory:</span>
                    <p className="font-medium">{selectedCell.details.memoryUsage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Response:</span>
                    <p className="font-medium">{selectedCell.details.responseTime.toFixed(0)}ms</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Errors:</span>
                    <p className="font-medium">{selectedCell.details.errorRate.toFixed(1)}%</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};