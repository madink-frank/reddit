import { apiClient } from './api';
import type {
  ExportRequest,
  ExportResult} from '../types/advanced-dashboard';

// Export service for multi-format data export functionality
export class ExportService {
  private baseUrl = '/export';

  // ============================================================================
  // Multi-format Export Methods
  // ============================================================================

  /**
   * Create a new export request
   */
  async createExport(request: Omit<ExportRequest, 'id'>): Promise<ExportResult> {
    const response = await apiClient.post<ExportResult>(`${this.baseUrl}/create`, request);
    return response;
  }

  /**
   * Get export status and result
   */
  async getExportStatus(exportId: string): Promise<ExportResult> {
    const response = await apiClient.get<ExportResult>(`${this.baseUrl}/${exportId}/status`);
    return response;
  }

  /**
   * Download export file
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${apiClient.getBaseURL()}${this.baseUrl}/${exportId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Cancel an ongoing export
   */
  async cancelExport(exportId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${exportId}/cancel`);
  }

  /**
   * Get list of user's exports
   */
  async getExportHistory(limit = 50, offset = 0): Promise<ExportResult[]> {
    const response = await apiClient.get<ExportResult[]>(`${this.baseUrl}/history`, {
      params: { limit, offset }
    });
    return response;
  }

  // ============================================================================
  // Excel Export with Formatting and Charts
  // ============================================================================

  /**
   * Export posts data to Excel with formatting
   */
  async exportPostsToExcel(options: {
    filters?: ExportRequest['filters'];
    includeAnalysis?: boolean;
    includeCharts?: boolean;
    worksheetName?: string;
  } = {}): Promise<ExportResult> {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: 'posts',
      format: 'excel',
      filters: options.filters,
      options: {
        includeAnalysis: options.includeAnalysis ?? true,
        includeMetadata: true,
        maxRecords: 10000,
      },
    };

    return this.createExport(request);
  }

  /**
   * Export NLP analysis results to Excel
   */
  async exportNLPAnalysisToExcel(options: {
    filters?: ExportRequest['filters'];
    includeCharts?: boolean;
    analysisTypes?: string[];
  } = {}): Promise<ExportResult> {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: 'analysis',
      format: 'excel',
      filters: {
        ...options.filters,
        analysisTypes: options.analysisTypes || ['sentiment', 'morphological', 'keywords'],
      },
      options: {
        includeAnalysis: true,
        includeMetadata: true,
      },
    };

    return this.createExport(request);
  }

  /**
   * Export image analysis results to Excel
   */
  async exportImageAnalysisToExcel(options: {
    filters?: ExportRequest['filters'];
    includeImages?: boolean;
  } = {}): Promise<ExportResult> {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: 'images',
      format: 'excel',
      filters: options.filters,
      options: {
        includeImages: options.includeImages ?? false,
        includeAnalysis: true,
        includeMetadata: true,
      },
    };

    return this.createExport(request);
  }

  /**
   * Export billing and usage data to Excel
   */
  async exportBillingToExcel(options: {
    dateRange?: { start: Date; end: Date };
    includeCharts?: boolean;
  } = {}): Promise<ExportResult> {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: 'reports',
      format: 'excel',
      filters: {
        dateRange: options.dateRange,
      },
      options: {
        includeAnalysis: true,
        includeMetadata: true,
      },
    };

    return this.createExport(request);
  }

  // ============================================================================
  // CSV Export with Customizable Field Selection
  // ============================================================================

  /**
   * Export data to CSV with customizable fields
   */
  async exportToCSV(options: {
    dataType: ExportRequest['dataType'];
    fields?: string[];
    filters?: ExportRequest['filters'];
    delimiter?: ',' | ';' | '\t';
    includeHeaders?: boolean;
  }): Promise<ExportResult> {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: options.dataType,
      format: 'csv',
      filters: options.filters,
      options: {
        includeMetadata: options.includeHeaders ?? true,
        maxRecords: 50000, // Higher limit for CSV
      },
    };

    return this.createExport(request);
  }

  /**
   * Get available fields for CSV export
   */
  async getAvailableFields(dataType: ExportRequest['dataType']): Promise<{
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    description?: string;
  }[]> {
    const response = await apiClient.get<any>(`${this.baseUrl}/fields/${dataType}`);
    return response;
  }

  // ============================================================================
  // PDF Report Generation with Visualizations
  // ============================================================================

  /**
   * Generate PDF report with visualizations
   */
  async generatePDFReport(options: {
    title: string;
    sections: {
      type: 'summary' | 'chart' | 'table' | 'analysis';
      title: string;
      data?: any;
      chartType?: 'line' | 'bar' | 'pie';
      options?: Record<string, any>;
    }[];
    filters?: ExportRequest['filters'];
    template?: 'standard' | 'executive' | 'detailed';
  }): Promise<ExportResult> {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: 'reports',
      format: 'pdf',
      filters: options.filters,
      options: {
        includeAnalysis: true,
        includeImages: true,
        includeMetadata: true,
      },
    };

    return this.createExport(request);
  }

  /**
   * Generate sentiment analysis PDF report
   */
  async generateSentimentReport(options: {
    dateRange?: { start: Date; end: Date };
    keywords?: string[];
    subreddits?: string[];
    includeCharts?: boolean;
  } = {}): Promise<ExportResult> {
    return this.generatePDFReport({
      title: 'Sentiment Analysis Report',
      sections: [
        { type: 'summary', title: 'Executive Summary' },
        { type: 'chart', title: 'Sentiment Timeline', chartType: 'line' },
        { type: 'chart', title: 'Sentiment Distribution', chartType: 'pie' },
        { type: 'table', title: 'Detailed Analysis' },
      ],
      filters: {
        dateRange: options.dateRange,
        keywords: options.keywords,
        subreddits: options.subreddits,
      },
      template: 'standard',
    });
  }

  /**
   * Generate crawling performance PDF report
   */
  async generateCrawlingReport(options: {
    dateRange?: { start: Date; end: Date };
    jobIds?: string[];
  } = {}): Promise<ExportResult> {
    return this.generatePDFReport({
      title: 'Crawling Performance Report',
      sections: [
        { type: 'summary', title: 'Performance Overview' },
        { type: 'chart', title: 'Success Rate Trends', chartType: 'line' },
        { type: 'chart', title: 'Data Collection Volume', chartType: 'bar' },
        { type: 'table', title: 'Job Details' },
      ],
      filters: {
        dateRange: options.dateRange,
      },
      template: 'detailed',
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get export templates
   */
  async getExportTemplates(): Promise<{
    id: string;
    name: string;
    description: string;
    format: ExportRequest['format'];
    dataType: ExportRequest['dataType'];
    defaultOptions: ExportRequest['options'];
  }[]> {
    const response = await apiClient.get<any>(`${this.baseUrl}/templates`);
    return response;
  }

  /**
   * Validate export request
   */
  async validateExportRequest(request: Omit<ExportRequest, 'id'>): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    estimatedSize?: number;
    estimatedTime?: number;
    pointsCost?: number;
  }> {
    const response = await apiClient.post<any>(`${this.baseUrl}/validate`, request);
    return response;
  }

  /**
   * Get export statistics
   */
  async getExportStats(): Promise<{
    totalExports: number;
    successRate: number;
    averageSize: number;
    averageTime: number;
    popularFormats: { format: string; count: number }[];
    recentActivity: { date: string; count: number }[];
  }> {
    const response = await apiClient.get<any>(`${this.baseUrl}/stats`);
    return response;
  }

  // ============================================================================
  // Client-side Export Utilities
  // ============================================================================

  /**
   * Download file from blob with proper filename
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix: string, format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}.${format}`;
  }

  /**
   * Format data for CSV export (client-side)
   */
  formatDataForCSV(data: any[], fields?: string[]): string {
    if (!data.length) return '';

    const selectedFields = fields || Object.keys(data[0]);
    const headers = selectedFields.join(',');

    const rows = data.map(item =>
      selectedFields.map(field => {
        const value = item[field];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Export data to JSON (client-side)
   */
  exportToJSON(data: any[], filename?: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const defaultFilename = filename || this.generateFilename('export', 'json');
    this.downloadBlob(blob, defaultFilename);
  }

  /**
   * Export data to CSV (client-side)
   */
  exportToCSVClient(data: any[], fields?: string[], filename?: string): void {
    const csvString = this.formatDataForCSV(data, fields);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const defaultFilename = filename || this.generateFilename('export', 'csv');
    this.downloadBlob(blob, defaultFilename);
  }
}

export const exportService = new ExportService();
export default exportService;