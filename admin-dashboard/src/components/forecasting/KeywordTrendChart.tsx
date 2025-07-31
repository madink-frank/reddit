/**
 * Keyword Trend Chart Component
 * 
 * Displays keyword trend forecasts with confidence intervals
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Download, Info } from 'lucide-react';
import { KeywordTrendForecast } from '../../services/forecastingService';

interface KeywordTrendChartProps {
  data: KeywordTrendForecast | any;
  isLoading: boolean;
  selectedKeywords: string[];
  forecastPeriod: number;
}

export const KeywordTrendChart: React.FC<KeywordTrendChartProps> = ({
  data,
  isLoading,
  selectedKeywords,
  forecastPeriod
}) => {
  const chartData = useMemo(() => {
    if (!data) return [];

    // Handle single keyword forecast
    if (data.predictions) {
      return data.predictions.map((pred: any, index: number) => ({
        day: pred.day,
        predicted_posts: pred.predicted_posts,
        predicted_score: pred.predicted_score,
        trend_strength: pred.trend_strength,
        confidence_80_lower: data.confidence_intervals?.['80%']?.[index]?.lower_bound || 0,
        confidence_80_upper: data.confidence_intervals?.['80%']?.[index]?.upper_bound || 0,
        confidence_95_lower: data.confidence_intervals?.['95%']?.[index]?.lower_bound || 0,
        confidence_95_upper: data.confidence_intervals?.['95%']?.[index]?.upper_bound || 0,
      }));
    }

    // Handle comparison data
    if (data.forecasts && Array.isArray(data.forecasts)) {
      const maxLength = Math.max(...data.forecasts.map((f: any) => f.predictions?.length || 0));
      
      return Array.from({ length: maxLength }, (_, index) => {
        const dayData: any = { day: index + 1 };
        
        data.forecasts.forEach((forecast: any, fIndex: number) => {
          const pred = forecast.predictions?.[index];
          if (pred) {
            dayData[`keyword_${fIndex}_posts`] = pred.predicted_posts;
            dayData[`keyword_${fIndex}_score`] = pred.predicted_score;
          }
        });
        
        return dayData;
      });
    }

    return [];
  }, [data]);

  const getTrendDirection = (slope: number) => {
    if (slope > 0.1) return { icon: TrendingUp, color: 'text-green-500', label: 'Increasing' };
    if (slope < -0.1) return { icon: TrendingDown, color: 'text-red-500', label: 'Decreasing' };
    return { icon: Minus, color: 'text-gray-500', label: 'Stable' };
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes('posts')) return [Math.round(value), 'Posts'];
    if (name.includes('score')) return [Math.round(value), 'Score'];
    return [Math.round(value * 100) / 100, name];
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Keyword Trend Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading trend data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedKeywords.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Keyword Trend Forecast</CardTitle>
          <CardDescription>
            Add keywords to see trend predictions and forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No keywords selected</p>
              <p className="text-sm">Add keywords above to start forecasting</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Keyword Trend Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No forecast data available</p>
              <p className="text-sm">Insufficient historical data for selected keywords</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single keyword view
  if (data.predictions) {
    const trendInfo = getTrendDirection(data.historical_summary?.post_trend_slope || 0);
    const TrendIcon = trendInfo.icon;

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Daily Posts</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(data.historical_summary?.average_daily_posts || 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Trend Direction</p>
                  <div className="flex items-center space-x-2">
                    <TrendIcon className={`w-5 h-5 ${trendInfo.color}`} />
                    <span className="text-white font-medium">{trendInfo.label}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Volatility</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round((data.historical_summary?.post_volatility || 0) * 100) / 100}
                  </p>
                </div>
                <Badge variant={
                  (data.historical_summary?.post_volatility || 0) > (data.historical_summary?.average_daily_posts || 0) 
                    ? 'destructive' : 'default'
                }>
                  {(data.historical_summary?.post_volatility || 0) > (data.historical_summary?.average_daily_posts || 0) 
                    ? 'High' : 'Low'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Data Points</p>
                  <p className="text-2xl font-bold text-white">
                    {data.historical_summary?.data_points || 0}
                  </p>
                </div>
                <Badge variant={
                  (data.historical_summary?.data_points || 0) >= 30 ? 'default' : 'secondary'
                }>
                  {(data.historical_summary?.data_points || 0) >= 30 ? 'Good' : 'Limited'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  Trend Forecast: {data.keyword}
                </CardTitle>
                <CardDescription>
                  {forecastPeriod}-day prediction with confidence intervals
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F3F4F6'
                  }}
                  formatter={formatTooltipValue}
                />
                <Legend />
                
                {/* Confidence intervals */}
                <Area
                  dataKey="confidence_95_upper"
                  stackId="confidence"
                  stroke="none"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  name="95% Confidence"
                />
                <Area
                  dataKey="confidence_80_upper"
                  stackId="confidence"
                  stroke="none"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  name="80% Confidence"
                />
                
                {/* Main prediction line */}
                <Line
                  type="monotone"
                  dataKey="predicted_posts"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Predicted Posts"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiple keywords comparison view
  if (data.forecasts) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Keyword Comparison</CardTitle>
              <CardDescription>
                Comparing {data.keywords?.length || 0} keywords over {forecastPeriod} days
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Comparison Summary */}
          {data.comparison && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="text-white font-medium mb-2">Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Strongest Trend:</span>
                  <span className="text-green-400 ml-2 font-medium">
                    {data.comparison.strongest_trend}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Highest Confidence:</span>
                  <span className="text-blue-400 ml-2 font-medium">
                    {data.comparison.highest_confidence}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Most Volatile:</span>
                  <span className="text-red-400 ml-2 font-medium">
                    {data.comparison.most_volatile}
                  </span>
                </div>
              </div>
              
              {data.comparison.recommendations && (
                <div className="mt-3">
                  <span className="text-gray-400 text-sm">Recommendations:</span>
                  <ul className="mt-1 space-y-1">
                    {data.comparison.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-300">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F3F4F6'
                }}
                formatter={formatTooltipValue}
              />
              <Legend />
              
              {/* Lines for each keyword */}
              {data.keywords?.map((keyword: string, index: number) => (
                <Line
                  key={keyword}
                  type="monotone"
                  dataKey={`keyword_${index}_posts`}
                  stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2, r: 3 }}
                  name={keyword}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return null;
};