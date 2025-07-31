/**
 * Enhanced Loading System
 * 
 * Provides unified loading states with skeleton animations, progress bars, 
 * and time-based feedback according to UI design improvements spec task 11
 * 
 * Features:
 * - Unified spinner and progress bar components
 * - Enhanced skeleton animations with shimmer effects
 * - Time-based loading feedback with progressive messages
 * - Accessibility-compliant loading states
 * - Performance-optimized animations
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Progress } from './progress';
import { Skeleton } from './Skeleton';
import { ANIMATIONS, ICON_SIZES } from '../../constants/design-tokens';

// Loading spinner with standardized sizes
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary'
}) => {
  const spinnerRef = React.useRef<HTMLDivElement>(null);

  const sizeClasses = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-2'
  };

  const colorClasses = {
    primary: 'border-blue-200 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    success: 'border-green-200 border-t-green-600',
    warning: 'border-yellow-200 border-t-yellow-600',
    error: 'border-red-200 border-t-red-600'
  };

  // Apply performance optimizations
  React.useEffect(() => {
    const element = spinnerRef.current;
    if (!element) return;

    // Apply GPU acceleration and will-change for smooth spinning
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';

    return () => {
      element.style.willChange = 'auto';
    };
  }, []);

  return (
    <div
      ref={spinnerRef}
      className={cn(
        'animate-spin-optimized rounded-full gpu-accelerated',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

// Enhanced progress bar with time-based feedback
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showPercentage = false,
  animated = true,
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          sizeClasses[size],
          'bg-gray-200 dark:bg-gray-700',
          animated && 'transition-all duration-300 ease-out'
        )}
      />
    </div>
  );
};

// Enhanced time-based loading feedback component
interface TimedLoadingProps {
  isLoading: boolean;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  showSpinner?: boolean;
  showProgress?: boolean;
  progress?: number;
  className?: string;
  customMessages?: {
    initial?: string;
    slow?: string;
    verySlow?: string;
    timeout?: string;
  };
  timeThresholds?: {
    slow?: number;
    verySlow?: number;
    timeout?: number;
  };
  onTimeout?: () => void;
}

export const TimedLoading: React.FC<TimedLoadingProps> = ({
  isLoading,
  children,
  fallback,
  showSpinner = true,
  showProgress = false,
  progress = 0,
  className,
  customMessages = {},
  timeThresholds = {},
  onTimeout
}) => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'slow' | 'very-slow' | 'timeout'>('initial');

  // Default messages and thresholds
  const messages = {
    initial: 'Loading...',
    slow: 'Still loading, please wait...',
    verySlow: 'This is taking longer than usual...',
    timeout: 'Loading is taking too long. Please try refreshing.',
    ...customMessages
  };

  const thresholds = {
    slow: 3000,      // 3 seconds
    verySlow: 8000,  // 8 seconds
    timeout: 30000,  // 30 seconds
    ...timeThresholds
  };

  useEffect(() => {
    if (!isLoading) {
      setLoadingTime(0);
      setLoadingPhase('initial');
      setLoadingMessage(messages.initial);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setLoadingTime(elapsed);

      // Update message and phase based on loading time
      if (elapsed >= thresholds.timeout) {
        setLoadingPhase('timeout');
        setLoadingMessage(messages.timeout);
        onTimeout?.();
      } else if (elapsed >= thresholds.verySlow) {
        setLoadingPhase('very-slow');
        setLoadingMessage(messages.verySlow);
      } else if (elapsed >= thresholds.slow) {
        setLoadingPhase('slow');
        setLoadingMessage(messages.slow);
      } else {
        setLoadingPhase('initial');
        setLoadingMessage(messages.initial);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading, messages, thresholds, onTimeout]);

  if (!isLoading) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Determine spinner color based on loading phase
  const getSpinnerColor = () => {
    switch (loadingPhase) {
      case 'timeout':
        return 'error';
      case 'very-slow':
        return 'warning';
      case 'slow':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
      {showSpinner && (
        <div className="relative">
          <LoadingSpinner 
            size="lg" 
            color={getSpinnerColor()}
            className="animate-spin"
          />
          {loadingPhase === 'very-slow' && (
            <div className="absolute inset-0 animate-pulse">
              <LoadingSpinner 
                size="xl" 
                color="warning"
                className="opacity-30"
              />
            </div>
          )}
        </div>
      )}
      
      {showProgress && (
        <div className="w-full max-w-xs">
          <ProgressBar 
            value={progress} 
            showPercentage 
            animated
            variant={loadingPhase === 'timeout' ? 'error' : loadingPhase === 'very-slow' ? 'warning' : 'default'}
          />
        </div>
      )}
      
      <div className="text-center space-y-2">
        <p className={cn(
          'font-medium transition-colors duration-300',
          loadingPhase === 'timeout' && 'text-red-600 dark:text-red-400',
          loadingPhase === 'very-slow' && 'text-yellow-600 dark:text-yellow-400',
          loadingPhase === 'slow' && 'text-blue-600 dark:text-blue-400',
          loadingPhase === 'initial' && 'text-gray-600 dark:text-gray-400'
        )}>
          {loadingMessage}
        </p>
        
        {loadingTime > thresholds.slow && (
          <p className="text-sm text-gray-500 dark:text-gray-500 animate-fade-in">
            Loading time: {Math.round(loadingTime / 1000)}s
          </p>
        )}

        {loadingPhase === 'timeout' && (
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline animate-fade-in"
          >
            Refresh page
          </button>
        )}
      </div>
    </div>
  );
};

// Enhanced skeleton with improved animations and accessibility
interface EnhancedSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'avatar' | 'button';
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none';
  lines?: number;
  spacing?: 'tight' | 'normal' | 'loose';
  randomWidth?: boolean; // For more natural text skeleton appearance
}

export const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'shimmer',
  lines = 1,
  spacing = 'normal',
  randomWidth = false
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 relative overflow-hidden will-change-transform';

  const variantClasses = {
    text: 'rounded h-4',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    avatar: 'rounded-full aspect-square',
    button: 'rounded-lg h-10'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    shimmer: 'animate-shimmer',
    none: ''
  };

  const spacingClasses = {
    tight: 'space-y-1',
    normal: 'space-y-2',
    loose: 'space-y-3'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // Enhanced shimmer effect with better performance
  const shimmerOverlay = animation === 'shimmer' && (
    <div 
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 dark:via-gray-600/30 to-transparent gpu-accelerated"
      style={{ 
        animation: 'shimmerOptimized 1.2s ease-in-out infinite',
        willChange: 'transform',
        transform: 'translateZ(0) translateX(-100%)'
      }}
    />
  );

  // Generate random widths for more natural text appearance
  const getRandomWidth = (index: number, total: number) => {
    if (!randomWidth) return index === total - 1 ? '75%' : '100%';
    
    const widths = ['100%', '95%', '85%', '90%', '80%', '75%'];
    return index === total - 1 ? '60%' : widths[index % widths.length];
  };

  if (lines > 1) {
    return (
      <div className={cn(spacingClasses[spacing], className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              animationClasses[animation],
              'transition-all duration-300'
            )}
            style={{ 
              height: height || (variant === 'text' ? 16 : 20),
              width: getRandomWidth(index, lines),
              animationDelay: `${index * 100}ms` // Staggered animation
            }}
            role="status"
            aria-label="Loading content"
          >
            {shimmerOverlay}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        'transition-all duration-300',
        className
      )}
      style={style}
      role="status"
      aria-label="Loading content"
    >
      {shimmerOverlay}
    </div>
  );
};

// Enhanced loading wrapper with improved skeleton detection and animations
interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton?: 'text' | 'card' | 'table' | 'chart' | 'list' | 'dashboard' | 'form' | 'custom';
  skeletonProps?: any;
  children: React.ReactNode;
  className?: string;
  loadingClassName?: string;
  fadeTransition?: boolean;
  staggerAnimation?: boolean;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  skeleton = 'text',
  skeletonProps = {},
  children,
  className,
  loadingClassName,
  fadeTransition = true,
  staggerAnimation = true
}) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
    } else if (fadeTransition) {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isLoading, fadeTransition]);

  const renderSkeleton = () => {
    const staggerClass = staggerAnimation ? 'stagger-children' : '';
    
    switch (skeleton) {
      case 'text':
        return (
          <div className={staggerClass}>
            <EnhancedSkeleton 
              lines={3} 
              animation="shimmer" 
              randomWidth 
              spacing="normal"
              {...skeletonProps} 
            />
          </div>
        );
      
      case 'card':
        return (
          <div className={cn("border rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800", staggerClass)}>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <EnhancedSkeleton height={24} width="60%" animation="shimmer" />
                <EnhancedSkeleton height={16} width="40%" animation="shimmer" />
              </div>
              <EnhancedSkeleton height={32} width={32} variant="circular" animation="shimmer" />
            </div>
            <EnhancedSkeleton lines={3} animation="shimmer" randomWidth />
            <div className="flex space-x-3 pt-2">
              <EnhancedSkeleton height={36} width={100} variant="button" animation="shimmer" />
              <EnhancedSkeleton height={36} width={80} variant="button" animation="shimmer" />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className={cn("border rounded-lg overflow-hidden bg-white dark:bg-gray-800", staggerClass)}>
            {/* Table header */}
            <div className="border-b bg-gray-50 dark:bg-gray-700 p-4">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <EnhancedSkeleton key={i} height={20} animation="shimmer" />
                ))}
              </div>
            </div>
            {/* Table rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <EnhancedSkeleton key={j} height={16} animation="shimmer" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div className={cn("border rounded-lg p-6 bg-white dark:bg-gray-800", staggerClass)}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <EnhancedSkeleton height={28} width="40%" animation="shimmer" />
                <div className="flex space-x-2">
                  <EnhancedSkeleton height={32} width={80} variant="button" animation="shimmer" />
                  <EnhancedSkeleton height={32} width={60} variant="button" animation="shimmer" />
                </div>
              </div>
              <EnhancedSkeleton height={300} animation="shimmer" className="rounded" />
              <div className="flex justify-center space-x-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <EnhancedSkeleton height={12} width={12} variant="circular" animation="shimmer" />
                    <EnhancedSkeleton height={12} width={80} animation="shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className={cn("space-y-4", staggerClass)}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
                <EnhancedSkeleton height={48} width={48} variant="avatar" animation="shimmer" />
                <div className="flex-1 space-y-2">
                  <EnhancedSkeleton height={18} width="75%" animation="shimmer" />
                  <EnhancedSkeleton height={14} width="50%" animation="shimmer" />
                </div>
                <div className="flex space-x-2">
                  <EnhancedSkeleton height={32} width={80} variant="button" animation="shimmer" />
                  <EnhancedSkeleton height={32} width={32} variant="circular" animation="shimmer" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'dashboard':
        return (
          <div className={cn("space-y-6", staggerClass)}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <EnhancedSkeleton height={32} width={300} animation="shimmer" />
                <EnhancedSkeleton height={16} width={400} animation="shimmer" />
              </div>
              <EnhancedSkeleton height={40} width={120} variant="button" animation="shimmer" />
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 border rounded-lg bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <EnhancedSkeleton height={16} width={80} animation="shimmer" />
                      <EnhancedSkeleton height={32} width={60} animation="shimmer" />
                    </div>
                    <EnhancedSkeleton height={40} width={40} variant="circular" animation="shimmer" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
                <EnhancedSkeleton height={24} width="40%" animation="shimmer" className="mb-4" />
                <EnhancedSkeleton height={200} animation="shimmer" />
              </div>
              <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
                <EnhancedSkeleton height={24} width="40%" animation="shimmer" className="mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <EnhancedSkeleton height={32} width={32} variant="circular" animation="shimmer" />
                      <div className="flex-1 space-y-1">
                        <EnhancedSkeleton height={16} width="70%" animation="shimmer" />
                        <EnhancedSkeleton height={12} width="40%" animation="shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className={cn("space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800", staggerClass)}>
            <EnhancedSkeleton height={28} width="50%" animation="shimmer" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <EnhancedSkeleton height={16} width="30%" animation="shimmer" />
                <EnhancedSkeleton height={40} width="100%" animation="shimmer" />
              </div>
            ))}
            <div className="flex justify-end space-x-3 pt-4">
              <EnhancedSkeleton height={40} width={80} variant="button" animation="shimmer" />
              <EnhancedSkeleton height={40} width={100} variant="button" animation="shimmer" />
            </div>
          </div>
        );
      
      default:
        return <EnhancedSkeleton animation="shimmer" {...skeletonProps} />;
    }
  };

  if (!isVisible) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(
      className, 
      loadingClassName,
      fadeTransition && (isLoading ? 'animate-fade-in' : 'animate-fade-out')
    )}>
      {renderSkeleton()}
    </div>
  );
};

// Enhanced loading states for specific components with better UX
export const LoadingStates = {
  Dashboard: ({ showHeader = true, showStats = true, showCharts = true }) => (
    <div className="space-y-6 p-6 animate-fade-in">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <EnhancedSkeleton height={32} width={300} animation="shimmer" />
            <EnhancedSkeleton height={16} width={450} animation="shimmer" />
          </div>
          <EnhancedSkeleton height={40} width={140} variant="button" animation="shimmer" />
        </div>
      )}

      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <EnhancedSkeleton height={16} width={90} animation="shimmer" />
                  <EnhancedSkeleton height={32} width={70} animation="shimmer" />
                  <EnhancedSkeleton height={12} width={60} animation="shimmer" />
                </div>
                <EnhancedSkeleton height={40} width={40} variant="circular" animation="shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingWrapper isLoading skeleton="chart" staggerAnimation children={undefined} />
          <LoadingWrapper isLoading skeleton="list" staggerAnimation children={undefined} />
        </div>
      )}
    </div>
  ),

  Table: ({ rows = 5, columns = 4, showHeader = true, showPagination = false }) => (
    <div className="space-y-4">
      <LoadingWrapper 
        isLoading
        skeleton="table"
        skeletonProps={{ rows, columns, showHeader }}
        staggerAnimation children={undefined}      />
      {showPagination && (
        <div className="flex items-center justify-between pt-4">
          <EnhancedSkeleton height={16} width={120} animation="shimmer" />
          <div className="flex space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <EnhancedSkeleton key={i} height={32} width={32} variant="button" animation="shimmer" />
            ))}
          </div>
        </div>
      )}
    </div>
  ),

  Chart: ({ type = 'line', showLegend = true, showControls = true }) => (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 space-y-4">
      {showControls && (
        <div className="flex items-center justify-between">
          <EnhancedSkeleton height={28} width="35%" animation="shimmer" />
          <div className="flex space-x-2">
            <EnhancedSkeleton height={32} width={80} variant="button" animation="shimmer" />
            <EnhancedSkeleton height={32} width={60} variant="button" animation="shimmer" />
          </div>
        </div>
      )}
      
      <EnhancedSkeleton 
        height={type === 'pie' ? 250 : 300} 
        animation="shimmer" 
        className="rounded"
      />
      
      {showLegend && (
        <div className="flex justify-center space-x-6">
          {Array.from({ length: type === 'pie' ? 4 : 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <EnhancedSkeleton height={12} width={12} variant="circular" animation="shimmer" />
              <EnhancedSkeleton height={12} width={80} animation="shimmer" />
            </div>
          ))}
        </div>
      )}
    </div>
  ),

  Card: ({ showAvatar = false, showActions = true, contentLines = 3 }) => (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {showAvatar && (
            <EnhancedSkeleton height={48} width={48} variant="avatar" animation="shimmer" />
          )}
          <div className="space-y-2 flex-1">
            <EnhancedSkeleton height={24} width="70%" animation="shimmer" />
            <EnhancedSkeleton height={16} width="50%" animation="shimmer" />
          </div>
        </div>
        <EnhancedSkeleton height={32} width={32} variant="circular" animation="shimmer" />
      </div>
      
      <EnhancedSkeleton 
        lines={contentLines} 
        animation="shimmer" 
        randomWidth 
        spacing="normal"
      />
      
      {showActions && (
        <div className="flex space-x-3 pt-2 border-t">
          <EnhancedSkeleton height={36} width={100} variant="button" animation="shimmer" />
          <EnhancedSkeleton height={36} width={80} variant="button" animation="shimmer" />
        </div>
      )}
    </div>
  ),

  List: ({ items = 5, showAvatar = true, showActions = true }) => (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
          {showAvatar && (
            <EnhancedSkeleton height={48} width={48} variant="avatar" animation="shimmer" />
          )}
          <div className="flex-1 space-y-2">
            <EnhancedSkeleton height={18} width="75%" animation="shimmer" />
            <EnhancedSkeleton height={14} width="50%" animation="shimmer" />
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <EnhancedSkeleton height={32} width={80} variant="button" animation="shimmer" />
              <EnhancedSkeleton height={32} width={32} variant="circular" animation="shimmer" />
            </div>
          )}
        </div>
      ))}
    </div>
  ),

  Form: ({ fields = 4, showTitle = true, showActions = true }) => (
    <div className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800">
      {showTitle && (
        <div className="space-y-2">
          <EnhancedSkeleton height={28} width="60%" animation="shimmer" />
          <EnhancedSkeleton height={16} width="80%" animation="shimmer" />
        </div>
      )}
      
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <EnhancedSkeleton height={16} width="25%" animation="shimmer" />
            <EnhancedSkeleton height={40} width="100%" animation="shimmer" />
          </div>
        ))}
      </div>
      
      {showActions && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <EnhancedSkeleton height={40} width={80} variant="button" animation="shimmer" />
          <EnhancedSkeleton height={40} width={100} variant="button" animation="shimmer" />
        </div>
      )}
    </div>
  ),

  Analytics: () => (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <EnhancedSkeleton height={32} width={250} animation="shimmer" />
        <div className="flex space-x-2">
          <EnhancedSkeleton height={36} width={120} variant="button" animation="shimmer" />
          <EnhancedSkeleton height={36} width={100} variant="button" animation="shimmer" />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg bg-white dark:bg-gray-800 text-center">
            <EnhancedSkeleton height={48} width={48} variant="circular" animation="shimmer" className="mx-auto mb-3" />
            <EnhancedSkeleton height={32} width={80} animation="shimmer" className="mx-auto mb-2" />
            <EnhancedSkeleton height={16} width={120} animation="shimmer" className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingStates.Chart type="line" />
        <LoadingStates.Chart type="pie" />
      </div>
    </div>
  )
};

export default {
  LoadingSpinner,
  ProgressBar,
  TimedLoading,
  EnhancedSkeleton,
  LoadingWrapper,
  LoadingStates
};