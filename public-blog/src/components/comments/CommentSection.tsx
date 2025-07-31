import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { commentService } from '@/services/commentService';
import type { Comment, CommentFormData, CommentSubmissionResponse } from '@/types/comments';

interface CommentSectionProps {
  postId: string;
  postTitle: string;
  enabled?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postTitle,
  enabled = true
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'likeCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load comments
  useEffect(() => {
    if (!enabled) return;
    
    const loadComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const commentsData = await commentService.getComments(postId, {
          status: 'approved',
          sortBy,
          sortOrder
        });
        setComments(commentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [postId, enabled, sortBy, sortOrder]);

  const handleSubmitComment = async (data: CommentFormData): Promise<CommentSubmissionResponse> => {
    try {
      const response = await commentService.submitComment(postId, data);
      
      if (response.success && response.comment) {
        // Add new comment to the list if it doesn't require moderation
        if (response.comment.status === 'approved') {
          if (data.parentId) {
            // Handle reply - find parent and add to replies
            setComments(prev => prev.map(comment => {
              if (comment.id === data.parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), response.comment!]
                };
              }
              return comment;
            }));
          } else {
            // Add new top-level comment
            setComments(prev => [response.comment!, ...prev]);
          }
        }
        
        setShowCommentForm(false);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit comment'
      };
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await commentService.toggleCommentLike(commentId);
      
      if (response.success) {
        // Update comment like count in state
        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likeCount: response.likeCount,
                isLiked: !comment.isLiked
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: updateCommentLikes(comment.replies)
              };
            }
            return comment;
          });
        };
        
        setComments(prev => updateCommentLikes(prev));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReportComment = async (commentId: string, reason: string) => {
    try {
      const response = await commentService.reportComment(commentId, reason);
      
      if (response.success) {
        // Show success message or handle UI feedback
        console.log('Comment reported successfully');
      }
    } catch (error) {
      console.error('Failed to report comment:', error);
    }
  };

  const handleSortChange = (newSortBy: 'createdAt' | 'likeCount') => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const approvedComments = comments.filter(comment => comment.status === 'approved');
  const commentCount = approvedComments.reduce((count, comment) => {
    return count + 1 + (comment.replies?.length || 0);
  }, 0);

  if (!enabled) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">Comments are disabled for this post.</p>
      </div>
    );
  }

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Comments ({commentCount})
          </h2>
          <p className="text-gray-600 mt-1">
            Join the discussion about "{postTitle}"
          </p>
        </div>
        
        {/* Sort Options */}
        {commentCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('createdAt')}
              className={sortBy === 'createdAt' ? 'bg-blue-50 text-blue-700' : ''}
            >
              Newest {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('likeCount')}
              className={sortBy === 'likeCount' ? 'bg-blue-50 text-blue-700' : ''}
            >
              Popular {sortBy === 'likeCount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        )}
      </div>

      {/* Comment Form Toggle */}
      <div className="mb-8">
        {!showCommentForm ? (
          <Button
            onClick={() => setShowCommentForm(true)}
            className="w-full sm:w-auto"
          >
            Leave a Comment
          </Button>
        ) : (
          <CommentForm
            postId={postId}
            onSubmit={handleSubmitComment}
            onCancel={() => setShowCommentForm(false)}
          />
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-0">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load comments: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : approvedComments.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No comments yet
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to share your thoughts on this article!
            </p>
            {!showCommentForm && (
              <Button onClick={() => setShowCommentForm(true)}>
                Start the Discussion
              </Button>
            )}
          </div>
        ) : (
          approvedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleSubmitComment}
              onLike={handleLikeComment}
              onReport={handleReportComment}
            />
          ))
        )}
      </div>

      {/* Comment Guidelines */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Community Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be respectful and constructive in your comments</li>
          <li>• Stay on topic and contribute meaningfully to the discussion</li>
          <li>• No spam, self-promotion, or offensive content</li>
          <li>• Comments are moderated and may take time to appear</li>
        </ul>
      </div>
    </section>
  );
};

export default CommentSection;