import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Brain, Clock, Target } from 'lucide-react';
import { SentimentTimelineChart, SentimentTimelineData } from '../charts/SentimentTimelineChart';
import { sentimentTimelineService } from '../../services/sentimentTimelineService';

interface SentimentResult {
  score: number; // -1 to 1
  confidence: number;
  label: 'positive' | 'negative' | 'neutral';
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  processing_time: number;
}

// SentimentTimelineData is now imported from the chart component

interface SentimentAnalysisProps {
  className?: string;
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ className }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<SentimentTimelineData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        // For now, use mock data. In production, this would fetch from the API
        const mockData = sentimentTimelineService.generateMockData(7);
        setTimelineData(mockData);
      } catch (error) {
        console.error('Failed to load timeline data:', error);
        setError('Failed to load sentiment timeline data');
      }
    };

    loadTimelineData();
  }, []);

  const analyzeSentiment = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/nlp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: text,
          analysis_types: ['sentiment'],
          options: {}
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const data = await response.json();
      setResult(data.sentiment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const formatTimelineData = (data: SentimentTimelineData[]) => {
    return data.map(item => ({
      date: item.timestamp.toLocaleDateString(),
      positive: item.positive * 100,
      negative: item.negative * 100,
      neutral: item.neutral * 100,
      volume: item.volume
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="sentiment-text" className="block text-sm font-medium mb-2">
              Text to Analyze
            </label>
            <Textarea
              id="sentiment-text"
              placeholder="Enter text to analyze sentiment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={analyzeSentiment} 
            disabled={loading || !text.trim()}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Sentiment */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getSentimentIcon(result.label)}
                <div>
                  <p className="font-medium capitalize">{result.label} Sentiment</p>
                  <p className="text-sm text-gray-600">
                    Score: {formatScore(result.score)}% | Confidence: {formatScore(result.confidence)}%
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={getSentimentColor(result.label)}>
                {result.label.toUpperCase()}
              </Badge>
            </div>

            {/* Sentiment Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium">Sentiment Breakdown</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    Positive
                  </span>
                  <span className="text-sm font-medium">{formatScore(result.breakdown.positive)}%</span>
                </div>
                <Progress value={result.breakdown.positive * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    Negative
                  </span>
                  <span className="text-sm font-medium">{formatScore(result.breakdown.negative)}%</span>
                </div>
                <Progress value={result.breakdown.negative * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Minus className="h-3 w-3 text-gray-500" />
                    Neutral
                  </span>
                  <span className="text-sm font-medium">{formatScore(result.breakdown.neutral)}%</span>
                </div>
                <Progress value={result.breakdown.neutral * 100} className="h-2" />
              </div>
            </div>

            {/* Processing Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              Processing time: {(result.processing_time * 1000).toFixed(1)}ms
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Sentiment Timeline */}
      <SentimentTimelineChart
        data={timelineData}
        title="Advanced Sentiment Timeline Analysis"
        height={400}
        showEngagementCorrelation={true}
        showVolumeOverlay={true}
        enableBrushing={true}
        onTimeRangeChange={(start, end) => {
          console.log('Time range changed:', start, end);
        }}
        onDataExport={(data) => {
          console.log('Exporting data:', data);
          // Here you could implement actual export functionality
        }}
      />
    </div>
  );
};