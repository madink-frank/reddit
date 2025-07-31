import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useKeywords } from '@/hooks/useKeywords';
import { useSubreddits } from '@/hooks/usePosts';
import type { PostSearchParams } from '@/types';

interface PostFiltersProps {
  filters: PostSearchParams;
  onFiltersChange: (filters: PostSearchParams) => void;
  onReset: () => void;
}

export const PostFilters: React.FC<PostFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { data: keywords = [] } = useKeywords();
  const { data: subreddits = [] } = useSubreddits();

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onFiltersChange({ ...filters, query: query || undefined, page: 1 });
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, onFiltersChange]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleFilterChange = (key: keyof PostSearchParams, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filters change
    });
  };

  const handleKeywordChange = (keywordIds: number[]) => {
    handleFilterChange('keyword_ids', keywordIds.length > 0 ? keywordIds : undefined);
  };

  const handleSubredditChange = (subredditNames: string[]) => {
    handleFilterChange('subreddits', subredditNames.length > 0 ? subredditNames : undefined);
  };

  const handleDateFromChange = (date: string) => {
    handleFilterChange('date_from', date || undefined);
  };

  const handleDateToChange = (date: string) => {
    handleFilterChange('date_to', date || undefined);
  };

  const handleMinScoreChange = (score: string) => {
    const numScore = parseInt(score);
    handleFilterChange('min_score', isNaN(numScore) ? undefined : numScore);
  };

  const hasActiveFilters = () => {
    return !!(
      filters.query ||
      filters.keyword_ids?.length ||
      filters.subreddits?.length ||
      filters.date_from ||
      filters.date_to ||
      filters.min_score
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search posts by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Filters
        </Button>
        {hasActiveFilters() && (
          <Button variant="ghost" onClick={onReset}>
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Keywords Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <Select
              multiple
              value={filters.keyword_ids || []}
              onChange={handleKeywordChange}
              placeholder="Select keywords..."
            >
              {keywords.map((keyword) => (
                <option key={keyword.id} value={keyword.id}>
                  {keyword.keyword}
                </option>
              ))}
            </Select>
          </div>

          {/* Subreddits Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subreddits
            </label>
            <Select
              multiple
              value={filters.subreddits || []}
              onChange={handleSubredditChange}
              placeholder="Select subreddits..."
            >
              {subreddits.map((sub) => (
                <option key={sub.subreddit} value={sub.subreddit}>
                  r/{sub.subreddit} ({sub.post_count})
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <Input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <Input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </div>

          {/* Min Score Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Score
            </label>
            <Input
              type="number"
              placeholder="e.g. 100"
              value={filters.min_score || ''}
              onChange={(e) => handleMinScoreChange(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Filters
            </label>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMinScoreChange('100')}
                className="w-full"
              >
                Popular (100+ score)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  handleDateFromChange(yesterday.toISOString().split('T')[0]);
                }}
                className="w-full"
              >
                Last 24 hours
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.query && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.query}"
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleFilterChange('query', undefined);
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.keyword_ids?.map((keywordId) => {
              const keyword = keywords.find(k => k.id === keywordId);
              return keyword ? (
                <span key={keywordId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {keyword.keyword}
                  <button
                    onClick={() => {
                      const newIds = filters.keyword_ids?.filter(id => id !== keywordId) || [];
                      handleKeywordChange(newIds);
                    }}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}

            {filters.subreddits?.map((subreddit) => (
              <span key={subreddit} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                r/{subreddit}
                <button
                  onClick={() => {
                    const newSubs = filters.subreddits?.filter(s => s !== subreddit) || [];
                    handleSubredditChange(newSubs);
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            ))}

            {filters.min_score && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Min Score: {filters.min_score}
                <button
                  onClick={() => handleMinScoreChange('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-600"
                >
                  ×
                </button>
              </span>
            )}

            {(filters.date_from || filters.date_to) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Date: {filters.date_from || '...'} to {filters.date_to || '...'}
                <button
                  onClick={() => {
                    handleDateFromChange('');
                    handleDateToChange('');
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}