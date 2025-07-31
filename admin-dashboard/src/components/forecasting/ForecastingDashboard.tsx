/**
 * Forecasting Dashboard Component
 * 
 * Main dashboard for demand forecasting and predictive analytics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Slider } from '../ui/slider';
import { RefreshCw, TrendingUp, BarChart3, Target, Lightbulb } from 'lucide-react';
import { useForecasting } from '../../hooks/useForecasting';
import { KeywordTrendChart } from './KeywordTrendChart';
import { EngagementForecastChart } from './EngagementForecastChart';
import { TrendingTopicsList } from './TrendingTopicsList';
import { MarketInsightsPanel } from './MarketInsightsPanel';
import { ForecastingSummary } from './ForecastingSummary';

export const ForecastingDashboard: React.FC = () => {
  const {
    state,
    keywordTrendData,
    engagementData,
    trendingTopicsData,
    marketInsightsData,
    isLoadingKeywordTrends,
    isLoadingEngagement,
    isLoadingTrendingTopics,
    isLoadingMarketInsights,
    addKeyword,
    removeKeyword,
    clearKeywords,
    setForecastPeriod,
    setConfidenceThreshold,
    setTimeframe,
    refreshAllData,
    getForecastSummary
  } = useForecasting();

  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeyword(newKeyword.trim());
      setNewKeyword('');
    }
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword();
    }
  };

  const summary = getForecastSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Demand Forecasting</h1>
          <p className="text-gray-400 mt-1">
            Predictive analytics for keyword trends and engagement patterns
          </p>
        </div>
        <Button
          onClick={refreshAllData}
          disabled={summary.isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${summary.isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <ForecastingSummary summary={summary} />

      {/* Configuration Panel */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Forecasting Configuration
          </CardTitle>
          <CardDescription>
            Configure keywords, forecast periods, and analysis parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keyword Management */}
          <div className="space-y-2">
            <Label className="text-white">Keywords to Analyze</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                Add
              </Button>
            </div>
            
            {/* Selected Keywords */}
            {state.selectedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {state.selectedKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="bg-blue-600 text-white cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword} ×
                  </Badge>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearKeywords}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Forecast Period */}
            <div className="space-y-2">
              <Label className="text-white">Forecast Period (Days)</Label>
              <div className="px-3">
                <Slider
                  value={[state.forecastPeriod]}
                  onValueChange={(value) => setForecastPeriod(value[0])}
                  max={90}
                  min={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>7</span>
                  <span className="font-medium text-white">{state.forecastPeriod}</span>
                  <span>90</span>
                </div>
              </div>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-2">
              <Label className="text-white">Confidence Threshold</Label>
              <div className="px-3">
                <Slider
                  value={[state.confidenceThreshold * 100]}
                  onValueChange={(value) => setConfidenceThreshold(value[0] / 100)}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10%</span>
                  <span className="font-medium text-white">{Math.round(state.confidenceThreshold * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Timeframe */}
            <div className="space-y-2">
              <Label className="text-white">Analysis Timeframe</Label>
              <Select value={state.timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Keyword Trends
          </TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-blue-600">
            <Target className="w-4 h-4 mr-2" />
            Trending Topics
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">
            <Lightbulb className="w-4 h-4 mr-2" />
            Market Insights
          </TabsTrigger>
        </TabsList>

        {/* Keyword Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <KeywordTrendChart
            data={keywordTrendData}
            isLoading={isLoadingKeywordTrends}
            selectedKeywords={state.selectedKeywords}
            forecastPeriod={state.forecastPeriod}
          />
        </TabsContent>

        {/* Engagement Forecast Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <EngagementForecastChart
            data={engagementData}
            isLoading={isLoadingEngagement}
            forecastPeriod={state.forecastPeriod}
          />
        </TabsContent>

        {/* Trending Topics Tab */}
        <TabsContent value="trending" className="space-y-4">
          <TrendingTopicsList
            data={trendingTopicsData}
            isLoading={isLoadingTrendingTopics}
            confidenceThreshold={state.confidenceThreshold}
            onAddKeyword={addKeyword}
          />
        </TabsContent>

        {/* Market Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <MarketInsightsPanel
            data={marketInsightsData}
            isLoading={isLoadingMarketInsights}
            timeframe={state.timeframe}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};