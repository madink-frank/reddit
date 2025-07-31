import React, { useEffect, useRef, useCallback } from 'react';
import { PostCard } from './PostCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Post } from '@/types';

interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  onViewDetails: (post: Post) => void;
  onViewComments?: (post: Post) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  className?: string;
}

export const PostList: React.FC<PostListProps> = ({
  posts,
  isLoading = false,
  onViewDetails,
  onViewComments,
  onLoadMore,
  hasNextPage = false,
  className = ''
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Intersection observer for infinite scrolling
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && onLoadMore) {
        onLoadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasNextPage, onLoadMore]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (isLoading && posts.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-gray-500 ${className}`}>
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium mb-2">No posts found</h3>
        <p className="text-sm">Try adjusting your search criteria or filters.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map((post, index) => (
        <div
          key={post.id}
          ref={index === posts.length - 1 ? lastPostElementRef : null}
        >
          <PostCard
            post={post}
            onViewDetails={onViewDetails}
            onViewComments={onViewComments}
          />
        </div>
      ))}
      
      {isLoading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
      
      {hasNextPage && !isLoading && (
        <div ref={loadMoreRef} className="h-4" />
      )}
    </div>
  );
};