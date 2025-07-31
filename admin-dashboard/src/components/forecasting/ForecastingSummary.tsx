/**
 * Forecasting Summary Component
 * 
 * Displays summary cards with key forecasting metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { TrendingUp, BarChart3, Target, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ForecastingSummaryProps {
  summary: {
    totalKeywords: number;
    forecastPeriod: number;
    confidenceThreshold: number;
    hasData: {
      keywordTrends: boolean;
      engagement: boolean;
      trendingTopics: boolean;
      marketInsights: boolean;
    };
    isLoading: boolean;
    hasErrors: boolean;
  };
}

export const ForecastingSummary: React.FC<ForecastingSummaryProps> = ({ summary }) => {
  const getStatusIcon = () => {
    if (summary.isLoading) return <Clock className="w-4 h-4 text-yellow-500" />;
    if (summary.hasErrors) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (summary.isLoading) return 'Loading...';
    if (summary.hasErrors) return 'Errors detected';
    return 'All systems operational';
  };

  const getStatusColor = () => {
    if (summary.isLoading) return 'bg-yellow-600';
    if (summary.hasErrors) return 'bg-red-600';
    return 'bg-green-600';
  };

  const dataModules = [
    { key: 'keywordTrends', label: 'Keyword Trends', icon: TrendingUp },
    { key: 'engagement', label: 'Engagement', icon: BarChart3 },
    { key: 'trendingTopics', label: 'Trending Topics', icon: Target },
    { key: 'marketInsights', label: 'Market Insights', icon: Target },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* System Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">System Status</CardTitle>
          {getStatusIcon()}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{getStatusText()}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={getStatusColor()}>
              {Object.values(summary.hasData).filter(Boolean).length}/4 modules active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Tracked */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Keywords Tracked</CardTitle>
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{summary.totalKeywords}</div>
          <p className="text-xs text-gray-400 mt-1">
            {summary.totalKeywords === 0 ? 'Add keywords to start forecasting' : 'Active forecasting targets'}
          </p>
        </CardContent>
      </Card>

      {/* Forecast Period */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Forecast Period</CardTitle>
          <BarChart3 className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{summary.forecastPeriod} days</div>
          <p className="text-xs text-gray-400 mt-1">
            Prediction horizon
          </p>
        </CardContent>
      </Card>

      {/* Confidence Threshold */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Confidence Level</CardTitle>
          <Target className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {Math.round(summary.confidenceThreshold * 100)}%
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Minimum prediction confidence
          </p>
        </CardContent>
      </Card>

      {/* Data Modules Status */}
      <Card className="bg-gray-800 border-gray-700 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-white">Data Modules Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dataModules.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center space-x-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{label}</span>
                <Badge
                  variant={summary.hasData[key as keyof typeof summary.hasData] ? 'default' : 'secondary'}
                  className={
                    summary.hasData[key as keyof typeof summary.hasData]
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }
                >
                  {summary.hasData[key as keyof typeof summary.hasData] ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};