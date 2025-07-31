import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
}

const inputVariants = {
  default: 'border border-default bg-surface focus:border-brand-500 focus:ring-brand-500',
  filled: 'border-0 bg-background-secondary focus:bg-surface focus:ring-brand-500',
  outline: 'border-2 border-default bg-transparent focus:border-brand-500 focus:ring-0',
};

const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    inputSize = 'md',
    id,
    disabled,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-primary mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {hasLeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-400" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              // Base styles
              'block w-full rounded-lg text-primary placeholder-tertiary transition-default',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Variant styles
              inputVariants[variant],
              // Size styles
              inputSizes[inputSize],
              // Icon spacing
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              // Error state
              hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              // Dark mode adjustments
              'dark:focus:ring-brand-400',
              hasError && 'dark:focus:ring-error-400',
              // Custom className
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />
          
          {hasRightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-neutral-400" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-error-600 dark:text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-tertiary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outline';
  textareaSize?: 'sm' | 'md' | 'lg';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    helperText,
    variant = 'default',
    textareaSize = 'md',
    resize = 'vertical',
    id,
    disabled,
    rows = 4,
    ...props
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-primary mb-2"
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            // Base styles
            'block w-full rounded-lg text-primary placeholder-tertiary transition-default',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Variant styles
            inputVariants[variant],
            // Size styles
            inputSizes[textareaSize],
            // Resize styles
            resizeClasses[resize],
            // Error state
            hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            // Dark mode adjustments
            'dark:focus:ring-brand-400',
            hasError && 'dark:focus:ring-error-400',
            // Custom className
            className
          )}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${textareaId}-error` : 
            helperText ? `${textareaId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-2 text-sm text-error-600 dark:text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="mt-2 text-sm text-tertiary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';