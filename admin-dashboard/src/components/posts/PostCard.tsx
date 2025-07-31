import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onViewDetails: (post: Post) => void;
  onViewComments?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onViewDetails,
  onViewComments
}) => {
  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const truncateContent = (content: string | undefined, maxLength = 200) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">r/{post.subreddit}</Badge>
          <span className="text-sm text-gray-500">by u/{post.author}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>{formatScore(post.score)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{post.num_comments}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {post.title}
      </h3>

      {/* Content Preview */}
      {post.content && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {truncateContent(post.content)}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span>Posted {formatDate(post.created_utc)}</span>
          <span className="mx-2">•</span>
          <span>Crawled {formatDate(post.crawled_at)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {onViewComments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewComments(post)}
            >
              Comments
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(post)}
          >
            View Details
          </Button>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};