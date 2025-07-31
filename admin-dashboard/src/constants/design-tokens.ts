// Design Tokens - TypeScript Constants

// Icon Sizes - Standardized system for consistent icon sizing
export const ICON_SIZES = {
  xs: 'icon-xs',      // 12px - Small inline icons
  sm: 'icon-sm',      // 16px - Standard inline icons
  base: 'icon',       // 20px - Default icon size
  md: 'icon-md',      // 24px - Medium icons for buttons
  lg: 'icon-lg',      // 32px - Large icons for headers
  xl: 'icon-xl',      // 48px - Extra large icons (login page)
  '2xl': 'icon-2xl',  // 64px - Hero icons
} as const;

// Button Sizes
export const BUTTON_SIZES = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
} as const;

// Button Variants
export const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-destructive',
} as const;

// Card Variants
export const CARD_VARIANTS = {
  default: 'card',
  outlined: 'card-outlined',
  elevated: 'card-elevated',
} as const;

// Badge Variants
export const BADGE_VARIANTS = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
} as const;

// Form Component Variants
export const FORM_VARIANTS = {
  default: 'form-default',
  filled: 'form-filled',
  outlined: 'form-outlined',
} as const;

// Form Component Sizes
export const FORM_SIZES = {
  sm: 'form-sm',
  md: 'form-md',
  lg: 'form-lg',
} as const;

// Form States
export const FORM_STATES = {
  default: 'form-state-default',
  error: 'form-state-error',
  success: 'form-state-success',
  disabled: 'form-state-disabled',
  focused: 'form-state-focused',
} as const;

// Alert Variants
export const ALERT_VARIANTS = {
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
  info: 'alert-info',
} as const;

// Spacing Scale
export const SPACING = {
  0: 'space-0',
  px: 'space-px',
  0.5: 'space-0-5',
  1: 'space-1',
  1.5: 'space-1-5',
  2: 'space-2',
  2.5: 'space-2-5',
  3: 'space-3',
  3.5: 'space-3-5',
  4: 'space-4',
  5: 'space-5',
  6: 'space-6',
  7: 'space-7',
  8: 'space-8',
  9: 'space-9',
  10: 'space-10',
  11: 'space-11',
  12: 'space-12',
  14: 'space-14',
  16: 'space-16',
  20: 'space-20',
  24: 'space-24',
  28: 'space-28',
  32: 'space-32',
  36: 'space-36',
  40: 'space-40',
  44: 'space-44',
  48: 'space-48',
  52: 'space-52',
  56: 'space-56',
  60: 'space-60',
  64: 'space-64',
  72: 'space-72',
  80: 'space-80',
  96: 'space-96',
} as const;

// Semantic Spacing
export const SEMANTIC_SPACING = {
  xs: 'space-xs',
  sm: 'space-sm',
  md: 'space-md',
  lg: 'space-lg',
  xl: 'space-xl',
  '2xl': 'space-2xl',
  '3xl': 'space-3xl',
  '4xl': 'space-4xl',
  '5xl': 'space-5xl',
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
} as const;

// Heading Styles
export const HEADINGS = {
  h1: 'heading-1',
  h2: 'heading-2',
  h3: 'heading-3',
  h4: 'heading-4',
  h5: 'heading-5',
  h6: 'heading-6',
} as const;

// Body Text Styles
export const BODY_TEXT = {
  large: 'body-large',
  base: 'body-base',
  small: 'body-small',
  xs: 'body-xs',
} as const;

// Border Radius
export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

// Box Shadows
export const SHADOWS = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  none: 'shadow-none',
} as const;

// Z-Index Scale
export const Z_INDEX = {
  hide: 'z-hide',
  auto: 'z-auto',
  base: 'z-base',
  docked: 'z-docked',
  dropdown: 'z-dropdown',
  sticky: 'z-sticky',
  banner: 'z-banner',
  overlay: 'z-overlay',
  modal: 'z-modal',
  popover: 'z-popover',
  skipLink: 'z-skipLink',
  toast: 'z-toast',
  tooltip: 'z-tooltip',
} as const;

// Animation Classes
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  shake: 'animate-shake',
  shimmer: 'animate-shimmer',
  wave: 'animate-wave',
} as const;

// Color Classes
export const TEXT_COLORS = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  disabled: 'text-disabled',
  inverse: 'text-inverse',
  link: 'text-link',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
} as const;

export const BACKGROUND_COLORS = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  surface: 'bg-surface',
  surfaceSecondary: 'bg-surface-secondary',
  surfaceElevated: 'bg-surface-elevated',
} as const;

export const BORDER_COLORS = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  focus: 'border-focus',
  success: 'border-success',
  warning: 'border-warning',
  error: 'border-error',
} as const;

// Type definitions for better TypeScript support
export type IconSize = keyof typeof ICON_SIZES;
export type ButtonSize = keyof typeof BUTTON_SIZES;
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type CardVariant = keyof typeof CARD_VARIANTS;
export type BadgeVariant = keyof typeof BADGE_VARIANTS;
export type AlertVariant = keyof typeof ALERT_VARIANTS;
export type FormVariant = keyof typeof FORM_VARIANTS;
export type FormSize = keyof typeof FORM_SIZES;
export type FormState = keyof typeof FORM_STATES;
export type SpacingValue = keyof typeof SPACING;
export type SemanticSpacing = keyof typeof SEMANTIC_SPACING;
export type TypographySize = keyof typeof TYPOGRAPHY;
export type HeadingLevel = keyof typeof HEADINGS;
export type BodyTextSize = keyof typeof BODY_TEXT;
export type BorderRadiusSize = keyof typeof BORDER_RADIUS;
export type ShadowSize = keyof typeof SHADOWS;
export type ZIndexLevel = keyof typeof Z_INDEX;
export type AnimationType = keyof typeof ANIMATIONS;
export type TextColor = keyof typeof TEXT_COLORS;
export type BackgroundColor = keyof typeof BACKGROUND_COLORS;
export type BorderColor = keyof typeof BORDER_COLORS;

// Helper functions
export const getIconSizeClass = (size: IconSize): string => ICON_SIZES[size];

// Icon size utility functions for standardization
export const getStandardIconSize = (context: 'inline' | 'button' | 'header' | 'hero' | 'status'): IconSize => {
  switch (context) {
    case 'inline':
      return 'sm'; // 16px - for inline text icons
    case 'button':
      return 'md'; // 24px - for button icons
    case 'header':
      return 'lg'; // 32px - for section headers
    case 'hero':
      return 'xl'; // 48px - for hero sections, login page
    case 'status':
      return 'base'; // 20px - for status indicators
    default:
      return 'base';
  }
};

// Convert Tailwind size classes to design token sizes
export const convertTailwindToIconSize = (tailwindClass: string): IconSize => {
  const sizeMap: Record<string, IconSize> = {
    'h-3 w-3': 'xs',
    'h-4 w-4': 'sm',
    'h-5 w-5': 'base',
    'h-6 w-6': 'md',
    'h-8 w-8': 'lg',
    'h-12 w-12': 'xl',
    'h-16 w-16': '2xl',
  };
  return sizeMap[tailwindClass] || 'base';
};
export const getButtonClass = (variant: ButtonVariant, size: ButtonSize): string => 
  `btn ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
export const getCardClass = (variant: CardVariant): string => CARD_VARIANTS[variant];
export const getBadgeClass = (variant: BadgeVariant): string => `badge ${BADGE_VARIANTS[variant]}`;
export const getAlertClass = (variant: AlertVariant): string => `alert ${ALERT_VARIANTS[variant]}`;
export const getFormClass = (variant: FormVariant, size: FormSize, state?: FormState): string => {
  const baseClass = `form ${FORM_VARIANTS[variant]} ${FORM_SIZES[size]}`;
  return state ? `${baseClass} ${FORM_STATES[state]}` : baseClass;
};
export const getSpacingClass = (property: 'p' | 'm' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml', value: SpacingValue): string => 
  `${property}-${value}`;
export const getTextClass = (size: TypographySize, color?: TextColor): string => 
  color ? `${TYPOGRAPHY[size]} ${TEXT_COLORS[color]}` : TYPOGRAPHY[size];
export const getHeadingClass = (level: HeadingLevel): string => HEADINGS[level];
export const getBodyTextClass = (size: BodyTextSize): string => BODY_TEXT[size];

// CSS Custom Property Values (for direct CSS usage)
export const CSS_VARIABLES = {
  colors: {
    primary: {
      50: 'var(--color-primary-50)',
      100: 'var(--color-primary-100)',
      200: 'var(--color-primary-200)',
      300: 'var(--color-primary-300)',
      400: 'var(--color-primary-400)',
      500: 'var(--color-primary-500)',
      600: 'var(--color-primary-600)',
      700: 'var(--color-primary-700)',
      800: 'var(--color-primary-800)',
      900: 'var(--color-primary-900)',
      950: 'var(--color-primary-950)',
    },
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      tertiary: 'var(--color-text-tertiary)',
      disabled: 'var(--color-text-disabled)',
      inverse: 'var(--color-text-inverse)',
      link: 'var(--color-text-link)',
      linkHover: 'var(--color-text-link-hover)',
    },
    background: {
      primary: 'var(--color-background-primary)',
      secondary: 'var(--color-background-secondary)',
      tertiary: 'var(--color-background-tertiary)',
      overlay: 'var(--color-background-overlay)',
    },
    surface: {
      primary: 'var(--color-surface-primary)',
      secondary: 'var(--color-surface-secondary)',
      tertiary: 'var(--color-surface-tertiary)',
      elevated: 'var(--color-surface-elevated)',
    },
    border: {
      primary: 'var(--color-border-primary)',
      secondary: 'var(--color-border-secondary)',
      focus: 'var(--color-border-focus)',
      error: 'var(--color-border-error)',
      success: 'var(--color-border-success)',
      warning: 'var(--color-border-warning)',
    },
    status: {
      success: 'var(--color-status-success)',
      warning: 'var(--color-status-warning)',
      error: 'var(--color-status-error)',
      info: 'var(--color-status-info)',
      neutral: 'var(--color-status-neutral)',
    },
  },
  spacing: {
    xs: 'var(--space-xs)',
    sm: 'var(--space-sm)',
    md: 'var(--space-md)',
    lg: 'var(--space-lg)',
    xl: 'var(--space-xl)',
    '2xl': 'var(--space-2xl)',
    '3xl': 'var(--space-3xl)',
    '4xl': 'var(--space-4xl)',
    '5xl': 'var(--space-5xl)',
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-family-sans)',
      mono: 'var(--font-family-mono)',
      serif: 'var(--font-family-serif)',
    },
    fontSize: {
      xs: 'var(--font-size-xs)',
      sm: 'var(--font-size-sm)',
      base: 'var(--font-size-base)',
      lg: 'var(--font-size-lg)',
      xl: 'var(--font-size-xl)',
      '2xl': 'var(--font-size-2xl)',
      '3xl': 'var(--font-size-3xl)',
      '4xl': 'var(--font-size-4xl)',
      '5xl': 'var(--font-size-5xl)',
      '6xl': 'var(--font-size-6xl)',
    },
    lineHeight: {
      none: 'var(--line-height-none)',
      tight: 'var(--line-height-tight)',
      snug: 'var(--line-height-snug)',
      normal: 'var(--line-height-normal)',
      relaxed: 'var(--line-height-relaxed)',
      loose: 'var(--line-height-loose)',
    },
  },
  borderRadius: {
    none: 'var(--radius-none)',
    sm: 'var(--radius-sm)',
    base: 'var(--radius-base)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    '3xl': 'var(--radius-3xl)',
    full: 'var(--radius-full)',
  },
  boxShadow: {
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    base: 'var(--shadow-base)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    '2xl': 'var(--shadow-2xl)',
    inner: 'var(--shadow-inner)',
    none: 'var(--shadow-none)',
  },
  zIndex: {
    hide: 'var(--z-index-hide)',
    auto: 'var(--z-index-auto)',
    base: 'var(--z-index-base)',
    docked: 'var(--z-index-docked)',
    dropdown: 'var(--z-index-dropdown)',
    sticky: 'var(--z-index-sticky)',
    banner: 'var(--z-index-banner)',
    overlay: 'var(--z-index-overlay)',
    modal: 'var(--z-index-modal)',
    popover: 'var(--z-index-popover)',
    skipLink: 'var(--z-index-skipLink)',
    toast: 'var(--z-index-toast)',
    tooltip: 'var(--z-index-tooltip)',
  },
  animation: {
    duration: {
      instant: 'var(--duration-instant)',
      fast: 'var(--duration-fast)',
      normal: 'var(--duration-normal)',
      slow: 'var(--duration-slow)',
      slower: 'var(--duration-slower)',
      slowest: 'var(--duration-slowest)',
    },
    easing: {
      linear: 'var(--ease-linear)',
      in: 'var(--ease-in)',
      out: 'var(--ease-out)',
      inOut: 'var(--ease-in-out)',
      bounce: 'var(--ease-bounce)',
      elastic: 'var(--ease-elastic)',
    },
  },
} as const;