/**
 * Newsletter subscription service
 * Handles email subscriptions, preferences, and notifications
 */

import { config } from '@/config/env';
import type {
  NewsletterSubscription,
  SubscriptionFormData,
  SubscriptionResponse,
  UnsubscribeRequest,
  UnsubscribeResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  SubscriptionStats,
  PushSubscription
} from '@/types/subscription';

export class SubscriptionService {
  private baseUrl: string;
  private vapidPublicKey: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.vapidPublicKey = config.vapidPublicKey || '';
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
      console.error('Subscription API error:', error);
      throw error;
    }
  }

  // Subscribe to newsletter
  async subscribe(data: SubscriptionFormData): Promise<SubscriptionResponse> {
    // Client-side validation
    const validation = this.validateSubscription(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.map(e => e.message).join(', ')
      };
    }

    try {
      return await this.request<SubscriptionResponse>('/public/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          metadata: {
            source: 'blog',
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          }
        }),
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to subscribe'
      };
    }
  }

  // Confirm subscription
  async confirmSubscription(token: string): Promise<SubscriptionResponse> {
    try {
      return await this.request<SubscriptionResponse>(`/public/newsletter/confirm/${token}`, {
        method: 'POST'
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm subscription'
      };
    }
  }

  // Unsubscribe from newsletter
  async unsubscribe(data: UnsubscribeRequest): Promise<UnsubscribeResponse> {
    try {
      return await this.request<UnsubscribeResponse>('/public/newsletter/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unsubscribe'
      };
    }
  }

  // Update subscription preferences
  async updatePreferences(data: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> {
    try {
      return await this.request<UpdatePreferencesResponse>('/public/newsletter/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update preferences'
      };
    }
  }

  // Get subscription status
  async getSubscriptionStatus(email: string): Promise<{ subscribed: boolean; subscription?: NewsletterSubscription }> {
    try {
      return await this.request<{ subscribed: boolean; subscription?: NewsletterSubscription }>(
        `/public/newsletter/status?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      return { subscribed: false };
    }
  }

  // Get subscription statistics (public stats)
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      return await this.request<SubscriptionStats>('/public/newsletter/stats');
    } catch (error) {
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        pendingConfirmations: 0,
        unsubscribedCount: 0,
        bouncedCount: 0,
        growthRate: 0,
        popularCategories: [],
        popularTags: []
      };
    }
  }

  // Web Push Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.request('/public/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      return subscription.toJSON() as PushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await this.request('/public/notifications/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({
            subscription: subscription.toJSON()
          })
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Client-side validation
  protected validateSubscription(data: SubscriptionFormData): { 
    isValid: boolean; 
    errors: Array<{ field: keyof SubscriptionFormData; message: string }> 
  } {
    const errors: Array<{ field: keyof SubscriptionFormData; message: string }> = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Terms agreement validation
    if (!data.agreeToTerms) {
      errors.push({ field: 'agreeToTerms', message: 'You must agree to the terms and conditions' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility function for VAPID key conversion
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Local storage helpers for subscription preferences
  saveSubscriptionPreferences(preferences: any): void {
    try {
      localStorage.setItem('blog_subscription_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save subscription preferences:', error);
    }
  }

  getSubscriptionPreferences(): any {
    try {
      const stored = localStorage.getItem('blog_subscription_preferences');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get subscription preferences:', error);
      return null;
    }
  }

  clearSubscriptionPreferences(): void {
    try {
      localStorage.removeItem('blog_subscription_preferences');
    } catch (error) {
      console.error('Failed to clear subscription preferences:', error);
    }
  }
}

// Mock service for development
export class MockSubscriptionService extends SubscriptionService {
  private mockSubscriptions: NewsletterSubscription[] = [];

  override async subscribe(data: SubscriptionFormData): Promise<SubscriptionResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate subscription
    const validation = this.validateSubscription(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.map(e => e.message).join(', ')
      };
    }

    // Check if already subscribed
    const existing = this.mockSubscriptions.find(sub => sub.email === data.email);
    if (existing) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter'
      };
    }

    // Create new subscription
    const subscription: NewsletterSubscription = {
      id: Date.now().toString(),
      email: data.email,
      subscribedAt: new Date().toISOString(),
      status: 'pending',
      preferences: {
        frequency: data.frequency || 'weekly',
        categories: data.categories || [],
        tags: data.tags || [],
        digestFormat: 'summary',
        includeComments: false
      },
      metadata: {
        source: 'blog'
      }
    };

    this.mockSubscriptions.push(subscription);

    return {
      success: true,
      message: 'Successfully subscribed! Please check your email to confirm your subscription.',
      subscription,
      requiresConfirmation: true,
      confirmationSent: true
    };
  }

  override async confirmSubscription(_token: string): Promise<SubscriptionResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, you'd validate the token
    // For mock, we'll just activate the first pending subscription
    const subscription = this.mockSubscriptions.find(sub => sub.status === 'pending');
    
    if (subscription) {
      subscription.status = 'active';
      return {
        success: true,
        message: 'Subscription confirmed successfully!',
        subscription
      };
    }

    return {
      success: false,
      message: 'Invalid or expired confirmation token'
    };
  }

  override async unsubscribe(data: UnsubscribeRequest): Promise<UnsubscribeResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const subscriptionIndex = this.mockSubscriptions.findIndex(sub => sub.email === data.email);
    
    if (subscriptionIndex !== -1 && this.mockSubscriptions[subscriptionIndex]) {
      this.mockSubscriptions[subscriptionIndex]!.status = 'unsubscribed';
      return {
        success: true,
        message: 'Successfully unsubscribed from the newsletter'
      };
    }

    return {
      success: false,
      message: 'Email not found in our subscription list'
    };
  }

  override async getSubscriptionStats(): Promise<SubscriptionStats> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const activeCount = this.mockSubscriptions.filter(sub => sub.status === 'active').length;
    const pendingCount = this.mockSubscriptions.filter(sub => sub.status === 'pending').length;

    return {
      totalSubscribers: this.mockSubscriptions.length,
      activeSubscribers: activeCount,
      pendingConfirmations: pendingCount,
      unsubscribedCount: this.mockSubscriptions.filter(sub => sub.status === 'unsubscribed').length,
      bouncedCount: 0,
      growthRate: 15.5,
      popularCategories: [
        { category: 'Technology', subscriberCount: Math.floor(activeCount * 0.6) },
        { category: 'Gaming', subscriberCount: Math.floor(activeCount * 0.4) },
        { category: 'Science', subscriberCount: Math.floor(activeCount * 0.3) }
      ],
      popularTags: [
        { tag: 'AI', subscriberCount: Math.floor(activeCount * 0.5) },
        { tag: 'Reddit', subscriberCount: Math.floor(activeCount * 0.8) },
        { tag: 'Trends', subscriberCount: Math.floor(activeCount * 0.7) }
      ]
    };
  }
}

// Export the appropriate service based on configuration
export const subscriptionService = config.mockApi ? new MockSubscriptionService() : new SubscriptionService();