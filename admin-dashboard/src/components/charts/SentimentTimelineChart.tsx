import React, { useState, useEffect, useMemo } from 'react';
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
  ReferenceLine,
  Brush,
  ComposedChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  Download,
  Maximize2,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';

export interface SentimentTimelineData {
  timestamp: Date;
  positive: number;
  negative: number;
  neutral: number;
  volume: number;
  engagement: number;
  subreddit?: string;
  keyword?: string;
}

export interface SentimentCorrelationData {
  sentiment: number;
  engagement: number;
  volume: number;
  timestamp: Date;
}

interface SentimentTimelineChartProps {
  data: SentimentTimelineData[];
  title?: string;
  className?: string;
  height?: number;
  showEngagementCorrelation?: boolean;
  showVolumeOverlay?: boolean;
  enableBrushing?: boolean;
  onTimeRangeChange?: (startTime: Date, endTime: Date) => void;
  onDataExport?: (data: SentimentTimelineData[]) => void;
  isLoading?: boolean;
  error?: string;
}

type ViewMode = 'timeline' | 'correlation' | 'distribution' | 'heatmap';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

export const SentimentTimelineChart: React.FC<SentimentTimelineChartProps> = ({
  data,
  title = "Sentiment Timeline Analysis",
  className = '',
  height = 400,
  showEngagementCorrelation = true,
  showVolumeOverlay = true,
  enableBrushing = true,
  onTimeRangeChange,
  onDataExport,
  isLoading = false,
  error
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['positive', 'negative', 'neutral']);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }

    return data.filter(item => item.timestamp >= startTime);
  }, [data, timeRange]);

  // Format data for charts
  const chartData = useMemo(() => {
    return filteredData.map(item => ({
      timestamp: item.timestamp.getTime(),
      date: item.timestamp.toLocaleDateString(),
      time: item.timestamp.toLocaleTimeString(),
      positive: item.positive * 100,
      negative: item.negative * 100,
      neutral: item.neutral * 100,
      volume: item.volume,
      engagement: item.engagement,
      sentimentScore: (item.positive - item.negative) * 100,
      totalSentiment: (item.positive + item.negative + item.neutral) * 100
    }));
  }, [filteredData]);

  // Correlation data for sentiment vs engagement
  const correlationData = useMemo(() => {
    return filteredData.map(item => ({
      sentiment: (item.positive - item.negative) * 100,
      engagement: item.engagement,
      volume: item.volume,
      timestamp: item.timestamp
    }));
  }, [filteredData]);

  // Calculate sentiment statistics
  const sentimentStats = useMemo(() => {
    if (!chartData.length) return null;

    const avgPositive = chartData.reduce((sum, item) => sum + item.positive, 0) / chartData.length;
    const avgNegative = chartData.reduce((sum, item) => sum + item.negative, 0) / chartData.length;
    const avgNeutral = chartData.reduce((sum, item) => sum + item.neutral, 0) / chartData.length;
    const totalVolume = chartData.reduce((sum, item) => sum + item.volume, 0);

    return {
      avgPositive: avgPositive.toFixed(1),
      avgNegative: avgNegative.toFixed(1),
      avgNeutral: avgNeutral.toFixed(1),
      totalVolume,
      dominantSentiment: avgPositive > avgNegative ? 'positive' : avgNegative > avgPositive ? 'negative' : 'neutral'
    };
  }, [chartData]);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      setBrushDomain([domain.startIndex, domain.endIndex]);
      if (onTimeRangeChange && chartData.length > 0) {
        const startTime = new Date(chartData[domain.startIndex].timestamp);
        const endTime = new Date(chartData[domain.endIndex].timestamp);
        onTimeRangeChange(startTime, endTime);
      }
    }
  };

  const handleExport = () => {
    if (onDataExport) {
      const exportData = brushDomain
        ? filteredData.slice(brushDomain[0], brushDomain[1] + 1)
        : filteredData;
      onDataExport(exportData);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${data.date} ${data.time}`}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value.toFixed(1)}${entry.name.includes('engagement') ? '' : '%'}`}
              </p>
            ))}
            {data.volume && (
              <p className="text-gray-600">Volume: {data.volume}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTimelineView = () => (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis
            yAxisId="sentiment"
            stroke="#9CA3AF"
            fontSize={12}
            domain={[0, 100]}
          />
          {showVolumeOverlay && (
            <YAxis
              yAxisId="volume"
              orientation="right"
              stroke="#9CA3AF"
              fontSize={12}
            />
          )}
          <Tooltip content={<CustomTooltip />} />

          {/* Reference line at 50% for neutral sentiment */}
          <ReferenceLine y={50} stroke="#6B7280" strokeDasharray="2 2" yAxisId="sentiment" />

          {/* Sentiment lines */}
          {selectedMetrics.includes('positive') && (
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="positive"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Positive"
            />
          )}
          {selectedMetrics.includes('negative') && (
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="negative"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Negative"
            />
          )}
          {selectedMetrics.includes('neutral') && (
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="neutral"
              stroke="#6B7280"
              strokeWidth={2}
              dot={false}
              name="Neutral"
            />
          )}

          {/* Volume overlay */}
          {showVolumeOverlay && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#3B82F6"
              opacity={0.3}
              name="Volume"
            />
          )}

          {/* Engagement correlation */}
          {showEngagementCorrelation && (
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="engagement"
              stroke="#8B5CF6"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Engagement"
            />
          )}

          {/* Brush for zooming */}
          {enableBrushing && (
            <Brush
              dataKey="date"
              height={30}
              stroke="#3B82F6"
              onChange={handleBrushChange}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderCorrelationView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={correlationData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="sentiment"
          stroke="#9CA3AF"
          fontSize={12}
          label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          dataKey="engagement"
          stroke="#9CA3AF"
          fontSize={12}
          label={{ value: 'Engagement', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value.toFixed(2)}${name === 'sentiment' ? '%' : ''}`,
            name === 'sentiment' ? 'Sentiment Score' : 'Engagement'
          ]}
        />
        <Line
          type="monotone"
          dataKey="engagement"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderDistributionView = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="positive"
          stackId="1"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.6}
          name="Positive"
        />
        <Area
          type="monotone"
          dataKey="neutral"
          stackId="1"
          stroke="#6B7280"
          fill="#6B7280"
          fillOpacity={0.6}
          name="Neutral"
        />
        <Area
          type="monotone"
          dataKey="negative"
          stackId="1"
          stroke="#EF4444"
          fill="#EF4444"
          fillOpacity={0.6}
          name="Negative"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading sentiment timeline...</span>
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
            <p className="text-red-500 mb-2">Error loading sentiment timeline</p>
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
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(value: string) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="correlation">Correlation</SelectItem>
                <SelectItem value="distribution">Distribution</SelectItem>
              </SelectContent>
            </Select>

            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={(value: string) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1H</SelectItem>
                <SelectItem value="6h">6H</SelectItem>
                <SelectItem value="24h">24H</SelectItem>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
                <SelectItem value="all">All</SelectItem>
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

        {/* Statistics Summary */}
        {sentimentStats && (
          <div className="flex items-center space-x-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Positive: {sentimentStats.avgPositive}%
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Negative: {sentimentStats.avgNegative}%
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Minus className="h-3 w-3 text-gray-500" />
              Neutral: {sentimentStats.avgNeutral}%
            </Badge>
            <Badge variant="outline">
              Volume: {sentimentStats.totalVolume.toLocaleString()}
            </Badge>
          </div>
        )}

        {/* Metric Toggles */}
        {viewMode === 'timeline' && (
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">Show:</span>
            {['positive', 'negative', 'neutral'].map(metric => (
              <Button
                key={metric}
                variant={selectedMetrics.includes(metric) ? "primary" : "outline"}
                size="sm"
                onClick={() => handleMetricToggle(metric)}
                className="capitalize"
              >
                {metric}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'correlation' && renderCorrelationView()}
        {viewMode === 'distribution' && renderDistributionView()}
      </CardContent>
    </Card>
  );
};