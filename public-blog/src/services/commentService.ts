/**
 * Comment service for handling blog comments
 * Includes spam protection and moderation features
 */

import { config } from '@/config/env';
import type { 
  Comment, 
  CommentFormData, 
  CommentSubmissionResponse, 
  CommentStats,
  CommentFilters
} from '@/types/comments';

export class CommentService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.cache = new Map();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Comment API error:', error);
      throw error;
    }
  }

  // Get comments for a specific post
  async getComments(postId: string, filters?: CommentFilters): Promise<Comment[]> {
    const cacheKey = `comments-${postId}-${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached.data;
    }

    const searchParams = new URLSearchParams();
    if (filters?.status) searchParams.set('status', filters.status);
    if (filters?.sortBy) searchParams.set('sort_by', filters.sortBy);
    if (filters?.sortOrder) searchParams.set('sort_order', filters.sortOrder);

    const endpoint = `/public/posts/${postId}/comments${searchParams.toString() ? `?${searchParams}` : ''}`;
    const comments = await this.request<Comment[]>(endpoint);
    
    // Cache the result
    this.cache.set(cacheKey, { data: comments, timestamp: Date.now() });
    
    return comments;
  }

  // Submit a new comment
  async submitComment(postId: string, commentData: CommentFormData): Promise<CommentSubmissionResponse> {
    // Client-side validation
    const validation = this.validateComment(commentData);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.map(e => e.message).join(', ')
      };
    }

    // Spam protection - honeypot check
    if (this.isSpam(commentData)) {
      return {
        success: false,
        message: 'Comment rejected by spam filter'
      };
    }

    try {
      const response = await this.request<CommentSubmissionResponse>(`/public/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          ...commentData,
          timestamp: Date.now(), // For rate limiting
          userAgent: navigator.userAgent,
          referrer: document.referrer
        }),
      });

      // Clear cache for this post
      this.clearPostCache(postId);
      
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit comment'
      };
    }
  }

  // Like/unlike a comment
  async toggleCommentLike(commentId: string): Promise<{ success: boolean; likeCount: number }> {
    try {
      const response = await this.request<{ success: boolean; likeCount: number }>(
        `/public/comments/${commentId}/like`,
        { method: 'POST' }
      );
      
      // Clear relevant caches
      this.clearCache();
      
      return response;
    } catch (error) {
      return {
        success: false,
        likeCount: 0
      };
    }
  }

  // Report a comment as spam
  async reportComment(commentId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>(
        `/public/comments/${commentId}/report`,
        {
          method: 'POST',
          body: JSON.stringify({ reason })
        }
      );
    } catch (error) {
      return {
        success: false,
        message: 'Failed to report comment'
      };
    }
  }

  // Get comment statistics for a post
  async getCommentStats(postId: string): Promise<CommentStats> {
    try {
      return await this.request<CommentStats>(`/public/posts/${postId}/comments/stats`);
    } catch (error) {
      return {
        total: 0,
        approved: 0,
        pending: 0,
        spam: 0
      };
    }
  }

  // Client-side comment validation
  protected validateComment(data: CommentFormData): { isValid: boolean; errors: Array<{ field: keyof CommentFormData; message: string }> } {
    const errors: Array<{ field: keyof CommentFormData; message: string }> = [];

    // Name validation
    if (!data.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (data.name.length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    } else if (data.name.length > 50) {
      errors.push({ field: 'name', message: 'Name must be less than 50 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Website validation (optional)
    if (data.website && data.website.trim()) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(data.website)) {
        errors.push({ field: 'website', message: 'Please enter a valid URL (including http:// or https://)' });
      }
    }

    // Content validation
    if (!data.content.trim()) {
      errors.push({ field: 'content', message: 'Comment content is required' });
    } else if (data.content.length < 10) {
      errors.push({ field: 'content', message: 'Comment must be at least 10 characters' });
    } else if (data.content.length > 2000) {
      errors.push({ field: 'content', message: 'Comment must be less than 2000 characters' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Basic spam detection
  private isSpam(data: CommentFormData): boolean {
    const spamKeywords = [
      'viagra', 'casino', 'lottery', 'winner', 'congratulations',
      'click here', 'free money', 'make money fast', 'work from home'
    ];

    const content = data.content.toLowerCase();
    const name = data.name.toLowerCase();
    
    // Check for spam keywords
    const hasSpamKeywords = spamKeywords.some(keyword => 
      content.includes(keyword) || name.includes(keyword)
    );

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    const hasExcessiveLinks = linkCount > 2;

    // Check for repeated characters
    const hasRepeatedChars = /(.)\1{4,}/.test(content);

    // Check for all caps (more than 50% of content)
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const isAllCaps = capsCount > content.length * 0.5 && content.length > 20;

    return hasSpamKeywords || hasExcessiveLinks || hasRepeatedChars || isAllCaps;
  }

  // Clear cache for a specific post
  private clearPostCache(postId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`comments-${postId}`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  private clearCache(): void {
    this.cache.clear();
  }
}

// Mock service for development
export class MockCommentService extends CommentService {
  private mockComments: Comment[] = [
    {
      id: '1',
      postId: 'sample-post',
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff'
      },
      content: 'This is a great article! Thanks for sharing these insights about Reddit trends.',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      status: 'approved',
      isEdited: false,
      likeCount: 5,
      replies: [
        {
          id: '2',
          postId: 'sample-post',
          parentId: '1',
          author: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=7C3AED&color=fff'
          },
          content: 'I agree! The data visualization is particularly helpful.',
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
          status: 'approved',
          isEdited: false,
          likeCount: 2
        }
      ]
    },
    {
      id: '3',
      postId: 'sample-post',
      author: {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        website: 'https://mikejohnson.dev',
        avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=059669&color=fff'
      },
      content: 'Would love to see more analysis on gaming subreddits. The trends there are fascinating!',
      createdAt: '2024-01-15T14:20:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      status: 'approved',
      isEdited: false,
      likeCount: 3
    }
  ];

  override async getComments(postId: string): Promise<Comment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockComments.filter(comment => comment.postId === postId);
  }

  override async submitComment(postId: string, commentData: CommentFormData): Promise<CommentSubmissionResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate comment
    const validation = this.validateComment(commentData);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.map(e => e.message).join(', ')
      };
    }

    // Create new comment
    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      ...(commentData.parentId && { parentId: commentData.parentId }),
      author: {
        name: commentData.name,
        email: commentData.email,
        ...(commentData.website && { website: commentData.website }),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(commentData.name)}&background=random&color=fff`
      },
      content: commentData.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'approved', // In real app, might be 'pending'
      isEdited: false,
      likeCount: 0
    };

    // Add to mock data
    if (commentData.parentId) {
      // Find parent comment and add as reply
      const parentComment = this.mockComments.find(c => c.id === commentData.parentId);
      if (parentComment) {
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(newComment);
      }
    } else {
      this.mockComments.push(newComment);
    }

    return {
      success: true,
      comment: newComment,
      message: 'Comment submitted successfully!',
      requiresModeration: false
    };
  }

  override async toggleCommentLike(commentId: string): Promise<{ success: boolean; likeCount: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const comment = this.findCommentById(commentId);
    if (comment) {
      comment.likeCount += comment.isLiked ? -1 : 1;
      comment.isLiked = !comment.isLiked;
      return {
        success: true,
        likeCount: comment.likeCount
      };
    }
    
    return { success: false, likeCount: 0 };
  }

  private findCommentById(id: string): Comment | undefined {
    for (const comment of this.mockComments) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const reply = comment.replies.find(r => r.id === id);
        if (reply) return reply;
      }
    }
    return undefined;
  }
}

// Export the appropriate service based on configuration
export const commentService = config.mockApi ? new MockCommentService() : new CommentService();