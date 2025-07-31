import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Slider } from '../ui/slider';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart,
  Bar,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Zap, 
  Target,
  Download,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  trend: number; // Rate of change
  volatility: number; // Measure of variability
  anomaly: boolean; // Whether this point is an anomaly
  confidence: number; // Confidence in the trend prediction
  metadata?: { [key: string]: any };
}

export interface TrendSeries {
  id: string;
  name: string;
  data: TrendDataPoint[];
  color: string;
  unit: string;
  baseline?: number;
}

export interface CorrelationResult {
  series1: string;
  series2: string;
  correlation: number;
  pValue: number;
  significance: 'high' | 'medium' | 'low' | 'none';
  lag: number; // Time lag in data points
}

export interface PatternMatch {
  id: string;
  type: 'seasonal' | 'cyclical' | 'trend' | 'anomaly';
  description: string;
  confidence: number;
  startTime: Date;
  endTime: Date;
  series: string[];
  strength: number;
}

interface TrendCorrelationChartProps {
  series: TrendSeries[];
  title?: string;
  className?: string;
  height?: number;
  correlationThreshold?: number;
  anomalyThreshold?: number;
  onPatternDetected?: (pattern: PatternMatch) => void;
  onCorrelationFound?: (correlation: CorrelationResult) => void;
  onExport?: (data: any) => void;
  isLoading?: boolean;
  error?: string;
}

type ViewMode = 'trends' | 'correlations' | 'patterns' | 'anomalies' | 'predictions';
type AnalysisType = 'pearson' | 'spearman' | 'kendall';

export const TrendCorrelationChart: React.FC<TrendCorrelationChartProps> = ({
  series,
  title = "Trend Correlation Analysis",
  className = '',
  height = 400,
  correlationThreshold = 0.5,
  anomalyThreshold = 2.0,
  onPatternDetected,
  onCorrelationFound,
  onExport,
  isLoading = false,
  error
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('trends');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('pearson');
  const [selectedSeries, setSelectedSeries] = useState<string[]>(
    series.slice(0, 3).map(s => s.id)
  );
  const [correlationThresholdValue, setCorrelationThresholdValue] = useState([correlationThreshold]);
  const [anomalyThresholdValue, setAnomalyThresholdValue] = useState([anomalyThreshold]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter series based on selection
  const activeSeries = useMemo(() => {
    return series.filter(s => selectedSeries.includes(s.id));
  }, [series, selectedSeries]);

  // Calculate correlations between all series pairs
  const correlations = useMemo(() => {
    const results: CorrelationResult[] = [];
    
    for (let i = 0; i < activeSeries.length; i++) {
      for (let j = i + 1; j < activeSeries.length; j++) {
        const series1 = activeSeries[i];
        const series2 = activeSeries[j];
        
        // Align data points by timestamp
        const alignedData = alignSeriesData(series1, series2);
        
        if (alignedData.length > 2) {
          const correlation = calculateCorrelation(
            alignedData.map(d => d.value1),
            alignedData.map(d => d.value2),
            analysisType
          );
          
          const pValue = calculatePValue(correlation, alignedData.length);
          const significance = getSignificanceLevel(pValue);
          
          results.push({
            series1: series1.name,
            series2: series2.name,
            correlation,
            pValue,
            significance,
            lag: 0 // Simplified - would need more complex analysis for lag detection
          });
        }
      }
    }
    
    return results.filter(r => Math.abs(r.correlation) >= correlationThresholdValue[0]);
  }, [activeSeries, analysisType, correlationThresholdValue]);

  // Detect patterns in the data
  const patterns = useMemo(() => {
    const detectedPatterns: PatternMatch[] = [];
    
    activeSeries.forEach(seriesData => {
      // Detect trend patterns
      const trendPattern = detectTrendPattern(seriesData);
      if (trendPattern) {
        detectedPatterns.push(trendPattern);
      }
      
      // Detect seasonal patterns
      const seasonalPattern = detectSeasonalPattern(seriesData);
      if (seasonalPattern) {
        detectedPatterns.push(seasonalPattern);
      }
      
      // Detect anomalies
      const anomalies = detectAnomalies(seriesData, anomalyThresholdValue[0]);
      detectedPatterns.push(...anomalies);
    });
    
    return detectedPatterns;
  }, [activeSeries, anomalyThresholdValue]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!activeSeries.length) return [];
    
    // Get all unique timestamps
    const allTimestamps = new Set<number>();
    activeSeries.forEach(s => {
      s.data.forEach(point => {
        allTimestamps.add(point.timestamp.getTime());
      });
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    return sortedTimestamps.map(timestamp => {
      const dataPoint: any = {
        timestamp,
        time: new Date(timestamp).toLocaleTimeString(),
        date: new Date(timestamp).toLocaleDateString()
      };
      
      activeSeries.forEach(s => {
        const point = s.data.find(p => p.timestamp.getTime() === timestamp);
        if (point) {
          dataPoint[s.id] = point.value;
          dataPoint[`${s.id}_trend`] = point.trend;
          dataPoint[`${s.id}_volatility`] = point.volatility;
          dataPoint[`${s.id}_anomaly`] = point.anomaly;
        }
      });
      
      return dataPoint;
    });
  }, [activeSeries]);

  // Helper functions
  const alignSeriesData = (series1: TrendSeries, series2: TrendSeries) => {
    const aligned: Array<{ timestamp: number; value1: number; value2: number }> = [];
    
    series1.data.forEach(point1 => {
      const point2 = series2.data.find(p => 
        Math.abs(p.timestamp.getTime() - point1.timestamp.getTime()) < 60000 // 1 minute tolerance
      );
      
      if (point2) {
        aligned.push({
          timestamp: point1.timestamp.getTime(),
          value1: point1.value,
          value2: point2.value
        });
      }
    });
    
    return aligned;
  };

  const calculateCorrelation = (x: number[], y: number[], type: AnalysisType): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    switch (type) {
      case 'pearson':
        return calculatePearsonCorrelation(x, y);
      case 'spearman':
        return calculateSpearmanCorrelation(x, y);
      case 'kendall':
        return calculateKendallCorrelation(x, y);
      default:
        return calculatePearsonCorrelation(x, y);
    }
  };

  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateSpearmanCorrelation = (x: number[], y: number[]): number => {
    // Simplified implementation - would need proper ranking
    const xRanks = x.map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((item, rank) => ({ ...item, rank }))
      .sort((a, b) => a.idx - b.idx)
      .map(item => item.rank);
    
    const yRanks = y.map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((item, rank) => ({ ...item, rank }))
      .sort((a, b) => a.idx - b.idx)
      .map(item => item.rank);
    
    return calculatePearsonCorrelation(xRanks, yRanks);
  };

  const calculateKendallCorrelation = (x: number[], y: number[]): number => {
    // Simplified implementation
    let concordant = 0;
    let discordant = 0;
    
    for (let i = 0; i < x.length - 1; i++) {
      for (let j = i + 1; j < x.length; j++) {
        const xDiff = x[i] - x[j];
        const yDiff = y[i] - y[j];
        
        if (xDiff * yDiff > 0) concordant++;
        else if (xDiff * yDiff < 0) discordant++;
      }
    }
    
    const n = x.length;
    return (concordant - discordant) / (n * (n - 1) / 2);
  };

  const calculatePValue = (correlation: number, n: number): number => {
    // Simplified p-value calculation
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    return 2 * (1 - Math.abs(t) / Math.sqrt(n - 2 + t * t));
  };

  const getSignificanceLevel = (pValue: number): 'high' | 'medium' | 'low' | 'none' => {
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    if (pValue < 0.1) return 'low';
    return 'none';
  };

  const detectTrendPattern = (seriesData: TrendSeries): PatternMatch | null => {
    const trends = seriesData.data.map(d => d.trend);
    const avgTrend = trends.reduce((sum, t) => sum + t, 0) / trends.length;
    
    if (Math.abs(avgTrend) > 0.1) {
      return {
        id: `trend_${seriesData.id}_${Date.now()}`,
        type: 'trend',
        description: `${avgTrend > 0 ? 'Upward' : 'Downward'} trend detected`,
        confidence: Math.min(Math.abs(avgTrend) * 10, 1),
        startTime: seriesData.data[0].timestamp,
        endTime: seriesData.data[seriesData.data.length - 1].timestamp,
        series: [seriesData.name],
        strength: Math.abs(avgTrend)
      };
    }
    
    return null;
  };

  const detectSeasonalPattern = (seriesData: TrendSeries): PatternMatch | null => {
    // Simplified seasonal detection - would need more sophisticated analysis
    const values = seriesData.data.map(d => d.value);
    const variance = calculateVariance(values);
    
    if (variance > 0.5) {
      return {
        id: `seasonal_${seriesData.id}_${Date.now()}`,
        type: 'seasonal',
        description: 'Seasonal pattern detected',
        confidence: Math.min(variance / 2, 1),
        startTime: seriesData.data[0].timestamp,
        endTime: seriesData.data[seriesData.data.length - 1].timestamp,
        series: [seriesData.name],
        strength: variance
      };
    }
    
    return null;
  };

  const detectAnomalies = (seriesData: TrendSeries, threshold: number): PatternMatch[] => {
    const anomalies: PatternMatch[] = [];
    
    seriesData.data.forEach(point => {
      if (point.anomaly || Math.abs(point.value - (seriesData.baseline || 0)) > threshold) {
        anomalies.push({
          id: `anomaly_${seriesData.id}_${point.timestamp.getTime()}`,
          type: 'anomaly',
          description: `Anomaly detected: value ${point.value.toFixed(2)}`,
          confidence: point.confidence || 0.8,
          startTime: point.timestamp,
          endTime: point.timestamp,
          series: [seriesData.name],
          strength: Math.abs(point.value - (seriesData.baseline || 0))
        });
      }
    });
    
    return anomalies;
  };

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  };

  const handleSeriesToggle = (seriesId: string) => {
    setSelectedSeries(prev => 
      prev.includes(seriesId) 
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  const handleExport = () => {
    const exportData = {
      series: activeSeries,
      correlations,
      patterns,
      chartData
    };
    
    if (onExport) {
      onExport(exportData);
    } else {
      // Default JSON export
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trend-correlation-analysis.json';
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
              const seriesData = activeSeries.find(s => s.id === entry.dataKey);
              return (
                <p key={index} style={{ color: entry.color }}>
                  {`${seriesData?.name}: ${entry.value.toFixed(2)} ${seriesData?.unit || ''}`}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTrendsView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        
        {activeSeries.map(s => (
          <Line
            key={s.id}
            type="monotone"
            dataKey={s.id}
            stroke={s.color}
            strokeWidth={2}
            name={s.name}
          />
        ))}
        
        {/* Add baseline reference lines */}
        {activeSeries.map(s => s.baseline && (
          <ReferenceLine
            key={`baseline_${s.id}`}
            y={s.baseline}
            stroke={s.color}
            strokeDasharray="5 5"
            opacity={0.5}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderCorrelationsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {correlations.map((corr, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">{corr.series1} vs {corr.series2}</p>
                <p className={`text-2xl font-bold ${
                  Math.abs(corr.correlation) > 0.7 ? 'text-green-600' :
                  Math.abs(corr.correlation) > 0.3 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {corr.correlation.toFixed(3)}
                </p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {corr.significance}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    p={corr.pValue.toFixed(3)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {correlations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-8 w-8 mx-auto mb-2" />
          <p>No significant correlations found above threshold</p>
        </div>
      )}
    </div>
  );

  const renderPatternsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map(pattern => (
          <Card key={pattern.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    {pattern.type === 'trend' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    {pattern.type === 'seasonal' && <Activity className="h-4 w-4 text-green-500" />}
                    {pattern.type === 'anomaly' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium capitalize">{pattern.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {pattern.startTime.toLocaleString()} - {pattern.endTime.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {(pattern.confidence * 100).toFixed(0)}%
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Strength: {pattern.strength.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {patterns.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>No patterns detected in the current data</p>
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
            <span>Analyzing trends and correlations...</span>
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
            <p className="text-red-500 mb-2">Error analyzing trends</p>
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
            <Zap className="h-5 w-5" />
            {title}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trends">Trends</SelectItem>
                <SelectItem value="correlations">Correlations</SelectItem>
                <SelectItem value="patterns">Patterns</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Analysis Type Selector */}
            <Select value={analysisType} onValueChange={(value: AnalysisType) => setAnalysisType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pearson">Pearson</SelectItem>
                <SelectItem value="spearman">Spearman</SelectItem>
                <SelectItem value="kendall">Kendall</SelectItem>
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
          {/* Series Selection */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Series:</h4>
            <div className="flex flex-wrap gap-2">
              {series.map(s => (
                <Button
                  key={s.id}
                  variant={selectedSeries.includes(s.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSeriesToggle(s.id)}
                  className="flex items-center gap-2"
                  style={{ 
                    backgroundColor: selectedSeries.includes(s.id) ? s.color : undefined,
                    borderColor: s.color
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Correlation Threshold: {correlationThresholdValue[0].toFixed(2)}
              </label>
              <Slider
                value={correlationThresholdValue}
                onValueChange={setCorrelationThresholdValue}
                max={1}
                min={0}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Anomaly Threshold: {anomalyThresholdValue[0].toFixed(1)}
              </label>
              <Slider
                value={anomalyThresholdValue}
                onValueChange={setAnomalyThresholdValue}
                max={5}
                min={0.5}
                step={0.1}
              />
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline">
            Series: {selectedSeries.length}/{series.length}
          </Badge>
          <Badge variant="outline">
            Correlations: {correlations.length}
          </Badge>
          <Badge variant="outline">
            Patterns: {patterns.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: isFullscreen ? 'calc(100vh - 300px)' : height }}>
          {viewMode === 'trends' && renderTrendsView()}
          {viewMode === 'correlations' && renderCorrelationsView()}
          {viewMode === 'patterns' && renderPatternsView()}
        </div>
      </CardContent>
    </Card>
  );
};