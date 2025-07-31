import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePost } from '@/hooks/usePosts';
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PostDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post | null;
}

interface Comment {
    id: number;
    reddit_id: string;
    body: string;
    author: string;
    score: number;
    created_utc: string;
    crawled_at: string;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
    isOpen,
    onClose,
    post
}) => {
    const [showComments, setShowComments] = useState(false);
    const [commentsPage, setCommentsPage] = useState(1);

    // Fetch detailed post data if needed
    const { data: detailedPost, isLoading } = usePost(post?.id || 0, isOpen && !!post);

    if (!post) return null;

    const currentPost = (detailedPost as Post) || post;

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

    const formatFullDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'Unknown date';
        }
    };

    // Mock comments data - in real implementation, this would come from API
    const mockComments: Comment[] = [
        {
            id: 1,
            reddit_id: 'comment1',
            body: 'This is a great post! Thanks for sharing.',
            author: 'user1',
            score: 15,
            created_utc: '2024-01-20T10:30:00Z',
            crawled_at: '2024-01-20T10:35:00Z'
        },
        {
            id: 2,
            reddit_id: 'comment2',
            body: 'I disagree with some points, but overall interesting perspective.',
            author: 'user2',
            score: 8,
            created_utc: '2024-01-20T11:15:00Z',
            crawled_at: '2024-01-20T11:20:00Z'
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Post Details"
            size="xl"
        >
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <Badge variant="secondary">r/{currentPost.subreddit}</Badge>
                            <span className="text-sm text-gray-500">by u/{currentPost.author}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{formatScore(currentPost.score)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                <span>{currentPost.num_comments} comments</span>
                            </div>
                        </div>
                    </div>

                    {/* Post Title */}
                    <h2 className="text-xl font-bold text-gray-900">
                        {currentPost.title}
                    </h2>

                    {/* Post Content */}
                    {currentPost.content && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {currentPost.content}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Post Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                        <div>
                            <span className="font-medium">Posted:</span> {formatFullDate(currentPost.created_utc)}
                        </div>
                        <div>
                            <span className="font-medium">Crawled:</span> {formatFullDate(currentPost.crawled_at)}
                        </div>
                        <div>
                            <span className="font-medium">Reddit ID:</span> {currentPost.reddit_id}
                        </div>
                        <div>
                            <span className="font-medium">Score:</span> {currentPost.score}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                            <a
                                href={currentPost.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                                View on Reddit
                            </a>

                            <Button
                                variant="outline"
                                onClick={() => setShowComments(!showComments)}
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                {showComments ? 'Hide Comments' : 'Show Comments'}
                            </Button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Comments ({currentPost.num_comments})
                            </h3>

                            {mockComments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p>No comments available</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {mockComments.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900">u/{comment.author}</span>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(comment.created_utc)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>{comment.score}</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {comment.body}
                                            </p>
                                        </div>
                                    ))}

                                    {/* Pagination for comments */}
                                    {mockComments.length > 0 && (
                                        <div className="flex justify-center pt-4">
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={commentsPage === 1}
                                                    onClick={() => setCommentsPage(commentsPage - 1)}
                                                >
                                                    Previous
                                                </Button>
                                                <span className="flex items-center px-3 py-1 text-sm text-gray-600">
                                                    Page {commentsPage}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCommentsPage(commentsPage + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};