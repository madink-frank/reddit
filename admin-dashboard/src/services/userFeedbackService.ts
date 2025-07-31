/**
 * User Feedback Collection Service
 * Handles collection, storage, and analysis of user feedback
 */

export interface FeedbackData {
  id: string;
  userId?: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  category: string;
  title: string;
  description: string;
  rating?: number;
  metadata: {
    url: string;
    userAgent: string;
    timestamp: Date;
    sessionId: string;
    version: string;
  };
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  averageRating: number;
  responseTime: number;
  resolutionRate: number;
  trends: {
    period: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];
}

class UserFeedbackService {
  private feedbackStorage: FeedbackData[] = [];
  private analyticsCache: FeedbackAnalytics | null = null;

  /**
   * Submit new feedback
   */
  async submitFeedback(feedback: Omit<FeedbackData, 'id' | 'metadata' | 'status'>): Promise<string> {
    const feedbackData: FeedbackData = {
      ...feedback,
      id: this.generateId(),
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        version: process.env.REACT_APP_VERSION || '1.0.0'
      },
      status: 'new'
    };

    // Store feedback
    this.feedbackStorage.push(feedbackData);
    
    // Send to backend (in real implementation)
    await this.sendToBackend(feedbackData);
    
    // Trigger analytics update
    this.invalidateAnalyticsCache();
    
    // Send notification to admin
    this.notifyAdmins(feedbackData);
    
    return feedbackData.id;
  }

  /**
   * Get feedback analytics
   */
  async getFeedbackAnalytics(): Promise<FeedbackAnalytics> {
    if (this.analyticsCache) {
      return this.analyticsCache;
    }

    const analytics = this.calculateAnalytics();
    this.analyticsCache = analytics;
    
    return analytics;
  }

  /**
   * Get feedback by filters
   */
  async getFeedback(filters: {
    type?: string;
    status?: string;
    priority?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  } = {}): Promise<FeedbackData[]> {
    let filtered = [...this.feedbackStorage];

    if (filters.type) {
      filtered = filtered.filter(f => f.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(f => f.priority === filters.priority);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(f => 
        f.metadata.timestamp >= filters.dateRange!.start &&
        f.metadata.timestamp <= filters.dateRange!.end
      );
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered.sort((a, b) => 
      b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime()
    );
  }

  /**
   * Update feedback status
   */
  async updateFeedbackStatus(id: string, status: FeedbackData['status']): Promise<void> {
    const feedback = this.feedbackStorage.find(f => f.id === id);
    if (feedback) {
      feedback.status = status;
      await this.sendToBackend(feedback);
      this.invalidateAnalyticsCache();
    }
  }

  /**
   * Get user satisfaction metrics
   */
  async getSatisfactionMetrics(): Promise<{
    nps: number;
    csat: number;
    ces: number;
    trends: { date: string; score: number }[];
  }> {
    const ratedFeedback = this.feedbackStorage.filter(f => f.rating !== undefined);
    
    if (ratedFeedback.length === 0) {
      return { nps: 0, csat: 0, ces: 0, trends: [] };
    }

    // Calculate Net Promoter Score (NPS)
    const promoters = ratedFeedback.filter(f => f.rating! >= 9).length;
    const detractors = ratedFeedback.filter(f => f.rating! <= 6).length;
    const nps = ((promoters - detractors) / ratedFeedback.length) * 100;

    // Calculate Customer Satisfaction (CSAT)
    const satisfied = ratedFeedback.filter(f => f.rating! >= 7).length;
    const csat = (satisfied / ratedFeedback.length) * 100;

    // Calculate Customer Effort Score (CES) - simplified
    const avgRating = ratedFeedback.reduce((sum, f) => sum + f.rating!, 0) / ratedFeedback.length;
    const ces = (avgRating / 10) * 100;

    // Generate trends (last 30 days)
    const trends = this.generateSatisfactionTrends(ratedFeedback);

    return { nps, csat, ces, trends };
  }

  private calculateAnalytics(): FeedbackAnalytics {
    const total = this.feedbackStorage.length;
    
    const byType = this.feedbackStorage.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.feedbackStorage.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ratedFeedback = this.feedbackStorage.filter(f => f.rating !== undefined);
    const averageRating = ratedFeedback.length > 0 
      ? ratedFeedback.reduce((sum, f) => sum + f.rating!, 0) / ratedFeedback.length 
      : 0;

    const resolvedFeedback = this.feedbackStorage.filter(f => f.status === 'resolved').length;
    const resolutionRate = total > 0 ? (resolvedFeedback / total) * 100 : 0;

    // Calculate average response time (mock data)
    const responseTime = 24; // hours

    const trends = this.generateTrends();

    return {
      totalFeedback: total,
      byType,
      byCategory,
      averageRating,
      responseTime,
      resolutionRate,
      trends
    };
  }

  private generateTrends(): FeedbackAnalytics['trends'] {
    // Generate last 7 days trends
    const trends = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayFeedback = this.feedbackStorage.filter(f => {
        const feedbackDate = new Date(f.metadata.timestamp);
        return feedbackDate.toDateString() === date.toDateString();
      });

      const sentiment = this.calculateSentiment(dayFeedback);
      
      trends.push({
        period: date.toISOString().split('T')[0],
        count: dayFeedback.length,
        sentiment
      });
    }
    
    return trends;
  }

  private generateSatisfactionTrends(ratedFeedback: FeedbackData[]): { date: string; score: number }[] {
    const trends = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayFeedback = ratedFeedback.filter(f => {
        const feedbackDate = new Date(f.metadata.timestamp);
        return feedbackDate.toDateString() === date.toDateString();
      });

      const avgScore = dayFeedback.length > 0
        ? dayFeedback.reduce((sum, f) => sum + f.rating!, 0) / dayFeedback.length
        : 0;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        score: avgScore
      });
    }
    
    return trends;
  }

  private calculateSentiment(feedback: FeedbackData[]): 'positive' | 'neutral' | 'negative' {
    if (feedback.length === 0) return 'neutral';
    
    const avgRating = feedback
      .filter(f => f.rating !== undefined)
      .reduce((sum, f, _, arr) => sum + f.rating! / arr.length, 0);
    
    if (avgRating >= 7) return 'positive';
    if (avgRating >= 4) return 'neutral';
    return 'negative';
  }

  private async sendToBackend(feedback: FeedbackData): Promise<void> {
    // In real implementation, send to backend API
    console.log('Sending feedback to backend:', feedback.id);
  }

  private notifyAdmins(feedback: FeedbackData): void {
    if (feedback.priority === 'critical' || feedback.type === 'bug') {
      // Send immediate notification to admins
      console.log('Notifying admins of critical feedback:', feedback.id);
    }
  }

  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('feedback_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('feedback_session_id', sessionId);
    }
    return sessionId;
  }

  private invalidateAnalyticsCache(): void {
    this.analyticsCache = null;
  }
}

export const userFeedbackService = new UserFeedbackService();