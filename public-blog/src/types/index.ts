// Type definitions for the public blog application

// ============================================================================
// Blog Content Types
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  metadata: {
    readingTime: number;
    wordCount: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
  color?: string;
  icon?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  color?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchResult {
  posts: BlogPost[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchTime: number;
  suggestions?: string[];
}

// ============================================================================
// Request Parameters
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  category?: string;
  tags?: string[];
  sortBy?: 'publishedAt' | 'title' | 'readingTime' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterParams {
  categories?: string[];
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  readingTime?: {
    min: number;
    max: number;
  };
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
  external?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterSubscription {
  email: string;
  preferences?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    categories: string[];
  };
}

export interface CommentForm {
  name: string;
  email: string;
  website?: string;
  comment: string;
  parentId?: string;
}

// ============================================================================
// State Management Types (Zustand)
// ============================================================================

export interface AppState {
  theme: Theme['mode'];
  sidebarOpen: boolean;
  searchQuery: string;
  selectedCategories: string[];
  selectedTags: string[];
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedTags: (tags: string[]) => void;
  resetFilters: () => void;
}

export interface BlogState {
  posts: BlogPost[];
  categories: BlogCategory[];
  tags: BlogTag[];
  currentPost: BlogPost | null;
  loading: boolean;
  error: string | null;
  searchResults: SearchResult | null;
  setPosts: (posts: BlogPost[]) => void;
  setCategories: (categories: BlogCategory[]) => void;
  setTags: (tags: BlogTag[]) => void;
  setCurrentPost: (post: BlogPost | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: SearchResult | null) => void;
}

// ============================================================================
// React Query Types
// ============================================================================

export interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
}

export interface MutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export type ContentType = 'blog' | 'product_intro' | 'trend_analysis';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// ============================================================================
// SEO and Meta Types
// ============================================================================

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: number;
}

// ============================================================================
// RSS and Feed Types
// ============================================================================

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  language: string;
  lastBuildDate: string;
  items: RSSItem[];
}

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  categories?: string[];
  author?: string;
}

// ============================================================================
// Environment and Configuration Types
// ============================================================================

export interface AppConfig {
  apiUrl: string;
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    github?: string;
  };
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  features: {
    comments: boolean;
    newsletter: boolean;
    search: boolean;
    darkMode: boolean;
  };
}

// ============================================================================
// Re-exports from other type files
// ============================================================================

export type * from './api';
export type * from './react';
export type * from './hooks';
export type * from './utils';
export type * from './comments';
export type * from './subscription';
