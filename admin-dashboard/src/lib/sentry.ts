import * as Sentry from '@sentry/react';

// Sentry configuration
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
  const release = import.meta.env.VITE_APP_VERSION || 'unknown';
  
  // Only initialize Sentry if DSN is provided and not in development
  if (dsn && environment !== 'development') {
    Sentry.init({
      dsn,
      environment,
      release,
      
      // Performance monitoring sample rate
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      
      // Filter out common noise
      beforeSend(event, hint) {
        // Filter out network errors that are not actionable
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Skip network timeout errors
            if (error.message.includes('Network Error') || 
                error.message.includes('timeout')) {
              return null;
            }
            
            // Skip cancelled requests
            if (error.message.includes('cancelled') || 
                error.message.includes('aborted')) {
              return null;
            }
          }
        }
        
        return event;
      },
      
      // Set user context
      initialScope: {
        tags: {
          component: 'admin-dashboard',
        },
      },
    });
    
    console.log(`Sentry initialized for ${environment} environment`);
  } else {
    console.log('Sentry not initialized - missing DSN or development environment');
  }
};

// Error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Performance monitoring helpers
export const startTransaction = (name: string, op: string) => {
  // Simplified for development - just return a mock transaction
  return {
    setTag: () => {},
    setData: () => {},
    finish: () => {},
  };
};

export const addBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// User context helpers
export const setUser = (user: { id: string; username?: string; email?: string }) => {
  Sentry.setUser(user);
};

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const setContext = (key: string, context: Record<string, any>) => {
  Sentry.setContext(key, context);
};

// Manual error reporting
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// React Router integration - deprecated, using error boundary instead

export default Sentry;