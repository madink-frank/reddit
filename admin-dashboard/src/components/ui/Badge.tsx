/**
 * Badge Component
 * 
 * A small status indicator or label component.
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const badgeVariants = {
  default: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  outline: "border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
};

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base"
};

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  size = 'md',
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};