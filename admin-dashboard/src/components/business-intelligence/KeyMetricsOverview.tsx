/**
 * Key Metrics Overview Component
 * 
 * Detailed metrics overview with charts and trends
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

interface KeyMetricsOverviewProps {
  marketInsights: any;
  reputationData: any;
  trendingTopics: any;
  timeframe: 'week' | 'month' | 'quarter';
  isLoading: boolean;
}

export const KeyMetricsOverview: React.FC<KeyMetricsOverviewProps> = ({
  marketInsights,
  reputationData,
  trendingTopics,
  timeframe,
  isLoading
}) => {
  // Generate sample trend data based on timeframe
  const generateTrendData = () => {
    const periods = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const data = [];
    
    for (let i = 0; i < Math.min(periods, 12); i++) {
      const date = new Date();
      date.setDate(date.getDate() - (periods - i));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opportunities: Math.floor(Math.random() * 20) + 5,
        reputation: Math.floor(Math.random() * 30) + 60,
        engagement: Math.floor(Math.random() * 50) + 25,
        mentions: Math.floor(Math.random() * 100) + 50
      });
    }
    
    return data;
  };

  const trendData = generateTrendData();

  // Opportunity distribution data
  const opportunityData = [
    { name: 'High Confidence', value: marketInsights?.summary?.high_confidence_predictions || 0, color: '#10B981' },
    { name: 'Medium Confidence', value: Math.max(0, (marketInsights?.summary?.trending_topics_count || 0) - (marketInsights?.summary?.high_confidence_predictions || 0)), color: '#F59E0B' },
    { name: 'Low Confidence', value: Math.floor(Math.random() * 5), color: '#EF4444' }
  ];

  // Performance metrics
  const performanceMetrics = [
    {
      title: 'Market Opportunities',
      value: marketInsights?.summary?.trending_topics_count || 0,
      change: '+12%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-500'
    },
    {
      title: 'Brand Mentions',
      value: reputationData?.overview?.total_mentions || 0,
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'text-green-500'
    },
    {
      title: 'Engagement Rate',
      value: '24.5%',
      change: '+3%',
      trend: 'up',
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '-1%',
      trend: 'down',
      icon: Zap,
      color: 'text-yellow-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <span className={`text-sm ${
                    metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">vs last {timeframe}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Analysis Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Trends</CardTitle>
            <CardDescription>
              Key metrics over the last {timeframe}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
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
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="opportunities"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Opportunities"
                />
                <Line
                  type="monotone"
                  dataKey="reputation"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name="Reputation Score"
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  name="Engagement"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Opportunity Distribution */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Opportunity Distribution</CardTitle>
            <CardDescription>
              Breakdown by confidence level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={opportunityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {opportunityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F3F4F6'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {opportunityData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-300">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Position Analysis */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Market Position Analysis</CardTitle>
            <CardDescription>
              Competitive positioning metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Market Share</span>
                  <span className="text-white">23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Brand Awareness</span>
                  <span className="text-white">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Customer Satisfaction</span>
                  <span className="text-white">84%</span>
                </div>
                <Progress value={84} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Innovation Index</span>
                  <span className="text-white">76%</span>
                </div>
                <Progress value={76} className="h-2" />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Overall Position</span>
                <Badge className="bg-green-600">Strong</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Above average performance across key metrics
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Engagement Breakdown</CardTitle>
            <CardDescription>
              Engagement sources and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Posts', value: reputationData?.detailed_metrics?.mentions?.mention_breakdown?.post_mentions || 0 },
                { name: 'Comments', value: reputationData?.detailed_metrics?.mentions?.mention_breakdown?.comment_mentions || 0 },
                { name: 'Shares', value: Math.floor(Math.random() * 50) + 10 },
                { name: 'Reactions', value: Math.floor(Math.random() * 100) + 20 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
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
                />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Key Insights Summary</CardTitle>
          <CardDescription>
            Automated insights from current data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-400 font-medium">Positive Trend</span>
              </div>
              <p className="text-sm text-gray-300">
                Market opportunities increased by 12% this {timeframe}, indicating strong growth potential.
              </p>
            </div>
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-blue-400 font-medium">Market Position</span>
              </div>
              <p className="text-sm text-gray-300">
                Brand reputation remains strong with consistent positive sentiment across channels.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart3 className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-yellow-400 font-medium">Optimization</span>
              </div>
              <p className="text-sm text-gray-300">
                Conversion rates show room for improvement. Consider A/B testing new strategies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};