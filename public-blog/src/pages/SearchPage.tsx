import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Badge, Search } from '@/components/ui';
import SearchResultCard from '@/components/ui/SearchResultCard';
import apiClient from '@/services/api';
import type { BlogPost, SearchResponse, CategoryResponse, TagResponse } from '@/services/api';

interface SearchSuggestion {
  text: string;
  type: 'query' | 'tag' | 'category';
  count?: number;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryResponse['categories']>([]);
  const [tags, setTags] = useState<TagResponse['tags']>([]);

  const pageSize = 12;

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('blog-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (err) {
        console.error('Failed to parse search history:', err);
      }
    }
  }, []);

  // Load categories and tags for suggestions
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getTags(),
        ]);
        setCategories(categoriesData.categories);
        setTags(tagsData.tags);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };

    fetchMetadata();
  }, []);

  // Perform search when parameters change
  useEffect(() => {
    if (query || category || tag) {
      performSearch();
    } else {
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(1);
    }
  }, [query, category, tag, page]);

  // Update search input when query changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      let response: SearchResponse;

      if (query) {
        response = await apiClient.searchPosts({
          query,
          page,
          pageSize,
          ...(category && { category }),
          ...(tag && { tag }),
        });
      } else {
        // If no query but has filters, use regular posts API
        const postsResponse = await apiClient.getBlogPosts({
          page,
          pageSize,
          ...(category && { category }),
          ...(tag && { tag }),
        });
        response = {
          results: postsResponse.posts,
          total: postsResponse.total,
          query: '',
          page: postsResponse.page,
          pageSize: postsResponse.pageSize,
        };
      }

      setSearchResults(response.results);
      setTotalResults(response.total);
      setTotalPages(Math.ceil(response.total / response.pageSize));

      // Add to search history if there's a query
      if (query && !searchHistory.includes(query)) {
        const newHistory = [query, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
        setSearchHistory(newHistory);
        localStorage.setItem('blog-search-history', JSON.stringify(newHistory));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Generate search suggestions
  const generateSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      // Show search history when input is empty
      return searchHistory.slice(0, 5).map(historyItem => ({
        text: historyItem,
        type: 'query' as const,
      }));
    }

    const suggestions: SearchSuggestion[] = [];
    const lowerInput = input.toLowerCase();

    // Add matching categories
    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(lowerInput)) {
        suggestions.push({
          text: cat.name,
          type: 'category',
          count: cat.count,
        });
      }
    });

    // Add matching tags
    tags.forEach(tagItem => {
      if (tagItem.name.toLowerCase().includes(lowerInput)) {
        suggestions.push({
          text: tagItem.name,
          type: 'tag',
          count: tagItem.count,
        });
      }
    });

    // Add search history matches
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(lowerInput) && historyItem !== input) {
        suggestions.push({
          text: historyItem,
          type: 'query',
        });
      }
    });

    return suggestions.slice(0, 8);
  }, [categories, tags, searchHistory]);

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(searchInput);
    setSuggestions(newSuggestions);
  }, [searchInput, generateSuggestions]);

  const handleSearch = (searchQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    params.delete('page'); // Reset to first page
    setSearchParams(params);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const params = new URLSearchParams(searchParams);
    
    if (suggestion.type === 'query') {
      params.set('q', suggestion.text);
    } else if (suggestion.type === 'category') {
      params.set('category', suggestion.text);
      params.delete('q');
    } else if (suggestion.type === 'tag') {
      params.set('tag', suggestion.text);
      params.delete('q');
    }
    
    params.delete('page');
    setSearchParams(params);
    setShowSuggestions(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('blog-search-history');
  };

  const hasActiveFilters = useMemo(() => {
    return query || category || tag;
  }, [query, category, tag]);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Search Blog Posts
          </h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search
              placeholder="Search articles, topics, or keywords..."
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full text-lg"
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-80 overflow-y-auto">
                {!searchInput.trim() && searchHistory.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Recent Searches</span>
                      <button
                        onClick={clearSearchHistory}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">
                        {suggestion.type === 'query' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                        {suggestion.type === 'category' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        )}
                        {suggestion.type === 'tag' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-900">{suggestion.text}</span>
                        {suggestion.type !== 'query' && (
                          <span className="text-xs text-gray-500 ml-2 capitalize">
                            {suggestion.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-gray-400">
                        {suggestion.count} posts
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {query && (
                <Badge variant="primary" className="gap-1">
                  Search: "{query}"
                  <button
                    onClick={() => handleFilterChange('q', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {category && (
                <Badge variant="outline" className="gap-1">
                  Category: {category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {tag && (
                <Badge variant="outline" className="gap-1">
                  Tag: {tag}
                  <button
                    onClick={() => handleFilterChange('tag', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear all
              </Button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {hasActiveFilters ? 'Search Results' : 'All Posts'}
            </h2>
            <p className="text-gray-600 mt-1">
              {loading ? 'Searching...' : `${totalResults} ${totalResults === 1 ? 'result' : 'results'} found`}
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

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {searchResults.map((post) => (
                <SearchResultCard
                  key={post.id}
                  post={post}
                  searchQuery={query}
                  className="h-full"
                  onTagClick={(tagName) => handleFilterChange('tag', tagName)}
                  onCategoryClick={(categoryName) => handleFilterChange('category', categoryName)}
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
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'primary' : 'outline'}
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
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && searchResults.length === 0 && hasActiveFilters && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any posts matching your search criteria.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Try:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Using different keywords</li>
                  <li>• Checking your spelling</li>
                  <li>• Using more general terms</li>
                  <li>• Removing some filters</li>
                </ul>
              </div>
              <Button onClick={clearFilters} className="mt-4">
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        {/* No Filters State */}
        {!loading && !hasActiveFilters && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-600 mb-4">
                Enter keywords, topics, or browse by categories to find interesting articles.
              </p>
              <Link to="/blog">
                <Button>
                  Browse All Posts
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;