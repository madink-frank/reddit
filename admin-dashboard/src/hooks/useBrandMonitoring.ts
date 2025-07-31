/**
 * Brand Monitoring Hook
 * 
 * Custom hook for managing brand monitoring state and operations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  brandMonitoringService,
  BrandMention,
  BrandSentiment,
  CompetitiveAnalysis,
  ReputationDashboard,
  MarketOverview
} from '../services/brandMonitoringService';
import { useToast } from './use-toast';

export interface BrandMonitoringState {
  selectedBrand: string;
  competitorBrands: string[];
  selectedSubreddits: string[];
  analysisPeriod: number;
  monitoringMode: 'single' | 'competitive' | 'market';
}

export const useBrandMonitoring = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [state, setState] = useState<BrandMonitoringState>({
    selectedBrand: '',
    competitorBrands: [],
    selectedSubreddits: [],
    analysisPeriod: 30,
    monitoringMode: 'single'
  });

  // Update state
  const updateState = useCallback((updates: Partial<BrandMonitoringState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Brand mentions tracking
  const {
    data: brandMentionsData,
    isLoading: isLoadingMentions,
    error: mentionsError,
    refetch: refetchMentions
  } = useQuery({
    queryKey: ['brandMentions', state.selectedBrand, state.selectedSubreddits, state.analysisPeriod],
    queryFn: () => brandMonitoringService.trackBrandMentions(state.selectedBrand, {
      subreddits: state.selectedSubreddits.length > 0 ? state.selectedSubreddits : undefined,
      daysBack: state.analysisPeriod
    }),
    enabled: !!state.selectedBrand,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Brand sentiment analysis
  const {
    data: brandSentimentData,
    isLoading: isLoadingSentiment,
    error: sentimentError,
    refetch: refetchSentiment
  } = useQuery({
    queryKey: ['brandSentiment', state.selectedBrand, state.selectedSubreddits, state.analysisPeriod],
    queryFn: () => brandMonitoringService.analyzeBrandSentiment(state.selectedBrand, {
      subreddits: state.selectedSubreddits.length > 0 ? state.selectedSubreddits : undefined,
      daysBack: state.analysisPeriod
    }),
    enabled: !!state.selectedBrand,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Reputation dashboard
  const {
    data: reputationDashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['reputationDashboard', state.selectedBrand, state.selectedSubreddits, state.analysisPeriod],
    queryFn: () => brandMonitoringService.getReputationDashboard(state.selectedBrand, {
      subreddits: state.selectedSubreddits.length > 0 ? state.selectedSubreddits : undefined,
      daysBack: state.analysisPeriod
    }),
    enabled: !!state.selectedBrand && state.monitoringMode === 'single',
    staleTime: 20 * 60 * 1000, // 20 minutes
  });

  // Competitive analysis
  const {
    data: competitiveAnalysisData,
    isLoading: isLoadingCompetitive,
    error: competitiveError,
    refetch: refetchCompetitive
  } = useQuery({
    queryKey: ['competitiveAnalysis', state.selectedBrand, state.competitorBrands, state.selectedSubreddits, state.analysisPeriod],
    queryFn: () => brandMonitoringService.performCompetitiveAnalysis(
      state.selectedBrand,
      state.competitorBrands,
      {
        subreddits: state.selectedSubreddits.length > 0 ? state.selectedSubreddits : undefined,
        daysBack: state.analysisPeriod
      }
    ),
    enabled: !!state.selectedBrand && state.competitorBrands.length > 0 && state.monitoringMode === 'competitive',
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Market overview
  const {
    data: marketOverviewData,
    isLoading: isLoadingMarket,
    error: marketError,
    refetch: refetchMarket
  } = useQuery({
    queryKey: ['marketOverview', state.selectedBrand, state.competitorBrands, state.selectedSubreddits, state.analysisPeriod],
    queryFn: () => {
      const allBrands = [state.selectedBrand, ...state.competitorBrands];
      return brandMonitoringService.getMarketOverview(allBrands, {
        subreddits: state.selectedSubreddits.length > 0 ? state.selectedSubreddits : undefined,
        daysBack: state.analysisPeriod
      });
    },
    enabled: !!state.selectedBrand && state.competitorBrands.length > 0 && state.monitoringMode === 'market',
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Brand analysis mutation for ad-hoc analysis
  const brandAnalysisMutation = useMutation({
    mutationFn: ({ brand, options }: { brand: string; options?: any }) =>
      brandMonitoringService.getReputationDashboard(brand, options),
    onSuccess: (data) => {
      toast({
        title: "Brand Analysis Complete",
        description: `Analysis for "${data.brand_name}" completed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze brand",
        variant: "destructive",
      });
    },
  });

  // Set selected brand
  const setSelectedBrand = useCallback((brand: string) => {
    updateState({ selectedBrand: brand });
  }, [updateState]);

  // Add competitor brand
  const addCompetitorBrand = useCallback((brand: string) => {
    if (!state.competitorBrands.includes(brand)) {
      updateState({
        competitorBrands: [...state.competitorBrands, brand]
      });
    }
  }, [state.competitorBrands, updateState]);

  // Remove competitor brand
  const removeCompetitorBrand = useCallback((brand: string) => {
    updateState({
      competitorBrands: state.competitorBrands.filter(b => b !== brand)
    });
  }, [state.competitorBrands, updateState]);

  // Clear competitor brands
  const clearCompetitorBrands = useCallback(() => {
    updateState({ competitorBrands: [] });
  }, [updateState]);

  // Add subreddit
  const addSubreddit = useCallback((subreddit: string) => {
    if (!state.selectedSubreddits.includes(subreddit)) {
      updateState({
        selectedSubreddits: [...state.selectedSubreddits, subreddit]
      });
    }
  }, [state.selectedSubreddits, updateState]);

  // Remove subreddit
  const removeSubreddit = useCallback((subreddit: string) => {
    updateState({
      selectedSubreddits: state.selectedSubreddits.filter(s => s !== subreddit)
    });
  }, [state.selectedSubreddits, updateState]);

  // Clear subreddits
  const clearSubreddits = useCallback(() => {
    updateState({ selectedSubreddits: [] });
  }, [updateState]);

  // Set analysis period
  const setAnalysisPeriod = useCallback((period: number) => {
    updateState({ analysisPeriod: period });
  }, [updateState]);

  // Set monitoring mode
  const setMonitoringMode = useCallback((mode: 'single' | 'competitive' | 'market') => {
    updateState({ monitoringMode: mode });
  }, [updateState]);

  // Analyze specific brand
  const analyzeBrand = useCallback((brand: string, options?: any) => {
    return brandAnalysisMutation.mutateAsync({ brand, options });
  }, [brandAnalysisMutation]);

  // Refresh all data
  const refreshAllData = useCallback(() => {
    refetchMentions();
    refetchSentiment();
    refetchDashboard();
    refetchCompetitive();
    refetchMarket();
    
    toast({
      title: "Data Refreshed",
      description: "All brand monitoring data has been updated.",
    });
  }, [refetchMentions, refetchSentiment, refetchDashboard, refetchCompetitive, refetchMarket, toast]);

  // Get monitoring summary
  const getMonitoringSummary = useCallback(() => {
    const summary = {
      selectedBrand: state.selectedBrand,
      competitorCount: state.competitorBrands.length,
      subredditCount: state.selectedSubreddits.length,
      analysisPeriod: state.analysisPeriod,
      monitoringMode: state.monitoringMode,
      hasData: {
        mentions: !!brandMentionsData,
        sentiment: !!brandSentimentData,
        dashboard: !!reputationDashboardData,
        competitive: !!competitiveAnalysisData,
        market: !!marketOverviewData
      },
      isLoading: isLoadingMentions || isLoadingSentiment || isLoadingDashboard || 
                 isLoadingCompetitive || isLoadingMarket,
      hasErrors: !!(mentionsError || sentimentError || dashboardError || 
                   competitiveError || marketError)
    };

    return summary;
  }, [
    state,
    brandMentionsData,
    brandSentimentData,
    reputationDashboardData,
    competitiveAnalysisData,
    marketOverviewData,
    isLoadingMentions,
    isLoadingSentiment,
    isLoadingDashboard,
    isLoadingCompetitive,
    isLoadingMarket,
    mentionsError,
    sentimentError,
    dashboardError,
    competitiveError,
    marketError
  ]);

  // Get brand health insights
  const getBrandHealthInsights = useCallback(() => {
    if (!brandSentimentData) return null;

    const reputationScore = brandSentimentData.reputation_score;
    const healthScore = brandMonitoringService.getBrandHealthScore(reputationScore);
    
    return {
      ...healthScore,
      recommendations: brandSentimentData.recommendations?.slice(0, 3) || [],
      trendDirection: brandMonitoringService.getTrendDirection(
        brandSentimentData.sentiment_trends?.trend_direction || 'stable'
      )
    };
  }, [brandSentimentData]);

  return {
    // State
    state,
    updateState,

    // Data
    brandMentionsData,
    brandSentimentData,
    reputationDashboardData,
    competitiveAnalysisData,
    marketOverviewData,
    brandAnalysisData: brandAnalysisMutation.data,

    // Loading states
    isLoadingMentions,
    isLoadingSentiment,
    isLoadingDashboard,
    isLoadingCompetitive,
    isLoadingMarket,
    isAnalyzingBrand: brandAnalysisMutation.isPending,

    // Errors
    mentionsError,
    sentimentError,
    dashboardError,
    competitiveError,
    marketError,
    brandAnalysisError: brandAnalysisMutation.error,

    // Actions
    setSelectedBrand,
    addCompetitorBrand,
    removeCompetitorBrand,
    clearCompetitorBrands,
    addSubreddit,
    removeSubreddit,
    clearSubreddits,
    setAnalysisPeriod,
    setMonitoringMode,
    analyzeBrand,
    refreshAllData,

    // Utilities
    getMonitoringSummary,
    getBrandHealthInsights,

    // Refetch functions
    refetchMentions,
    refetchSentiment,
    refetchDashboard,
    refetchCompetitive,
    refetchMarket,
  };
};