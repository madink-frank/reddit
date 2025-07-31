import { apiClient } from './api';
import type { 
  Keyword, 
  KeywordCreate, 
  KeywordUpdate, 
  KeywordStats,
  PaginatedResponse 
} from '../types';

export interface KeywordListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  sort_by?: 'created_at' | 'keyword' | 'post_count';
  sort_order?: 'asc' | 'desc';
}

export class KeywordService {
  /**
   * Get paginated list of keywords
   */
  async getKeywords(params?: KeywordListParams): Promise<PaginatedResponse<Keyword>> {
    return apiClient.get<PaginatedResponse<Keyword>>('/keywords', { params });
  }

  /**
   * Get keyword by ID
   */
  async getKeyword(id: number): Promise<Keyword> {
    return apiClient.get<Keyword>(`/keywords/${id}`);
  }

  /**
   * Create new keyword
   */
  async createKeyword(data: KeywordCreate): Promise<Keyword> {
    return apiClient.post<Keyword>('/keywords', data);
  }

  /**
   * Update keyword
   */
  async updateKeyword(id: number, data: KeywordUpdate): Promise<Keyword> {
    return apiClient.put<Keyword>(`/keywords/${id}`, data);
  }

  /**
   * Delete keyword
   */
  async deleteKeyword(id: number): Promise<void> {
    return apiClient.delete(`/keywords/${id}`);
  }

  /**
   * Bulk delete keywords
   */
  async bulkDeleteKeywords(ids: number[]): Promise<{ deleted_count: number }> {
    return apiClient.post('/keywords/bulk-delete', { keyword_ids: ids });
  }

  /**
   * Bulk update keywords (activate/deactivate)
   */
  async bulkUpdateKeywords(ids: number[], updates: Partial<KeywordUpdate>): Promise<{ updated_count: number }> {
    return apiClient.post('/keywords/bulk-update', { keyword_ids: ids, updates });
  }

  /**
   * Get keyword statistics
   */
  async getKeywordStats(id: number): Promise<KeywordStats> {
    return apiClient.get<KeywordStats>(`/keywords/${id}/stats`);
  }

  /**
   * Get all keywords statistics
   */
  async getAllKeywordsStats(): Promise<KeywordStats[]> {
    return apiClient.get<KeywordStats[]>('/keywords/stats');
  }

  /**
   * Check if keyword exists
   */
  async checkKeywordExists(keyword: string): Promise<{ exists: boolean; keyword_id?: number }> {
    return apiClient.get('/keywords/check', { params: { keyword } });
  }

  /**
   * Export keywords to CSV
   */
  async exportKeywords(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/keywords/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export const keywordService = new KeywordService();