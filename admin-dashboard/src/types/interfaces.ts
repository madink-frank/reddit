// Consolidated Advanced Dashboard Interfaces

// Re-export all advanced dashboard types
export * from './advanced-dashboard';

// Additional interface definitions for the advanced dashboard infrastructure

// ============================================================================
// Store Management Interfaces
// ============================================================================

export interface StoreInitializationResult {
  success: boolean;
  error?: Error;
  message?: string;
}

export interface StoreHealthStatus {
  healthy: boolean;
  lastCheck: Date;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Dashboard Infrastructure Interfaces
// ============================================================================

export interface DashboardModule {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  initialize: () => Promise<void>;
  cleanup: () => void;
  getHealth: () => StoreHealthStatus;
}

export interface DashboardConfiguration {
  modules: DashboardModule[];
  theme: {
    mode: 'light' | 'dark' | 'system';
    customColors?: Record<string, string>;
  };
  features: {
    realTimeMonitoring: boolean;
    nlpAnalysis: boolean;
    imageAnalysis: boolean;
    advancedVisualization: boolean;
  };
  performance: {
    enableCaching: boolean;
    cacheExpiration: number;
    maxConcurrentRequests: number;
    debounceDelay: number;
  };
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse';
}

export interface ErrorProps extends BaseComponentProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export interface StatusIndicatorProps extends BaseComponentProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'processing';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

// ============================================================================
// Analysis Component Interfaces
// ============================================================================

export interface AnalysisCardProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isProcessing?: boolean;
  onAnalyze?: () => void;
  result?: any;
  variant?: 'nlp' | 'image' | 'monitoring';
}

export interface ResultDisplayProps extends BaseComponentProps {
  result: any;
  type: 'nlp' | 'image' | 'monitoring';
  format?: 'card' | 'table' | 'chart';
  exportable?: boolean;
}

export interface ChartProps extends BaseComponentProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'wordcloud' | 'heatmap';
  options?: {
    responsive?: boolean;
    darkTheme?: boolean;
    interactive?: boolean;
    exportable?: boolean;
  };
}

// ============================================================================
// Form and Input Interfaces
// ============================================================================

export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export interface TextInputProps extends FormFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url';
  maxLength?: number;
}

export interface TextAreaProps extends FormFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  resize?: boolean;
}

export interface SelectProps extends FormFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
}

export interface FileUploadProps extends FormFieldProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

// ============================================================================
// Navigation and Layout Interfaces
// ============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: NavigationItem[];
  disabled?: boolean;
}

export interface SidebarProps extends BaseComponentProps {
  items: NavigationItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  currentPath?: string;
}

export interface HeaderProps extends BaseComponentProps {
  title?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; path?: string }[];
  showThemeToggle?: boolean;
  showNotifications?: boolean;
}

export interface LayoutProps extends BaseComponentProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  fluid?: boolean;
}

// ============================================================================
// Modal and Dialog Interfaces
// ============================================================================

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  footer?: React.ReactNode;
}

export interface ConfirmDialogProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface ToastProps extends BaseComponentProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: { label: string; onClick: () => void }[];
  onDismiss: (id: string) => void;
}

// ============================================================================
// Data Table Interfaces
// ============================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
    onChange: (field: string, order: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onChange: (filters: Record<string, any>) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
}

// ============================================================================
// Utility Interfaces
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface ExportParams {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  filename?: string;
  data: any[];
  columns?: string[];
  options?: Record<string, any>;
}

// ============================================================================
// Event Interfaces
// ============================================================================

export interface DashboardEvent {
  type: string;
  timestamp: Date;
  source: string;
  data?: any;
  userId?: string;
}

export interface AnalysisEvent extends DashboardEvent {
  type: 'analysis_started' | 'analysis_completed' | 'analysis_failed';
  analysisType: 'nlp' | 'image';
  analysisId: string;
  duration?: number;
  pointsConsumed?: number;
}

export interface MonitoringEvent extends DashboardEvent {
  type: 'job_started' | 'job_completed' | 'job_failed' | 'system_alert';
  jobId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metrics?: Record<string, number>;
}

export interface UserEvent extends DashboardEvent {
  type: 'user_login' | 'user_logout' | 'user_action';
  action?: string;
  target?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UseLocalStorageResult<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export interface UseDebounceResult<T> {
  debouncedValue: T;
  isDebouncing: boolean;
}

export interface UseThrottleResult<T> {
  throttledValue: T;
  isThrottling: boolean;
}

// ============================================================================
// Context Interfaces
// ============================================================================

export interface DashboardContextValue {
  configuration: DashboardConfiguration;
  updateConfiguration: (config: Partial<DashboardConfiguration>) => void;
  modules: DashboardModule[];
  registerModule: (module: DashboardModule) => void;
  unregisterModule: (moduleId: string) => void;
  health: Record<string, StoreHealthStatus>;
}

export interface NotificationContextValue {
  notifications: ToastProps[];
  addNotification: (notification: Omit<ToastProps, 'id' | 'onDismiss'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface AnalysisContextValue {
  currentAnalysis: any | null;
  startAnalysis: (type: 'nlp' | 'image', data: any) => Promise<string>;
  getAnalysisResult: (id: string) => any | null;
  cancelAnalysis: (id: string) => void;
  clearHistory: () => void;
}

// ============================================================================
// Testing Interfaces
// ============================================================================

export interface TestComponentProps {
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface MockApiResponse<T = any> {
  data: T;
  delay?: number;
  shouldFail?: boolean;
  errorMessage?: string;
}

export interface TestScenario {
  name: string;
  description: string;
  setup: () => void;
  execute: () => Promise<void>;
  verify: () => void;
  cleanup: () => void;
}

// ============================================================================
// Performance Interfaces
// ============================================================================

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  networkRequests: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface OptimizationConfig {
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableMemoization: boolean;
  enableCodeSplitting: boolean;
  maxConcurrentRequests: number;
  cacheStrategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
}

// ============================================================================
// Accessibility Interfaces
// ============================================================================

export interface AccessibilityConfig {
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableScreenReader: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  keyboardNavigation: boolean;
}

export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  role?: string;
  tabIndex?: number;
}

// All interfaces are available via named exports above