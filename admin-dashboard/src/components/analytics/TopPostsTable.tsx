import React, { useState } from 'react';
import { ChartContainer } from '../charts/ChartContainer';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

interface TopPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  createdAt: string;
  url: string;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface TopPostsTableProps {
  data: TopPost[];
  title?: string;
  className?: string;
  isLoading?: boolean;
  error?: string;
  maxItems?: number;
  sortBy?: 'score' | 'comments' | 'date';
  onSort?: (sortBy: string) => void;
  onPostClick?: (post: TopPost) => void;
}

export const TopPostsTable: React.FC<TopPostsTableProps> = ({
  data,
  title = "상위 성과 포스트",
  className = '',
  isLoading = false,
  error,
  maxItems = 20,
  sortBy = 'score',
  onSort,
  onPostClick,
}) => {
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [showSentiment, setShowSentiment] = useState(true);

  // Sort data
  const sortedData = [...data]
    .sort((a, b) => {
      switch (currentSortBy) {
        case 'score':
          return b.score - a.score;
        case 'comments':
          return b.numComments - a.numComments;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    })
    .slice(0, maxItems);

  const handleSortChange = (newSortBy: string) => {
    setCurrentSortBy(newSortBy);
    onSort?.(newSortBy);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      default:
        return '❓';
    }
  };

  const sortOptions = [
    { value: 'score', label: '점수순' },
    { value: 'comments', label: '댓글 수순' },
    { value: 'date', label: '최신순' },
  ];

  const actions = (
    <div className="flex items-center space-x-2">
      <Select
        value={currentSortBy}
        onChange={handleSortChange}
        options={sortOptions}
        className="w-32"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSentiment(!showSentiment)}
      >
        {showSentiment ? '감정 숨기기' : '감정 보기'}
      </Button>
    </div>
  );

  return (
    <div className={className}>
      <ChartContainer
        title={title}
        isLoading={isLoading}
        error={error}
        actions={actions}
      >
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(sortedData.reduce((sum, post) => sum + post.score, 0) / sortedData.length)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                평균 점수
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(sortedData.reduce((sum, post) => sum + post.numComments, 0) / sortedData.length)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                평균 댓글 수
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {new Set(sortedData.map(post => post.subreddit)).size}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                서브레딧 수
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {sortedData.filter(post => post.sentiment === 'positive').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                긍정적 포스트
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    포스트
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    점수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    댓글
                  </th>
                  {showSentiment && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      감정
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((post, index) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {post.title}
                        </div>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            r/{post.subreddit}
                          </span>
                          <span className="text-xs text-gray-500">
                            by u/{post.author}
                          </span>
                        </div>
                        {post.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.keywords.slice(0, 3).map(keyword => (
                              <Badge key={keyword} variant="secondary" size="sm">
                                {keyword}
                              </Badge>
                            ))}
                            {post.keywords.length > 3 && (
                              <Badge variant="secondary" size="sm">
                                +{post.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.score.toLocaleString()}
                        </span>
                        {index < 3 && (
                          <span className="ml-2 text-xs">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {post.numComments.toLocaleString()}
                    </td>
                    {showSentiment && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(post.sentiment)}`}>
                          {getSentimentIcon(post.sentiment)} {post.sentiment || 'unknown'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onPostClick?.(post)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          상세
                        </button>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          원본
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
};