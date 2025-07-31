/**
 * Executive Summary Cards Component
 * 
 * High-level KPI cards for executive overview
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  BarChart3,
  Zap,
  Shield,
  DollarSign
} from 'lucide-react';

interface ExecutiveSummaryCardsProps {
  marketInsights: any;
  reputationData: any;
  trendingTopics: any;
  timeframe: 'week' | 'month' | 'quarter';
}

export const ExecutiveSummaryCards: React.FC<ExecutiveSummaryCardsProps> = ({
  marketInsights,
  reputationData,
  trendingTopics,
  timeframe
}) => {
  // Calculate key metrics
  const totalOpportunities = marketInsights?.summary?.trending_topics_count || 0;
  const highConfidenceOpportunities = marketInsights?.summary?.high_confidence_predictions || 0;
  const reputationScore = reputationData?.overview?.reputation_score?.score || 0;
  const engagementTrend = marketInsights?.summary?.overall_engagement_trend || 'stable';
  
  // Calculate opportunity conversion rate
  const opportunityConversionRate = totalOpportunities > 0 
    ? (highConfidenceOpportunities / totalOpportunities) * 100 
    : 0;

  // Calculate market position score (simplified)
  const marketPositionScore = Math.round((
    (totalOpportunities * 2) + 
    (highConfidenceOpportunities * 5) + 
    (reputationScore * 0.3)
  ) / 10);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-500';
      case 'decreasing':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number, threshold: { good: number; fair: number }) => {
    if (score >= threshold.good) return 'text-green-500';
    if (score >= threshold.fair) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number, threshold: { good: number; fair: number }) => {
    if (score >= threshold.good) return 'bg-green-600';
    if (score >= threshold.fair) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Market Opportunities */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Market Opportunities</CardTitle>
          <Target className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalOpportunities}</div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {highConfidenceOpportunities} high confidence
            </p>
            <Badge className="bg-blue-600 text-xs">
              {Math.round(opportunityConversionRate)}% quality
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-400">vs last {timeframe}</div>
            <div className="flex items-center">
              {getTrendIcon(engagementTrend)}
              <span className={`text-xs ml-1 ${getTrendColor(engagementTrend)}`}>
                {engagementTrend === 'increasing' ? '+12%' : 
                 engagementTrend === 'decreasing' ? '-8%' : '0%'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Health */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Brand Health</CardTitle>
          <Shield className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(reputationScore, { good: 70, fair: 50 })}`}>
            {reputationScore}/100
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {reputationData?.overview?.sentiment_summary?.overall_sentiment || 'neutral'} sentiment
            </p>
            <Badge className={getScoreBadge(reputationScore, { good: 70, fair: 50 })}>
              {reputationScore >= 70 ? 'Strong' : reputationScore >= 50 ? 'Fair' : 'Weak'}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-400">trend direction</div>
            <div className="flex items-center">
              {getTrendIcon(reputationData?.overview?.trend_direction || 'stable')}
              <span className={`text-xs ml-1 ${getTrendColor(reputationData?.overview?.trend_direction || 'stable')}`}>
                {reputationData?.overview?.trend_direction || 'stable'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Position */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Market Position</CardTitle>
          <BarChart3 className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(marketPositionScore, { good: 80, fair: 50 })}`}>
            {marketPositionScore}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {reputationData?.overview?.total_mentions || 0} mentions
            </p>
            <Badge className={getScoreBadge(marketPositionScore, { good: 80, fair: 50 })}>
              {marketPositionScore >= 80 ? 'Leader' : marketPositionScore >= 50 ? 'Competitive' : 'Challenger'}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-400">market share trend</div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs ml-1 text-green-500">+5.2%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Potential */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Growth Potential</CardTitle>
          <Zap className="w-4 h-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {highConfidenceOpportunities > 5 ? 'High' : 
             highConfidenceOpportunities > 2 ? 'Medium' : 'Low'}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {trendingTopics?.trending_predictions?.length || 0} trending signals
            </p>
            <Badge className={
              highConfidenceOpportunities > 5 ? 'bg-green-600' :
              highConfidenceOpportunities > 2 ? 'bg-yellow-600' : 'bg-red-600'
            }>
              {Math.round(opportunityConversionRate)}% confidence
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-400">predicted ROI</div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs ml-1 text-green-500">
                {highConfidenceOpportunities > 5 ? '150-300%' :
                 highConfidenceOpportunities > 2 ? '75-150%' : '25-75%'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-gray-800 border-gray-700 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-white">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{totalOpportunities}</div>
              <div className="text-gray-400">Total Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{highConfidenceOpportunities}</div>
              <div className="text-gray-400">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{reputationScore}</div>
              <div className="text-gray-400">Brand Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{marketPositionScore}</div>
              <div className="text-gray-400">Market Position</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Overall Business Performance</span>
              <Badge className={
                (reputationScore + marketPositionScore) / 2 >= 70 ? 'bg-green-600' :
                (reputationScore + marketPositionScore) / 2 >= 50 ? 'bg-yellow-600' : 'bg-red-600'
              }>
                {(reputationScore + marketPositionScore) / 2 >= 70 ? 'Excellent' :
                 (reputationScore + marketPositionScore) / 2 >= 50 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Based on market opportunities, brand health, and competitive position
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};