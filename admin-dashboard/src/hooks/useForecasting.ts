/**
 * Forecasting Hook
 * 
 * Custom hook for managing forecasting state and operations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  forecastingService,
  KeywordTrendForecast,
  EngagementForecast,
  TrendingTopicsPrediction,
  TrendAnalysis,
  MarketInsights
} from '../services/forecastingService';
import { useToast } from './use-toast';

export interface ForecastingState {
  selectedKeywords: string[];
  forecastPeriod: number;
  confidenceThreshold: number;
  timeframe: 'day' | 'week' | 'month';
}

export const useForecasting = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [state, setState] = useState<ForecastingState>({
    selectedKeywords: [],
    forecastPeriod: 30,
    confidenceThreshold: 0.7,
    timeframe: 'week'
  });

  // Update state
  const updateState = useCallback((updates: Partial<ForecastingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Keyword trend forecasting
  const {
    data: keywordTrendData,
    isLoading: isLoadingKeywordTrends,
    error: keywordTrendError,
    refetch: refetchKeywordTrends
  } = useQuery({
    queryKey: ['keywordTrends', state.selectedKeywords, state.forecastPeriod],
    queryFn: async () => {
      if (state.selectedKeywords.length === 0) return null;
      
      if (state.selectedKeywords.length === 1) {
        return await forecastingService.predictKeywordTrends(
          state.selectedKeywords[0],
          state.forecastPeriod
        );
      } else {
        return await forecastingService.compareKeywordTrends(
          state.selectedKeywords,
          state.forecastPeriod
        );
      }
    },
    enabled: state.selectedKeywords.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Engagement forecasting
  const {
    data: engagementData,
    isLoading: isLoadingEngagement,
    error: engagementError,
    refetch: refetchEngagement
  } = useQuery({
    queryKey: ['engagementForecast', state.forecastPeriod],
    queryFn: () => forecastingService.forecastEngagementPatterns({
      daysAhead: state.forecastPeriod
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Trending topics prediction
  const {
    data: trendingTopicsData,
    isLoading: isLoadingTrendingTopics,
    error: trendingTopicsError,
    refetch: refetchTrendingTopics
  } = useQuery({
    queryKey: ['trendingTopics', state.forecastPeriod, state.confidenceThreshold],
    queryFn: () => forecastingService.predictTrendingTopics(
      state.forecastPeriod,
      state.confidenceThreshold
    ),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Market insights
  const {
    data: marketInsightsData,
    isLoading: isLoadingMarketInsights,
    error: marketInsightsError,
    refetch: refetchMarketInsights
  } = useQuery({
    queryKey: ['marketInsights', state.timeframe],
    queryFn: () => forecastingService.getMarketInsights(state.timeframe),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Trend analysis mutation for individual keywords
  const trendAnalysisMutation = useMutation({
    mutationFn: ({ keyword, daysBack }: { keyword: string; daysBack?: number }) =>
      forecastingService.getTrendAnalysis(keyword, daysBack),
    onSuccess: (data) => {
      toast({
        title: "Trend Analysis Complete",
        description: `Analysis for "${data.keyword}" completed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze trend",
        variant: "destructive",
      });
    },
  });

  // Add keyword to selection
  const addKeyword = useCallback((keyword: string) => {
    if (!state.selectedKeywords.includes(keyword)) {
      updateState({
        selectedKeywords: [...state.selectedKeywords, keyword]
      });
    }
  }, [state.selectedKeywords, updateState]);

  // Remove keyword from selection
  const removeKeyword = useCallback((keyword: string) => {
    updateState({
      selectedKeywords: state.selectedKeywords.filter(k => k !== keyword)
    });
  }, [state.selectedKeywords, updateState]);

  // Clear all keywords
  const clearKeywords = useCallback(() => {
    updateState({ selectedKeywords: [] });
  }, [updateState]);

  // Set forecast period
  const setForecastPeriod = useCallback((period: number) => {
    updateState({ forecastPeriod: period });
  }, [updateState]);

  // Set confidence threshold
  const setConfidenceThreshold = useCallback((threshold: number) => {
    updateState({ confidenceThreshold: threshold });
  }, [updateState]);

  // Set timeframe
  const setTimeframe = useCallback((timeframe: 'day' | 'week' | 'month') => {
    updateState({ timeframe });
  }, [updateState]);

  // Analyze specific keyword trend
  const analyzeTrend = useCallback((keyword: string, daysBack?: number) => {
    return trendAnalysisMutation.mutateAsync({ keyword, daysBack });
  }, [trendAnalysisMutation]);

  // Refresh all data
  const refreshAllData = useCallback(() => {
    refetchKeywordTrends();
    refetchEngagement();
    refetchTrendingTopics();
    refetchMarketInsights();
    
    toast({
      title: "Data Refreshed",
      description: "All forecasting data has been updated.",
    });
  }, [refetchKeywordTrends, refetchEngagement, refetchTrendingTopics, refetchMarketInsights, toast]);

  // Get forecast summary
  const getForecastSummary = useCallback(() => {
    const summary = {
      totalKeywords: state.selectedKeywords.length,
      forecastPeriod: state.forecastPeriod,
      confidenceThreshold: state.confidenceThreshold,
      hasData: {
        keywordTrends: !!keywordTrendData,
        engagement: !!engagementData,
        trendingTopics: !!trendingTopicsData,
        marketInsights: !!marketInsightsData
      },
      isLoading: isLoadingKeywordTrends || isLoadingEngagement || 
                 isLoadingTrendingTopics || isLoadingMarketInsights,
      hasErrors: !!(keywordTrendError || engagementError || 
                   trendingTopicsError || marketInsightsError)
    };

    return summary;
  }, [
    state,
    keywordTrendData,
    engagementData,
    trendingTopicsData,
    marketInsightsData,
    isLoadingKeywordTrends,
    isLoadingEngagement,
    isLoadingTrendingTopics,
    isLoadingMarketInsights,
    keywordTrendError,
    engagementError,
    trendingTopicsError,
    marketInsightsError
  ]);

  return {
    // State
    state,
    updateState,

    // Data
    keywordTrendData,
    engagementData,
    trendingTopicsData,
    marketInsightsData,
    trendAnalysisData: trendAnalysisMutation.data,

    // Loading states
    isLoadingKeywordTrends,
    isLoadingEngagement,
    isLoadingTrendingTopics,
    isLoadingMarketInsights,
    isAnalyzingTrend: trendAnalysisMutation.isPending,

    // Errors
    keywordTrendError,
    engagementError,
    trendingTopicsError,
    marketInsightsError,
    trendAnalysisError: trendAnalysisMutation.error,

    // Actions
    addKeyword,
    removeKeyword,
    clearKeywords,
    setForecastPeriod,
    setConfidenceThreshold,
    setTimeframe,
    analyzeTrend,
    refreshAllData,

    // Utilities
    getForecastSummary,

    // Refetch functions
    refetchKeywordTrends,
    refetchEngagement,
    refetchTrendingTopics,
    refetchMarketInsights,
  };
};