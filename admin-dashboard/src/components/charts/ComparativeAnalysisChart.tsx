import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  GitCompare, 
  Filter, 
  Download,
  Maximize2,
  Plus,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export interface ComparisonDataPoint {
  timestamp: Date;
  label: string;
  values: { [key: string]: number };
  metadata?: { [key: string]: any };
}

export interface ComparisonDataset {
  id: string;
  name: string;
  data: ComparisonDataPoint[];
  color: string;
  visible: boolean;
  type: 'line' | 'bar' | 'area';
}

export interface ComparisonMetric {
  key: string;
  name: string;
  unit: string;
  format: (value: number) => string;
  color: string;
}

interface ComparativeAnalysisChartProps {
  datasets: ComparisonDataset[];
  metrics: ComparisonMetric[];
  title?: string;
  className?: string;
  height?: number;
  onDatasetToggle?: (datasetId: string, visible: boolean) => void;
  onMetricSelect?: (metricKey: string) => void;
  onExport?: (data: ComparisonDataset[]) => void;
  isLoading?: boolean;
  error?: string;
}

type ViewMode = 'sideBySide' | 'overlay' | 'radar' | 'scatter' | 'correlation';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const ComparativeAnalysisChart: React.FC<ComparativeAnalysisChartProps> = ({
  datasets,
  metrics,
  title = "Comparative Analysis",
  className = '',
  height = 400,
  onDatasetToggle,
  onMetricSelect,
  onExport,
  isLoading = false,
  error
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('sideBySide');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    metrics.slice(0, 3).map(m => m.key)
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter datasets based on search and visibility
  const visibleDatasets = useMemo(() => {
    return datasets.filter(dataset => 
      dataset.visible && 
      (searchTerm === '' || dataset.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [datasets, searchTerm]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(0);
    }
    
    return visibleDatasets.map(dataset => ({
      ...dataset,
      data: dataset.data.filter(point => point.timestamp >= cutoffTime)
    }));
  }, [visibleDatasets, timeRange]);

  // Prepare data for different chart types
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];
    
    // Get all unique timestamps
    const allTimestamps = new Set<number>();
    filteredData.forEach(dataset => {
      dataset.data.forEach(point => {
        allTimestamps.add(point.timestamp.getTime());
      });
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    // Create combined data points
    return sortedTimestamps.map(timestamp => {
      const dataPoint: any = {
        timestamp,
        time: new Date(timestamp).toLocaleTimeString(),
        date: new Date(timestamp).toLocaleDateString()
      };
      
      filteredData.forEach(dataset => {
        const point = dataset.data.find(p => p.timestamp.getTime() === timestamp);
        if (point) {
          selectedMetrics.forEach(metricKey => {
            dataPoint[`${dataset.id}_${metricKey}`] = point.values[metricKey] || 0;
          });
        }
      });
      
      return dataPoint;
    });
  }, [filteredData, selectedMetrics]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!filteredData.length) return [];
    
    return selectedMetrics.map(metricKey => {
      const metric = metrics.find(m => m.key === metricKey);
      const dataPoint: any = { metric: metric?.name || metricKey };
      
      filteredData.forEach(dataset => {
        const avgValue = dataset.data.reduce((sum, point) => {
          return sum + (point.values[metricKey] || 0);
        }, 0) / dataset.data.length;
        
        dataPoint[dataset.name] = avgValue;
      });
      
      return dataPoint;
    });
  }, [filteredData, selectedMetrics, metrics]);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (selectedMetrics.length < 2) return [];
    
    const xMetric = selectedMetrics[0];
    const yMetric = selectedMetrics[1];
    
    return filteredData.flatMap(dataset => 
      dataset.data.map(point => ({
        x: point.values[xMetric] || 0,
        y: point.values[yMetric] || 0,
        dataset: dataset.name,
        color: dataset.color,
        timestamp: point.timestamp
      }))
    );
  }, [filteredData, selectedMetrics]);

  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    if (selectedMetrics.length < 2 || !filteredData.length) return [];
    
    const matrix: Array<{ x: string; y: string; correlation: number }> = [];
    
    for (let i = 0; i < selectedMetrics.length; i++) {
      for (let j = 0; j < selectedMetrics.length; j++) {
        const metricX = selectedMetrics[i];
        const metricY = selectedMetrics[j];
        
        // Calculate correlation across all datasets
        const allDataPoints = filteredData.flatMap(dataset => dataset.data);
        const xValues = allDataPoints.map(p => p.values[metricX] || 0);
        const yValues = allDataPoints.map(p => p.values[metricY] || 0);
        
        const correlation = calculateCorrelation(xValues, yValues);
        
        matrix.push({
          x: metrics.find(m => m.key === metricX)?.name || metricX,
          y: metrics.find(m => m.key === metricY)?.name || metricY,
          correlation
        });
      }
    }
    
    return matrix;
  }, [filteredData, selectedMetrics, metrics]);

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const handleDatasetToggle = (datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      onDatasetToggle?.(datasetId, !dataset.visible);
    }
  };

  const handleMetricToggle = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
    onMetricSelect?.(metricKey);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredData);
    } else {
      // Default CSV export
      const csvContent = [
        'Dataset,Timestamp,' + selectedMetrics.join(','),
        ...filteredData.flatMap(dataset =>
          dataset.data.map(point => 
            `${dataset.name},${point.timestamp.toISOString()},${selectedMetrics.map(m => point.values[m] || 0).join(',')}`
          )
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'comparative-analysis.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => {
              const [datasetId, metricKey] = entry.dataKey.split('_');
              const dataset = datasets.find(d => d.id === datasetId);
              const metric = metrics.find(m => m.key === metricKey);
              
              return (
                <p key={index} style={{ color: entry.color }}>
                  {`${dataset?.name} - ${metric?.name}: ${metric?.format(entry.value) || entry.value}`}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderSideBySideView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredData.map(dataset => (
        <Card key={dataset.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{dataset.name}</span>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dataset.color }} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataset.data.map(point => ({
                ...point,
                time: point.timestamp.toLocaleTimeString(),
                ...selectedMetrics.reduce((acc, metricKey) => ({
                  ...acc,
                  [metricKey]: point.values[metricKey] || 0
                }), {})
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                {selectedMetrics.map((metricKey, index) => {
                  const metric = metrics.find(m => m.key === metricKey);
                  return (
                    <Line
                      key={metricKey}
                      type="monotone"
                      dataKey={metricKey}
                      stroke={metric?.color || COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      name={metric?.name}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderOverlayView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        {filteredData.map(dataset => 
          selectedMetrics.map(metricKey => {
            const metric = metrics.find(m => m.key === metricKey);
            return (
              <Line
                key={`${dataset.id}_${metricKey}`}
                type="monotone"
                dataKey={`${dataset.id}_${metricKey}`}
                stroke={dataset.color}
                strokeWidth={2}
                strokeDasharray={metric?.key === selectedMetrics[0] ? '0' : '5 5'}
                name={`${dataset.name} - ${metric?.name}`}
              />
            );
          })
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderRadarView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis />
        <Tooltip />
        {filteredData.map(dataset => (
          <Radar
            key={dataset.id}
            name={dataset.name}
            dataKey={dataset.name}
            stroke={dataset.color}
            fill={dataset.color}
            fillOpacity={0.1}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );

  const renderScatterView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="x" 
          stroke="#9CA3AF" 
          fontSize={12}
          name={metrics.find(m => m.key === selectedMetrics[0])?.name}
        />
        <YAxis 
          dataKey="y" 
          stroke="#9CA3AF" 
          fontSize={12}
          name={metrics.find(m => m.key === selectedMetrics[1])?.name}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            value.toFixed(2), 
            name === 'x' ? metrics.find(m => m.key === selectedMetrics[0])?.name : 
            metrics.find(m => m.key === selectedMetrics[1])?.name
          ]}
        />
        {filteredData.map(dataset => (
          <Scatter
            key={dataset.id}
            name={dataset.name}
            data={scatterData.filter(point => point.dataset === dataset.name)}
            fill={dataset.color}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderCorrelationView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {correlationMatrix.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">{item.x} vs {item.y}</p>
                <p className={`text-2xl font-bold ${
                  Math.abs(item.correlation) > 0.7 ? 'text-green-600' :
                  Math.abs(item.correlation) > 0.3 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {item.correlation.toFixed(3)}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.abs(item.correlation) > 0.7 ? 'Strong' :
                   Math.abs(item.correlation) > 0.3 ? 'Moderate' : 'Weak'} correlation
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading comparison data...</span>
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
            <p className="text-red-500 mb-2">Error loading comparison data</p>
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
            <GitCompare className="h-5 w-5" />
            {title}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sideBySide">Side by Side</SelectItem>
                <SelectItem value="overlay">Overlay</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
                <SelectItem value="correlation">Correlation</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1H</SelectItem>
                <SelectItem value="6h">6H</SelectItem>
                <SelectItem value="24h">24H</SelectItem>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
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
        
        {/* Controls */}
        <div className="space-y-4 mt-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          
          {/* Dataset Toggles */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Datasets:</h4>
            <div className="flex flex-wrap gap-2">
              {datasets.map(dataset => (
                <Button
                  key={dataset.id}
                  variant={dataset.visible ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatasetToggle(dataset.id)}
                  className="flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: dataset.color }}
                  />
                  {dataset.name}
                  {dataset.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Metric Toggles */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Metrics:</h4>
            <div className="flex flex-wrap gap-2">
              {metrics.map(metric => (
                <Button
                  key={metric.key}
                  variant={selectedMetrics.includes(metric.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMetricToggle(metric.key)}
                  style={{ 
                    backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                    borderColor: metric.color
                  }}
                >
                  {metric.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline">
            Datasets: {visibleDatasets.length}/{datasets.length}
          </Badge>
          <Badge variant="outline">
            Metrics: {selectedMetrics.length}/{metrics.length}
          </Badge>
          <Badge variant="outline">
            Data Points: {chartData.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: isFullscreen ? 'calc(100vh - 300px)' : height }}>
          {viewMode === 'sideBySide' && renderSideBySideView()}
          {viewMode === 'overlay' && renderOverlayView()}
          {viewMode === 'radar' && renderRadarView()}
          {viewMode === 'scatter' && renderScatterView()}
          {viewMode === 'correlation' && renderCorrelationView()}
        </div>
      </CardContent>
    </Card>
  );
};