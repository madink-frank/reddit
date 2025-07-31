import React, { useState, useMemo } from 'react';
import { PostList } from '../components/posts/PostList';
import { PostFilters } from '../components/posts/PostFilters';
import { PostSorting } from '../components/posts/PostSorting';
import { PostDetailModal } from '../components/posts/PostDetailModal';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { usePosts } from '../hooks/usePosts';
import { usePostFilters } from '../hooks/usePostFilters';
import type { Post, PaginatedResponse } from '../types';

// Type guard to check if data is a PaginatedResponse
const isPaginatedResponse = (data: any): data is PaginatedResponse<Post> => {
  return data && typeof data === 'object' &&
    typeof data.totalPages === 'number' &&
    typeof data.total === 'number' &&
    Array.isArray(data.data);
};

const PostsPage: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { filters, updateFilters, resetFilters, updatePage, updatePageSize, updateSort } = usePostFilters();

  // Convert filters to API parameters
  const apiParams = useMemo(() => ({
    ...filters,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order
  }), [filters]);

  const { data: postsData, isLoading, error } = usePosts(apiParams);

  const handleViewDetails = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleLoadMore = () => {
    const currentPage = filters.page || 1;
    if (isPaginatedResponse(postsData) && currentPage < postsData.totalPages) {
      updatePage(currentPage + 1);
    }
  };

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading posts</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>There was an error loading the posts. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Posts Explorer</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse and search through crawled Reddit posts
        </p>
      </div>

      {/* Filters */}
      <PostFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {isPaginatedResponse(postsData) && (
            <span className="text-sm text-gray-600">
              {postsData.total} {postsData.total === 1 ? 'post' : 'posts'} found
            </span>
          )}
          {isLoading && (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          )}
        </div>

        <PostSorting
          sortBy={filters.sort_by || 'created_utc'}
          sortOrder={filters.sort_order || 'desc'}
          onSortChange={updateSort}
        />
      </div>

      {/* Posts List */}
      <div className="mb-6">
        <PostList
          posts={isPaginatedResponse(postsData) ? postsData.data : []}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onLoadMore={handleLoadMore}
          hasNextPage={isPaginatedResponse(postsData) ? (filters.page || 1) < postsData.totalPages : false}
        />
      </div>

      {/* Pagination */}
      {isPaginatedResponse(postsData) && postsData.totalPages > 1 && (
        <Pagination
          currentPage={filters.page || 1}
          totalPages={postsData.totalPages}
          totalItems={postsData.total}
          itemsPerPage={filters.page_size || 20}
          onPageChange={updatePage}
          onPageSizeChange={updatePageSize}
          className="mt-6"
        />
      )}

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
      />
    </div>
  );
};

export default PostsPage;