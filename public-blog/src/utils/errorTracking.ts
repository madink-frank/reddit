// Error tracking and monitoring utilities
import React from 'react';

export interface ErrorInfo {
  message: string;
  stack?: string | undefined;
  componentStack?: string | undefined;
  errorBoundary?: string | undefined;
  url?: string | undefined;
  userAgent?: string | undefined;
  timestamp: number;
  userId?: string | undefined;
  sessionId?: string | undefined;
}

export interface PerformanceIssue {
  type: 'slow_component' | 'memory_leak' | 'large_bundle' | 'slow_api';
  component?: string | undefined;
  duration?: number | undefined;
  memoryUsage?: number | undefined;
  bundleSize?: number | undefined;
  apiEndpoint?: string | undefined;
  timestamp: number;
}

class ErrorTracker {
  private errors: ErrorInfo[] = [];
  private performanceIssues: PerformanceIssue[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        userAgent: navigator.userAgent,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        userAgent: navigator.userAgent,
      });
    });

    // Performance monitoring
    this.setupPerformanceMonitoring();

    this.isInitialized = true;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Capture errors manually
  captureError(error: Partial<ErrorInfo>): void {
    const errorInfo: ErrorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      componentStack: error.componentStack,
      errorBoundary: error.errorBoundary,
      url: error.url || window.location.href,
      userAgent: error.userAgent || navigator.userAgent,
      timestamp: error.timestamp || Date.now(),
      userId: error.userId || this.userId,
      sessionId: error.sessionId || this.sessionId,
    };

    this.errors.push(errorInfo);
    this.reportError(errorInfo);

    // Keep only last 50 errors in memory
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  // Capture React component errors
  captureComponentError(error: Error, errorInfo: { componentStack: string }, errorBoundary: string): void {
    this.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary,
      timestamp: Date.now(),
    });
  }

  // Capture API errors
  captureApiError(endpoint: string, status: number, message: string, requestData?: any): void {
    this.captureError({
      message: `API Error: ${message}`,
      stack: `Endpoint: ${endpoint}\nStatus: ${status}\nRequest: ${JSON.stringify(requestData, null, 2)}`,
      url: endpoint,
      timestamp: Date.now(),
    });
  }

  // Set user context
  setUser(userId: string, _userData?: Record<string, any>): void {
    this.userId = userId;
    
    // Update existing errors with user ID
    this.errors.forEach(error => {
      if (!error.userId) {
        error.userId = userId;
      }
    });
  }

  // Performance issue tracking
  capturePerformanceIssue(issue: Partial<PerformanceIssue>): void {
    const performanceIssue: PerformanceIssue = {
      type: issue.type || 'slow_component',
      component: issue.component,
      duration: issue.duration,
      memoryUsage: issue.memoryUsage,
      bundleSize: issue.bundleSize,
      apiEndpoint: issue.apiEndpoint,
      timestamp: issue.timestamp || Date.now(),
    };

    this.performanceIssues.push(performanceIssue);
    this.reportPerformanceIssue(performanceIssue);

    // Keep only last 20 performance issues
    if (this.performanceIssues.length > 20) {
      this.performanceIssues = this.performanceIssues.slice(-20);
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor slow components (using React DevTools profiler data if available)
    if ('performance' in window && 'measure' in performance) {
      const originalMeasure = performance.measure;
      performance.measure = function(name: string, startMark?: string, endMark?: string) {
        const result = originalMeasure.call(this, name, startMark, endMark);
        
        // Check for slow React components
        if (name.includes('⚛️') && result && result.duration > 16) { // 16ms = 60fps threshold
          errorTracker.capturePerformanceIssue({
            type: 'slow_component',
            component: name,
            duration: result.duration,
            timestamp: Date.now(),
          });
        }
        
        return result;
      };
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (memoryUsagePercent > 80) {
          this.capturePerformanceIssue({
            type: 'memory_leak',
            memoryUsage: memory.usedJSHeapSize,
            timestamp: Date.now(),
          });
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = performance.now() - startTime;
        
        // Report slow API calls (>5 seconds)
        if (duration > 5000) {
          errorTracker.capturePerformanceIssue({
            type: 'slow_api',
            apiEndpoint: url,
            duration,
            timestamp: Date.now(),
          });
        }
        
        return response;
      } catch (error) {
        errorTracker.captureApiError(url, 0, (error as Error).message, args[1]);
        throw error;
      }
    };
  }

  private reportError(error: ErrorInfo): void {
    // Send to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_stack: error.stack,
          error_url: error.url,
          session_id: error.sessionId,
          user_id: error.userId,
        },
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error captured:', error);
    }

    // Send to external error tracking service (e.g., Sentry, LogRocket)
    this.sendToExternalService('error', error);
  }

  private reportPerformanceIssue(issue: PerformanceIssue): void {
    // Send to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      gtag('event', 'performance_issue', {
        event_category: 'Performance',
        event_label: issue.type,
        value: issue.duration || issue.memoryUsage || 0,
        custom_map: {
          component: issue.component,
          api_endpoint: issue.apiEndpoint,
          session_id: this.sessionId,
        },
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('Performance issue captured:', issue);
    }

    // Send to external service
    this.sendToExternalService('performance', issue);
  }

  private async sendToExternalService(type: 'error' | 'performance', data: ErrorInfo | PerformanceIssue): Promise<void> {
    try {
      // This would be replaced with actual service endpoints
      const endpoint = import.meta.env.VITE_ERROR_TRACKING_ENDPOINT;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          environment: import.meta.env.MODE,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      // Silently fail to avoid infinite error loops
      if (import.meta.env.DEV) {
        console.error('Failed to send error to external service:', error);
      }
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    recentErrors: ErrorInfo[];
    errorsByType: Record<string, number>;
    performanceIssues: PerformanceIssue[];
  } {
    const errorsByType: Record<string, number> = {};
    
    this.errors.forEach(error => {
      const errorType = this.categorizeError(error.message);
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      recentErrors: this.errors.slice(-10),
      errorsByType,
      performanceIssues: this.performanceIssues.slice(-10),
    };
  }

  private categorizeError(message: string): string {
    if (message.includes('Network')) return 'Network Error';
    if (message.includes('TypeError')) return 'Type Error';
    if (message.includes('ReferenceError')) return 'Reference Error';
    if (message.includes('SyntaxError')) return 'Syntax Error';
    if (message.includes('API Error')) return 'API Error';
    if (message.includes('Promise Rejection')) return 'Promise Error';
    return 'Unknown Error';
  }

  // Clear stored errors (useful for testing)
  clearErrors(): void {
    this.errors = [];
    this.performanceIssues = [];
  }

  // Export errors for debugging
  exportErrors(): string {
    return JSON.stringify({
      errors: this.errors,
      performanceIssues: this.performanceIssues,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
    }, null, 2);
  }
}

// React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.captureComponentError(error, { componentStack: errorInfo.componentStack || '' }, 'ErrorBoundary');
  }

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return React.createElement(FallbackComponent, { error: this.state.error! });
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  return React.createElement('div', { className: 'error-boundary' },
    React.createElement('h2', null, 'Something went wrong'),
    React.createElement('p', null, 'We\'re sorry, but something unexpected happened.'),
    import.meta.env.DEV && React.createElement('details', null,
      React.createElement('summary', null, 'Error details (development only)'),
      React.createElement('pre', null, error.message),
      React.createElement('pre', null, error.stack)
    ),
    React.createElement('button', 
      { onClick: () => window.location.reload() },
      'Reload page'
    )
  );
};

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Convenience functions
export const captureError = (error: Partial<ErrorInfo>) => errorTracker.captureError(error);
export const captureApiError = (endpoint: string, status: number, message: string, requestData?: any) => 
  errorTracker.captureApiError(endpoint, status, message, requestData);
export const setUser = (userId: string, userData?: Record<string, any>) => 
  errorTracker.setUser(userId, userData);
export const capturePerformanceIssue = (issue: Partial<PerformanceIssue>) => 
  errorTracker.capturePerformanceIssue(issue);

export default errorTracker;