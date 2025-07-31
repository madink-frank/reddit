// Hook-specific type definitions

import type { UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import type { BlogPost, BlogCategory, BlogTag, SearchParams } from './index';

// ============================================================================
// React Query Hook Types
// ============================================================================

export interface UseBlogPostsOptions extends Omit<UseQueryOptions, 'queryKey' | 'queryFn'> {
  params?: SearchParams;
}

export interface UseBlogPostOptions extends Omit<UseQueryOptions, 'queryKey' | 'queryFn'> {
  slug: string;
}

export interface UseInfiniteBlogPostsOptions extends Omit<UseInfiniteQueryOptions, 'queryKey' | 'queryFn'> {
  params?: Omit<SearchParams, 'page'>;
}

export interface UseSearchPostsOptions extends Omit<UseQueryOptions, 'queryKey' | 'queryFn'> {
  query: string;
  params?: Omit<SearchParams, 'query'>;
}

export type UseCategoriesOptions = Omit<UseQueryOptions, 'queryKey' | 'queryFn'>;

export type UseTagsOptions = Omit<UseQueryOptions, 'queryKey' | 'queryFn'>;

// ============================================================================
// Custom Hook Return Types
// ============================================================================

export interface UseBlogPostsReturn {
  posts: BlogPost[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
}

export interface UseBlogPostReturn {
  post: BlogPost | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseSearchReturn {
  results: BlogPost[];
  totalCount: number;
  searchTime: number;
  suggestions: string[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  search: (query: string) => void;
  clearSearch: () => void;
}

export interface UseCategoriesReturn {
  categories: BlogCategory[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseTagsReturn {
  tags: BlogTag[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseThemeReturn {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// UseLocalStorageReturn and UseDebounceReturn are defined in react.ts

export interface UseIntersectionObserverReturn {
  ref: React.RefObject<Element>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export interface UseScrollPositionReturn {
  x: number;
  y: number;
  scrollTo: (x: number, y: number) => void;
  scrollToTop: () => void;
}

export interface UseMediaQueryReturn {
  matches: boolean;
}

// UsePaginationReturn and UseToggleReturn are defined in react.ts

export interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  copied: boolean;
  error: Error | null;
}

export interface UseKeyboardShortcutReturn {
  register: (key: string, callback: () => void) => void;
  unregister: (key: string) => void;
}

// ============================================================================
// Form Hook Types
// ============================================================================

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (event: React.FormEvent) => void;
  reset: () => void;
  validate: () => boolean;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

// ============================================================================
// API Hook Types
// ============================================================================

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

// ============================================================================
// Animation Hook Types
// ============================================================================

export interface UseAnimationReturn {
  ref: React.RefObject<HTMLElement>;
  isVisible: boolean;
  hasAnimated: boolean;
}

export interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLElement>;
  progress: number;
  isInView: boolean;
}

// ============================================================================
// Performance Hook Types
// ============================================================================

export interface UsePerformanceReturn {
  measureTime: (name: string, fn: () => void) => void;
  measureAsyncTime: (name: string, fn: () => Promise<void>) => Promise<void>;
  getMetrics: () => Record<string, number>;
  clearMetrics: () => void;
}

export interface UseImageLoadReturn {
  loaded: boolean;
  error: boolean;
  loading: boolean;
}

// ============================================================================
// Accessibility Hook Types
// ============================================================================

export interface UseA11yReturn {
  announceToScreenReader: (message: string) => void;
  focusElement: (selector: string) => void;
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => () => void;
}

export interface UseFocusTrapReturn {
  ref: React.RefObject<HTMLElement>;
  activate: () => void;
  deactivate: () => void;
}

// ============================================================================
// SEO Hook Types
// ============================================================================

export interface UseSEOReturn {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setKeywords: (keywords: string[]) => void;
  setOGImage: (image: string) => void;
  setCanonicalUrl: (url: string) => void;
}

export interface UseStructuredDataReturn {
  setStructuredData: (data: any) => void;
  removeStructuredData: () => void;
}