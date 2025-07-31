/**
 * Semantic Layout Component
 * 
 * Provides proper semantic structure and ARIA landmarks for the application
 */

import React from 'react';
import { IntegratedNavigation } from './IntegratedNavigation';

interface SemanticLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavigation?: boolean;
  navigationCollapsed?: boolean;
  onNavigationToggle?: () => void;
  className?: string;
}

export const SemanticLayout: React.FC<SemanticLayoutProps> = ({
  children,
  title,
  description,
  showNavigation = true,
  navigationCollapsed = false,
  onNavigationToggle,
  className = ''
}) => {
  return (
    <div className={`semantic-layout min-h-screen bg-background-primary ${className}`}>
      {/* Skip to content links are handled by SkipLinks component in App.tsx */}
      
      {/* Application Header */}
      <header role="banner" className="sr-only">
        <h1>Reddit Content Platform Admin Dashboard</h1>
        {description && <p>{description}</p>}
      </header>

      <div className="flex h-screen">
        {/* Navigation Sidebar */}
        {showNavigation && (
          <nav 
            role="navigation" 
            aria-label="Main navigation"
            id="navigation"
            tabIndex={-1}
            className={`${navigationCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}
          >
            <IntegratedNavigation 
              collapsed={navigationCollapsed}
              onToggle={onNavigationToggle}
            />
          </nav>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Header */}
          {title && (
            <header className="bg-surface-primary border-b border-primary px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-primary">{title}</h1>
                  {description && (
                    <p className="mt-1 text-sm text-secondary">{description}</p>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main 
            role="main" 
            className="flex-1 overflow-auto p-6"
            aria-label={title ? `${title} content` : 'Main content'}
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Application Footer */}
      <footer role="contentinfo" className="sr-only">
        <p>Reddit Content Platform - Admin Dashboard</p>
      </footer>
    </div>
  );
};

/**
 * Page Section Component
 * Provides semantic sectioning with proper headings and ARIA labels
 */
interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export const PageSection: React.FC<PageSectionProps> = ({
  children,
  title,
  description,
  level = 2,
  className = '',
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const sectionId = id || (title ? `section-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const titleId = title ? `${sectionId}-title` : undefined;
  const descriptionId = description ? `${sectionId}-description` : undefined;

  return (
    <section
      id={sectionId}
      className={`page-section ${className}`}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy || titleId}
      aria-describedby={ariaDescribedBy || descriptionId}
      {...props}
    >
      {title && (
        <header className="section-header mb-6">
          <HeadingTag id={titleId} className="section-title text-xl font-semibold text-primary">
            {title}
          </HeadingTag>
          {description && (
            <p id={descriptionId} className="section-description mt-2 text-sm text-secondary">
              {description}
            </p>
          )}
        </header>
      )}
      
      <div className="section-content">
        {children}
      </div>
    </section>
  );
};

/**
 * Content Grid Component
 * Provides accessible grid layout with proper ARIA labels
 */
interface ContentGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  'aria-label'?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div
      className={`content-grid grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}
      role="grid"
      aria-label={ariaLabel || `Content grid with ${columns} columns`}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} role="gridcell" className="grid-item">
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * Status Indicator Component
 * Provides accessible status indication with proper ARIA attributes
 */
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  description,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const statusConfig = {
    success: {
      color: 'text-success',
      bgColor: 'bg-success/20',
      icon: '✓',
      ariaLabel: 'Success'
    },
    warning: {
      color: 'text-warning',
      bgColor: 'bg-warning/20',
      icon: '⚠',
      ariaLabel: 'Warning'
    },
    error: {
      color: 'text-error',
      bgColor: 'bg-error/20',
      icon: '✕',
      ariaLabel: 'Error'
    },
    info: {
      color: 'text-info',
      bgColor: 'bg-info/20',
      icon: 'ℹ',
      ariaLabel: 'Information'
    },
    neutral: {
      color: 'text-secondary',
      bgColor: 'bg-surface-secondary',
      icon: '○',
      ariaLabel: 'Neutral'
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const config = statusConfig[status];

  return (
    <div
      className={`status-indicator inline-flex items-center gap-2 rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`${config.ariaLabel}: ${label}`}
      aria-describedby={description ? `status-desc-${Math.random().toString(36).substr(2, 9)}` : undefined}
    >
      {showIcon && (
        <span className="status-icon" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span className="status-label font-medium">{label}</span>
      {description && (
        <span className="sr-only" id={`status-desc-${Math.random().toString(36).substr(2, 9)}`}>
          {description}
        </span>
      )}
    </div>
  );
};