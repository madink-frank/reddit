import React, { useState, useEffect, useMemo } from 'react';
import { BlogPostCard, Button, Badge, Search, FeedSubscription, NewsletterSubscription } from '@/components/ui';
import apiClient from '@/services/api';
import type { BlogPost, BlogPostsResponse, CategoryResponse, TagResponse } from '@/services/api';

interface FilterState {
  category: string;
  tag: string;
  search: string;
}

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<CategoryResponse['categories']>([]);
  const [tags, setTags] = useState<TagResponse['tags']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    tag: '',
    search: '',
  });

  const pageSize = 12;

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getTags(),
        ]);
        setCategories(categoriesData.categories);
        setTags(tagsData.tags);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch posts based on filters and pagination
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        let response: BlogPostsResponse;

        if (filters.search) {
          // Use search API when there's a search query
          const searchResponse = await apiClient.searchPosts({
            query: filters.search,
            page: currentPage,
            pageSize,
            ...(filters.category && { category: filters.category }),
            ...(filters.tag && { tag: filters.tag }),
          });
          response = {
            posts: searchResponse.results,
            total: searchResponse.total,
            page: searchResponse.page,
            pageSize: searchResponse.pageSize,
            totalPages: Math.ceil(searchResponse.total / searchResponse.pageSize),
          };
        } else {
          // Use regular posts API
          response = await apiClient.getBlogPosts({
            page: currentPage,
            pageSize,
            ...(filters.category && { category: filters.category }),
            ...(filters.tag && { tag: filters.tag }),
          });
        }

        setPosts(response.posts);
        setTotalPages(response.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.category, filters.tag, filters.search]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', tag: '', search: '' });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.category || filters.tag || filters.search;
  }, [filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blog Posts
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Explore our latest insights about Reddit trends, AI analysis, and social media patterns.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Search
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(value) => handleFilterChange('search', value)}
                  className="w-full"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Categories
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      !filters.category
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => handleFilterChange('category', category.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.category === category.slug
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className="text-gray-400 ml-1">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag.slug}
                      variant={filters.tag === tag.slug ? 'primary' : 'secondary'}
                      className="cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => 
                        handleFilterChange('tag', filters.tag === tag.slug ? '' : tag.slug)
                      }
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="mt-6">
              <NewsletterSubscription
                variant="sidebar"
                showPreferences={false}
                className="text-sm"
              />
            </div>

            {/* RSS Subscription */}
            <div className="mt-6">
              <FeedSubscription variant="compact" showTitle={false} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    {filters.category && (
                      <Badge variant="outline" className="gap-1">
                        Category: {categories.find(c => c.slug === filters.category)?.name}
                        <button
                          onClick={() => handleFilterChange('category', '')}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.tag && (
                      <Badge variant="outline" className="gap-1">
                        Tag: {tags.find(t => t.slug === filters.tag)?.name}
                        <button
                          onClick={() => handleFilterChange('tag', '')}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.search && (
                      <Badge variant="outline" className="gap-1">
                        Search: "{filters.search}"
                        <button
                          onClick={() => handleFilterChange('search', '')}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : `${posts.length} posts found`}
                </p>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            {!loading && posts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {posts.map((post) => (
                    <BlogPostCard
                      key={post.id}
                      post={post}
                      className="h-full"
                      onTagClick={(tag) => handleFilterChange('tag', tag)}
                      onCategoryClick={(category) => handleFilterChange('category', category)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <nav className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!loading && posts.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to find more posts."
                      : "We haven't published any posts yet. Check back soon!"
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;