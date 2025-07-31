import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  separator = (
    <svg
      className="w-4 h-4 text-tertiary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
}) => {
  if (items.length === 0) return null;

  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {item.href && !isCurrent ? (
                <Link
                  to={item.href}
                  className="text-secondary hover:text-primary transition-colors focus-ring rounded-md px-1 py-0.5"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'px-1 py-0.5',
                    isCurrent ? 'text-primary font-medium' : 'text-secondary'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Auto-generating breadcrumbs based on current route
export interface AutoBreadcrumbsProps {
  className?: string;
  homeLabel?: string;
  separator?: React.ReactNode;
  pathLabels?: Record<string, string>;
}

export const AutoBreadcrumbs: React.FC<AutoBreadcrumbsProps> = ({
  className,
  homeLabel = 'Home',
  separator,
  pathLabels = {},
}) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) return null;

  const items: BreadcrumbItem[] = [
    {
      label: homeLabel,
      href: '/',
    },
  ];

  // Build breadcrumb items from path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Use custom label if provided, otherwise format the segment
    const label = pathLabels[currentPath] || 
                  pathLabels[segment] || 
                  segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    items.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast,
    } as BreadcrumbItem);
  });

  return (
    <Breadcrumbs
      items={items}
      {...(className && { className })}
      separator={separator}
    />
  );
};

// Page Navigation (Previous/Next)
export interface PageNavigationItem {
  title: string;
  href: string;
  subtitle?: string;
}

export interface PageNavigationProps {
  previous?: PageNavigationItem;
  next?: PageNavigationItem;
  className?: string;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  previous,
  next,
  className,
}) => {
  if (!previous && !next) return null;

  return (
    <nav
      className={cn('flex justify-between items-center py-8 border-t border-default', className)}
      aria-label="Page navigation"
    >
      {/* Previous Page */}
      <div className="flex-1">
        {previous && (
          <Link
            to={previous.href}
            className="group flex items-center space-x-3 text-left hover:text-brand-primary transition-colors focus-ring rounded-lg p-3 -m-3"
          >
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-tertiary group-hover:text-brand-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm text-tertiary group-hover:text-brand-primary transition-colors">
                Previous
              </div>
              <div className="font-medium text-secondary group-hover:text-primary transition-colors truncate">
                {previous.title}
              </div>
              {previous.subtitle && (
                <div className="text-sm text-tertiary mt-1 truncate">
                  {previous.subtitle}
                </div>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* Next Page */}
      <div className="flex-1 flex justify-end">
        {next && (
          <Link
            to={next.href}
            className="group flex items-center space-x-3 text-right hover:text-brand-primary transition-colors focus-ring rounded-lg p-3 -m-3"
          >
            <div className="min-w-0">
              <div className="text-sm text-tertiary group-hover:text-brand-primary transition-colors">
                Next
              </div>
              <div className="font-medium text-secondary group-hover:text-primary transition-colors truncate">
                {next.title}
              </div>
              {next.subtitle && (
                <div className="text-sm text-tertiary mt-1 truncate">
                  {next.subtitle}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-tertiary group-hover:text-brand-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
};

// Table of Contents Navigation
export interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

export interface TableOfContentsProps {
  items: TocItem[];
  activeId?: string;
  className?: string;
  title?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  activeId,
  className,
  title = 'Table of Contents',
}) => {
  if (items.length === 0) return null;

  const renderTocItems = (tocItems: TocItem[], level = 0) => {
    return (
      <ul className={cn(level > 0 && 'ml-4 mt-2')}>
        {tocItems.map((item) => (
          <li key={item.id} className="mb-2">
            <a
              href={`#${item.id}`}
              className={cn(
                'block text-sm transition-colors focus-ring rounded-md px-2 py-1 -mx-2',
                activeId === item.id
                  ? 'text-brand-primary font-medium bg-brand-50 dark:bg-brand-900/20'
                  : 'text-secondary hover:text-primary hover:bg-background-secondary'
              )}
            >
              {item.title}
            </a>
            {item.children && item.children.length > 0 && (
              renderTocItems(item.children, level + 1)
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <nav className={cn('', className)} aria-label="Table of contents">
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
        {title}
      </h3>
      {renderTocItems(items)}
    </nav>
  );
};