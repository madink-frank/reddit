/**
 * API client for the public blog
 * Handles communication with the backend API for public content
 */

import { config } from '@/config/env';

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  readingTime: number;
  featured: boolean;
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    socialImage?: string;
  };
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResponse {
  results: BlogPost[];
  total: number;
  query: string;
  page: number;
  pageSize: number;
}

export interface CategoryResponse {
  categories: Array<{
    name: string;
    slug: string;
    count: number;
    description?: string;
  }>;
}

export interface TagResponse {
  tags: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(params: { message: string; status: number; code?: string }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    if (params.code) {
      this.code = params.code;
    }
  }
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.apiTimeout;
    this.cache = new Map();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${url}`;

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < config.cacheDuration) {
        if (config.debugMode) {
          console.log('Cache hit:', cacheKey);
        }
        return cached.data;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError({
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
        });
      }

      const data = await response.json();

      // Cache successful GET requests
      if (!options.method || options.method === 'GET') {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if ((error as Error).name === 'AbortError') {
        throw new ApiError({
          message: 'Request timeout',
          status: 408,
          code: 'TIMEOUT',
        });
      }
      
      throw new ApiError({
        message: (error as Error).message || 'Network error',
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }
  }

  // Blog Posts API
  async getBlogPosts(params: {
    page?: number;
    pageSize?: number;
    category?: string;
    tag?: string;
    featured?: boolean;
  } = {}): Promise<BlogPostsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('page_size', params.pageSize.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.tag) searchParams.set('tag', params.tag);
    if (params.featured !== undefined) searchParams.set('featured', params.featured.toString());

    const endpoint = `/public/posts${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<BlogPostsResponse>(endpoint);
  }

  async getBlogPost(slug: string): Promise<BlogPost> {
    return this.request<BlogPost>(`/public/posts/${slug}`);
  }

  async getFeaturedPosts(limit: number = 5): Promise<BlogPost[]> {
    const response = await this.request<BlogPostsResponse>(
      `/public/posts?featured=true&page_size=${limit}`
    );
    return response.posts;
  }

  async getRecentPosts(limit: number = 10): Promise<BlogPost[]> {
    const response = await this.request<BlogPostsResponse>(
      `/public/posts?page_size=${limit}`
    );
    return response.posts;
  }

  // Search API
  async searchPosts(params: {
    query: string;
    page?: number;
    pageSize?: number;
    category?: string;
    tag?: string;
  }): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.query);
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('page_size', params.pageSize.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.tag) searchParams.set('tag', params.tag);

    return this.request<SearchResponse>(`/public/search?${searchParams}`);
  }

  // Categories API
  async getCategories(): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/public/categories');
  }

  // Tags API
  async getTags(): Promise<TagResponse> {
    return this.request<TagResponse>('/public/tags');
  }

  // RSS Feed
  async getRssFeed(): Promise<string> {
    return this.request<string>('/public/rss', {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
  }

  // Newsletter subscription
  async subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/public/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats (for debugging)
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// ApiError is already exported above as a class

// Mock API for development
export const mockApiClient = {
  async getBlogPosts(): Promise<BlogPostsResponse> {
    // Mock data for development
    const mockPosts: BlogPost[] = [
      {
        id: 1,
        title: 'The Rise of AI in Reddit Communities',
        content: 'Lorem ipsum dolor sit amet...',
        excerpt: 'Exploring how AI is transforming Reddit discussions...',
        slug: 'rise-of-ai-reddit-communities',
        author: 'Reddit Content Platform',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        tags: ['AI', 'Technology', 'Reddit'],
        category: 'Technology',
        readingTime: 5,
        featured: true,
        metadata: {
          seoTitle: 'The Rise of AI in Reddit Communities | Reddit Trends Blog',
          seoDescription: 'Exploring how AI is transforming Reddit discussions and community interactions.',
        },
      },
      // Add more mock posts as needed
    ];

    return {
      posts: mockPosts,
      total: mockPosts.length,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    };
  },

  async getBlogPost(slug: string): Promise<BlogPost> {
    // Return mock post based on slug
    return {
      id: 1,
      title: 'Mock Blog Post',
      content: 'This is a mock blog post content...',
      excerpt: 'Mock excerpt...',
      slug,
      author: 'Reddit Content Platform',
      publishedAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      tags: ['Mock', 'Development'],
      category: 'Development',
      readingTime: 3,
      featured: false,
      metadata: {},
    };
  },

  async searchPosts(params: { query: string }): Promise<SearchResponse> {
    return {
      results: [],
      total: 0,
      query: params.query,
      page: 1,
      pageSize: 10,
    };
  },

  async getCategories(): Promise<CategoryResponse> {
    return {
      categories: [
        { name: 'Technology', slug: 'technology', count: 15 },
        { name: 'Gaming', slug: 'gaming', count: 12 },
        { name: 'Science', slug: 'science', count: 8 },
      ],
    };
  },

  async getTags(): Promise<TagResponse> {
    return {
      tags: [
        { name: 'AI', slug: 'ai', count: 10 },
        { name: 'Reddit', slug: 'reddit', count: 25 },
        { name: 'Trends', slug: 'trends', count: 18 },
      ],
    };
  },
};

// Export the appropriate client based on configuration
export default config.mockApi ? mockApiClient : apiClient;