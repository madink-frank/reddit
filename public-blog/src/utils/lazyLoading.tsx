import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { ErrorBoundary } from './errorTracking';

// Loading component for lazy-loaded components
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4`} />
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
};

// Error fallback for lazy-loaded components
interface LazyErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const LazyErrorFallback: React.FC<LazyErrorFallbackProps> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 mb-4">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load component</h3>
    <p className="text-red-600 text-sm mb-4 text-center">
      {error.message || 'Something went wrong while loading this component.'}
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Higher-order component for lazy loading with error boundary and loading state
export function withLazyLoading<T extends ComponentType<any>>(
  LazyComponent: LazyExoticComponent<T>,
  options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<LazyErrorFallbackProps>;
    loadingText?: string;
    retryable?: boolean;
  } = {}
) {
  const {
    fallback: CustomFallback,
    errorFallback: CustomErrorFallback,
    loadingText = 'Loading...',
    retryable = true
  } = options;

  const WrappedComponent: React.FC<React.ComponentProps<T>> = (props) => {
    const [retryCount, setRetryCount] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      setRetryCount(prev => prev + 1);
    }, []);

    const FallbackComponent = CustomFallback || (() => <LoadingSpinner text={loadingText} />);
    const ErrorFallbackComponent = CustomErrorFallback || LazyErrorFallback;

    return (
      <ErrorBoundary
        key={retryCount}
        fallback={retryable ? 
          ({ error }) => <ErrorFallbackComponent error={error} retry={handleRetry} /> :
          undefined
        }
      >
        <Suspense fallback={<FallbackComponent />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Copy display name for debugging
  WrappedComponent.displayName = `withLazyLoading(${LazyComponent.displayName || LazyComponent.name || 'Component'})`;

  return WrappedComponent;
}

// Preload a lazy component
export const preloadComponent = <T extends ComponentType<any>>(
  LazyComponent: LazyExoticComponent<T>
): Promise<{ default: T }> => {
  // This will trigger the dynamic import and cache the result
  return LazyComponent._payload._result || LazyComponent._payload._value;
};

// Hook for preloading components on hover/focus
export const usePreloadOnHover = <T extends ComponentType<any>>(
  LazyComponent: LazyExoticComponent<T>
) => {
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  const preload = React.useCallback(() => {
    if (!isPreloaded) {
      preloadComponent(LazyComponent).catch(() => {
        // Ignore preload errors
      });
      setIsPreloaded(true);
    }
  }, [LazyComponent, isPreloaded]);

  return {
    onMouseEnter: preload,
    onFocus: preload,
    isPreloaded
  };
};

// Lazy load with intersection observer for viewport-based loading
export const useLazyLoadOnVisible = <T extends ComponentType<any>>(
  LazyComponent: LazyExoticComponent<T>,
  options: IntersectionObserverInit = {}
) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          preloadComponent(LazyComponent)
            .then(() => setIsLoaded(true))
            .catch(() => {
              // Handle load error
            });
          observer.unobserve(element);
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [LazyComponent, isLoaded, options]);

  return {
    ref,
    isVisible,
    isLoaded
  };
};

// Route-based code splitting helper
export const createLazyRoute = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<LazyErrorFallbackProps>;
    preload?: boolean;
  }
) => {
  const LazyComponent = React.lazy(importFn);
  
  // Preload if requested
  if (options?.preload) {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      preloadComponent(LazyComponent).catch(() => {
        // Ignore preload errors
      });
    }, 100);
  }

  return withLazyLoading(LazyComponent, options);
};

// Bundle splitting utilities
export const bundleUtils = {
  // Preload critical routes
  preloadCriticalRoutes: (routes: Array<() => Promise<any>>) => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 100);
      }
    };

    routes.forEach((importFn, index) => {
      schedulePreload(() => {
        setTimeout(() => {
          importFn().catch(() => {
            // Ignore preload errors
          });
        }, index * 100); // Stagger preloads
      });
    });
  },

  // Get bundle size information (development only)
  getBundleInfo: () => {
    if (import.meta.env.DEV) {
      return {
        chunks: performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('.js'))
          .map(entry => ({
            name: entry.name,
            size: (entry as any).transferSize || 0,
            loadTime: entry.duration
          }))
      };
    }
    return null;
  }
};

// Component for measuring and displaying bundle loading performance
export const BundlePerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('chunk') || entry.name.includes('lazy')) {
            console.log(`Bundle loaded: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);

  return <>{children}</>;
};

export default {
  withLazyLoading,
  preloadComponent,
  usePreloadOnHover,
  useLazyLoadOnVisible,
  createLazyRoute,
  bundleUtils,
  BundlePerformanceMonitor
};