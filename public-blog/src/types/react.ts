// React-specific type definitions

import type { ReactNode, ComponentType } from 'react';

// ============================================================================
// Common React Props
// ============================================================================

export interface BaseProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface ClickableProps {
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

// ============================================================================
// Component Props
// ============================================================================

export interface ButtonProps extends BaseProps, ClickableProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export interface TextareaProps extends BaseProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface SelectProps extends BaseProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface CheckboxProps extends BaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

export interface RadioProps extends BaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  name: string;
  value: string;
}

export interface ModalProps extends BaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

export interface TooltipProps extends BaseProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  arrow?: boolean;
}

export interface DropdownProps extends BaseProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  closeOnItemClick?: boolean;
}

export interface DropdownItem {
  key: string;
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  icon?: ReactNode;
}

export interface TabsProps extends BaseProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
  items: TabItem[];
}

export interface TabItem {
  key: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface AccordionProps extends BaseProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpenItems?: string[];
  openItems?: string[];
  onOpenChange?: (openItems: string[]) => void;
}

export interface AccordionItem {
  key: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface PaginationProps extends BaseProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'md' | 'lg';
}

export interface BreadcrumbProps extends BaseProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
}

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

export interface AlertProps extends BaseProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  closable?: boolean;
  onClose?: () => void;
  icon?: ReactNode;
  action?: ReactNode;
}

export interface BadgeProps extends BaseProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  count?: number;
  showZero?: boolean;
}

export interface AvatarProps extends BaseProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  fallback?: ReactNode;
  online?: boolean;
}

export interface CardProps extends BaseProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  image?: string;
  imageAlt?: string;
  actions?: ReactNode;
  hoverable?: boolean;
  loading?: boolean;
}

export interface SkeletonProps extends BaseProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | false;
  lines?: number;
}

export interface SpinnerProps extends BaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  thickness?: number;
}

// ============================================================================
// Layout Props
// ============================================================================

export interface ContainerProps extends BaseProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | false;
  fluid?: boolean;
  centerContent?: boolean;
}

export interface GridProps extends BaseProps {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number | string;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export interface FlexProps extends BaseProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: number | string;
}

export interface StackProps extends BaseProps {
  direction?: 'horizontal' | 'vertical';
  spacing?: number | string;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  divider?: ReactNode;
}

// ============================================================================
// Form Props
// ============================================================================

export interface FormProps extends BaseProps {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  noValidate?: boolean;
  autoComplete?: 'on' | 'off';
}

export interface FormFieldProps extends BaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface FormGroupProps extends BaseProps {
  title?: string;
  description?: string;
}

// ============================================================================
// Higher-Order Component Types
// ============================================================================

export interface WithLoadingProps {
  loading?: boolean;
  loadingComponent?: ComponentType;
}

export interface WithErrorProps {
  error?: string | Error | null;
  errorComponent?: ComponentType<{ error: string | Error }>;
}

export interface WithAuthProps {
  requireAuth?: boolean;
  fallback?: ComponentType;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export interface UseDebounceReturn<T> {
  debouncedValue: T;
  cancel: () => void;
  flush: () => void;
}

export interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
}

// ============================================================================
// Event Handler Types
// ============================================================================

export type ClickHandler = (event: React.MouseEvent) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (event: React.FormEvent) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;
export type FocusHandler = (event: React.FocusEvent) => void;