/**
 * Business Intelligence Dashboard Component
 * 
 * Executive summary dashboard with key metrics, actionable insights,
 * and integrated analysis from forecasting, brand monitoring, and advertising effectiveness.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Zap
} from 'lucide-react';
import { useForecasting } from '../../hooks/useForecasting';
import { useBrandMonitoring } from '../../hooks/useBrandMonitoring';
import { ExecutiveSummaryCards } from './ExecutiveSummaryCards';
import { KeyMetricsOverview } from './KeyMetricsOverview';
import { ActionableInsights } from './ActionableInsights';
import { PerformanceTrends } from './PerformanceTrends';
import { CompetitiveIntelligence } from './CompetitiveIntelligence';
import { ROIAnalysis } from './ROIAnalysis';

export const BusinessIntelligenceDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  
  const {
    marketInsightsData,
    trendingTopicsData,
    isLoadingMarketInsights,
    isLoadingTrendingTopics,
    refreshAllData: refreshForecastingData
  } = useForecasting();

  const {
    reputationDashboardData,
    competitiveAnalysisData,
    isLoadingDashboard,
    isLoadingCompetitive,
    refreshAllData: refreshBrandData
  } = useBrandMonitoring();

  // Refresh all data
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshForecastingData(),
        refreshBrandData()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate overall business health score
  const calculateBusinessHealthScore = () => {
    let totalScore = 0;
    let components = 0;

    // Market insights contribution
    if (marketInsightsData) {
      const trendingCount = marketInsightsData.summary?.trending_topics_count || 0;
      const highConfidence = marketInsightsData.summary?.high_confidence_predictions || 0;
      const marketScore = Math.min(100, (trendingCount * 5) + (highConfidence * 10));
      totalScore += marketScore;
      components++;
    }

    // Brand reputation contribution
    if (reputationDashboardData?.overview?.reputation_score) {
      const reputationScore = reputationDashboardData.overview.reputation_score.score || 0;
      totalScore += reputationScore;
      components++;
    }

    // Trending topics contribution
    if (trendingTopicsData) {
      const predictions = trendingTopicsData.trending_predictions || [];
      const avgConfidence = predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100
        : 0;
      totalScore += avgConfidence;
      components++;
    }

    return components > 0 ? Math.round(totalScore / components) : 0;
  };

  const businessHealthScore = calculateBusinessHealthScore();

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  // Generate executive insights
  const generateExecutiveInsights = () => {
    const insights = [];

    // Market opportunity insights
    if (marketInsightsData?.summary?.high_confidence_predictions > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        title: 'High-Confidence Market Opportunities',
        description: `${marketInsightsData.summary.high_confidence_predictions} trending opportunities identified with high confidence`,
        action: 'Review trending topics and allocate resources to capitalize on opportunities',
        impact: 'High Revenue Potential'
      });
    }

    // Brand reputation insights
    if (reputationDashboardData?.overview?.reputation_score) {
      const score = reputationDashboardData.overview.reputation_score.score;
      if (score < 60) {
        insights.push({
          type: 'warning',
          priority: 'high',
          title: 'Brand Reputation Needs Attention',
          description: `Brand reputation score is ${score}/100, below optimal levels`,
          action: 'Implement reputation management strategies and address negative sentiment',
          impact: 'Brand Protection'
        });
      } else if (score >= 80) {
        insights.push({
          type: 'positive',
          priority: 'medium',
          title: 'Strong Brand Reputation',
          description: `Excellent brand reputation score of ${score}/100`,
          action: 'Maintain current strategies and leverage positive sentiment for growth',
          impact: 'Competitive Advantage'
        });
      }
    }

    // Engagement trend insights
    if (marketInsightsData?.summary?.overall_engagement_trend === 'increasing') {
      insights.push({
        type: 'positive',
        priority: 'medium',
        title: 'Positive Engagement Trend',
        description: 'Overall market engagement is trending upward',
        action: 'Increase content production and marketing efforts to capitalize on trend',
        impact: 'Growth Acceleration'
      });
    }

    return insights.slice(0, 5); // Top 5 insights
  };

  const executiveInsights = generateExecutiveInsights();

  const isLoading = isLoadingMarketInsights || isLoadingTrendingTopics || 
                   isLoadingDashboard || isLoadingCompetitive || refreshing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Intelligence</h1>
          <p className="text-gray-400 mt-1">
            Executive dashboard with actionable insights and strategic recommendations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Timeframe:</span>
            <div className="flex space-x-1">
              {(['week', 'month', 'quarter'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedTimeframe === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(period)}
                  className={selectedTimeframe === period ? 'bg-blue-600' : ''}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Business Health Score */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Business Health Score
          </CardTitle>
          <CardDescription>
            Overall business performance and market position assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getHealthScoreColor(businessHealthScore)}`}>
                  {businessHealthScore}
                </div>
                <div className="text-sm text-gray-400">/ 100</div>
              </div>
              <div>
                <Badge className={
                  businessHealthScore >= 80 ? 'bg-green-600' :
                  businessHealthScore >= 60 ? 'bg-blue-600' :
                  businessHealthScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                }>
                  {getHealthScoreLabel(businessHealthScore)}
                </Badge>
                <p className="text-sm text-gray-400 mt-1">
                  Based on market trends, brand reputation, and opportunities
                </p>
              </div>
            </div>
            <div className="w-32">
              <Progress value={businessHealthScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary Cards */}
      <ExecutiveSummaryCards
        marketInsights={marketInsightsData}
        reputationData={reputationDashboardData}
        trendingTopics={trendingTopicsData}
        timeframe={selectedTimeframe}
      />

      {/* Executive Insights */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Executive Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-generated strategic insights and actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {executiveInsights.length > 0 ? (
            <div className="space-y-4">
              {executiveInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'opportunity' ? 'border-green-500 bg-green-500/10' :
                    insight.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-blue-500 bg-blue-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {insight.type === 'opportunity' ? (
                        <Target className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : insight.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{insight.title}</h4>
                        <p className="text-gray-300 text-sm mt-1">{insight.description}</p>
                        <p className="text-gray-400 text-sm mt-2">
                          <strong>Action:</strong> {insight.action}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={
                        insight.priority === 'high' ? 'border-red-500 text-red-400' :
                        insight.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                        'border-gray-500 text-gray-400'
                      }>
                        {insight.priority.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{insight.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No specific insights available</p>
              <p className="text-sm">Insights will appear as data is collected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="competitive" className="data-[state=active]:bg-blue-600">
            <Target className="w-4 h-4 mr-2" />
            Competitive
          </TabsTrigger>
          <TabsTrigger value="roi" className="data-[state=active]:bg-blue-600">
            <DollarSign className="w-4 h-4 mr-2" />
            ROI Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Key Metrics Overview */}
        <TabsContent value="overview" className="space-y-4">
          <KeyMetricsOverview
            marketInsights={marketInsightsData}
            reputationData={reputationDashboardData}
            trendingTopics={trendingTopicsData}
            timeframe={selectedTimeframe}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Performance Trends */}
        <TabsContent value="trends" className="space-y-4">
          <PerformanceTrends
            marketInsights={marketInsightsData}
            reputationData={reputationDashboardData}
            timeframe={selectedTimeframe}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Competitive Intelligence */}
        <TabsContent value="competitive" className="space-y-4">
          <CompetitiveIntelligence
            competitiveData={competitiveAnalysisData}
            reputationData={reputationDashboardData}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ROI Analysis */}
        <TabsContent value="roi" className="space-y-4">
          <ROIAnalysis
            marketInsights={marketInsightsData}
            trendingTopics={trendingTopicsData}
            timeframe={selectedTimeframe}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Actionable Insights */}
        <TabsContent value="insights" className="space-y-4">
          <ActionableInsights
            insights={executiveInsights}
            marketInsights={marketInsightsData}
            reputationData={reputationDashboardData}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription>
            Common business intelligence tasks and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Download className="w-5 h-5 mb-2" />
              <span className="font-medium">Export Executive Report</span>
              <span className="text-sm text-gray-400">Generate comprehensive business report</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Calendar className="w-5 h-5 mb-2" />
              <span className="font-medium">Schedule Analysis</span>
              <span className="text-sm text-gray-400">Set up automated reporting</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Zap className="w-5 h-5 mb-2" />
              <span className="font-medium">Alert Configuration</span>
              <span className="text-sm text-gray-400">Configure business alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};