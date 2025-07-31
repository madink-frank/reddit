/**
 * Notification Service
 * Handles new post notifications and user engagement features
 */

import { config } from '@/config/env';
// import { subscriptionService } from './subscriptionService';
import type { WebPushNotification } from '@/types/subscription';

export interface NewPostNotification {
  postId: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  url: string;
  imageUrl?: string;
}

export interface NotificationPreferences {
  immediate: boolean;
  digest: boolean;
  categories: string[];
  tags: string[];
  minEngagement?: number; // Minimum engagement score to notify
}

export class NotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
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
      console.error('Notification API error:', error);
      throw error;
    }
  }

  // Send new post notification to subscribers
  async notifyNewPost(post: NewPostNotification): Promise<{ success: boolean; notificationsSent: number }> {
    try {
      return await this.request<{ success: boolean; notificationsSent: number }>(
        '/admin/notifications/new-post',
        {
          method: 'POST',
          body: JSON.stringify(post),
        }
      );
    } catch (error) {
      console.error('Failed to send new post notifications:', error);
      return { success: false, notificationsSent: 0 };
    }
  }

  // Send trending post notification
  async notifyTrendingPost(post: NewPostNotification): Promise<{ success: boolean; notificationsSent: number }> {
    try {
      return await this.request<{ success: boolean; notificationsSent: number }>(
        '/admin/notifications/trending-post',
        {
          method: 'POST',
          body: JSON.stringify(post),
        }
      );
    } catch (error) {
      console.error('Failed to send trending post notifications:', error);
      return { success: false, notificationsSent: 0 };
    }
  }

  // Send personalized digest
  async sendPersonalizedDigest(
    email: string,
    posts: NewPostNotification[],
    preferences: NotificationPreferences
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>(
        '/admin/notifications/personalized-digest',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            posts,
            preferences
          }),
        }
      );
    } catch (error) {
      console.error('Failed to send personalized digest:', error);
      return { success: false, message: 'Failed to send digest' };
    }
  }

  // Get notification analytics
  async getNotificationAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalSent: number;
    emailsSent: number;
    pushNotificationsSent: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
    topPerformingPosts: Array<{
      postId: string;
      title: string;
      opens: number;
      clicks: number;
      engagementRate: number;
    }>;
  }> {
    try {
      return await this.request<any>(`/admin/notifications/analytics?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to get notification analytics:', error);
      return {
        totalSent: 0,
        emailsSent: 0,
        pushNotificationsSent: 0,
        openRate: 0,
        clickRate: 0,
        unsubscribeRate: 0,
        topPerformingPosts: []
      };
    }
  }

  // Client-side notification helpers
  async showBrowserNotification(
    title: string,
    options: Partial<WebPushNotification> = {}
  ): Promise<void> {
    if (!('Notification' in window)) {
      throw new Error('Browser notifications not supported');
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    const notification = new Notification(title, {
      ...(options.body && { body: options.body }),
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/badge-72x72.png',
      tag: options.tag || 'blog-notification',
      requireInteraction: options.requireInteraction || false,
      // image: options.image, // Not supported in standard Notification API
      ...(options.url && { data: { url: options.url } })
    });

    // Handle notification click
    notification.onclick = () => {
      if (options.url) {
        window.open(options.url, '_blank');
      }
      notification.close();
    };

    // Auto-close after 8 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 8000);
    }
  }

  // Schedule notification for later
  async scheduleNotification(
    notification: NewPostNotification,
    scheduledFor: Date,
    type: 'email' | 'push' | 'both' = 'both'
  ): Promise<{ success: boolean; scheduledId?: string }> {
    try {
      return await this.request<{ success: boolean; scheduledId?: string }>(
        '/admin/notifications/schedule',
        {
          method: 'POST',
          body: JSON.stringify({
            notification,
            scheduledFor: scheduledFor.toISOString(),
            type
          }),
        }
      );
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return { success: false };
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(scheduledId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(
        `/admin/notifications/schedule/${scheduledId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      console.error('Failed to cancel scheduled notification:', error);
      return { success: false };
    }
  }

  // Get user engagement score for personalization
  async getUserEngagementScore(email: string): Promise<{
    score: number;
    factors: {
      openRate: number;
      clickRate: number;
      timeOnSite: number;
      commentsLeft: number;
      sharesCount: number;
    };
    recommendations: string[];
  }> {
    try {
      return await this.request<any>(`/public/engagement/score?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Failed to get engagement score:', error);
      return {
        score: 0,
        factors: {
          openRate: 0,
          clickRate: 0,
          timeOnSite: 0,
          commentsLeft: 0,
          sharesCount: 0
        },
        recommendations: []
      };
    }
  }

  // Track notification interaction
  async trackNotificationInteraction(
    notificationId: string,
    action: 'opened' | 'clicked' | 'dismissed',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.request('/public/notifications/track', {
        method: 'POST',
        body: JSON.stringify({
          notificationId,
          action,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        }),
      });
    } catch (error) {
      console.error('Failed to track notification interaction:', error);
    }
  }

  // Get notification preferences for a user
  async getNotificationPreferences(email: string): Promise<NotificationPreferences> {
    try {
      return await this.request<NotificationPreferences>(
        `/public/notifications/preferences?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        immediate: true,
        digest: true,
        categories: [],
        tags: [],
        minEngagement: 0
      };
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    email: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>(
        '/public/notifications/preferences',
        {
          method: 'PUT',
          body: JSON.stringify({
            email,
            preferences
          }),
        }
      );
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return { success: false, message: 'Failed to update preferences' };
    }
  }
}

// Mock service for development
export class MockNotificationService extends NotificationService {
  override async notifyNewPost(post: NewPostNotification): Promise<{ success: boolean; notificationsSent: number }> {
    console.log('Mock: Sending new post notification:', post);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, notificationsSent: Math.floor(Math.random() * 100) + 50 };
  }

  override async notifyTrendingPost(post: NewPostNotification): Promise<{ success: boolean; notificationsSent: number }> {
    console.log('Mock: Sending trending post notification:', post);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, notificationsSent: Math.floor(Math.random() * 200) + 100 };
  }

  override async getNotificationAnalytics(_timeframe: 'day' | 'week' | 'month' = 'week') {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalSent: 1250,
      emailsSent: 1000,
      pushNotificationsSent: 250,
      openRate: 0.35,
      clickRate: 0.12,
      unsubscribeRate: 0.02,
      topPerformingPosts: [
        {
          postId: '1',
          title: 'Top Reddit Trends This Week',
          opens: 450,
          clicks: 89,
          engagementRate: 0.198
        },
        {
          postId: '2',
          title: 'AI Discussion Explodes on r/Technology',
          opens: 380,
          clicks: 76,
          engagementRate: 0.2
        }
      ]
    };
  }

  override async getUserEngagementScore(_email: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      score: Math.floor(Math.random() * 100),
      factors: {
        openRate: Math.random() * 0.8,
        clickRate: Math.random() * 0.3,
        timeOnSite: Math.floor(Math.random() * 300),
        commentsLeft: Math.floor(Math.random() * 10),
        sharesCount: Math.floor(Math.random() * 5)
      },
      recommendations: [
        'User shows high engagement with technology posts',
        'Prefers weekly digest over daily notifications',
        'Most active during weekday evenings'
      ]
    };
  }
}

// Export the appropriate service based on configuration
export const notificationService = config.mockApi ? new MockNotificationService() : new NotificationService();