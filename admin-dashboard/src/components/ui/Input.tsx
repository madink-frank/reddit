import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  label?: string;
  helpText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  // Icon props
  leftIcon?: React.ComponentType<any> | React.ReactElement;
  rightIcon?: React.ComponentType<any> | React.ReactElement;
  leftIconClassName?: string;
  rightIconClassName?: string;
}

// Icon utility functions
const getIconSize = (inputSize: 'sm' | 'md' | 'lg'): number => {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 18
  };
  return sizeMap[inputSize];
};

// Enhanced icon position constants for different input sizes and variants
const iconPositions = {
  left: {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-4'
  },
  right: {
    sm: 'right-2.5',
    md: 'right-3', 
    lg: 'right-4'
  }
} as const;

// Variant-specific adjustments for icon positioning
const getVariantIconAdjustments = (variant: 'default' | 'filled' | 'outlined', size: 'sm' | 'md' | 'lg') => {
  // Outlined variant needs slightly more padding due to thicker border
  if (variant === 'outlined') {
    const adjustments = {
      sm: { left: 'left-3', right: 'right-3' },
      md: { left: 'left-3.5', right: 'right-3.5' },
      lg: { left: 'left-4.5', right: 'right-4.5' }
    };
    return adjustments[size];
  }
  
  // Default and filled variants use standard positioning
  return {
    left: iconPositions.left[size],
    right: iconPositions.right[size]
  };
};

const getIconPositionClasses = (
  position: 'left' | 'right', 
  inputSize: 'sm' | 'md' | 'lg',
  variant: 'default' | 'filled' | 'outlined' = 'default'
): string => {
  const variantAdjustments = getVariantIconAdjustments(variant, inputSize);
  return variantAdjustments[position];
};

// Enhanced dynamic padding calculation system with variant support
const getPaddingClasses = (
  leftIcon: boolean, 
  rightIcon: boolean, 
  hasStateIndicator: boolean,
  size: 'sm' | 'md' | 'lg',
  variant: 'default' | 'filled' | 'outlined' = 'default'
): string => {
  // Base padding when no icons are present
  const basePadding = {
    sm: { left: 'pl-2.5', right: 'pr-2.5' },
    md: { left: 'pl-3', right: 'pr-3' },
    lg: { left: 'pl-4', right: 'pr-4' }
  };
  
  // Icon padding when icons are present - adjusted for variants
  const iconPadding = {
    default: {
      sm: { left: 'pl-8', right: 'pr-8' },
      md: { left: 'pl-10', right: 'pr-10' },
      lg: { left: 'pl-12', right: 'pr-12' }
    },
    filled: {
      sm: { left: 'pl-8', right: 'pr-8' },
      md: { left: 'pl-10', right: 'pr-10' },
      lg: { left: 'pl-12', right: 'pr-12' }
    },
    outlined: {
      // Outlined variant needs slightly more padding due to thicker border
      sm: { left: 'pl-9', right: 'pr-9' },
      md: { left: 'pl-11', right: 'pr-11' },
      lg: { left: 'pl-13', right: 'pr-13' }
    }
  };
  
  // Calculate left padding based on left icon presence
  const leftPadding = leftIcon ? iconPadding[variant][size].left : basePadding[size].left;
  
  // Calculate right padding based on right icon or state indicator presence
  // State indicators take precedence over right icons
  const rightPadding = (rightIcon || hasStateIndicator) ? iconPadding[variant][size].right : basePadding[size].right;
  
  return `${leftPadding} ${rightPadding}`;
};

const renderIcon = (
  icon: React.ComponentType<any> | React.ReactElement | undefined,
  position: 'left' | 'right',
  inputSize: 'sm' | 'md' | 'lg',
  variant: 'default' | 'filled' | 'outlined' = 'default',
  className?: string
): React.ReactElement | null => {
  if (!icon) return null;
  
  try {
    const baseClasses = cn(
      'absolute inset-y-0 flex items-center pointer-events-none',
      getIconPositionClasses(position, inputSize, variant),
      'text-tertiary', // Default color from design system
      // Ensure proper z-index for different variants
      variant === 'outlined' ? 'z-10' : 'z-0',
      className
    );
    
    let iconElement: React.ReactElement;
    
    // Handle React component icons (like Lucide icons)
    if (typeof icon === 'function') {
      iconElement = React.createElement(icon, { 
        size: getIconSize(inputSize),
        className: 'flex-shrink-0'
      });
    }
    // Handle JSX element icons
    else if (React.isValidElement(icon)) {
      // Clone the element and ensure it has appropriate size
      const iconProps = icon.props as any;
      iconElement = React.cloneElement(icon, {
        ...iconProps,
        className: cn('flex-shrink-0', iconProps?.className),
        style: {
          width: getIconSize(inputSize),
          height: getIconSize(inputSize),
          ...(iconProps?.style || {})
        }
      });
    }
    // Invalid icon type - return null and warn in development
    else {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.warn('Invalid icon type provided to Input component. Expected React component or JSX element.');
      }
      return null;
    }
    
    return (
      <div className={baseClasses} aria-hidden="true">
        {iconElement}
      </div>
    );
  } catch (error) {
    // Error handling for icon rendering failures
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('Error rendering icon in Input component:', error);
    }
    return null;
  }
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    error, 
    label, 
    helpText, 
    variant = 'default',
    size = 'md',
    success = false,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    onKeyDown,
    onFocus,
    onBlur,
    leftIcon,
    rightIcon,
    leftIconClassName,
    rightIconClassName,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;
    const helpTextId = `${inputId}-help`;
    const errorId = `${inputId}-error`;
    
    // State for focus management to encompass entire input container
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Enhanced keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle Escape key to clear input (if not required)
      if (event.key === 'Escape' && !props.required) {
        const target = event.target as HTMLInputElement;
        target.value = '';
        if (props.onChange) {
          props.onChange(event as any);
        }
      }
      
      // Call custom onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(event);
      }
    };
    
    // Enhanced focus handling for container-wide focus behavior
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) {
        onFocus(event);
      }
    };
    
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) {
        onBlur(event);
      }
    };
    
    // Base size classes without padding (padding will be calculated dynamically)
    const sizeClasses = {
      sm: 'h-8 py-1.5 text-sm',
      md: 'h-10 py-2 text-sm',
      lg: 'h-12 py-3 text-base'
    };
    
    // Calculate dynamic padding based on icon presence and state indicators
    const hasStateIndicator = success || !!error;
    const dynamicPadding = getPaddingClasses(
      !!leftIcon, 
      !!rightIcon, 
      hasStateIndicator, 
      size,
      variant
    );

    const variantClasses = {
      default: 'border-primary bg-surface-primary',
      filled: 'border-transparent bg-surface-secondary',
      outlined: 'border-2 border-primary bg-transparent'
    };

    const getStateClasses = () => {
      if (error) {
        return 'border-error focus:border-error';
      }
      if (success) {
        return 'border-success focus:border-success';
      }
      return 'border-primary focus:border-focus';
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-primary mb-2"
          >
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <div 
          className={cn(
            "relative",
            // Enhanced focus ring that encompasses the entire input container
            isFocused && "ring-3 ring-focus/20 ring-offset-0 rounded-md"
          )}
        >
          {/* Left Icon */}
          {renderIcon(leftIcon, 'left', size, variant, leftIconClassName)}
          
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles
              "flex w-full rounded-md font-sans transition-all duration-200 ease-out",
              "placeholder:text-tertiary",
              "focus:outline-none", // Remove default focus ring since container handles it
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              
              // Size classes (height and vertical padding)
              sizeClasses[size],
              
              // Dynamic padding based on icon presence
              dynamicPadding,
              
              // Variant classes
              variantClasses[variant],
              
              // State classes (without focus ring since container handles it)
              getStateClasses(),
              
              // Custom className
              className
            )}
            ref={ref}
            aria-describedby={cn(
              ariaDescribedBy,
              helpText && helpTextId,
              error && errorId
            ).trim() || undefined}
            aria-invalid={ariaInvalid || !!error}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Right Icon - only show if no state indicators are present */}
          {!success && !error && renderIcon(rightIcon, 'right', size, variant, rightIconClassName)}
          
          {/* Success indicator */}
          {success && !error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg 
                className="h-4 w-4 text-success" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          )}
          
          {/* Error indicator */}
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg 
                className="h-4 w-4 text-error" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Help text */}
        {helpText && !error && (
          <p id={helpTextId} className="mt-1.5 text-xs text-tertiary">
            {helpText}
          </p>
        )}
        
        {/* Error message */}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-error flex items-center gap-1" role="alert">
            <svg 
              className="h-3 w-3 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";