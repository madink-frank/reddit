import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ComparativeAnalysisChart } from '../components/charts/ComparativeAnalysisChart';
import { TrendCorrelationChart } from '../components/charts/TrendCorrelationChart';
import { SentimentTimelineChart } from '../components/charts/SentimentTimelineChart';
import { WordFrequencyChart } from '../components/charts/WordFrequencyChart';
import { KeywordNetworkChart } from '../components/charts/KeywordNetworkChart';
import { 
  BarChart3, 
  GitCompare, 
  Zap,
  Activity,
  Brain,
  Network,
  Download,
  RefreshCw
} from 'lucide-react';
import type { 
  ComparisonDataset, 
  ComparisonMetric,
  TrendSeries,
  PatternMatch,
  CorrelationResult,
  SentimentTimelineData,
  WordFrequencyData,
  KeywordNetworkData
} from '../components/charts';

const AdvancedAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('comparative');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for comparative analysis
  const [comparisonDatasets, setComparisonDatasets] = useState<ComparisonDataset[]>([]);
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetric[]>([]);
  
  // Mock data for trend correlation
  const [trendSeries, setTrendSeries] = useState<TrendSeries[]>([]);
  
  // Mock data for sentiment analysis
  const [sentimentData, setSentimentData] = useState<SentimentTimelineData[]>([]);
  
  // Mock data for word frequency
  const [wordFrequencyData, setWordFrequencyData] = useState<WordFrequencyData[]>([]);
  
  // Mock data for keyword network
  const [keywordNetworkData, setKeywordNetworkData] = useState<KeywordNetworkData>({ nodes: [], edges: [] });

  useEffect(() => {
    generateMockData();
  }, []);

  const generateMockData = () => {
    setIsLoading(true);
    
    // Generate comparison datasets
    const datasets: ComparisonDataset[] = [
      {
        id: 'reddit_posts',
        name: 'Reddit Posts',
        data: generateTimeSeriesData('posts', 100),
        color: '#3B82F6',
        visible: true,
        type: 'line'
      },
      {
        id: 'user_engagement',
        name: 'User Engagement',
        data: generateTimeSeriesData('engagement', 100),
        color: '#10B981',
        visible: true,
        type: 'line'
      },
      {
        id: 'sentiment_score',
        name: 'Sentiment Score',
        data: generateTimeSeriesData('sentiment', 100),
        color: '#F59E0B',
        visible: true,
        type: 'area'
      },
      {
        id: 'response_time',
        name: 'Response Time',
        data: generateTimeSeriesData('response_time', 100),
        color: '#EF4444',
        visible: false,
        type: 'bar'
      }
    ];
    
    const metrics: ComparisonMetric[] = [
      {
        key: 'posts',
        name: 'Posts Count',
        unit: 'posts',
        format: (value) => `${value.toFixed(0)} posts`,
        color: '#3B82F6'
      },
      {
        key: 'engagement',
        name: 'Engagement Rate',
        unit: '%',
        format: (value) => `${value.toFixed(1)}%`,
        color: '#10B981'
      },
      {
        key: 'sentiment',
        name: 'Sentiment Score',
        unit: 'score',
        format: (value) => `${value.toFixed(2)}`,
        color: '#F59E0B'
      },
      {
        key: 'response_time',
        name: 'Response Time',
        unit: 'ms',
        format: (value) => `${value.toFixed(0)}ms`,
        color: '#EF4444'
      }
    ];
    
    setComparisonDatasets(datasets);
    setComparisonMetrics(metrics);
    
    // Generate trend series data
    const trends: TrendSeries[] = [
      {
        id: 'cpu_usage',
        name: 'CPU Usage',
        data: generateTrendData('cpu', 50),
        color: '#8B5CF6',
        unit: '%',
        baseline: 50
      },
      {
        id: 'memory_usage',
        name: 'Memory Usage',
        data: generateTrendData('memory', 50),
        color: '#EC4899',
        unit: '%',
        baseline: 60
      },
      {
        id: 'request_rate',
        name: 'Request Rate',
        data: generateTrendData('requests', 50),
        color: '#06B6D4',
        unit: 'req/s',
        baseline: 100
      }
    ];
    
    setTrendSeries(trends);
    
    // Generate sentiment timeline data
    const sentimentTimeline: SentimentTimelineData[] = [];
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(Date.now() - (48 - i) * 60 * 60 * 1000);
      sentimentTimeline.push({
        timestamp,
        positive: 0.4 + Math.random() * 0.4,
        negative: 0.1 + Math.random() * 0.3,
        neutral: 0.2 + Math.random() * 0.3,
        volume: 50 + Math.random() * 100,
        engagement: 60 + Math.random() * 40,
        subreddit: ['technology', 'programming', 'webdev'][Math.floor(Math.random() * 3)],
        keyword: ['react', 'typescript', 'nodejs'][Math.floor(Math.random() * 3)]
      });
    }
    
    setSentimentData(sentimentTimeline);
    
    // Generate word frequency data
    const words = [
      'react', 'typescript', 'javascript', 'nodejs', 'python', 'api', 'database',
      'frontend', 'backend', 'development', 'programming', 'coding', 'software',
      'web', 'mobile', 'cloud', 'aws', 'docker', 'kubernetes', 'microservices'
    ];
    
    const wordFreq: WordFrequencyData[] = words.map(word => ({
      word,
      frequency: Math.floor(Math.random() * 100) + 10,
      sentiment: (Math.random() - 0.5) * 2,
      category: ['technology', 'programming', 'tools'][Math.floor(Math.random() * 3)],
      subreddit: ['programming', 'webdev', 'javascript'][Math.floor(Math.random() * 3)],
      importance: Math.random(),
      trend: (Math.random() - 0.5) * 2,
      cooccurrence: words.filter(() => Math.random() > 0.7).slice(0, 3)
    }));
    
    setWordFrequencyData(wordFreq);
    
    // Generate keyword network data
    const nodes = words.slice(0, 15).map(word => ({
      id: word,
      word,
      frequency: Math.floor(Math.random() * 100) + 10,
      sentiment: (Math.random() - 0.5) * 2,
      category: ['technology', 'programming', 'tools'][Math.floor(Math.random() * 3)],
      subreddit: ['programming', 'webdev', 'javascript'][Math.floor(Math.random() * 3)]
    }));
    
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.7) {
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: Math.random() * 0.8 + 0.2,
            type: ['cooccurrence', 'semantic', 'temporal'][Math.floor(Math.random() * 3)] as any
          });
        }
      }
    }
    
    setKeywordNetworkData({ nodes, edges });
    
    setTimeout(() => setIsLoading(false), 1000);
  };

  const generateTimeSeriesData = (type: string, count: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - (count - i) * 60 * 60 * 1000);
      let baseValue = 50;
      
      // Add patterns based on type
      if (type === 'posts') {
        baseValue = 20 + Math.sin(i * 0.1) * 10 + Math.random() * 20;
      } else if (type === 'engagement') {
        baseValue = 60 + Math.cos(i * 0.15) * 15 + Math.random() * 10;
      } else if (type === 'sentiment') {
        baseValue = 0.5 + Math.sin(i * 0.2) * 0.3 + (Math.random() - 0.5) * 0.2;
      } else if (type === 'response_time') {
        baseValue = 200 + Math.random() * 100 + (i % 10 === 0 ? 300 : 0);
      }
      
      const values: { [key: string]: number } = {};
      values[type] = Math.max(0, baseValue);
      
      data.push({
        timestamp,
        label: timestamp.toLocaleTimeString(),
        values,
        metadata: {
          hour: timestamp.getHours(),
          dayOfWeek: timestamp.getDay()
        }
      });
    }
    
    return data;
  };

  const generateTrendData = (type: string, count: number) => {
    const data = [];
    const now = new Date();
    let previousValue = 50;
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - (count - i) * 60 * 1000);
      
      // Generate realistic trend patterns
      const trend = (Math.random() - 0.5) * 2;
      const volatility = Math.random() * 5;
      const value = Math.max(0, Math.min(100, previousValue + trend + (Math.random() - 0.5) * volatility));
      
      // Detect anomalies
      const anomaly = Math.random() > 0.95 || Math.abs(value - previousValue) > 20;
      
      data.push({
        timestamp,
        value,
        trend,
        volatility,
        anomaly,
        confidence: 0.8 + Math.random() * 0.2,
        metadata: {
          type,
          previousValue
        }
      });
      
      previousValue = value;
    }
    
    return data;
  };

  const handleDatasetToggle = (datasetId: string, visible: boolean) => {
    setComparisonDatasets(prev => 
      prev.map(dataset => 
        dataset.id === datasetId ? { ...dataset, visible } : dataset
      )
    );
  };

  const handlePatternDetected = (pattern: PatternMatch) => {
    console.log('Pattern detected:', pattern);
    // Handle pattern detection (e.g., show notification, log to analytics)
  };

  const handleCorrelationFound = (correlation: CorrelationResult) => {
    console.log('Correlation found:', correlation);
    // Handle correlation discovery
  };

  const handleExportData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive data analysis with comparative tools, trend correlation, and pattern recognition
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateMockData}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Data
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportData({ 
              datasets: comparisonDatasets, 
              trends: trendSeries,
              sentiment: sentimentData,
              words: wordFrequencyData,
              network: keywordNetworkData
            }, 'advanced-analytics-export.json')}
          >
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="comparative">Comparative</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparative" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Multi-Dimensional Comparative Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Compare multiple datasets side-by-side with overlay views, radar charts, and correlation analysis.
              </p>
            </CardContent>
          </Card>
          
          <ComparativeAnalysisChart
            datasets={comparisonDatasets}
            metrics={comparisonMetrics}
            title="Multi-Dataset Comparison"
            height={500}
            onDatasetToggle={handleDatasetToggle}
            onMetricSelect={(metric) => console.log('Metric selected:', metric)}
            onExport={(data) => handleExportData(data, 'comparative-analysis.json')}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Trend Correlation & Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Analyze trends, detect correlations between metrics, and identify patterns with statistical significance.
              </p>
            </CardContent>
          </Card>
          
          <TrendCorrelationChart
            series={trendSeries}
            title="Advanced Trend Analysis"
            height={500}
            correlationThreshold={0.5}
            anomalyThreshold={2.0}
            onPatternDetected={handlePatternDetected}
            onCorrelationFound={handleCorrelationFound}
            onExport={(data) => handleExportData(data, 'trend-correlation.json')}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Advanced Sentiment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Interactive sentiment analysis with engagement correlation and multi-dimensional views.
              </p>
            </CardContent>
          </Card>
          
          <SentimentTimelineChart
            data={sentimentData}
            title="Sentiment Analysis with Engagement Correlation"
            height={500}
            showEngagementCorrelation={true}
            showVolumeOverlay={true}
            enableBrushing={true}
            onTimeRangeChange={(start, end) => console.log('Time range:', start, end)}
            onDataExport={(data) => handleExportData(data, 'sentiment-timeline.json')}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Advanced Word Frequency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Dynamic word clouds, frequency analysis, and semantic filtering with sentiment overlay.
              </p>
            </CardContent>
          </Card>
          
          <WordFrequencyChart
            data={wordFrequencyData}
            title="Interactive Word Frequency Visualization"
            height={500}
            showSentimentOverlay={true}
            enableFiltering={true}
            enableNetworkView={true}
            onWordSelect={(word) => console.log('Word selected:', word)}
            onExport={(data) => handleExportData(data, 'word-frequency.json')}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Keyword Semantic Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Visualize semantic relationships between keywords with interactive network graphs and clustering.
              </p>
            </CardContent>
          </Card>
          
          <KeywordNetworkChart
            data={keywordNetworkData}
            title="Interactive Keyword Network"
            height={600}
            width={1000}
            onNodeClick={(node) => console.log('Node clicked:', node)}
            onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
            onExport={(data) => handleExportData(data, 'keyword-network.json')}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{comparisonDatasets.length}</p>
              <p className="text-sm text-gray-600">Datasets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{trendSeries.length}</p>
              <p className="text-sm text-gray-600">Trend Series</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{sentimentData.length}</p>
              <p className="text-sm text-gray-600">Sentiment Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{wordFrequencyData.length}</p>
              <p className="text-sm text-gray-600">Keywords</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsPage;