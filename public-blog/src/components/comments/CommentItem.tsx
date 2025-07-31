import React, { useState } from 'react';
import { Button } from '@/components/ui';
import CommentForm from './CommentForm';
import type { Comment, CommentFormData, CommentSubmissionResponse } from '@/types/comments';

interface CommentItemProps {
  comment: Comment;
  onReply: (data: CommentFormData) => Promise<CommentSubmissionResponse>;
  onLike: (commentId: string) => Promise<void>;
  onReport: (commentId: string, reason: string) => Promise<void>;
  level?: number;
  maxLevel?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onReport,
  level = 0,
  maxLevel = 3
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const handleReply = async (data: CommentFormData): Promise<CommentSubmissionResponse> => {
    const response = await onReply(data);
    if (response.success) {
      setShowReplyForm(false);
    }
    return response;
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await onLike(comment.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || isReporting) return;
    
    setIsReporting(true);
    try {
      await onReport(comment.id, reportReason);
      setShowReportForm(false);
      setReportReason('');
    } finally {
      setIsReporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const indentClass = level > 0 ? `ml-${Math.min(level * 8, 32)}` : '';

  return (
    <div className={`${indentClass} ${level > 0 ? 'border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="bg-white rounded-lg border p-4 mb-4">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {comment.author.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Author Info */}
            <div>
              <div className="flex items-center gap-2">
                {comment.author.website ? (
                  <a
                    href={comment.author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {comment.author.name}
                  </a>
                ) : (
                  <span className="font-medium text-gray-900">
                    {comment.author.name}
                  </span>
                )}
                {comment.isEdited && (
                  <span className="text-xs text-gray-500 italic">(edited)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <time dateTime={comment.createdAt}>
                  {formatDate(comment.createdAt)}
                </time>
                {comment.status === 'pending' && (
                  <span className="text-orange-600 text-xs">• Pending approval</span>
                )}
              </div>
            </div>
          </div>

          {/* Report Button */}
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Report comment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Comment Content */}
        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 text-sm">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1 transition-colors ${
              comment.isLiked
                ? 'text-red-600 hover:text-red-700'
                : 'text-gray-500 hover:text-gray-700'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <svg className="w-4 h-4" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{comment.likeCount}</span>
          </button>

          {/* Reply Button */}
          {level < maxLevel && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Report Form */}
        {showReportForm && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Report this comment</h4>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please explain why you're reporting this comment..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleReport}
                disabled={!reportReason.trim() || isReporting}
              >
                {isReporting ? 'Reporting...' : 'Report'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowReportForm(false);
                  setReportReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              postId={comment.postId}
              parentId={comment.id}
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.author.name}...`}
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onReport={onReport}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;