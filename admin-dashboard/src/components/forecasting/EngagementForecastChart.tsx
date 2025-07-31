/**
 * Engagement Forecast Chart Component
 * 
 * Displays engagement pattern forecasts and weekly trends
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import { EngagementForecast } from '../../services/forecastingService';

interface EngagementForecastChartProps {
  data: EngagementForecast | null;
  isLoading: boolean;
  forecastPeriod: number;
}

export const EngagementForecastChart: React.FC<EngagementForecastChartProps> = ({
  data,
  isLoading,
  forecastPeriod
}) => {
  const chartData = useMemo(() => {
    if (!data?.forecasts) return [];
    
    return data.forecasts.map(forecast => ({
      day: forecast.day,
      date: new Date(forecast.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      engagement_rate: forecast.predicted_engagement_rate,
      seasonal_factor: forecast.seasonal_factor,
      day_of_week: forecast.day_of_week,
      day_name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][forecast.day_of_week]
    }));
  }, [data]);

  const weeklyPatternData = useMemo(() => {
    if (!data?.engagement_patterns?.weekly_patterns) return [];
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return Object.entries(data.engagement_patterns.weekly_patterns).map(([dayIndex, value]) => ({
      day: dayNames[parseInt(dayIndex)],
      engagement: value,
      dayIndex: parseInt(dayIndex)
    }));
  }, [data]);

  const getTrendIcon = (direction: string) => {
    return direction === 'increasing' ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (direction: string) => {
    return direction === 'increasing' ? 'text-green-500' : 'text-red-500';
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Engagement Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading engagement data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Engagement Forecast</CardTitle>
          <CardDescription>
            Engagement pattern analysis and predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No engagement data available</p>
              <p className="text-sm">Insufficient historical data for analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = getTrendIcon(data.engagement_patterns?.trend_direction || 'stable');
  const trendColor = getTrendColor(data.engagement_patterns?.trend_direction || 'stable');

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Engagement</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round((data.engagement_patterns?.overall_avg_engagement || 0) * 100) / 100}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Trend Direction</p>
                <div className="flex items-center space-x-2">
                  <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                  <span className="text-white font-medium capitalize">
                    {data.engagement_patterns?.trend_direction || 'Stable'}
                  </span>
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
                  {Math.round((data.engagement_patterns?.engagement_volatility || 0) * 100) / 100}
                </p>
              </div>
              <Badge variant={
                (data.engagement_patterns?.engagement_volatility || 0) > 
                (data.engagement_patterns?.overall_avg_engagement || 0) 
                  ? 'destructive' : 'default'
              }>
                {(data.engagement_patterns?.engagement_volatility || 0) > 
                 (data.engagement_patterns?.overall_avg_engagement || 0) 
                  ? 'High' : 'Low'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Forecast Period</p>
                <p className="text-2xl font-bold text-white">{forecastPeriod} days</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Forecast Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Engagement Forecast</CardTitle>
              <CardDescription>
                Predicted engagement rates over the next {forecastPeriod} days
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                interval="preserveStartEnd"
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
                formatter={(value: number, name: string) => [
                  Math.round(value * 100) / 100,
                  name === 'engagement_rate' ? 'Engagement Rate' : name
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              
              <Line
                type="monotone"
                dataKey="engagement_rate"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                name="Predicted Engagement"
              />
              
              <Line
                type="monotone"
                dataKey="seasonal_factor"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                name="Seasonal Factor"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Pattern Analysis */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Weekly Engagement Patterns</CardTitle>
          <CardDescription>
            Average engagement by day of the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyPatternData}>
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
                formatter={(value: number) => [
                  Math.round(value * 100) / 100,
                  'Avg Engagement'
                ]}
              />
              
              <Bar 
                dataKey="engagement" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Weekly Insights */}
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Weekly Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Best Day:</span>
                <span className="text-green-400 ml-2 font-medium">
                  {weeklyPatternData.reduce((best, current) => 
                    current.engagement > best.engagement ? current : best, 
                    weeklyPatternData[0] || { day: 'N/A' }
                  ).day}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Lowest Day:</span>
                <span className="text-red-400 ml-2 font-medium">
                  {weeklyPatternData.reduce((worst, current) => 
                    current.engagement < worst.engagement ? current : worst, 
                    weeklyPatternData[0] || { day: 'N/A' }
                  ).day}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};