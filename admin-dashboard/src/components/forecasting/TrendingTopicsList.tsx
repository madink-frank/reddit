/**
 * Trending Topics List Component
 * 
 * Displays predicted trending topics with confidence scores
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Progress } from '../ui/progress';
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar,
  Activity,
  Zap,
  Filter
} from 'lucide-react';
import { TrendingTopicsPrediction } from '../../services/forecastingService';

interface TrendingTopicsListProps {
  data: TrendingTopicsPrediction | null;
  isLoading: boolean;
  confidenceThreshold: number;
  onAddKeyword: (keyword: string) => void;
}

export const TrendingTopicsList: React.FC<TrendingTopicsListProps> = ({
  data,
  isLoading,
  confidenceThreshold,
  onAddKeyword
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'confidence' | 'momentum' | 'growth'>('confidence');

  const filteredAndSortedTopics = React.useMemo(() => {
    if (!data?.trending_predictions) return [];

    let filtered = data.trending_predictions.filter(topic =>
      topic.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'momentum':
          return b.current_momentum - a.current_momentum;
        case 'growth':
          return b.growth_rate - a.growth_rate;
        default:
          return b.confidence - a.confidence;
      }
    });
  }, [data, searchTerm, sortBy]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-600';
    if (confidence >= 0.6) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getMomentumIcon = (momentum: number) => {
    if (momentum > 10) return <Zap className="w-4 h-4 text-yellow-500" />;
    if (momentum > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <Activity className="w-4 h-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Trending Topics Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Analyzing trending patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.trending_predictions || data.trending_predictions.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Trending Topics Prediction</CardTitle>
          <CardDescription>
            No trending topics found with current confidence threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trending predictions available</p>
              <p className="text-sm">Try lowering the confidence threshold</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Predictions</p>
                <p className="text-2xl font-bold text-white">
                  {data.trending_predictions.length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">High Confidence</p>
                <p className="text-2xl font-bold text-white">
                  {data.trending_predictions.filter(t => t.confidence >= 0.8).length}
                </p>
              </div>
              <Badge className="bg-green-600">
                {Math.round((data.trending_predictions.filter(t => t.confidence >= 0.8).length / data.trending_predictions.length) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Analyzed Keywords</p>
                <p className="text-2xl font-bold text-white">
                  {data.total_analyzed}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Forecast Period</p>
                <p className="text-2xl font-bold text-white">
                  {data.forecast_period} days
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search trending topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Sort by:</span>
              <div className="flex space-x-1">
                {[
                  { key: 'confidence', label: 'Confidence' },
                  { key: 'momentum', label: 'Momentum' },
                  { key: 'growth', label: 'Growth' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={sortBy === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy(key as any)}
                    className={sortBy === key ? 'bg-blue-600' : ''}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Trending Predictions</CardTitle>
          <CardDescription>
            Keywords predicted to trend with {Math.round(confidenceThreshold * 100)}%+ confidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAndSortedTopics.map((topic, index) => (
              <div
                key={topic.keyword}
                className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg font-medium text-white">
                        #{index + 1} {topic.keyword}
                      </span>
                      {getMomentumIcon(topic.current_momentum)}
                      <Badge className={getConfidenceColor(topic.confidence)}>
                        {getConfidenceLabel(topic.confidence)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Confidence:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress 
                            value={topic.confidence * 100} 
                            className="flex-1 h-2"
                          />
                          <span className="text-white font-medium">
                            {Math.round(topic.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Momentum:</span>
                        <p className="text-white font-medium">
                          {Math.round(topic.current_momentum * 100) / 100}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Growth Rate:</span>
                        <p className={`font-medium ${
                          topic.growth_rate > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {topic.growth_rate > 0 ? '+' : ''}{Math.round(topic.growth_rate * 100)}%
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Peak Date:</span>
                        <p className="text-white font-medium">
                          {topic.predicted_peak_date 
                            ? new Date(topic.predicted_peak_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'TBD'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Factors */}
                    <div className="mt-3 p-2 bg-gray-600 rounded text-xs">
                      <span className="text-gray-300">Factors: </span>
                      <span className="text-white">
                        Recent Activity: {Math.round(topic.factors.recent_activity)}, 
                        Historical: {Math.round(topic.factors.historical_activity)}, 
                        Consistency: {Math.round(topic.factors.consistency * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onAddKeyword(topic.keyword)}
                    size="sm"
                    className="ml-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Track
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredAndSortedTopics.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No topics found matching "{searchTerm}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};