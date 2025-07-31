import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  as?: React.ElementType;
}

const badgeVariants = {
  default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
  primary: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200',
  secondary: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
  error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
  outline: 'border border-neutral-300 text-neutral-700 bg-transparent dark:border-neutral-600 dark:text-neutral-300',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    dot = false,
    removable = false,
    onRemove,
    children,
    as: Component = 'span',
    ...props 
  }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
          // Variant styles
          badgeVariants[variant],
          // Size styles
          badgeSizes[size],
          // Custom className
          className
        )}
        {...props}
      >
        {dot && (
          <span 
            className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" 
            aria-hidden="true"
          />
        )}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="flex-shrink-0 ml-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-current hover:bg-opacity-20 focus:outline-none focus:bg-current focus:bg-opacity-20 transition-colors"
            aria-label="Remove badge"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </Component>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge - specialized badge for status indicators
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'dot'> {
  status: 'online' | 'offline' | 'busy' | 'away' | 'draft' | 'published' | 'archived';
}

const statusConfig = {
  online: { variant: 'success' as const, dot: true, label: 'Online' },
  offline: { variant: 'default' as const, dot: true, label: 'Offline' },
  busy: { variant: 'error' as const, dot: true, label: 'Busy' },
  away: { variant: 'warning' as const, dot: true, label: 'Away' },
  draft: { variant: 'secondary' as const, dot: false, label: 'Draft' },
  published: { variant: 'success' as const, dot: false, label: 'Published' },
  archived: { variant: 'default' as const, dot: false, label: 'Archived' },
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const config = statusConfig[status];
    
    return (
      <Badge
        ref={ref}
        variant={config.variant}
        dot={config.dot}
        {...props}
      >
        {children || config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Tag Badge - specialized badge for tags
export interface TagBadgeProps extends Omit<BadgeProps, 'variant' | 'onClick'> {
  tag: string;
  count?: number;
  selected?: boolean;
  onClick?: (tag: string) => void;
}

export const TagBadge = React.forwardRef<HTMLSpanElement, TagBadgeProps>(
  ({ tag, count, selected = false, onClick, className, ...props }, ref) => {
    if (onClick) {
      return (
        <button
          ref={ref as any}
          type="button"
          onClick={() => onClick(tag)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
            'cursor-pointer hover:bg-opacity-80 focus-ring',
            selected ? 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200' : 'border border-neutral-300 text-neutral-700 bg-transparent dark:border-neutral-600 dark:text-neutral-300',
            'px-2.5 py-0.5 text-sm',
            className
          )}
          {...props}
        >
          #{tag}
          {count !== undefined && (
            <span className="ml-1 text-xs opacity-75">
              ({count})
            </span>
          )}
        </button>
      );
    }

    return (
      <Badge
        ref={ref}
        variant={selected ? 'primary' : 'outline'}
        className={className}
        {...props}
      >
        #{tag}
        {count !== undefined && (
          <span className="ml-1 text-xs opacity-75">
            ({count})
          </span>
        )}
      </Badge>
    );
  }
);

TagBadge.displayName = 'TagBadge';