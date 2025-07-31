import { apiClient } from './api';
import type { 
  GeneratedContent, 
  ContentGenerateRequest, 
  PaginatedResponse 
} from '../types';

export interface ContentListParams {
  page?: number;
  page_size?: number;
  content_type?: 'blog' | 'product_intro' | 'trend_analysis';
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'title' | 'content_type';
  sort_order?: 'asc' | 'desc';
}

export interface ContentTemplate {
  id: number;
  name: string;
  content_type: 'blog' | 'product_intro' | 'trend_analysis';
  template: string;
  variables: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ContentGenerationStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimated_completion?: string;
  error_message?: string;
}

export class ContentService {
  /**
   * Generate new content
   */
  async generateContent(request: ContentGenerateRequest): Promise<{
    job_id: string;
    estimated_completion: string;
    message: string;
  }> {
    return apiClient.post('/content/generate', request);
  }

  /**
   * Get content generation status
   */
  async getGenerationStatus(jobId: string): Promise<ContentGenerationStatus> {
    return apiClient.get(`/content/generation/${jobId}/status`);
  }

  /**
   * Get paginated list of generated content
   */
  async getContent(params?: ContentListParams): Promise<PaginatedResponse<GeneratedContent>> {
    return apiClient.get('/content', { params });
  }

  /**
   * Get content by ID
   */
  async getContentById(id: number): Promise<GeneratedContent> {
    return apiClient.get(`/content/${id}`);
  }

  /**
   * Update content
   */
  async updateContent(id: number, data: {
    title?: string;
    content?: string;
    metadata?: Record<string, unknown>;
  }): Promise<GeneratedContent> {
    return apiClient.put(`/content/${id}`, data);
  }

  /**
   * Delete content
   */
  async deleteContent(id: number): Promise<void> {
    return apiClient.delete(`/content/${id}`);
  }

  /**
   * Bulk delete content
   */
  async bulkDeleteContent(ids: number[]): Promise<{ deleted_count: number }> {
    return apiClient.post('/content/bulk-delete', { content_ids: ids });
  }

  /**
   * Get content templates
   */
  async getTemplates(): Promise<ContentTemplate[]> {
    return apiClient.get('/content/templates');
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: number): Promise<ContentTemplate> {
    return apiClient.get(`/content/templates/${id}`);
  }

  /**
   * Create new template
   */
  async createTemplate(data: {
    name: string;
    content_type: 'blog' | 'product_intro' | 'trend_analysis';
    template: string;
    description?: string;
  }): Promise<ContentTemplate> {
    return apiClient.post('/content/templates', data);
  }

  /**
   * Update template
   */
  async updateTemplate(id: number, data: Partial<ContentTemplate>): Promise<ContentTemplate> {
    return apiClient.put(`/content/templates/${id}`, data);
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: number): Promise<void> {
    return apiClient.delete(`/content/templates/${id}`);
  }

  /**
   * Preview content generation
   */
  async previewContent(request: ContentGenerateRequest): Promise<{
    preview: string;
    word_count: number;
    estimated_reading_time: number;
  }> {
    return apiClient.post('/content/preview', request);
  }

  /**
   * Get content statistics
   */
  async getContentStats(): Promise<{
    total_content: number;
    content_by_type: Record<string, number>;
    content_today: number;
    avg_generation_time: number;
    success_rate: number;
  }> {
    return apiClient.get('/content/stats');
  }

  /**
   * Export content
   */
  async exportContent(
    ids?: number[],
    format: 'markdown' | 'html' | 'pdf' | 'json' = 'markdown'
  ): Promise<Blob> {
    const response = await apiClient.post(`/content/export?format=${format}`, {
      content_ids: ids,
    }, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  /**
   * Duplicate content
   */
  async duplicateContent(id: number): Promise<GeneratedContent> {
    return apiClient.post(`/content/${id}/duplicate`);
  }

  /**
   * Get content history/versions
   */
  async getContentHistory(id: number): Promise<Array<{
    version: number;
    content: string;
    created_at: string;
    changes_summary: string;
  }>> {
    return apiClient.get(`/content/${id}/history`);
  }
}

export const contentService = new ContentService();