import { useState, useEffect, useCallback, useMemo } from 'react';
import { useThemeContext } from '../components/providers/ThemeProvider';
import { useAdvancedTheme } from './useAdvancedDashboard';
import { ThemeConfig, ThemeMode, themePresets, accessibilityHelpers } from '../config/theme';

export interface EnhancedThemeState {
  // Current theme state
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  themeConfig: ThemeConfig;

  // Theme actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  applyTheme: (config: ThemeConfig) => void;
  resetTheme: () => void;

  // Preset management
  applyPreset: (presetName: keyof typeof themePresets) => void;
  availablePresets: typeof themePresets;

  // Accessibility features
  enableHighContrast: () => void;
  disableAnimations: () => void;
  applyAccessibilityPreferences: () => void;

  // Theme utilities
  isDark: boolean;
  isLight: boolean;
  isSystemTheme: boolean;
  getThemeClass: (lightClass: string, darkClass: string) => string;
  getThemeValue: <T>(lightValue: T, darkValue: T) => T;

  // Advanced features
  isTransitioning: boolean;
  customThemeActive: boolean;
  systemThemeSupported: boolean;
}

export const useEnhancedTheme = (): EnhancedThemeState => {
  const themeContext = useThemeContext();
  const advancedTheme = useAdvancedTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [customThemeActive, setCustomThemeActive] = useState(false);

  // Check if system theme is supported
  const systemThemeSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
  }, []);

  // Enhanced theme switching with transition
  const setThemeWithTransition = useCallback(async (newTheme: ThemeMode) => {
    setIsTransitioning(true);

    // Add transition class
    document.documentElement.classList.add('theme-transitioning');

    // Apply theme
    themeContext.setTheme(newTheme);

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  }, [themeContext]);

  // Enhanced theme toggle with cycle through all modes
  const enhancedToggleTheme = useCallback(() => {
    const modes: ThemeMode[] = systemThemeSupported
      ? ['light', 'dark', 'system']
      : ['light', 'dark'];

    const currentIndex = modes.indexOf(themeContext.theme);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeWithTransition(modes[nextIndex]);
  }, [themeContext.theme, systemThemeSupported, setThemeWithTransition]);

  // Apply theme preset
  const applyPreset = useCallback((presetName: keyof typeof themePresets) => {
    const preset = themePresets[presetName];
    if (preset) {
      setIsTransitioning(true);
      document.documentElement.classList.add('theme-transitioning');

      advancedTheme.applyTheme(preset);
      setCustomThemeActive(presetName !== 'default');

      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        setIsTransitioning(false);
      }, 300);
    }
  }, [advancedTheme]);

  // Enhanced apply theme with validation and transition
  const enhancedApplyTheme = useCallback((config: ThemeConfig) => {
    setIsTransitioning(true);
    document.documentElement.classList.add('theme-transitioning');

    // Apply accessibility preferences if needed
    const finalConfig = accessibilityHelpers.applyAccessibilityPreferences(config);

    advancedTheme.applyTheme(finalConfig);
    setCustomThemeActive(true);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  }, [advancedTheme]);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setIsTransitioning(true);
    document.documentElement.classList.add('theme-transitioning');

    advancedTheme.resetTheme();
    setCustomThemeActive(false);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  }, [advancedTheme]);

  // Accessibility helpers
  const enableHighContrast = useCallback(() => {
    const highContrastConfig = {
      ...advancedTheme.themeConfig,
      colors: {
        ...advancedTheme.themeConfig.colors,
        primary: themeContext.resolvedTheme === 'dark' ? '#ffffff' : '#000000',
        text: themeContext.resolvedTheme === 'dark' ? '#ffffff' : '#000000',
        background: themeContext.resolvedTheme === 'dark' ? '#000000' : '#ffffff',
      },
    };
    enhancedApplyTheme(highContrastConfig);
  }, [advancedTheme.themeConfig, themeContext.resolvedTheme, enhancedApplyTheme]);

  const disableAnimations = useCallback(() => {
    const noAnimationConfig = {
      ...advancedTheme.themeConfig,
      animations: {
        ...advancedTheme.themeConfig.animations,
        enabled: false,
        duration: 0,
      },
    };
    enhancedApplyTheme(noAnimationConfig);
  }, [advancedTheme.themeConfig, enhancedApplyTheme]);

  const applyAccessibilityPreferences = useCallback(() => {
    const accessibleConfig = accessibilityHelpers.applyAccessibilityPreferences(
      advancedTheme.themeConfig
    );
    enhancedApplyTheme(accessibleConfig);
  }, [advancedTheme.themeConfig, enhancedApplyTheme]);

  // Theme utility functions
  const getThemeClass = useCallback((lightClass: string, darkClass: string) => {
    return themeContext.resolvedTheme === 'dark' ? darkClass : lightClass;
  }, [themeContext.resolvedTheme]);

  const getThemeValue = useCallback(<T,>(lightValue: T, darkValue: T): T => {
    return themeContext.resolvedTheme === 'dark' ? darkValue : lightValue;
  }, [themeContext.resolvedTheme]);

  // Computed properties
  const isDark = themeContext.resolvedTheme === 'dark';
  const isLight = themeContext.resolvedTheme === 'light';
  const isSystemTheme = themeContext.theme === 'system';

  // Listen for system theme changes and update custom theme status
  useEffect(() => {
    // Check if current theme config differs from default
    const isCustom = JSON.stringify(advancedTheme.themeConfig) !== JSON.stringify(themePresets.default);
    setCustomThemeActive(isCustom);
  }, [advancedTheme.themeConfig]);

  // Add theme transition styles to document head
  useEffect(() => {
    const styleId = 'enhanced-theme-transitions';
    let existingStyle = document.getElementById(styleId);

    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .theme-transitioning,
        .theme-transitioning *,
        .theme-transitioning *:before,
        .theme-transitioning *:after {
          transition: background-color 300ms ease-in-out,
                      border-color 300ms ease-in-out,
                      color 300ms ease-in-out,
                      box-shadow 300ms ease-in-out,
                      fill 300ms ease-in-out,
                      stroke 300ms ease-in-out !important;
          transition-delay: 0ms !important;
        }
        
        .theme-transitioning .no-transition,
        .theme-transitioning .no-transition *,
        .theme-transitioning .no-transition *:before,
        .theme-transitioning .no-transition *:after {
          transition: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  return {
    // Current theme state
    theme: themeContext.theme,
    resolvedTheme: themeContext.resolvedTheme,
    themeConfig: advancedTheme.themeConfig,

    // Theme actions
    setTheme: setThemeWithTransition,
    toggleTheme: enhancedToggleTheme,
    applyTheme: enhancedApplyTheme,
    resetTheme,

    // Preset management
    applyPreset,
    availablePresets: themePresets,

    // Accessibility features
    enableHighContrast,
    disableAnimations,
    applyAccessibilityPreferences,

    // Theme utilities
    isDark,
    isLight,
    isSystemTheme,
    getThemeClass,
    getThemeValue,

    // Advanced features
    isTransitioning,
    customThemeActive,
    systemThemeSupported,
  };
};

// Hook for theme-aware component styling
export const useThemeAwareStyles = () => {
  const { resolvedTheme, getThemeClass, getThemeValue } = useEnhancedTheme();

  return {
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    getThemeClass,
    getThemeValue,

    // Common theme-aware style patterns
    cardStyles: getThemeClass(
      'bg-white border-gray-200 shadow-sm',
      'bg-gray-800 border-gray-700 shadow-lg'
    ),

    textStyles: getThemeClass(
      'text-gray-900',
      'text-gray-100'
    ),

    mutedTextStyles: getThemeClass(
      'text-gray-600',
      'text-gray-400'
    ),

    borderStyles: getThemeClass(
      'border-gray-200',
      'border-gray-700'
    ),

    hoverStyles: getThemeClass(
      'hover:bg-gray-50',
      'hover:bg-gray-700'
    ),

    focusStyles: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  };
};

// Hook for theme persistence
export const useThemePersistence = () => {
  const { theme, themeConfig } = useEnhancedTheme();

  useEffect(() => {
    // Save theme preference to localStorage
    try {
      localStorage.setItem('enhanced-theme-preference', theme);
      localStorage.setItem('enhanced-theme-config', JSON.stringify(themeConfig));
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, [theme, themeConfig]);

  // Load theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('enhanced-theme-preference') as ThemeMode;
      const savedConfig = localStorage.getItem('enhanced-theme-config');

      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        // Theme will be loaded by the ThemeProvider
      }

      if (savedConfig) {
        try {
          // Config will be loaded by the useAdvancedTheme hook
        } catch (error) {
          console.warn('Failed to parse saved theme config:', error);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }, []);
};

export default useEnhancedTheme;