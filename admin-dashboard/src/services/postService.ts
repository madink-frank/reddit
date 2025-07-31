import { apiClient } from './api';
import type { 
  Post, 
  PostSearchParams, 
  PaginatedResponse 
} from '../types';

export interface PostListParams extends PostSearchParams {
  sort_by?: 'created_utc' | 'score' | 'num_comments' | 'crawled_at';
  sort_order?: 'asc' | 'desc';
}

export interface TrendingPostsParams {
  time_period?: '1h' | '6h' | '24h' | '7d' | '30d';
  limit?: number;
  subreddits?: string[];
}

export class PostService {
  /**
   * Get paginated list of posts with search and filtering
   */
  async getPosts(params?: PostListParams): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>('/posts', { params });
  }

  /**
   * Get post by ID
   */
  async getPost(id: number): Promise<Post> {
    return apiClient.get<Post>(`/posts/${id}`);
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(params?: TrendingPostsParams): Promise<Post[]> {
    return apiClient.get<Post[]>('/posts/trending', { params });
  }

  /**
   * Search posts with full-text search
   */
  async searchPosts(query: string, params?: Omit<PostListParams, 'query'>): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>('/posts/search', { 
      params: { query, ...params } 
    });
  }

  /**
   * Get posts by keyword
   */
  async getPostsByKeyword(keywordId: number, params?: Omit<PostListParams, 'keyword_ids'>): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>(`/posts/keyword/${keywordId}`, { params });
  }

  /**
   * Get posts by subreddit
   */
  async getPostsBySubreddit(subreddit: string, params?: Omit<PostListParams, 'subreddits'>): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>(`/posts/subreddit/${subreddit}`, { params });
  }

  /**
   * Get post statistics
   */
  async getPostStats(): Promise<{
    total_posts: number;
    posts_today: number;
    avg_score: number;
    top_subreddits: Array<{ subreddit: string; count: number }>;
  }> {
    return apiClient.get('/posts/stats');
  }

  /**
   * Get subreddit list with post counts
   */
  async getSubreddits(): Promise<Array<{ subreddit: string; post_count: number }>> {
    return apiClient.get('/posts/subreddits');
  }

  /**
   * Delete post (admin only)
   */
  async deletePost(id: number): Promise<void> {
    return apiClient.delete(`/posts/${id}`);
  }

  /**
   * Bulk delete posts (admin only)
   */
  async bulkDeletePosts(ids: number[]): Promise<{ deleted_count: number }> {
    return apiClient.post('/posts/bulk-delete', { post_ids: ids });
  }

  /**
   * Export posts to CSV
   */
  async exportPosts(params?: PostListParams, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/posts/export?format=${format}`, {
      params,
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export const postService = new PostService();