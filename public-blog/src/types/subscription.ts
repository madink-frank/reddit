// Newsletter and subscription types

export interface NewsletterSubscription {
  id?: string;
  email: string;
  subscribedAt?: string;
  status: 'active' | 'pending' | 'unsubscribed' | 'bounced';
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly';
    categories: string[];
    tags: string[];
    digestFormat: 'summary' | 'full';
    includeComments: boolean;
  };
  metadata?: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  };
}

export interface SubscriptionFormData {
  email: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  categories?: string[];
  tags?: string[];
  agreeToTerms: boolean;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: NewsletterSubscription;
  requiresConfirmation?: boolean;
  confirmationSent?: boolean;
}

export interface UnsubscribeRequest {
  email: string;
  token?: string;
  reason?: string;
}

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
}

export interface SubscriptionPreferences {
  frequency: 'daily' | 'weekly' | 'monthly';
  categories: string[];
  tags: string[];
  digestFormat: 'summary' | 'full';
  includeComments: boolean;
}

export interface UpdatePreferencesRequest {
  email: string;
  token: string;
  preferences: Partial<SubscriptionPreferences>;
}

export interface UpdatePreferencesResponse {
  success: boolean;
  message: string;
  preferences?: SubscriptionPreferences;
}

export interface SubscriptionStats {
  totalSubscribers: number;
  activeSubscribers: number;
  pendingConfirmations: number;
  unsubscribedCount: number;
  bouncedCount: number;
  growthRate: number;
  popularCategories: Array<{
    category: string;
    subscriberCount: number;
  }>;
  popularTags: Array<{
    tag: string;
    subscriberCount: number;
  }>;
}

export interface EmailDigest {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  subject: string;
  content: string;
  posts: Array<{
    id: string;
    title: string;
    excerpt: string;
    url: string;
    publishedAt: string;
    category: string;
    tags: string[];
  }>;
  sentAt: string;
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    newPosts: boolean;
    weeklyDigest: boolean;
    monthlyDigest: boolean;
    commentReplies: boolean;
    systemUpdates: boolean;
  };
  browser: {
    enabled: boolean;
    newPosts: boolean;
    trendingPosts: boolean;
  };
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface SubscriptionValidationError {
  field: keyof SubscriptionFormData;
  message: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  type: 'welcome' | 'confirmation' | 'digest' | 'notification' | 'unsubscribe';
}