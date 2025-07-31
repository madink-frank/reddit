import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useKeywordStats } from '../../hooks/useKeywords';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import { formatDate, formatNumber } from '../../lib/utils';
import type { Keyword } from '../../types';

interface KeywordStatsCardProps {
  keyword: Keyword;
  showChart?: boolean;
}

export const KeywordStatsCard: React.FC<KeywordStatsCardProps> = ({
  keyword,
  showChart = false
}) => {
  const { data: stats, isLoading, error } = useKeywordStats(keyword.id);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p>Unable to load statistics</p>
        </div>
      </div>
    );
  }

  const trendPercentage = stats.recent_activity > 0 ? 
    ((stats.recent_activity / stats.total_posts) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {keyword.keyword}
          </h3>
          <Badge variant={keyword.is_active ? 'success' : 'secondary'}>
            {keyword.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {keyword.description && (
          <p className="text-sm text-gray-600 mb-4">{keyword.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Posts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats.total_posts)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avg_score.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Activity</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900 mr-2">
                  {formatNumber(stats.recent_activity)}
                </p>
                {trendPercentage > 0 && (
                  <div className="flex items-center text-sm">
                    {trendPercentage > 10 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={trendPercentage > 10 ? 'text-green-600' : 'text-red-600'}>
                      {trendPercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-gray-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">
                {formatDate(keyword.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {stats.top_subreddits && stats.top_subreddits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Top Subreddits</h4>
            <div className="flex flex-wrap gap-2">
              {stats.top_subreddits.slice(0, 5).map((subreddit) => (
                <Badge key={subreddit} variant="secondary">
                  r/{subreddit}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showChart && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Chart</h4>
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">Chart visualization would go here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};