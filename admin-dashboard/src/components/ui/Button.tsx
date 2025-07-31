import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { useColorAccessibility } from '../../hooks/useColorAccessibility';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  semanticType?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    semanticType,
    children,
    disabled,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    ...props 
  }, ref) => {
    const { applyAccessibilityClasses, preferences } = useColorAccessibility();
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Apply accessibility classes when preferences change
    useEffect(() => {
      const element = buttonRef.current;
      if (element && semanticType) {
        applyAccessibilityClasses(element, semanticType);
      }
    }, [applyAccessibilityClasses, semanticType, preferences]);
    const baseClasses = [
      'inline-flex items-center justify-center gap-2 rounded-md font-medium',
      preferences.reducedMotion ? '' : 'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      preferences.enhancedFocus && 'enhanced-focus',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      fullWidth && 'w-full'
    ].filter(Boolean).join(' ');

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50',
      secondary: 'bg-surface-secondary text-primary hover:bg-surface-secondary/80 focus:ring-primary/50',
      outline: 'border border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50',
      ghost: 'text-primary hover:bg-surface-secondary focus:ring-primary/50',
      destructive: 'bg-error text-white hover:bg-error/90 focus:ring-error/50',
      success: 'bg-success text-white hover:bg-success/90 focus:ring-success/50',
      warning: 'bg-warning text-white hover:bg-warning/90 focus:ring-warning/50'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        disabled={isDisabled}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg 
            className={cn('animate-spin', iconSizeClasses[size])} 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={iconSizeClasses[size]} aria-hidden="true" />
        )}
        
        {children && (
          <span className={loading ? 'sr-only' : undefined}>
            {children}
          </span>
        )}
        
        {loading && (
          <span className="sr-only">Loading...</span>
        )}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={iconSizeClasses[size]} aria-hidden="true" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Export button variants for use in other components
export const buttonVariants = {
  variant: {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50',
    secondary: 'bg-surface-secondary text-primary hover:bg-surface-secondary/80 focus:ring-primary/50',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50',
    ghost: 'text-primary hover:bg-surface-secondary focus:ring-primary/50',
    destructive: 'bg-error text-white hover:bg-error/90 focus:ring-error/50',
    success: 'bg-success text-white hover:bg-success/90 focus:ring-success/50',
    warning: 'bg-warning text-white hover:bg-warning/90 focus:ring-warning/50'
  },
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
};