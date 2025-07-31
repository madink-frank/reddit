// Utility type definitions

// ============================================================================
// Generic Utility Types
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// ============================================================================
// Function Utility Types
// ============================================================================

export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

export type SyncFunction<T extends any[] = any[], R = any> = (...args: T) => R;

export type EventHandler<T = Event> = (event: T) => void;

export type Callback<T extends any[] = any[], R = void> = (...args: T) => R;

export type Predicate<T> = (value: T) => boolean;

export type Comparator<T> = (a: T, b: T) => number;

export type Transformer<T, U> = (value: T) => U;

export type Validator<T> = (value: T) => string | null;

// ============================================================================
// Array Utility Types
// ============================================================================

export type NonEmptyArray<T> = [T, ...T[]];

export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [...R, T]>;

// ============================================================================
// Object Utility Types
// ============================================================================

export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Immutable<T> = {
  readonly [P in keyof T]: T[P];
};

// ============================================================================
// String Utility Types
// ============================================================================

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

export type Split<S extends string, D extends string> = string extends S
  ? string[]
  : S extends ''
  ? []
  : S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : [S];

export type Join<T extends string[], D extends string> = T extends []
  ? ''
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? R extends string[]
      ? `${F}${D}${Join<R, D>}`
      : never
    : never
  : never;

export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S;

// ============================================================================
// Date Utility Types
// ============================================================================

export type DateString = string; // ISO 8601 date string
export type TimeString = string; // ISO 8601 time string
export type DateTimeString = string; // ISO 8601 datetime string

export interface DateRange {
  start: Date | DateString;
  end: Date | DateString;
}

export interface TimeRange {
  start: TimeString;
  end: TimeString;
}

// ============================================================================
// API Utility Types
// ============================================================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
  lastFetch: number | null;
}

export type ApiEndpoint<TParams = void, TResponse = any> = TParams extends void
  ? () => Promise<TResponse>
  : (params: TParams) => Promise<TResponse>;

// ============================================================================
// Form Utility Types
// ============================================================================

export type FormFieldValue = string | number | boolean | Date | null | undefined;

export type FormValues = Record<string, FormFieldValue>;

export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>>;

export type FormTouched<T extends FormValues> = Partial<Record<keyof T, boolean>>;

export interface FormField<T extends FormFieldValue = FormFieldValue> {
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
  disabled: boolean;
}

export type FormState<T extends FormValues> = {
  [K in keyof T]: FormField<T[K]>;
};

// ============================================================================
// Component Utility Types
// ============================================================================

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export type ComponentColor = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink';

export interface ComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

export interface UtilClickableProps {
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

export interface FocusableProps {
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  autoFocus?: boolean;
  tabIndex?: number;
}

// ============================================================================
// Theme Utility Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeBreakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

// ============================================================================
// Animation Utility Types
// ============================================================================

export type AnimationDuration = 'fast' | 'normal' | 'slow';

export type AnimationEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface AnimationConfig {
  duration: number;
  easing: AnimationEasing;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// ============================================================================
// Accessibility Utility Types
// ============================================================================

export type AriaRole = 
  | 'button'
  | 'link'
  | 'menuitem'
  | 'tab'
  | 'tabpanel'
  | 'dialog'
  | 'alertdialog'
  | 'tooltip'
  | 'status'
  | 'alert'
  | 'log'
  | 'marquee'
  | 'timer'
  | 'region'
  | 'main'
  | 'navigation'
  | 'banner'
  | 'contentinfo'
  | 'complementary'
  | 'search'
  | 'form'
  | 'article'
  | 'section'
  | 'heading'
  | 'list'
  | 'listitem'
  | 'table'
  | 'row'
  | 'cell'
  | 'columnheader'
  | 'rowheader';

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-pressed'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-activedescendant'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-level'?: number;
  'aria-posinset'?: number;
  'aria-setsize'?: number;
  role?: AriaRole;
}

// ============================================================================
// Performance Utility Types
// ============================================================================

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  bundleSize: number;
}

export interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  placeholder?: React.ComponentType;
  fallback?: React.ComponentType;
}

// ============================================================================
// SEO Utility Types
// ============================================================================

export interface SEOMetaTags {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  robots?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export interface StructuredDataType {
  '@context': string;
  '@type': string;
  [key: string]: any;
}