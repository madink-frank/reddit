// Google Analytics and tracking utilities

export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  enableDebug?: boolean;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
}

export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface CustomEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface UserProperties {
  user_id?: string;
  user_type?: 'visitor' | 'subscriber' | 'returning';
  preferred_theme?: 'light' | 'dark';
  subscription_status?: 'subscribed' | 'unsubscribed';
}

// Global gtag function type
type GtagFunction = (...args: any[]) => void;

class AnalyticsManager {
  private config: AnalyticsConfig;
  private isInitialized = false;
  private debugMode = false;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.debugMode = config.enableDebug || false;
  }

  // Initialize Google Analytics
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('Analytics already initialized');
      return;
    }

    if (!this.config.googleAnalyticsId) {
      this.log('Google Analytics ID not provided, skipping initialization');
      return;
    }

    try {
      // Initialize dataLayer
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };

      // Configure Google Analytics
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', this.config.googleAnalyticsId, {
        page_title: document.title,
        page_location: window.location.href,
        debug_mode: this.debugMode,
        send_page_view: false, // We'll handle page views manually
      });

      // Load Google Analytics script
      await this.loadGoogleAnalyticsScript();

      // Initialize Google Tag Manager if provided
      if (this.config.googleTagManagerId) {
        await this.loadGoogleTagManagerScript();
      }

      // Set up error tracking
      if (this.config.enableErrorTracking) {
        this.setupErrorTracking();
      }

      // Set up performance tracking
      if (this.config.enablePerformanceTracking) {
        this.setupPerformanceTracking();
      }

      this.isInitialized = true;
      this.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async loadGoogleAnalyticsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Analytics script'));
      document.head.appendChild(script);
    });
  }

  private async loadGoogleTagManagerScript(): Promise<void> {
    return new Promise((resolve) => {
      // GTM script
      const script = document.createElement('script');
      script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${this.config.googleTagManagerId}');
      `;
      document.head.appendChild(script);

      // GTM noscript
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${this.config.googleTagManagerId}"
                height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
      document.body.appendChild(noscript);

      resolve();
    });
  }

  // Track page views
  trackPageView(pageData?: Partial<PageViewEvent>): void {
    if (!this.isInitialized || !(window as any).gtag) {
      this.log('Analytics not initialized, skipping page view');
      return;
    }

    const pageView: PageViewEvent = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...pageData,
    };

    (window as any).gtag('event', 'page_view', pageView);
    this.log('Page view tracked:', pageView);
  }

  // Track custom events
  trackEvent(event: CustomEvent): void {
    if (!this.isInitialized || !(window as any).gtag) {
      this.log('Analytics not initialized, skipping event');
      return;
    }

    const eventData: any = {
      event_category: event.event_category || 'General',
      event_label: event.event_label,
      value: event.value,
      ...event.custom_parameters,
    };

    (window as any).gtag('event', event.event_name, eventData);
    this.log('Event tracked:', event.event_name, eventData);
  }

  // Set user properties
  setUserProperties(properties: UserProperties): void {
    if (!this.isInitialized || !(window as any).gtag) {
      this.log('Analytics not initialized, skipping user properties');
      return;
    }

    (window as any).gtag('config', this.config.googleAnalyticsId!, {
      user_id: properties.user_id,
      custom_map: {
        user_type: properties.user_type,
        preferred_theme: properties.preferred_theme,
        subscription_status: properties.subscription_status,
      },
    });

    this.log('User properties set:', properties);
  }

  // Track blog-specific events
  trackBlogPost(postId: string, postTitle: string, category?: string): void {
    this.trackEvent({
      event_name: 'blog_post_view',
      event_category: 'Blog',
      event_label: postTitle,
      custom_parameters: {
        post_id: postId,
        post_category: category,
      },
    });
  }

  trackSearch(searchTerm: string, resultsCount: number): void {
    this.trackEvent({
      event_name: 'search',
      event_category: 'Blog',
      event_label: searchTerm,
      value: resultsCount,
      custom_parameters: {
        search_term: searchTerm,
        results_count: resultsCount,
      },
    });
  }

  trackSubscription(type: 'newsletter' | 'rss', action: 'subscribe' | 'unsubscribe'): void {
    this.trackEvent({
      event_name: 'subscription',
      event_category: 'Engagement',
      event_label: `${type}_${action}`,
      custom_parameters: {
        subscription_type: type,
        action: action,
      },
    });
  }

  trackSocialShare(platform: string, url: string, title: string): void {
    this.trackEvent({
      event_name: 'share',
      event_category: 'Social',
      event_label: platform,
      custom_parameters: {
        platform: platform,
        shared_url: url,
        shared_title: title,
      },
    });
  }

  trackDownload(fileName: string, fileType: string): void {
    this.trackEvent({
      event_name: 'file_download',
      event_category: 'Downloads',
      event_label: fileName,
      custom_parameters: {
        file_name: fileName,
        file_type: fileType,
      },
    });
  }

  trackOutboundLink(url: string, linkText?: string): void {
    this.trackEvent({
      event_name: 'click',
      event_category: 'Outbound Links',
      event_label: url,
      custom_parameters: {
        link_url: url,
        link_text: linkText,
      },
    });
  }

  // Error tracking
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackEvent({
        event_name: 'exception',
        event_category: 'Error',
        event_label: event.message,
        custom_parameters: {
          error_message: event.message,
          error_filename: event.filename,
          error_lineno: event.lineno,
          error_colno: event.colno,
          fatal: false,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent({
        event_name: 'exception',
        event_category: 'Error',
        event_label: 'Unhandled Promise Rejection',
        custom_parameters: {
          error_message: event.reason?.toString() || 'Unknown error',
          fatal: false,
        },
      });
    });
  }

  // Performance tracking
  private setupPerformanceTracking(): void {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.trackEvent({
            event_name: 'web_vitals',
            event_category: 'Performance',
            event_label: 'LCP',
            value: Math.round(lastEntry.startTime),
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        this.log('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.trackEvent({
              event_name: 'web_vitals',
              event_category: 'Performance',
              event_label: 'FID',
              value: Math.round(fid),
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        this.log('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.trackEvent({
            event_name: 'web_vitals',
            event_category: 'Performance',
            event_label: 'CLS',
            value: Math.round(clsValue * 1000), // Convert to milliseconds
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        this.log('CLS observer not supported');
      }
    }

    // Track page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackEvent({
            event_name: 'page_load_time',
            event_category: 'Performance',
            event_label: 'Load Complete',
            value: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          });
        }
      }, 0);
    });
  }

  // Consent management
  grantConsent(): void {
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
      this.log('Analytics consent granted');
    }
  }

  revokeConsent(): void {
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
      this.log('Analytics consent revoked');
    }
  }

  // Debug logging
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.log('[Analytics]', ...args);
    }
  }

  // Get analytics status
  getStatus(): { initialized: boolean; config: AnalyticsConfig } {
    return {
      initialized: this.isInitialized,
      config: this.config,
    };
  }
}

// Create analytics instance
const getAnalyticsConfig = (): AnalyticsConfig => ({
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  googleTagManagerId: import.meta.env.VITE_GOOGLE_TAG_MANAGER_ID,
  enableDebug: import.meta.env.VITE_DEBUG_MODE === 'true',
  enablePerformanceTracking: true,
  enableErrorTracking: true,
});

export const analytics = new AnalyticsManager(getAnalyticsConfig());

// Convenience functions
export const initializeAnalytics = () => analytics.initialize();
export const trackPageView = (data?: Partial<PageViewEvent>) => analytics.trackPageView(data);
export const trackEvent = (event: CustomEvent) => analytics.trackEvent(event);
export const setUserProperties = (properties: UserProperties) => analytics.setUserProperties(properties);

// Blog-specific tracking functions
export const trackBlogPost = (postId: string, postTitle: string, category?: string) => 
  analytics.trackBlogPost(postId, postTitle, category);
export const trackSearch = (searchTerm: string, resultsCount: number) => 
  analytics.trackSearch(searchTerm, resultsCount);
export const trackSubscription = (type: 'newsletter' | 'rss', action: 'subscribe' | 'unsubscribe') => 
  analytics.trackSubscription(type, action);
export const trackSocialShare = (platform: string, url: string, title: string) => 
  analytics.trackSocialShare(platform, url, title);
export const trackDownload = (fileName: string, fileType: string) => 
  analytics.trackDownload(fileName, fileType);
export const trackOutboundLink = (url: string, linkText?: string) => 
  analytics.trackOutboundLink(url, linkText);

// Consent management
export const grantAnalyticsConsent = () => analytics.grantConsent();
export const revokeAnalyticsConsent = () => analytics.revokeConsent();

export default analytics;