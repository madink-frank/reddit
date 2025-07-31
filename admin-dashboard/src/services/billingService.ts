import { apiClient } from './api';

export interface UserBilling {
  user_id: number;
  current_points: number;
  total_spent: number;
  total_purchased: number;
  daily_limit?: number;
  monthly_limit?: number;
  low_balance_threshold: number;
  notifications_enabled: boolean;
}

export interface PointTransaction {
  id: number;
  user_billing_id: number;
  transaction_type: string;
  operation_type?: string;
  amount: number;
  balance_after: number;
  description?: string;
  reference_id?: string;
  status: string;
  created_at: string;
  processed_at?: string;
}

export interface TransactionHistory {
  transactions: PointTransaction[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface OperationBreakdown {
  operations: number;
  points: number;
}

export interface DailyUsage {
  date: string;
  operations: number;
  points: number;
}

export interface UsageAnalytics {
  period_days: number;
  total_operations: number;
  total_points_used: number;
  avg_daily_operations: number;
  avg_daily_points: number;
  operation_breakdown: Record<string, OperationBreakdown>;
  daily_usage: DailyUsage[];
}

export interface AddPointsRequest {
  amount: number;
  description?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
}

export interface DeductPointsRequest {
  operation_type: string;
  amount?: number;
  description?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
}

export interface SpendingLimitsRequest {
  daily_limit?: number;
  monthly_limit?: number;
}

export interface SpendingLimitsResponse {
  daily_limit?: number;
  monthly_limit?: number;
  low_balance_threshold: number;
  notifications_enabled: boolean;
}

export interface OperationCosts {
  operation_costs: Record<string, number>;
  currency: string;
  description: string;
}

export interface SpendingLimitCheck {
  can_proceed: boolean;
  warnings: Array<Record<string, any>>;
  limits_exceeded: Array<Record<string, any>>;
}

class BillingService {
  private readonly baseUrl = '/billing';

  /**
   * Get current user's billing information and point balance
   */
  async getUserBalance(): Promise<UserBilling> {
    const response = await apiClient.get<{ data: UserBilling }>(`${this.baseUrl}/balance`);
    return response.data;
  }

  /**
   * Add points to user's account
   */
  async addPoints(request: AddPointsRequest): Promise<PointTransaction> {
    const response = await apiClient.post<{ data: PointTransaction }>(`${this.baseUrl}/add-points`, request);
    return response.data;
  }

  /**
   * Deduct points for an operation
   */
  async deductPoints(request: DeductPointsRequest): Promise<PointTransaction> {
    const response = await apiClient.post<{ data: PointTransaction }>(`${this.baseUrl}/deduct-points`, request);
    return response.data;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    limit: number = 50,
    offset: number = 0,
    transactionType?: string
  ): Promise<TransactionHistory> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (transactionType) {
      params.append('transaction_type', transactionType);
    }

    const response = await apiClient.get<{ data: TransactionHistory }>(
      `${this.baseUrl}/transactions?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(days: number = 30): Promise<UsageAnalytics> {
    const response = await apiClient.get<{ data: UsageAnalytics }>(
      `${this.baseUrl}/usage-analytics?days=${days}`
    );
    return response.data;
  }

  /**
   * Update spending limits
   */
  async updateSpendingLimits(request: SpendingLimitsRequest): Promise<SpendingLimitsResponse> {
    const response = await apiClient.post<{ data: SpendingLimitsResponse }>(
      `${this.baseUrl}/spending-limits`,
      request
    );
    return response.data;
  }

  /**
   * Check if operation would exceed spending limits
   */
  async checkSpendingLimits(amount: number): Promise<SpendingLimitCheck> {
    const response = await apiClient.post<{ data: SpendingLimitCheck }>(
      `${this.baseUrl}/check-spending-limits`,
      { amount }
    );
    return response.data;
  }

  /**
   * Get operation costs
   */
  async getOperationCosts(): Promise<OperationCosts> {
    const response = await apiClient.get<{ data: OperationCosts }>(`${this.baseUrl}/operation-costs`);
    return response.data;
  }

  /**
   * Format points for display
   */
  formatPoints(points: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(points);
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Get transaction type display name
   */
  getTransactionTypeDisplay(type: string): string {
    const typeMap: Record<string, string> = {
      purchase: 'Purchase',
      deduction: 'Usage',
      refund: 'Refund',
      bonus: 'Bonus',
    };
    return typeMap[type] || type;
  }

  /**
   * Get operation type display name
   */
  getOperationTypeDisplay(type?: string): string {
    if (!type) return 'N/A';

    const typeMap: Record<string, string> = {
      crawling_post: 'Post Crawling',
      crawling_comment: 'Comment Crawling',
      nlp_sentiment: 'Sentiment Analysis',
      nlp_morphological: 'Morphological Analysis',
      nlp_similarity: 'Text Similarity',
      nlp_keywords: 'Keyword Extraction',
      image_object_detection: 'Object Detection',
      image_ocr: 'OCR Processing',
      image_classification: 'Image Classification',
      export_excel: 'Excel Export',
      export_csv: 'CSV Export',
      export_pdf: 'PDF Export',
    };

    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get status color for transaction status
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      completed: 'text-green-600',
      pending: 'text-yellow-600',
      failed: 'text-red-600',
      cancelled: 'text-gray-600',
    };
    return colorMap[status] || 'text-gray-600';
  }

  /**
   * Check if balance is low
   */
  isBalanceLow(balance: number, threshold: number): boolean {
    return balance <= threshold;
  }

  /**
   * Get balance status
   */
  getBalanceStatus(balance: number, threshold: number): 'low' | 'normal' | 'good' {
    if (balance <= threshold) return 'low';
    if (balance <= threshold * 2) return 'normal';
    return 'good';
  }
}

export const billingService = new BillingService();