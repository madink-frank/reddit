import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Input } from '../ui/Input';
import { Slider } from '../ui/slider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Hash,
  Cloud,
  Filter,
  Search,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Network,
  TrendingUp,
  Settings,
  RefreshCw,
  Maximize2
} from 'lucide-react';

export interface WordFrequencyData {
  word: string;
  frequency: number;
  sentiment?: number;
  subreddit?: string;
  category?: string;
  importance?: number;
  trend?: number;
  cooccurrence?: string[];
}

export interface KeywordNetworkNode {
  id: string;
  word: string;
  frequency: number;
  sentiment: number;
  size: number;
  color: string;
}

export interface KeywordNetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: 'cooccurrence' | 'semantic' | 'temporal';
}

interface WordFrequencyChartProps {
  data: WordFrequencyData[];
  title?: string;
  className?: string;
  height?: number;
  showSentimentOverlay?: boolean;
  enableFiltering?: boolean;
  enableNetworkView?: boolean;
  onWordSelect?: (word: string) => void;
  onExport?: (data: WordFrequencyData[]) => void;
  isLoading?: boolean;
  error?: string;
}

type ViewMode = 'bar' | 'cloud' | 'pie' | 'network' | 'trend' | 'scatter';
type SortMode = 'frequency' | 'sentiment' | 'importance' | 'alphabetical';
type FilterMode = 'all' | 'positive' | 'negative' | 'neutral';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const WordFrequencyChart: React.FC<WordFrequencyChartProps> = ({
  data,
  title = "Word Frequency Analysis",
  className = '',
  height = 400,
  showSentimentOverlay = true,
  enableFiltering = true,
  enableNetworkView = true,
  onWordSelect,
  onExport,
  isLoading = false,
  error
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [sortMode, setSortMode] = useState<SortMode>('frequency');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxWords, setMaxWords] = useState([20]);
  const [minFrequency, setMinFrequency] = useState([1]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data.filter(item => {
      // Search filter
      if (searchTerm && !item.word.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Frequency filter
      if (item.frequency < minFrequency[0]) {
        return false;
      }

      // Sentiment filter
      if (filterMode !== 'all' && item.sentiment !== undefined) {
        if (filterMode === 'positive' && item.sentiment <= 0) return false;
        if (filterMode === 'negative' && item.sentiment >= 0) return false;
        if (filterMode === 'neutral' && Math.abs(item.sentiment) > 0.1) return false;
      }

      return true;
    });

    // Sort data
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'sentiment':
          return (b.sentiment || 0) - (a.sentiment || 0);
        case 'importance':
          return (b.importance || 0) - (a.importance || 0);
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        default:
          return 0;
      }
    });

    return filtered.slice(0, maxWords[0]);
  }, [data, searchTerm, minFrequency, filterMode, sortMode, maxWords]);

  // Generate chart data based on view mode
  const chartData = useMemo(() => {
    return processedData.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
      sentimentColor: item.sentiment
        ? item.sentiment > 0 ? '#10B981' : item.sentiment < 0 ? '#EF4444' : '#6B7280'
        : '#6B7280'
    }));
  }, [processedData]);

  // Generate network data for semantic relationships
  const networkData = useMemo(() => {
    const nodes: KeywordNetworkNode[] = processedData.map((item, index) => ({
      id: item.word,
      word: item.word,
      frequency: item.frequency,
      sentiment: item.sentiment || 0,
      size: Math.max(20, Math.min(100, item.frequency * 2)),
      color: COLORS[index % COLORS.length]
    }));

    const edges: KeywordNetworkEdge[] = [];

    // Generate edges based on co-occurrence
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sourceItem = processedData[i];
        const targetItem = processedData[j];

        // Simple co-occurrence simulation based on category or subreddit
        if (sourceItem.category === targetItem.category ||
          sourceItem.subreddit === targetItem.subreddit) {
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: Math.min(sourceItem.frequency, targetItem.frequency) * 0.1,
            type: 'cooccurrence'
          });
        }
      }
    }

    return { nodes, edges };
  }, [processedData]);

  const handleWordClick = (word: string) => {
    setSelectedWord(selectedWord === word ? null : word);
    onWordSelect?.(word);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(processedData);
    } else {
      // Default CSV export
      const csvContent = [
        'Word,Frequency,Sentiment,Category,Subreddit,Importance',
        ...processedData.map(item =>
          `${item.word},${item.frequency},${item.sentiment || ''},${item.category || ''},${item.subreddit || ''},${item.importance || ''}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'word-frequency.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.word}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">Frequency: {data.frequency}</p>
            {data.sentiment !== undefined && (
              <p className="text-sm">Sentiment: {data.sentiment.toFixed(2)}</p>
            )}
            {data.category && (
              <p className="text-sm">Category: {data.category}</p>
            )}
            {data.importance && (
              <p className="text-sm">Importance: {data.importance.toFixed(3)}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="word"
          angle={-45}
          textAnchor="end"
          height={80}
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="frequency"
          fill="#3B82F6"
          onClick={(data) => handleWordClick(data.payload.word)}
          cursor="pointer"
        />
        {showSentimentOverlay && (
          <Bar
            dataKey="sentiment"
            fill="#10B981"
            opacity={0.6}
            yAxisId="sentiment"
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderWordCloud = () => (
    <div className="relative h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-center h-full gap-2">
        {chartData.map((item, index) => (
          <span
            key={index}
            className={`inline-block px-2 py-1 rounded cursor-pointer transition-all hover:scale-110 ${selectedWord === item.word ? 'ring-2 ring-blue-500' : ''
              }`}
            style={{
              fontSize: `${Math.max(12, Math.min(32, item.frequency * 2))}px`,
              color: showSentimentOverlay ? item.sentimentColor : item.color,
              fontWeight: item.importance && item.importance > 0.1 ? 'bold' : 'normal'
            }}
            onClick={() => handleWordClick(item.word)}
            title={`Frequency: ${item.frequency}${item.sentiment ? `, Sentiment: ${item.sentiment.toFixed(2)}` : ''}`}
          >
            {item.word}
          </span>
        ))}
      </div>
      {selectedWord && (
        <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-700 p-2 rounded shadow-md text-sm">
          <strong>{selectedWord}</strong>
          {chartData.find(item => item.word === selectedWord) && (
            <div className="mt-1">
              <div>Freq: {chartData.find(item => item.word === selectedWord)?.frequency}</div>
              {chartData.find(item => item.word === selectedWord)?.sentiment && (
                <div>Sentiment: {chartData.find(item => item.word === selectedWord)?.sentiment?.toFixed(2)}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData.slice(0, 10)}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ word, frequency }) => `${word} (${frequency})`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="frequency"
          onClick={(data) => handleWordClick(data.word)}
        >
          {chartData.slice(0, 10).map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="frequency"
          stroke="#9CA3AF"
          fontSize={12}
          label={{ value: 'Frequency', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          dataKey="sentiment"
          stroke="#9CA3AF"
          fontSize={12}
          label={{ value: 'Sentiment', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          dataKey="sentiment"
          fill="#8B5CF6"
          onClick={(data) => handleWordClick(data.payload.word)}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderNetworkView = () => (
    <div className="relative h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="text-center text-gray-600 mt-20">
        <Network className="h-12 w-12 mx-auto mb-4" />
        <p>Network visualization would be rendered here</p>
        <p className="text-sm">Showing semantic relationships between keywords</p>
        <div className="mt-4 space-y-2">
          {networkData.nodes.slice(0, 5).map(node => (
            <div key={node.id} className="flex items-center justify-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-sm">{node.word}</span>
              <Badge variant="outline">{node.frequency}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading word frequency data...</span>
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
            <p className="text-red-500 mb-2">Error loading word frequency data</p>
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
            <Hash className="h-5 w-5" />
            {title}
          </CardTitle>

          <div className="flex items-center space-x-2">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value="cloud">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Word Cloud
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Pie Chart
                  </div>
                </SelectItem>
                <SelectItem value="scatter">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Scatter Plot
                  </div>
                </SelectItem>
                {enableNetworkView && (
                  <SelectItem value="network">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Network
                    </div>
                  </SelectItem>
                )}
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

        {/* Filters and Controls */}
        {enableFiltering && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort Mode */}
              <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frequency">Frequency</SelectItem>
                  <SelectItem value="sentiment">Sentiment</SelectItem>
                  <SelectItem value="importance">Importance</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Mode */}
              <Select value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Words</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>

              {/* Max Words */}
              <div className="flex items-center space-x-2">
                <span className="text-sm">Max: {maxWords[0]}</span>
                <Slider
                  value={maxWords}
                  onValueChange={setMaxWords}
                  max={100}
                  min={5}
                  step={5}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline">
            Total Words: {processedData.length}
          </Badge>
          <Badge variant="outline">
            Avg Frequency: {(processedData.reduce((sum, item) => sum + item.frequency, 0) / processedData.length || 0).toFixed(1)}
          </Badge>
          {showSentimentOverlay && (
            <Badge variant="outline">
              Avg Sentiment: {(processedData.reduce((sum, item) => sum + (item.sentiment || 0), 0) / processedData.length || 0).toFixed(2)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
          {viewMode === 'bar' && renderBarChart()}
          {viewMode === 'cloud' && renderWordCloud()}
          {viewMode === 'pie' && renderPieChart()}
          {viewMode === 'scatter' && renderScatterChart()}
          {viewMode === 'network' && renderNetworkView()}
        </div>
      </CardContent>
    </Card>
  );
};