import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useKeywords } from '../hooks/useKeywords';
import {
  TrendLineChart,
  KeywordFrequencyChart,
  SubredditDistributionChart,
} from '../components/charts';
import { TopPostsTable } from '../components/analytics/TopPostsTable';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface AnalyticsFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedKeywords: string[];
  selectedSubreddits: string[];
  refreshInterval: number; // in seconds, 0 = no auto refresh
}

const AnalyticsPage: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Default to last 30 days

    return {
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      selectedKeywords: [],
      selectedSubreddits: [],
      refreshInterval: 0,
    };
  });

  const [autoRefresh, setAutoRefresh] = useState(false);

  // Hooks
  const { data: keywordsData } = useKeywords();
  const {
    trendData,
    keywordFrequencyData,
    subredditDistributionData,
    topPostsData,
    isLoading,
    error,
    refetch,
  } = useAnalytics(filters);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh || filters.refreshInterval === 0) return;

    const interval = setInterval(() => {
      refetch();
    }, filters.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, filters.refreshInterval, refetch]);

  const handleDateRangeChange = (dateRange: { startDate: string; endDate: string }) => {
    setFilters(prev => ({
      ...prev,
      dateRange,
    }));
  };

  const handleKeywordFilter = (keywords: string[]) => {
    setFilters(prev => ({
      ...prev,
      selectedKeywords: keywords,
    }));
  };

  const handleSubredditFilter = (subreddits: string[]) => {
    setFilters(prev => ({
      ...prev,
      selectedSubreddits: subreddits,
    }));
  };

  const handleRefreshIntervalChange = (interval: string) => {
    setFilters(prev => ({
      ...prev,
      refreshInterval: parseInt(interval),
    }));
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const refreshIntervalOptions = [
    { value: '0', label: '자동 새로고침 없음' },
    { value: '30', label: '30초마다' },
    { value: '60', label: '1분마다' },
    { value: '300', label: '5분마다' },
    { value: '900', label: '15분마다' },
  ];

  const availableKeywords = keywordsData?.map(k => k.keyword) || [];
  const availableSubreddits = subredditDistributionData?.map(s => s.subreddit) || [];

  if (isLoading && !trendData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            분석 대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reddit 데이터 트렌드 및 통계 분석
          </p>
        </div>
        <Button onClick={refetch} disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" /> : '새로고침'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          필터 및 설정
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              날짜 범위
            </label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Keywords Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              키워드 필터
            </label>
            <Select
              value={filters.selectedKeywords[0] || ''}
              onChange={(value) => handleKeywordFilter(value ? [value] : [])}
              options={[
                { value: '', label: '모든 키워드' },
                ...availableKeywords.map(keyword => ({
                  value: keyword,
                  label: keyword,
                })),
              ]}
            />
          </div>

          {/* Auto Refresh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              자동 새로고침
            </label>
            <Select
              value={filters.refreshInterval.toString()}
              onChange={handleRefreshIntervalChange}
              options={refreshIntervalOptions}
            />
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-end">
            <Checkbox
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              label="자동 새로고침 활성화"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                데이터 로드 오류
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2">
          <TrendLineChart
            data={trendData || []}
            keywords={availableKeywords}
            isLoading={isLoading}
            error={error}
            onFilter={handleKeywordFilter}
            height={350}
          />
        </div>

        {/* Keyword Frequency Chart */}
        <KeywordFrequencyChart
          data={keywordFrequencyData || []}
          isLoading={isLoading}
          error={error}
          maxItems={15}
        />

        {/* Subreddit Distribution Chart */}
        <SubredditDistributionChart
          data={subredditDistributionData || []}
          isLoading={isLoading}
          error={error}
          variant="doughnut"
          maxItems={12}
        />
      </div>

      {/* Top Posts Table */}
      <TopPostsTable
        data={topPostsData || []}
        isLoading={isLoading}
        error={error}
        maxItems={25}
        onPostClick={(post) => {
          // Handle post click - could open modal or navigate to detail page
          console.log('Post clicked:', post);
        }}
      />

      {/* Real-time Status */}
      {autoRefresh && filters.refreshInterval > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">
              {filters.refreshInterval}초마다 자동 새로고침
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;