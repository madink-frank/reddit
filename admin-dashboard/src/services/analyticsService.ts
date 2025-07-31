import { captureMessage, setContext, setUser, setTag } from '../lib/sentry';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

// User properties for analytics
export interface UserProperties {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  firstLogin?: boolean;
  lastActive?: Date;
}

// Page view tracking
export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp?: number;
  userId?: string;
}

class AnalyticsService {
  private isEnabled: boolean;
  private userId: string | null = null;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    if (this.isEnabled) {
      this.initializeAnalytics();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAnalytics() {
    // Set up global analytics context
    setContext('analytics', {
      sessionId: this.sessionId,
      startTime: this.startTime,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    // Track session start
    this.track('session_start', {
      sessionId: this.sessionId,
      timestamp: this.startTime,
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', { timestamp: Date.now() });
      } else {
        this.track('page_visible', { timestamp: Date.now() });
      }
    });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.track('session_end', {
        sessionId: this.sessionId,
        duration: Date.now() - this.startTime,
      });
    });

    console.log('Analytics service initialized');
  }

  // Set user information
  setUser(user: UserProperties) {
    if (!this.isEnabled) return;

    this.userId = user.id;
    
    // Set user context in Sentry
    setUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    // Set user tags
    if (user.role) {
      setTag('user.role', user.role);
    }

    // Track user identification
    this.track('user_identified', {
      userId: user.id,
      username: user.username,
      role: user.role,
      firstLogin: user.firstLogin,
    });
  }

  // Track custom events
  track(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: window.location.href,
        path: window.location.pathname,
      },
      userId: this.userId || undefined,
      timestamp: Date.now(),
    };

    // Send to Sentry as breadcrumb
    captureMessage(`Analytics: ${eventName}`, 'info');
    setContext('lastEvent', event);

    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'User Interaction',
        event_label: properties.label || eventName,
        value: properties.value || 1,
        custom_parameters: properties,
      });
    }

    // Send to custom analytics endpoint
    this.sendToEndpoint(event);

    // Log in development
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', event);
    }
  }

  // Track page views
  trackPageView(pageView: PageView) {
    if (!this.isEnabled) return;

    const enhancedPageView = {
      ...pageView,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: pageView.timestamp || Date.now(),
      referrer: pageView.referrer || document.referrer,
      userAgent: navigator.userAgent,
    };

    this.track('page_view', enhancedPageView);

    // Update page context in Sentry
    setContext('currentPage', {
      path: pageView.path,
      title: pageView.title,
      timestamp: enhancedPageView.timestamp,
    });
  }

  // Track user interactions
  trackClick(element: string, properties: Record<string, any> = {}) {
    this.track('click', {
      element,
      ...properties,
    });
  }

  trackFormSubmit(formName: string, properties: Record<string, any> = {}) {
    this.track('form_submit', {
      formName,
      ...properties,
    });
  }

  trackSearch(query: string, results: number, properties: Record<string, any> = {}) {
    this.track('search', {
      query,
      results,
      ...properties,
    });
  }

  trackError(error: Error, context: Record<string, any> = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, properties: Record<string, any> = {}) {
    this.track('feature_usage', {
      feature,
      action,
      ...properties,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, properties: Record<string, any> = {}) {
    this.track('performance', {
      metric,
      value,
      ...properties,
    });
  }

  // Send event to custom analytics endpoint
  private async sendToEndpoint(event: AnalyticsEvent) {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (!endpoint) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'event',
          event,
          metadata: {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          },
        }),
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Get session information
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
    };
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    setTag('analytics.enabled', enabled.toString());
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// React hook for analytics
export const useAnalytics = () => {
  return {
    track: analyticsService.track.bind(analyticsService),
    trackPageView: analyticsService.trackPageView.bind(analyticsService),
    trackClick: analyticsService.trackClick.bind(analyticsService),
    trackFormSubmit: analyticsService.trackFormSubmit.bind(analyticsService),
    trackSearch: analyticsService.trackSearch.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackFeatureUsage: analyticsService.trackFeatureUsage.bind(analyticsService),
    trackPerformance: analyticsService.trackPerformance.bind(analyticsService),
    setUser: analyticsService.setUser.bind(analyticsService),
    getSessionInfo: analyticsService.getSessionInfo.bind(analyticsService),
  };
};

export default analyticsService;