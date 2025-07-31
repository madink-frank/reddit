import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Skeleton } from '../ui/Skeleton';

// Lazy loading configuration
export interface LazyLoadConfig {
  threshold?: number; // Intersection threshold (0-1)
  rootMargin?: string; // Root margin for intersection observer
  triggerOnce?: boolean; // Only trigger loading once
  placeholder?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  retryAttempts?: number;
  retryDelay?: number;
}

// Lazy load hook
export function useLazyLoad(config: LazyLoadConfig = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    elementRef,
    isVisible,
    hasLoaded
  };
}

// Generic lazy loader component
interface LazyLoaderProps {
  children: React.ReactNode;
  config?: LazyLoadConfig;
  className?: string;
  style?: React.CSSProperties;
}

export function LazyLoader({ children, config = {}, className, style }: LazyLoaderProps) {
  const { elementRef, isVisible, hasLoaded } = useLazyLoad(config);
  const { placeholder: Placeholder = DefaultPlaceholder } = config;

  return (
    <div ref={elementRef} className={className} style={style}>
      {hasLoaded ? children : <Placeholder />}
    </div>
  );
}

// Default placeholder component
function DefaultPlaceholder() {
  return (
    <div className="animate-pulse">
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// Error boundary for lazy loaded components
interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class LazyErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
  },
  LazyErrorBoundaryState
> {
  private retryTimer: number | null = null;

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<LazyErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    this.props.onError?.(error);
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  retry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;

    if (this.state.retryCount < maxRetries) {
      this.retryTimer = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          retryCount: prevState.retryCount + 1
        }));
      }, retryDelay);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Loading Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Failed to load component. {this.state.error?.message}
              </p>
            </div>
            {this.state.retryCount < (this.props.maxRetries || 3) && (
              <button
                onClick={this.retry}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry ({this.state.retryCount + 1}/{this.props.maxRetries || 3})
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy component wrapper with enhanced features
interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ComponentType;
  errorBoundary?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  preload?: boolean;
  [key: string]: any;
}

export function LazyComponent({
  loader,
  fallback: Fallback = DefaultPlaceholder,
  errorBoundary = true,
  retryAttempts = 3,
  retryDelay = 1000,
  preload = false,
  ...props
}: LazyComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasPreloaded = useRef(false);

  const loadComponent = async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const module = await loader();
      setComponent(() => module.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    if (retryCount < retryAttempts) {
      setRetryCount(prev => prev + 1);
      setTimeout(loadComponent, retryDelay);
    }
  };

  // Preload component if requested
  useEffect(() => {
    if (preload && !hasPreloaded.current) {
      hasPreloaded.current = true;
      loadComponent();
    }
  }, [preload]);

  const content = (() => {
    if (error) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Component Load Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error.message}
              </p>
            </div>
            {retryCount < retryAttempts && (
              <button
                onClick={retry}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry ({retryCount + 1}/{retryAttempts})
              </button>
            )}
          </div>
        </div>
      );
    }

    if (isLoading || !Component) {
      return <Fallback />;
    }

    return <Component {...props} />;
  })();

  if (errorBoundary) {
    return (
      <LazyErrorBoundary maxRetries={retryAttempts} retryDelay={retryDelay}>
        <LazyLoader config={{ triggerOnce: true }}>
          <div onMouseEnter={loadComponent} onClick={loadComponent}>
            {content}
          </div>
        </LazyLoader>
      </LazyErrorBoundary>
    );
  }

  return (
    <LazyLoader config={{ triggerOnce: true }}>
      <div onMouseEnter={loadComponent} onClick={loadComponent}>
        {content}
      </div>
    </LazyLoader>
  );
}

// Progressive enhancement hook
export function useProgressiveEnhancement<T>(
  baseFeature: T,
  enhancedFeature: () => Promise<T>,
  condition: boolean = true
) {
  const [feature, setFeature] = useState<T>(baseFeature);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (condition && !isEnhanced && !isLoading) {
      setIsLoading(true);

      enhancedFeature()
        .then(enhanced => {
          setFeature(enhanced);
          setIsEnhanced(true);
        })
        .catch(error => {
          console.warn('Progressive enhancement failed:', error);
          // Keep using base feature
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [condition, isEnhanced, isLoading]);

  return {
    feature,
    isEnhanced,
    isLoading
  };
}

// Enhanced lazy image component with format optimization
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  webpSrc?: string;
  avifSrc?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  webpSrc,
  avifSrc,
  priority = false,
  quality = 75,
  onLoad,
  onError,
  className,
  sizes,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || blurDataURL || '');
  const [optimizedSources, setOptimizedSources] = useState<{
    avif?: string;
    webp?: string;
    fallback: string;
  } | null>(null);
  const { elementRef, isVisible } = useLazyLoad({ threshold: 0.1 });

  // Generate optimized sources
  useEffect(() => {
    const generateSources = async () => {
      try {
        // Import the optimization service dynamically to avoid circular dependencies
        const { imageOptimizationService } = await import('../../services/imageOptimizationService');
        const asset = await imageOptimizationService.optimizeImage(src, { quality, priority });

        setOptimizedSources({
          avif: avifSrc || asset.optimizedUrls.avif,
          webp: webpSrc || asset.optimizedUrls.webp,
          fallback: asset.optimizedUrls.jpeg
        });

        if (asset.placeholder && !blurDataURL) {
          setCurrentSrc(asset.placeholder);
        }
      } catch (error) {
        console.warn('Failed to optimize image, using fallback:', error);
        setOptimizedSources({
          avif: avifSrc,
          webp: webpSrc,
          fallback: src
        });
      }
    };

    generateSources();
  }, [src, webpSrc, avifSrc, quality, priority, blurDataURL]);

  // Load the actual image when in view
  useEffect(() => {
    if ((isVisible || priority) && optimizedSources && !isLoaded && !hasError) {
      const img = new Image();

      img.onload = () => {
        setCurrentSrc(optimizedSources.fallback);
        setIsLoaded(true);
        onLoad?.();
      };

      img.onerror = () => {
        setHasError(true);
        onError?.();
      };

      img.src = optimizedSources.fallback;
    }
  }, [isVisible, priority, optimizedSources, isLoaded, hasError, onLoad, onError]);

  if (!optimizedSources) {
    return (
      <div
        ref={elementRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className || ''}`}
        {...props}
      />
    );
  }

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className || ''}`}>
      <picture>
        {/* AVIF source for modern browsers */}
        {optimizedSources.avif && (isVisible || priority) && (
          <source srcSet={optimizedSources.avif} type="image/avif" sizes={sizes} />
        )}

        {/* WebP source for modern browsers */}
        {optimizedSources.webp && (isVisible || priority) && (
          <source srcSet={optimizedSources.webp} type="image/webp" sizes={sizes} />
        )}

        <img
          src={currentSrc}
          alt={alt}
          className={`transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
            } ${blurDataURL && !isLoaded ? 'blur-sm scale-110' : ''}`}
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
          {...props}
        />
      </picture>

      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

export default LazyLoader;