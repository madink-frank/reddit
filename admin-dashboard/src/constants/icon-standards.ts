/**
 * Icon Standardization Guide
 * 
 * This file defines the standardized icon usage patterns across the application.
 * Use these guidelines to ensure consistent icon sizing and usage.
 */

import { IconSize } from './design-tokens';

/**
 * Standard icon sizes for different contexts
 */
export const ICON_CONTEXT_SIZES: Record<string, IconSize> = {
  // Text and inline usage
  'inline-text': 'sm',        // 16px - Icons within text content
  'form-field': 'sm',         // 16px - Icons in form inputs
  'table-cell': 'sm',         // 16px - Icons in table cells
  
  // Interactive elements
  'button-small': 'sm',       // 16px - Small button icons
  'button-medium': 'base',    // 20px - Medium button icons
  'button-large': 'md',       // 24px - Large button icons
  'dropdown-item': 'sm',      // 16px - Dropdown menu item icons
  
  // Navigation and UI
  'nav-item': 'base',         // 20px - Navigation menu icons
  'tab-icon': 'base',         // 20px - Tab icons
  'breadcrumb': 'sm',         // 16px - Breadcrumb icons
  
  // Status and feedback
  'status-indicator': 'base', // 20px - Status badges and indicators
  'alert-icon': 'base',       // 20px - Alert and notification icons
  'loading-spinner': 'base',  // 20px - Loading indicators
  
  // Content areas
  'card-header': 'md',        // 24px - Card header icons
  'section-header': 'lg',     // 32px - Section title icons
  'page-header': 'lg',        // 32px - Page title icons
  
  // Special contexts
  'login-page': 'xl',         // 48px - Login page main icon
  'empty-state': 'xl',        // 48px - Empty state illustrations
  'hero-section': '2xl',      // 64px - Hero section icons
  'avatar-small': 'md',       // 24px - Small user avatars
  'avatar-large': 'lg',       // 32px - Large user avatars
} as const;

/**
 * Icon usage recommendations by component type
 */
export const COMPONENT_ICON_GUIDELINES = {
  // Dashboard components
  StatCard: {
    mainIcon: 'md',           // 24px - Main stat icon
    trendIcon: 'sm',          // 16px - Trend indicator
  },
  
  // Form components
  Button: {
    small: 'sm',              // 16px - Small buttons
    medium: 'base',           // 20px - Medium buttons
    large: 'md',              // 24px - Large buttons
  },
  
  Input: {
    leadingIcon: 'sm',        // 16px - Icon before input
    trailingIcon: 'sm',       // 16px - Icon after input
  },
  
  // Navigation components
  Sidebar: {
    menuItem: 'base',         // 20px - Sidebar menu icons
    logo: 'lg',               // 32px - Logo/brand icon
  },
  
  Header: {
    actionButton: 'base',     // 20px - Header action buttons
    userAvatar: 'md',         // 24px - User avatar
  },
  
  // Data display
  Table: {
    cellIcon: 'sm',           // 16px - Icons in table cells
    actionIcon: 'sm',         // 16px - Row action icons
    sortIcon: 'sm',           // 16px - Column sort icons
  },
  
  Card: {
    headerIcon: 'md',         // 24px - Card header icons
    contentIcon: 'base',      // 20px - Icons within card content
  },
  
  // Feedback components
  Alert: {
    statusIcon: 'base',       // 20px - Alert status icons
    closeIcon: 'sm',          // 16px - Close button icon
  },
  
  Modal: {
    headerIcon: 'md',         // 24px - Modal header icons
    closeIcon: 'sm',          // 16px - Close button icon
  },
} as const;

/**
 * Common icon size patterns to avoid
 * These are Tailwind classes that should be replaced with design tokens
 */
export const DEPRECATED_TAILWIND_SIZES = [
  'h-3 w-3',   // Use 'xs' instead
  'h-4 w-4',   // Use 'sm' instead
  'h-5 w-5',   // Use 'base' instead
  'h-6 w-6',   // Use 'md' instead
  'h-8 w-8',   // Use 'lg' instead
  'h-12 w-12', // Use 'xl' instead
  'h-16 w-16', // Use '2xl' instead
] as const;

/**
 * Migration helper: Convert Tailwind classes to design token sizes
 */
export const TAILWIND_TO_DESIGN_TOKEN_MAP: Record<string, IconSize> = {
  'h-3 w-3': 'xs',
  'h-4 w-4': 'sm',
  'h-5 w-5': 'base',
  'h-6 w-6': 'md',
  'h-8 w-8': 'lg',
  'h-12 w-12': 'xl',
  'h-16 w-16': '2xl',
} as const;

/**
 * Get recommended icon size for a specific context
 */
export const getRecommendedIconSize = (context: keyof typeof ICON_CONTEXT_SIZES): IconSize => {
  return ICON_CONTEXT_SIZES[context] || 'base';
};

/**
 * Validate if an icon size is appropriate for a given context
 */
export const validateIconSize = (size: IconSize, context: keyof typeof ICON_CONTEXT_SIZES): boolean => {
  const recommendedSize = ICON_CONTEXT_SIZES[context];
  return size === recommendedSize;
};

/**
 * Get all available icon contexts
 */
export const getAvailableIconContexts = (): string[] => {
  return Object.keys(ICON_CONTEXT_SIZES);
};

export type IconContext = keyof typeof ICON_CONTEXT_SIZES;
export type ComponentIconGuideline = keyof typeof COMPONENT_ICON_GUIDELINES;

/**
 * Development utility: Find and report non-standard icon sizes
 * This function can be used during development to identify icons that need migration
 */
export const findNonStandardIconSizes = (element: HTMLElement): Array<{
  element: HTMLElement;
  currentClasses: string;
  suggestedSize: IconSize;
}> => {
  const results: Array<{
    element: HTMLElement;
    currentClasses: string;
    suggestedSize: IconSize;
  }> = [];

  // Find all elements with Tailwind size classes
  const iconElements = element.querySelectorAll('[class*="h-"][class*="w-"]');
  
  iconElements.forEach((el) => {
    const classList = Array.from(el.classList);
    const sizeClasses = classList.filter(cls => 
      DEPRECATED_TAILWIND_SIZES.some(deprecated => cls.includes(deprecated.split(' ')[0]))
    );
    
    if (sizeClasses.length > 0) {
      const currentClasses = sizeClasses.join(' ');
      const suggestedSize = TAILWIND_TO_DESIGN_TOKEN_MAP[currentClasses] || 'base';
      
      results.push({
        element: el as HTMLElement,
        currentClasses,
        suggestedSize,
      });
    }
  });

  return results;
};

/**
 * Development utility: Generate migration report
 */
export const generateMigrationReport = (): void => {
  if (typeof window === 'undefined') return;
  
  const nonStandardIcons = findNonStandardIconSizes(document.body);
  
  if (nonStandardIcons.length === 0) {
    console.log('✅ All icons are using standardized sizes!');
    return;
  }

  console.group('🔧 Icon Size Migration Report');
  console.log(`Found ${nonStandardIcons.length} icons using non-standard sizes:`);
  
  nonStandardIcons.forEach(({ element, currentClasses, suggestedSize }, index) => {
    console.log(`${index + 1}. Element:`, element);
    console.log(`   Current: ${currentClasses}`);
    console.log(`   Suggested: icon-${suggestedSize}`);
    console.log('---');
  });
  
  console.groupEnd();
};