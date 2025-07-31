/**
 * ARIA Utilities
 * 
 * Provides helper functions for consistent ARIA implementation
 */

/**
 * Generates a unique ID for ARIA relationships
 */
export const generateAriaId = (prefix: string = 'aria'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Combines multiple ARIA describedby values
 */
export const combineAriaDescribedBy = (...ids: (string | undefined)[]): string | undefined => {
  const validIds = ids.filter(Boolean);
  return validIds.length > 0 ? validIds.join(' ') : undefined;
};

/**
 * Creates ARIA attributes for form fields
 */
export interface FormFieldAriaProps {
  id?: string;
  label?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
}

export const createFormFieldAria = ({
  id,
  helpText,
  error,
  required
}: FormFieldAriaProps) => {
  const fieldId = id || generateAriaId('field');
  const helpTextId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return {
    fieldId,
    helpTextId,
    errorId,
    'aria-describedby': combineAriaDescribedBy(helpTextId, errorId),
    'aria-invalid': !!error,
    'aria-required': required
  };
};

/**
 * Creates ARIA attributes for interactive elements
 */
export interface InteractiveElementAriaProps {
  label?: string;
  description?: string;
  expanded?: boolean;
  pressed?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export const createInteractiveElementAria = ({
  label,
  description,
  expanded,
  pressed,
  selected,
  disabled,
  loading
}: InteractiveElementAriaProps) => {
  const descriptionId = description ? generateAriaId('desc') : undefined;

  return {
    descriptionId,
    'aria-label': label,
    'aria-describedby': descriptionId,
    'aria-expanded': expanded,
    'aria-pressed': pressed,
    'aria-selected': selected,
    'aria-disabled': disabled,
    'aria-busy': loading
  };
};

/**
 * Creates ARIA attributes for status indicators
 */
export interface StatusAriaProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  message: string;
  live?: 'polite' | 'assertive' | 'off';
}

export const createStatusAria = ({
  status,
  message,
  live = 'polite'
}: StatusAriaProps) => {
  const statusLabels = {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    info: 'Information',
    neutral: 'Status'
  };

  return {
    role: status === 'error' ? 'alert' : 'status',
    'aria-live': live,
    'aria-label': `${statusLabels[status]}: ${message}`
  };
};

/**
 * Creates ARIA attributes for navigation elements
 */
export interface NavigationAriaProps {
  label: string;
  current?: boolean;
  level?: number;
  setSize?: number;
  posInSet?: number;
}

export const createNavigationAria = ({
  label,
  current,
  level,
  setSize,
  posInSet
}: NavigationAriaProps) => {
  return {
    'aria-label': label,
    'aria-current': current ? 'page' : undefined,
    'aria-level': level,
    'aria-setsize': setSize,
    'aria-posinset': posInSet
  };
};

/**
 * Creates ARIA attributes for modal dialogs
 */
export interface ModalAriaProps {
  title: string;
  description?: string;
  modal?: boolean;
}

export const createModalAria = ({
  description,
  modal = true
}: ModalAriaProps) => {
  const titleId = generateAriaId('modal-title');
  const descriptionId = description ? generateAriaId('modal-desc') : undefined;

  return {
    titleId,
    descriptionId,
    role: 'dialog',
    'aria-modal': modal,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId
  };
};

/**
 * Creates ARIA attributes for data tables
 */
export interface TableAriaProps {
  caption?: string;
  sortable?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export const createTableAria = ({
  caption,
  sortable,
  sortColumn,
  sortDirection
}: TableAriaProps) => {
  const captionId = caption ? generateAriaId('table-caption') : undefined;

  return {
    captionId,
    role: 'table',
    'aria-labelledby': captionId,
    'aria-sort': sortable && sortColumn ? sortDirection : undefined
  };
};

/**
 * Creates ARIA attributes for loading states
 */
export interface LoadingAriaProps {
  loading: boolean;
  loadingText?: string;
  live?: 'polite' | 'assertive';
}

export const createLoadingAria = ({
  loading,
  loadingText = 'Loading',
  live = 'polite'
}: LoadingAriaProps) => {
  return {
    'aria-busy': loading,
    'aria-live': loading ? live : undefined,
    'aria-label': loading ? loadingText : undefined
  };
};

/**
 * Creates ARIA attributes for progress indicators
 */
export interface ProgressAriaProps {
  value?: number;
  max?: number;
  label?: string;
  valueText?: string;
}

export const createProgressAria = ({
  value,
  max = 100,
  label,
  valueText
}: ProgressAriaProps) => {
  return {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuetext': valueText || (value !== undefined ? `${value} of ${max}` : undefined)
  };
};

/**
 * Creates ARIA attributes for expandable content
 */
export interface ExpandableAriaProps {
  expanded: boolean;
  controls?: string;
  label?: string;
}

export const createExpandableAria = ({
  expanded,
  controls,
  label
}: ExpandableAriaProps) => {
  const controlsId = controls || generateAriaId('expandable');

  return {
    controlsId,
    'aria-expanded': expanded,
    'aria-controls': controlsId,
    'aria-label': label
  };
};

/**
 * Creates ARIA attributes for search functionality
 */
export interface SearchAriaProps {
  query?: string;
  resultsCount?: number;
  loading?: boolean;
}

export const createSearchAria = ({
  query,
  resultsCount,
  loading
}: SearchAriaProps) => {
  const statusText = loading 
    ? 'Searching...' 
    : resultsCount !== undefined 
      ? `${resultsCount} results found${query ? ` for "${query}"` : ''}`
      : undefined;

  return {
    role: 'search',
    'aria-label': 'Search',
    'aria-busy': loading,
    statusText,
    statusAria: statusText ? {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': true
    } : undefined
  };
};

/**
 * Validates ARIA attributes and provides warnings for common issues
 */
export const validateAriaAttributes = (element: HTMLElement): string[] => {
  const warnings: string[] = [];
  
  // Check for missing labels on interactive elements
  const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'listbox'];
  const role = element.getAttribute('role');
  const tagName = element.tagName.toLowerCase();
  
  if (interactiveRoles.includes(role || '') || ['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
    const hasLabel = element.getAttribute('aria-label') || 
                    element.getAttribute('aria-labelledby') ||
                    (tagName === 'input' && element.getAttribute('placeholder')) ||
                    element.textContent?.trim();
    
    if (!hasLabel) {
      warnings.push(`Interactive element ${tagName}${role ? ` with role="${role}"` : ''} is missing an accessible label`);
    }
  }
  
  // Check for invalid ARIA references
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const ids = describedBy.split(' ');
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        warnings.push(`aria-describedby references non-existent element with id="${id}"`);
      }
    });
  }
  
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ids = labelledBy.split(' ');
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        warnings.push(`aria-labelledby references non-existent element with id="${id}"`);
      }
    });
  }
  
  return warnings;
};

/**
 * Announces a message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};