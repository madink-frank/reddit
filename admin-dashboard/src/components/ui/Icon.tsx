import React from 'react';
import { ICON_SIZES, type IconSize } from '../../constants/design-tokens';
import { type IconContext, getRecommendedIconSize } from '../../constants/icon-standards';

/**
 * Available icon names
 */
export type IconName = 
  | 'dashboard'
  | 'keywords'
  | 'posts'
  | 'analytics'
  | 'content'
  | 'monitoring'
  | 'search'
  | 'filter'
  | 'sort'
  | 'edit'
  | 'delete'
  | 'add'
  | 'refresh'
  | 'download'
  | 'upload'
  | 'settings'
  | 'user'
  | 'logout'
  | 'loading'
  | 'check'
  | 'close'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'eye'
  | 'eye-off'
  | 'heart'
  | 'star'
  | 'bookmark'
  | 'share'
  | 'link'
  | 'calendar'
  | 'clock'
  | 'chart-bar'
  | 'chart-line'
  | 'chart-pie';

/**
 * Icon component props
 */
interface IconProps {
  name: IconName;
  size?: IconSize;
  context?: IconContext; // Semantic context for automatic size selection
  className?: string;
  'aria-label'?: string;
}

/**
 * Size mappings for icons using design tokens
 * Maps semantic size names to CSS classes for consistent icon sizing
 */
const getSizeClass = (size: IconSize): string => ICON_SIZES[size];

/**
 * SVG path definitions for icons
 */
const iconPaths: Record<IconName, string> = {
  dashboard: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 01-1-1V7a1 1 0 011-1h14a2 2 0 002 2v1M3 7V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v1',
  keywords: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  posts: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  content: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  monitoring: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  sort: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  delete: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  add: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  loading: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
  check: 'M5 13l4 4L19 7',
  close: 'M6 18L18 6M6 6l12 12',
  'arrow-up': 'M7 14l5-5 5 5',
  'arrow-down': 'M17 10l-5 5-5-5',
  'arrow-left': 'M14 7l-5 5 5 5',
  'arrow-right': 'M10 17l5-5-5-5',
  'chevron-up': 'M7 14l5-5 5 5',
  'chevron-down': 'M17 10l-5 5-5-5',
  'chevron-left': 'M14 7l-5 5 5 5',
  'chevron-right': 'M10 17l5-5-5-5',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
  'eye-off': 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22',
  heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z',
  share: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'chart-line': 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
  'chart-pie': 'M11 2a9 9 0 104.5 17.5A9 9 0 0011 2z M11 2v9l8.5 8.5'
};

/**
 * Standardized Icon component using inline SVG with consistent sizing
 * 
 * Features:
 * - Uses design token system for consistent sizing
 * - Semantic size names (xs, sm, base, md, lg, xl, 2xl)
 * - Context-aware sizing for automatic size selection
 * - Proper accessibility attributes
 * - TypeScript support for icon names and sizes
 * 
 * @example
 * // Explicit size
 * <Icon name="dashboard" size="md" className="text-blue-500" />
 * 
 * // Context-aware sizing
 * <Icon name="dashboard" context="button-medium" className="text-blue-500" />
 */
export const Icon: React.FC<IconProps> = ({ 
  name, 
  size, 
  context,
  className = '', 
  'aria-label': ariaLabel,
  ...props 
}) => {
  // Determine size: explicit size takes precedence over context
  const finalSize = size || (context ? getRecommendedIconSize(context) : 'base');
  const sizeClass = getSizeClass(finalSize);
  const path = iconPaths[name];

  if (!path) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(iconPaths));
    return null;
  }

  return (
    <svg
      className={`${sizeClass} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel || name}
      role="img"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={path}
      />
    </svg>
  );
};

/**
 * Preload critical icons
 */
export const preloadCriticalIcons = () => {
  // This function can be used to preload critical icons if needed
  // For inline SVGs, this is not necessary as they're already bundled
  return Promise.resolve();
};