import React from 'react';
import { cn } from '../../lib/utils';
import { AutoBreadcrumbs, Breadcrumbs, type BreadcrumbItem } from './Navigation';

export interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  showBreadcrumbs?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-none',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-6',
  md: 'px-6 py-8',
  lg: 'px-8 py-12',
};

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  showBreadcrumbs = false,
  breadcrumbs,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding])}>
        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <div className="mb-6">
            {breadcrumbs ? (
              <Breadcrumbs items={breadcrumbs} />
            ) : (
              <AutoBreadcrumbs />
            )}
          </div>
        )}

        {/* Page Header */}
        {(title || subtitle || actions) && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-3xl font-bold text-primary mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-lg text-secondary">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
};