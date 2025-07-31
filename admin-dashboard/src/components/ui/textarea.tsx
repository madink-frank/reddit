import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helpText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    error,
    label,
    helpText,
    variant = 'default',
    size = 'md',
    success = false,
    resize = 'vertical',
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const helpTextId = `${textareaId}-help`;
    const errorId = `${textareaId}-error`;
    
    const sizeClasses = {
      sm: 'min-h-[60px] px-2.5 py-1.5 text-sm',
      md: 'min-h-[80px] px-3 py-2 text-sm',
      lg: 'min-h-[120px] px-4 py-3 text-base'
    };

    const variantClasses = {
      default: 'border-primary bg-surface-primary',
      filled: 'border-transparent bg-surface-secondary',
      outlined: 'border-2 border-primary bg-transparent'
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
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

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-primary mb-2"
          >
            {label}
            {props.required && <span className="text-error ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="relative">
          <textarea
            id={textareaId}
            className={cn(
              // Base styles
              "flex w-full rounded-md font-sans transition-all duration-200 ease-out",
              "placeholder:text-tertiary",
              "focus:outline-none focus:ring-3 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary",
              
              // Size classes
              sizeClasses[size],
              
              // Variant classes
              variantClasses[variant],
              
              // Resize classes
              resizeClasses[resize],
              
              // State classes
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
            {...props}
          />
          
          {/* Success indicator */}
          {success && !error && (
            <div className="absolute top-2 right-2">
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
            <div className="absolute top-2 right-2">
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
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }