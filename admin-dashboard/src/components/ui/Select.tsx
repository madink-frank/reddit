import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  label?: string;
  helpText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
  placeholder?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    children, 
    value, 
    onValueChange, 
    onChange, 
    error,
    label,
    helpText,
    variant = 'default',
    size = 'md',
    success = false,
    placeholder,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    onKeyDown,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const helpTextId = `${selectId}-help`;
    const errorId = `${selectId}-error`;
    
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(event.target.value);
      }
      if (onChange) {
        onChange(event);
      }
    };

    // Enhanced keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>) => {
      // Handle Escape key to close dropdown
      if (event.key === 'Escape') {
        (event.target as HTMLSelectElement).blur();
      }
      
      // Call custom onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(event);
      }
    };

    const sizeClasses = {
      sm: 'h-8 px-2.5 py-1.5 text-sm pr-8',
      md: 'h-10 px-3 py-2 text-sm pr-10',
      lg: 'h-12 px-4 py-3 text-base pr-12'
    };

    const variantClasses = {
      default: 'border-primary bg-surface-primary',
      filled: 'border-transparent bg-surface-secondary',
      outlined: 'border-2 border-primary bg-transparent'
    };

    const getStateClasses = () => {
      if (error) {
        return 'border-error focus:border-error focus:ring-error/20';
      }
      if (success) {
        return 'border-success focus:border-success focus:ring-success/20';
      }
      return 'border-primary focus:border-focus focus:ring-focus/20';
    };

    const getChevronSize = () => {
      switch (size) {
        case 'sm': return 'w-4 h-4 right-2';
        case 'lg': return 'w-6 h-6 right-3';
        default: return 'w-5 h-5 right-2.5';
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-primary mb-2"
          >
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              // Base styles
              "flex w-full rounded-md font-sans transition-all duration-200 ease-out appearance-none",
              "focus:outline-none focus:ring-3 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary",
              "cursor-pointer",
              
              // Size classes
              sizeClasses[size],
              
              // Variant classes
              variantClasses[variant],
              
              // State classes
              getStateClasses(),
              
              // Custom className
              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-describedby={cn(
              ariaDescribedBy,
              helpText && helpTextId,
              error && errorId
            ).trim() || undefined}
            aria-invalid={ariaInvalid || !!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className={cn(
            "absolute inset-y-0 flex items-center pointer-events-none",
            getChevronSize()
          )}>
            <svg 
              className="text-tertiary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </div>
          
          {/* Success indicator */}
          {success && !error && (
            <div className="absolute inset-y-0 right-8 flex items-center pr-1">
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
            <div className="absolute inset-y-0 right-8 flex items-center pr-1">
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

Select.displayName = 'Select';

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <option
        className={className}
        ref={ref}
        {...props}
      >
        {children}
      </option>
    );
  }
);

SelectItem.displayName = 'SelectItem';

// Additional components for compatibility
export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => {
  return <span className={className}>{placeholder}</span>;
};