// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Authentication Types
export interface User {
  id: number;
  reddit_id: string;
  username: string;
  email?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  role?: string;
  is_admin?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  code: string;
  state: string;
}

// Keyword Types
export interface Keyword {
  id: number;
  keyword: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  post_count: number;
}

export interface KeywordCreate {
  keyword: string;
  description?: string;
}

export interface KeywordUpdate {
  keyword?: string;
  description?: string;
  is_active?: boolean;
}

// Post Types
export interface Post {
  id: number;
  reddit_id: string;
  title: string;
  content?: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: string;
  crawled_at: string;
  keyword_id: number;
}

export interface PostSearchParams {
  sort_order: any;
  sort_by: any;
  query?: string;
  keyword_ids?: number[];
  subreddits?: string[];
  date_from?: string;
  date_to?: string;
  min_score?: number;
  page?: number;
  page_size?: number;
}

// Content Generation Types
export interface GeneratedContent {
  id: number;
  title: string;
  content_type: 'blog' | 'product_intro' | 'trend_analysis';
  content: string;
  template_used?: string;
  source_keywords: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ContentGenerateRequest {
  content_type: 'blog' | 'product_intro' | 'trend_analysis';
  keyword_ids: number[];
  template_id?: number;
  custom_prompt?: string;
}

// Analytics Types
export interface TrendData {
  keyword: string;
  mentions: number;
  change_percentage: number;
  time_period: string;
}

export interface KeywordStats {
  keyword_id: number;
  keyword: string;
  total_posts: number;
  avg_score: number;
  top_subreddits: string[];
  recent_activity: number;
}

export interface DashboardStats {
  active_keywords_count: number;
  active_keywords_change: number;
  total_posts_count: number;
  total_posts_change: number;
  active_crawling_count: number;
  active_crawling_change: number;
  generated_content_count: number;
  generated_content_change: number;
  trending_keywords: TrendData[];
}

// Crawling Types
export interface CrawlingJob {
  id: number;
  keyword_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  posts_collected: number;
}

export interface ProcessLog {
  id: number;
  process_type: string;
  status: 'running' | 'completed' | 'failed';
  details: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

// Chart Types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}

export interface FilterState {
  search: string;
  dateRange: {
    from?: string;
    to?: string;
  };
  status?: string[];
  tags?: string[];
}

// Re-export advanced dashboard types
export * from './advanced-dashboard';
export * from './interfaces';