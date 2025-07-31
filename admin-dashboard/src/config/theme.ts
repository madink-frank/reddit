// Advanced Dashboard Theme Configuration

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  effects: {
    glassMorphism: boolean;
    shadows: boolean;
    gradients: boolean;
  };
}

export const defaultThemeConfig: ThemeConfig = {
  mode: 'system',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  effects: {
    glassMorphism: true,
    shadows: true,
    gradients: true,
  },
};

export const lightThemeConfig: ThemeConfig = {
  ...defaultThemeConfig,
  mode: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
  },
};

export const darkThemeConfig: ThemeConfig = {
  ...defaultThemeConfig,
  mode: 'dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
  },
};

// Theme utility functions
export const themeUtils = {
  /**
   * Apply theme configuration to document
   */
  applyTheme: (config: ThemeConfig) => {
    // Validate config before applying
    if (!isValidThemeConfig(config)) {
      console.warn('Invalid theme configuration provided, using default');
      config = defaultThemeConfig;
    }
    
    try {
      const root = document.documentElement;
      
      // Set theme mode
      root.setAttribute('data-theme', config.mode === 'system' ? getSystemTheme() : config.mode);
      
      // Apply custom colors
      root.style.setProperty('--color-theme-primary', config.colors.primary);
      root.style.setProperty('--color-theme-secondary', config.colors.secondary);
      root.style.setProperty('--color-theme-accent', config.colors.accent);
      root.style.setProperty('--color-theme-background', config.colors.background);
      root.style.setProperty('--color-theme-surface', config.colors.surface);
      root.style.setProperty('--color-theme-text', config.colors.text);
      
      // Apply animation settings
      root.style.setProperty('--animation-duration', `${config.animations.duration}ms`);
      root.style.setProperty('--animation-easing', config.animations.easing);
      
      // Apply effects
      root.classList.toggle('no-animations', !config.animations.enabled);
      root.classList.toggle('no-glass', !config.effects.glassMorphism);
      root.classList.toggle('no-shadows', !config.effects.shadows);
      root.classList.toggle('no-gradients', !config.effects.gradients);
    } catch (error) {
      console.warn('Failed to apply theme configuration to DOM:', error);
    }
  },
  
  /**
   * Get system theme preference
   */
  getSystemTheme: (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  /**
   * Get theme configuration from localStorage
   */
  loadThemeConfig: (key = 'advanced-dashboard-theme'): ThemeConfig => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the parsed config and merge with defaults
        if (isValidThemeConfig(parsed)) {
          return parsed;
        } else {
          // Merge valid parts with defaults
          const mergedConfig = { ...defaultThemeConfig, ...parsed };
          if (isValidThemeConfig(mergedConfig)) {
            return mergedConfig;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load theme configuration:', error);
    }
    return defaultThemeConfig;
  },
  
  /**
   * Save theme configuration to localStorage
   */
  saveThemeConfig: (config: ThemeConfig, key = 'advanced-dashboard-theme') => {
    // Validate config before saving
    if (!isValidThemeConfig(config)) {
      console.warn('Invalid theme configuration provided, cannot save');
      return;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save theme configuration:', error);
    }
  },
  
  /**
   * Generate CSS custom properties from theme config
   */
  generateCSSProperties: (config: ThemeConfig): Record<string, string> => {
    return {
      '--color-theme-primary': config.colors.primary,
      '--color-theme-secondary': config.colors.secondary,
      '--color-theme-accent': config.colors.accent,
      '--color-theme-background': config.colors.background,
      '--color-theme-surface': config.colors.surface,
      '--color-theme-text': config.colors.text,
      '--animation-duration': `${config.animations.duration}ms`,
      '--animation-easing': config.animations.easing,
    };
  },
  
  /**
   * Create theme variants for different contexts
   */
  createThemeVariants: (baseConfig: ThemeConfig) => {
    return {
      base: baseConfig,
      highContrast: {
        ...baseConfig,
        colors: {
          ...baseConfig.colors,
          primary: baseConfig.mode === 'dark' ? '#ffffff' : '#000000',
          text: baseConfig.mode === 'dark' ? '#ffffff' : '#000000',
        },
      },
      reducedMotion: {
        ...baseConfig,
        animations: {
          ...baseConfig.animations,
          enabled: false,
          duration: 0,
        },
      },
      minimal: {
        ...baseConfig,
        effects: {
          glassMorphism: false,
          shadows: false,
          gradients: false,
        },
      },
    };
  },
  
  /**
   * Convert UI store Theme to ThemeConfig
   */
  convertUIThemeToConfig: (uiTheme: { mode: 'light' | 'dark' | 'system'; primaryColor: string; fontSize: 'small' | 'medium' | 'large' }): ThemeConfig => {
    const baseConfig = uiTheme.mode === 'light' ? lightThemeConfig : 
                      uiTheme.mode === 'dark' ? darkThemeConfig : 
                      defaultThemeConfig;
    
    return {
      ...baseConfig,
      mode: uiTheme.mode,
      colors: {
        ...baseConfig.colors,
        primary: uiTheme.primaryColor,
      },
    };
  },
  
  /**
   * Convert ThemeConfig to UI store Theme
   */
  convertConfigToUITheme: (config: ThemeConfig): { mode: 'light' | 'dark' | 'system'; primaryColor: string; fontSize: 'small' | 'medium' | 'large' } => {
    return {
      mode: config.mode,
      primaryColor: config.colors.primary,
      fontSize: 'medium', // Default fontSize since it's not in ThemeConfig
    };
  },
  
  /**
   * Validate and sanitize theme mode
   */
  sanitizeThemeMode: (mode: unknown): ThemeMode => {
    if (isValidThemeMode(mode)) {
      return mode;
    }
    console.warn('Invalid theme mode provided, defaulting to system');
    return 'system';
  },
};

// Type guards for runtime validation
export const isValidThemeMode = (mode: unknown): mode is ThemeMode => {
  return typeof mode === 'string' && ['light', 'dark', 'system'].includes(mode);
};

export const isValidThemeConfig = (config: unknown): config is ThemeConfig => {
  if (!config || typeof config !== 'object') return false;
  
  const c = config as Record<string, unknown>;
  
  return (
    isValidThemeMode(c.mode) &&
    typeof c.colors === 'object' &&
    c.colors !== null &&
    typeof (c.colors as Record<string, unknown>).primary === 'string' &&
    typeof (c.colors as Record<string, unknown>).secondary === 'string' &&
    typeof (c.colors as Record<string, unknown>).accent === 'string' &&
    typeof (c.colors as Record<string, unknown>).background === 'string' &&
    typeof (c.colors as Record<string, unknown>).surface === 'string' &&
    typeof (c.colors as Record<string, unknown>).text === 'string' &&
    typeof c.animations === 'object' &&
    c.animations !== null &&
    typeof (c.animations as Record<string, unknown>).enabled === 'boolean' &&
    typeof (c.animations as Record<string, unknown>).duration === 'number' &&
    typeof (c.animations as Record<string, unknown>).easing === 'string' &&
    typeof c.effects === 'object' &&
    c.effects !== null &&
    typeof (c.effects as Record<string, unknown>).glassMorphism === 'boolean' &&
    typeof (c.effects as Record<string, unknown>).shadows === 'boolean' &&
    typeof (c.effects as Record<string, unknown>).gradients === 'boolean'
  );
};

// Helper function for system theme detection
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Theme presets
export const themePresets = {
  default: defaultThemeConfig,
  light: lightThemeConfig,
  dark: darkThemeConfig,
  
  // Professional themes
  corporate: {
    ...darkThemeConfig,
    colors: {
      primary: '#1e40af',
      secondary: '#374151',
      accent: '#059669',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1f2937',
    },
  } as ThemeConfig,
  
  midnight: {
    ...darkThemeConfig,
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#030712',
      surface: '#111827',
      text: '#f9fafb',
    },
  } as ThemeConfig,
  
  ocean: {
    ...darkThemeConfig,
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#10b981',
      background: '#0c4a6e',
      surface: '#075985',
      text: '#e0f2fe',
    },
  } as ThemeConfig,
  
  forest: {
    ...darkThemeConfig,
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: '#064e3b',
      surface: '#065f46',
      text: '#ecfdf5',
    },
  } as ThemeConfig,
};

// Accessibility helpers
export const accessibilityHelpers = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  /**
   * Apply accessibility preferences to theme config
   */
  applyAccessibilityPreferences: (config: ThemeConfig): ThemeConfig => {
    const modified = { ...config };
    
    if (accessibilityHelpers.prefersReducedMotion()) {
      modified.animations.enabled = false;
      modified.animations.duration = 0;
    }
    
    if (accessibilityHelpers.prefersHighContrast()) {
      // Apply high contrast colors
      modified.colors.primary = config.mode === 'dark' ? '#ffffff' : '#000000';
      modified.colors.text = config.mode === 'dark' ? '#ffffff' : '#000000';
    }
    
    return modified;
  },
};

export default {
  defaultThemeConfig,
  lightThemeConfig,
  darkThemeConfig,
  themeUtils,
  themePresets,
  accessibilityHelpers,
};