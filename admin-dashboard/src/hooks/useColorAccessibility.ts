import { useState, useEffect, useCallback } from 'react';
import { 
  prefersHighContrast, 
  prefersReducedMotion, 
  getSystemColorScheme,
  getColorblindSafeAlternative,
  getVisualPattern,
  validateColorAccessibility,
  type ColorAccessibilityReport
} from '../utils/colorAccessibility';

export interface ColorAccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  colorScheme: 'light' | 'dark';
  colorblindSafe: boolean;
  enhancedFocus: boolean;
}

export interface UseColorAccessibilityReturn {
  preferences: ColorAccessibilityPreferences;
  updatePreference: <K extends keyof ColorAccessibilityPreferences>(
    key: K, 
    value: ColorAccessibilityPreferences[K]
  ) => void;
  getAccessibleColor: (semanticType: string) => string;
  getVisualIndicator: (semanticType: string) => { pattern: string; icon: string; texture: string };
  validateColors: (foreground: string, background: string, isLargeText?: boolean) => ColorAccessibilityReport;
  applyAccessibilityClasses: (element: HTMLElement, semanticType?: string) => void;
  isAccessibilityModeActive: boolean;
}

const STORAGE_KEY = 'color-accessibility-preferences';

const defaultPreferences: ColorAccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  colorScheme: 'light',
  colorblindSafe: false,
  enhancedFocus: false,
};

export function useColorAccessibility(): UseColorAccessibilityReturn {
  const [preferences, setPreferences] = useState<ColorAccessibilityPreferences>(() => {
    // Initialize with system preferences
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedPrefs = stored ? JSON.parse(stored) : {};
    
    return {
      ...defaultPreferences,
      highContrast: prefersHighContrast(),
      reducedMotion: prefersReducedMotion(),
      colorScheme: getSystemColorScheme(),
      ...storedPrefs,
    };
  });

  // Listen for system preference changes
  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, highContrast: e.matches }));
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, colorScheme: e.matches ? 'dark' : 'light' }));
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Apply CSS classes to document based on preferences
  useEffect(() => {
    const { body } = document;
    
    // High contrast
    body.classList.toggle('high-contrast', preferences.highContrast);
    
    // Reduced motion
    body.classList.toggle('reduced-motion', preferences.reducedMotion);
    
    // Color scheme
    body.setAttribute('data-theme', preferences.colorScheme);
    
    // Colorblind safe
    body.classList.toggle('colorblind-safe', preferences.colorblindSafe);
    
    // Enhanced focus
    body.classList.toggle('enhanced-focus', preferences.enhancedFocus);
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof ColorAccessibilityPreferences>(
    key: K, 
    value: ColorAccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const getAccessibleColor = useCallback((semanticType: string) => {
    if (preferences.colorblindSafe) {
      return getColorblindSafeAlternative(semanticType as any);
    }
    
    // Return default color based on semantic type
    const colorMap: Record<string, string> = {
      success: 'var(--color-status-success)',
      warning: 'var(--color-status-warning)',
      error: 'var(--color-status-error)',
      info: 'var(--color-status-info)',
      neutral: 'var(--color-status-neutral)',
    };
    
    return colorMap[semanticType] || colorMap.neutral;
  }, [preferences.colorblindSafe]);

  const getVisualIndicator = useCallback((semanticType: string) => {
    return getVisualPattern(semanticType as any);
  }, []);

  const validateColors = useCallback((
    foreground: string, 
    background: string, 
    isLargeText: boolean = false
  ) => {
    return validateColorAccessibility(foreground, background, isLargeText);
  }, []);

  const applyAccessibilityClasses = useCallback((
    element: HTMLElement, 
    semanticType?: string
  ) => {
    const classes: string[] = [];
    
    if (preferences.highContrast) {
      classes.push('high-contrast');
    }
    
    if (preferences.reducedMotion) {
      classes.push('reduced-motion');
    }
    
    if (preferences.enhancedFocus) {
      classes.push('enhanced-focus');
    }
    
    if (preferences.colorblindSafe && semanticType) {
      const pattern = getVisualPattern(semanticType as any);
      classes.push(`pattern-${pattern.pattern}`);
      classes.push(`status-${semanticType}`);
    }
    
    // Remove existing accessibility classes
    element.classList.remove(
      'high-contrast', 
      'reduced-motion', 
      'enhanced-focus',
      'pattern-checkered',
      'pattern-diagonal-stripes',
      'pattern-dots',
      'pattern-horizontal-lines',
      'pattern-solid',
      'status-success',
      'status-warning',
      'status-error',
      'status-info',
      'status-neutral'
    );
    
    // Add new classes
    element.classList.add(...classes);
  }, [preferences]);

  const isAccessibilityModeActive = preferences.highContrast || 
    preferences.colorblindSafe || 
    preferences.enhancedFocus;

  return {
    preferences,
    updatePreference,
    getAccessibleColor,
    getVisualIndicator,
    validateColors,
    applyAccessibilityClasses,
    isAccessibilityModeActive,
  };
}

export default useColorAccessibility;