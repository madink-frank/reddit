import React, { Suspense, type ComponentType, type LazyExoticComponent } from 'react';

// Loading fallback component
export const LoadingFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// Error boundary for lazy loaded components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyLoadErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Default error fallback
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <div className="text-red-500 text-xl mb-2">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        {error.message || 'Failed to load component'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  loadingMessage?: string,
  ErrorFallback?: React.ComponentType<{ error: Error }>
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyLoadErrorBoundary fallback={ErrorFallback || DefaultErrorFallback}>
        <Suspense fallback={<LoadingFallback message={loadingMessage || 'Loading...'} />}>
          <LazyComponent {...(props as any)} />
        </Suspense>
      </LazyLoadErrorBoundary>
    );
  };
}

// Hook for intersection observer-based lazy loading
export const useLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || hasIntersected) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsIntersecting(true);
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
};

// Lazy loading container component
interface LazyContainerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  minHeight?: string;
}

export const LazyContainer: React.FC<LazyContainerProps> = ({
  children,
  fallback = <LoadingFallback />,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  minHeight = '200px',
}) => {
  const { elementRef, isIntersecting } = useLazyLoad(threshold, rootMargin);

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={className}
      style={{ minHeight }}
    >
      {isIntersecting ? children : fallback}
    </div>
  );
};

// Preload component for critical resources
interface PreloadProps {
  resources: Array<{
    href: string;
    as: 'image' | 'script' | 'style' | 'font' | 'fetch';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
}

export const Preload: React.FC<PreloadProps> = ({ resources }) => {
  React.useEffect(() => {
    resources.forEach(({ href, as, type, crossOrigin }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (type) link.type = type;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      
      document.head.appendChild(link);
    });
  }, [resources]);

  return null;
};

// Component for lazy loading images with intersection observer
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  ...props
}) => {
  const { elementRef, isIntersecting } = useLazyLoad(threshold, rootMargin);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="text-gray-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      {isIntersecting && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
};