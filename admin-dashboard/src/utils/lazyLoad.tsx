import React, { Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

/**
 * Higher-order component for lazy loading with loading fallback
 */
export function withLazyLoading<T extends object>(
  Component: React.LazyExoticComponent<ComponentType<T>>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Create a lazy-loaded component with default loading spinner
 */
export function createLazyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFn);
  return withLazyLoading(LazyComponent, fallback);
}

/**
 * Loading fallback for page-level components
 */
export const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading page...</p>
    </div>
  </div>
);

/**
 * Loading fallback for smaller components
 */
export const ComponentLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <LoadingSpinner size="sm" />
  </div>
);