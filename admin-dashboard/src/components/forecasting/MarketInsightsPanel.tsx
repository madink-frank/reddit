/**
 * Market Insights Panel Component
 * 
 * Displays market insights, trend summaries, and recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react';
import { MarketInsights } from '../../services/forecastingService';

interface MarketInsightsPanelProps {
  data: MarketInsights | null;
  isLoading: boolean;
  timeframe: 'day' | 'week' | 'month';
}

export const MarketInsightsPanel: React.FC<MarketInsightsPanelProps> = ({
  data,
  isLoading,
  timeframe
}) => {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-purple-500" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'border-green-500 bg-green-500/10';
      case 'positive':
        return 'border-blue-500 bg-blue-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-purple-500 bg-purple-500/10';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing' ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'increasing' ? 'text-green-500' : 'text-red-500';
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Generating market insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Market Insights</CardTitle>
          <CardDescription>
            Market analysis and strategic recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No market insights available</p>
              <p className="text-sm">Insufficient data for analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = getTrendIcon(data.summary.overall_engagement_trend);
  const trendColor = getTrendColor(data.summary.overall_engagement_trend);

  return (
    <div className="space-y-4">
      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Trending Topics</p>
                <p className="text-2xl font-bold text-white">
                  {data.summary.trending_topics_count}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge className="bg-blue-600">
                {data.summary.high_confidence_predictions} high confidence
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Engagement Trend</p>
                <div className="flex items-center space-x-2">
                  <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                  <span className="text-white font-medium capitalize">
                    {data.summary.overall_engagement_trend}
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Analysis Period</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {timeframe}ly
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Trending Topics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Top Trending Opportunities</CardTitle>
              <CardDescription>
                Highest potential topics for the {timeframe}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.top_trending && data.top_trending.length > 0 ? (
            <div className="space-y-3">
              {data.top_trending.map((topic, index) => (
                <div
                  key={topic.keyword}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="text-white font-medium">{topic.keyword}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Confidence: {Math.round(topic.confidence * 100)}%</span>
                        <span>Growth: {Math.round(topic.growth_rate * 100)}%</span>
                        <span>Momentum: {Math.round(topic.current_momentum * 100) / 100}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={topic.confidence * 100} 
                      className="w-20 h-2"
                    />
                    <Badge className={
                      topic.confidence >= 0.8 ? 'bg-green-600' :
                      topic.confidence >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                    }>
                      {topic.confidence >= 0.8 ? 'High' :
                       topic.confidence >= 0.6 ? 'Med' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No trending opportunities identified</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Forecast Summary */}
      {data.engagement_forecast && data.engagement_forecast.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Engagement Forecast Summary</CardTitle>
            <CardDescription>
              Expected engagement patterns for the coming days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {data.engagement_forecast.slice(0, 7).map((forecast, index) => (
                <div key={index} className="text-center p-2 bg-gray-700 rounded">
                  <p className="text-xs text-gray-400 mb-1">
                    {new Date(forecast.date).toLocaleDateString('en-US', { 
                      weekday: 'short' 
                    })}
                  </p>
                  <p className="text-sm font-medium text-white">
                    {Math.round(forecast.predicted_engagement_rate * 100) / 100}
                  </p>
                  <div className="mt-1">
                    <Progress 
                      value={(forecast.predicted_engagement_rate / 10) * 100} 
                      className="h-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>
            AI-generated insights and action items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recommendations && data.recommendations.length > 0 ? (
            <div className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getRecommendationColor(rec.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getRecommendationIcon(rec.type)}
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{rec.message}</p>
                      <p className="text-sm text-gray-300">{rec.action}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {rec.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No specific recommendations at this time</p>
              <p className="text-sm">Continue monitoring for new opportunities</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Health Score */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Market Health Score</CardTitle>
          <CardDescription>
            Overall market condition assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overall Health</span>
              <div className="flex items-center space-x-2">
                <Progress value={75} className="w-32 h-3" />
                <Badge className="bg-green-600">Good</Badge>
              </div>
            </div>

            {/* Individual Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Trending Activity</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={(data.summary.trending_topics_count / 20) * 100} 
                    className="w-20 h-2" 
                  />
                  <span className="text-white">
                    {Math.round((data.summary.trending_topics_count / 20) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prediction Confidence</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={(data.summary.high_confidence_predictions / Math.max(data.summary.trending_topics_count, 1)) * 100} 
                    className="w-20 h-2" 
                  />
                  <span className="text-white">
                    {Math.round((data.summary.high_confidence_predictions / Math.max(data.summary.trending_topics_count, 1)) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Engagement Trend</span>
                <div className="flex items-center space-x-2">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <span className="text-white capitalize">
                    {data.summary.overall_engagement_trend}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Opportunities</span>
                <Badge className={
                  data.recommendations.length > 2 ? 'bg-green-600' :
                  data.recommendations.length > 0 ? 'bg-yellow-600' : 'bg-gray-600'
                }>
                  {data.recommendations.length} available
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};