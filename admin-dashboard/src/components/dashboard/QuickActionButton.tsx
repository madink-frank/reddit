import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  iconColor,
  bgColor,
  onClick,
  disabled = false,
  loading = false,
  className,
  variant = 'primary'
}) => {
  const isDisabled = disabled || loading;
  const buttonId = `quick-action-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const descriptionId = `${buttonId}-description`;

  const getVariantClasses = () => {
    if (bgColor) return bgColor; // Use custom bgColor if provided
    
    switch (variant) {
      case 'primary':
        return 'bg-surface-primary hover:bg-surface-secondary border-primary';
      case 'secondary':
        return 'bg-surface-secondary hover:bg-surface-tertiary border-secondary';
      case 'success':
        return 'bg-success/10 hover:bg-success/20 border-success/20';
      case 'warning':
        return 'bg-warning/10 hover:bg-warning/20 border-warning/20';
      case 'error':
        return 'bg-error/10 hover:bg-error/20 border-error/20';
      case 'info':
        return 'bg-info/10 hover:bg-info/20 border-info/20';
      case 'accent':
        return 'bg-accent/10 hover:bg-accent/20 border-accent/20';
      default:
        return 'bg-surface-primary hover:bg-surface-secondary border-primary';
    }
  };

  const getIconColor = () => {
    if (iconColor) return iconColor; // Use custom iconColor if provided
    
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'secondary':
        return 'text-secondary';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      case 'info':
        return 'text-info';
      case 'accent':
        return 'text-accent';
      default:
        return 'text-primary';
    }
  };

  return (
    <button
      id={buttonId}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base styles
        'quick-action-button group relative w-full text-left',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2',
        
        // Disabled/loading state
        isDisabled && 'opacity-50 cursor-not-allowed',
        
        // Variant styles
        !isDisabled && getVariantClasses(),
        
        className
      )}
      aria-disabled={isDisabled}
      aria-describedby={descriptionId}
      aria-label={`${title}: ${description}`}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10">
          <div 
            className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"
            aria-label="Loading"
          />
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        {/* Icon container with improved alignment */}
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
          <Icon 
            className={cn(
              'quick-action-icon transition-all duration-200 ease-out',
              isDisabled ? 'text-tertiary' : [
                getIconColor(),
                'group-hover:scale-110 group-active:scale-105'
              ],
              loading ? 'opacity-0' : 'opacity-100'
            )}
            aria-hidden="true"
          />
        </div>
        
        {/* Content container */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'quick-action-title transition-colors duration-200',
            isDisabled ? 'text-tertiary' : 'text-primary group-hover:text-secondary',
            loading ? 'opacity-0' : 'opacity-100'
          )}>
            {title}
          </p>
          <p 
            id={descriptionId}
            className={cn(
              'quick-action-description transition-colors duration-200',
              isDisabled ? 'text-tertiary' : 'text-secondary group-hover:text-primary',
              loading ? 'opacity-0' : 'opacity-100'
            )}
          >
            {description}
          </p>
        </div>
        
        {/* Visual feedback indicator */}
        <div className={cn(
          'flex-shrink-0 w-2 h-2 rounded-full transition-all duration-200',
          isDisabled 
            ? 'bg-gray-300' 
            : 'bg-transparent group-hover:bg-current group-hover:opacity-20 group-active:opacity-30'
        )} />
      </div>
      
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 pointer-events-none',
        !isDisabled && 'group-hover:opacity-5 bg-gradient-to-br from-white to-transparent'
      )} />
    </button>
  );
};

export default QuickActionButton;