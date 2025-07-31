/**
 * Unified Loading Components Library
 * 
 * Provides consistent loading UI components with time-based feedback
 * according to UI design improvements spec task 11
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner, ProgressBar, TimedLoading, EnhancedSkeleton } from './LoadingSystem';
import { useLoadingState } from '../../hooks/useLoadingState';

// Enhanced loading overlay with better UX and accessibility
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
  backdrop?: 'light' | 'dark' | 'blur' | 'transparent';
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
  onClose?: () => void;
  preventClose?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  showProgress = false,
  progress = 0,
  className,
  backdrop = 'blur',
  size = 'md',
  showCloseButton = false,
  onClose,
  preventClose = true
}) => {
  if (!isLoading) return null;

  const backdropClasses = {
    light: 'bg-white/90',
    dark: 'bg-black/60',
    blur: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
    transparent: 'bg-transparent'
  };

  const sizeClasses = {
    sm: 'max-w-xs p-6',
    md: 'max-w-sm p-8',
    lg: 'max-w-md p-10'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose && onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !preventClose && onClose) {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isLoading && !preventClose) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLoading, preventClose, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center animate-fade-in',
        backdropClasses[backdrop],
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full mx-4 relative animate-scale-in',
        sizeClasses[size]
      )}>
        {showCloseButton && onClose && !preventClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close loading dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <div className="text-center">
          <div className="relative mb-6">
            <LoadingSpinner size="lg" className="mx-auto" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {message}
          </h3>
          
          {showProgress && (
            <div className="mb-4">
              <ProgressBar
                value={progress}
                showPercentage
                animated
                className="mb-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please wait while we process your request...
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline loading component for content areas
interface InlineLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: 'text' | 'card' | 'table' | 'chart' | 'list';
  message?: string;
  showSpinner?: boolean;
  className?: string;
  loadingClassName?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  isLoading,
  children,
  skeleton = 'text',
  message,
  showSpinner = true,
  className,
  loadingClassName
}) => {
  if (!isLoading) {
    return <div className={className}>{children}</div>;
  }

  const renderSkeleton = () => {
    switch (skeleton) {
      case 'text':
        return <EnhancedSkeleton lines={3} animation="shimmer" />;
      
      case 'card':
        return (
          <div className="border rounded-lg p-4 space-y-3">
            <EnhancedSkeleton height={24} width="60%" animation="shimmer" />
            <EnhancedSkeleton lines={3} animation="shimmer" />
            <div className="flex space-x-2 pt-2">
              <EnhancedSkeleton height={32} width={80} />
              <EnhancedSkeleton height={32} width={80} />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="space-y-3">
            <div className="flex space-x-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <EnhancedSkeleton key={i} height={20} className="flex-1" animation="shimmer" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <EnhancedSkeleton key={j} height={16} className="flex-1" animation="shimmer" />
                ))}
              </div>
            ))}
          </div>
        );
      
      case 'chart':
        return (
          <div className="space-y-4">
            <EnhancedSkeleton height={24} width="40%" animation="shimmer" />
            <EnhancedSkeleton height={200} animation="shimmer" />
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <EnhancedSkeleton height={40} width={40} variant="circular" animation="shimmer" />
                <div className="flex-1 space-y-2">
                  <EnhancedSkeleton height={16} width="75%" animation="shimmer" />
                  <EnhancedSkeleton height={14} width="50%" animation="shimmer" />
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return <EnhancedSkeleton animation="shimmer" />;
    }
  };

  return (
    <div className={cn(className, loadingClassName)}>
      {message && showSpinner ? (
        <div className="flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="md" className="mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      ) : (
        renderSkeleton()
      )}
    </div>
  );
};

// Enhanced button with loading state and better UX
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loadingSpinnerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  className,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loadingSpinnerColor,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white border-transparent',
    secondary: 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 text-gray-900 border-transparent dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
    outline: 'border-gray-300 hover:bg-gray-50 focus:ring-blue-500 text-gray-700 bg-transparent dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 focus:ring-gray-500 text-gray-700 border-transparent dark:hover:bg-gray-800 dark:text-gray-300',
    destructive: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white border-transparent'
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const spinnerSizes = {
    xs: 'xs' as const,
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'sm' as const,
    xl: 'md' as const
  };

  // Determine spinner color based on variant if not explicitly set
  const getSpinnerColor = () => {
    if (loadingSpinnerColor) return loadingSpinnerColor;
    
    switch (variant) {
      case 'primary':
      case 'destructive':
        return 'secondary';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const buttonContent = isLoading && loadingText ? loadingText : children;
  const showIcon = icon && !isLoading;
  const showSpinner = isLoading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 border',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95 transform',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isLoading && 'cursor-wait',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Left icon or spinner */}
      {(showSpinner || (showIcon && iconPosition === 'left')) && (
        <span className={cn('flex-shrink-0', buttonContent && 'mr-2')}>
          {showSpinner ? (
            <LoadingSpinner 
              size={spinnerSizes[size]} 
              color={getSpinnerColor()}
            />
          ) : (
            showIcon && iconPosition === 'left' && icon
          )}
        </span>
      )}
      
      {/* Button text */}
      <span className={cn(
        'transition-opacity duration-200',
        isLoading && 'opacity-90'
      )}>
        {buttonContent}
      </span>
      
      {/* Right icon */}
      {showIcon && iconPosition === 'right' && (
        <span className={cn('flex-shrink-0', buttonContent && 'ml-2')}>
          {icon}
        </span>
      )}
    </button>
  );
};

// Progressive loading component with stages
interface ProgressiveLoadingProps {
  stages: string[];
  currentStage: number;
  stageProgress?: number;
  overallProgress?: number;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  stages,
  currentStage,
  stageProgress = 0,
  overallProgress,
  className
}) => {
  const calculatedOverallProgress = overallProgress ?? 
    ((currentStage + (stageProgress / 100)) / stages.length) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {stages[currentStage]}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Step {currentStage + 1} of {stages.length}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Overall Progress</span>
          <span>{Math.round(calculatedOverallProgress)}%</span>
        </div>
        <ProgressBar
          value={calculatedOverallProgress}
          animated
          className="mb-4"
        />
      </div>

      {stageProgress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Current Stage</span>
            <span>{Math.round(stageProgress)}%</span>
          </div>
          <ProgressBar
            value={stageProgress}
            variant="success"
            size="sm"
            animated
          />
        </div>
      )}

      <div className="space-y-1">
        {stages.map((stage, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center text-sm',
              index < currentStage && 'text-green-600',
              index === currentStage && 'text-blue-600 font-medium',
              index > currentStage && 'text-gray-400'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full mr-3',
                index < currentStage && 'bg-green-600',
                index === currentStage && 'bg-blue-600',
                index > currentStage && 'bg-gray-300'
              )}
            />
            {stage}
          </div>
        ))}
      </div>
    </div>
  );
};

// Smart loading component that adapts based on loading time
interface SmartLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  isLoading,
  children,
  fallback,
  className
}) => {
  const loadingState = useLoadingState({
    messages: {
      normal: 'Loading...',
      slow: 'Still loading, please wait...',
      verySlow: 'This is taking longer than usual...',
      timeout: 'Loading timed out. Please try again.'
    }
  });

  React.useEffect(() => {
    if (isLoading) {
      loadingState.startLoading();
    } else {
      loadingState.stopLoading();
    }
  }, [isLoading, loadingState]);

  if (!isLoading) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <TimedLoading
      isLoading={loadingState.isLoading}
      showSpinner
      className={className}
    />
  );
};

// Export all components
export {
  LoadingSpinner,
  ProgressBar,
  TimedLoading,
  EnhancedSkeleton
} from './LoadingSystem';

export default {
  LoadingOverlay,
  InlineLoading,
  LoadingButton,
  ProgressiveLoading,
  SmartLoading,
  LoadingSpinner,
  ProgressBar,
  TimedLoading,
  EnhancedSkeleton
};