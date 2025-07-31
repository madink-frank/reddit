// API-specific type definitions

import type { BlogPost, BlogCategory, BlogTag, PaginationParams, SearchParams } from './index';

// ============================================================================
// API Client Types
// ============================================================================

export interface ApiClient {
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
  post<T>(url: string, data?: any): Promise<T>;
  put<T>(url: string, data?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiRequestConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retries: number;
  retryDelay: number;
}

// ============================================================================
// API Endpoints
// ============================================================================

export interface BlogApiEndpoints {
  // Posts
  getPosts: (params?: SearchParams) => Promise<{ posts: BlogPost[]; total: number }>;
  getPost: (slug: string) => Promise<BlogPost>;
  getRelatedPosts: (postId: string, limit?: number) => Promise<BlogPost[]>;
  
  // Categories
  getCategories: () => Promise<BlogCategory[]>;
  getCategory: (slug: string) => Promise<BlogCategory>;
  getCategoryPosts: (slug: string, params?: PaginationParams) => Promise<{ posts: BlogPost[]; total: number }>;
  
  // Tags
  getTags: () => Promise<BlogTag[]>;
  getTag: (slug: string) => Promise<BlogTag>;
  getTagPosts: (slug: string, params?: PaginationParams) => Promise<{ posts: BlogPost[]; total: number }>;
  
  // Search
  searchPosts: (params: SearchParams) => Promise<{ posts: BlogPost[]; total: number; searchTime: number }>;
  getSearchSuggestions: (query: string) => Promise<string[]>;
  
  // RSS
  getRSSFeed: () => Promise<string>;
  
  // Sitemap
  getSitemap: () => Promise<string>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetPostsRequest extends SearchParams {}

export interface GetPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetPostRequest {
  slug: string;
}

export interface GetPostResponse extends BlogPost {}

export interface SearchPostsRequest extends SearchParams {
  query: string;
}

export interface SearchPostsResponse {
  posts: BlogPost[];
  total: number;
  searchTime: number;
  suggestions: string[];
  page: number;
  totalPages: number;
}

export type GetCategoriesResponse = {
  categories: BlogCategory[];
};

export type GetTagsResponse = {
  tags: BlogTag[];
};

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

// ============================================================================
// HTTP Client Types
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  signal?: AbortSignal;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}