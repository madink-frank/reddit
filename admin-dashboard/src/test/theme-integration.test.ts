// Integration test for theme configuration consistency
// Using Jest globals - describe, it, expect, beforeEach are available globally
import {
  ThemeConfig,
  isValidThemeMode,
  isValidThemeConfig,
  themeUtils,
  defaultThemeConfig
} from '../config/theme';

describe('Theme Configuration Consistency', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Type Guards', () => {
    it('should validate theme modes correctly', () => {
      expect(isValidThemeMode('light')).toBe(true);
      expect(isValidThemeMode('dark')).toBe(true);
      expect(isValidThemeMode('system')).toBe(true);
      expect(isValidThemeMode('invalid')).toBe(false);
      expect(isValidThemeMode(123)).toBe(false);
      expect(isValidThemeMode(null)).toBe(false);
    });

    it('should validate theme config correctly', () => {
      expect(isValidThemeConfig(defaultThemeConfig)).toBe(true);

      const invalidConfig = {
        mode: 'light',
        colors: { primary: '#000' }, // missing required properties
      };
      expect(isValidThemeConfig(invalidConfig)).toBe(false);

      const validConfig: ThemeConfig = {
        mode: 'dark',
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
      expect(isValidThemeConfig(validConfig)).toBe(true);
    });
  });

  describe('Theme Utils', () => {
    it('should load and save theme config correctly', () => {
      const testConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'dark',
        colors: {
          ...defaultThemeConfig.colors,
          primary: '#ff0000',
        },
      };

      // Save config
      themeUtils.saveThemeConfig(testConfig);

      // Load config
      const loadedConfig = themeUtils.loadThemeConfig();
      expect(loadedConfig).toEqual(testConfig);
    });

    it('should not save invalid theme config', () => {
      const invalidConfig = { mode: 'invalid' } as any;

      // Should not save invalid config
      themeUtils.saveThemeConfig(invalidConfig);

      // Should return default config when loading
      const loadedConfig = themeUtils.loadThemeConfig();
      expect(loadedConfig).toEqual(defaultThemeConfig);
    });

    it('should generate CSS properties correctly', () => {
      const cssProps = themeUtils.generateCSSProperties(defaultThemeConfig);

      expect(cssProps).toHaveProperty('--color-theme-primary', defaultThemeConfig.colors.primary);
      expect(cssProps).toHaveProperty('--color-theme-secondary', defaultThemeConfig.colors.secondary);
      expect(cssProps).toHaveProperty('--animation-duration', '300ms');
      expect(cssProps).toHaveProperty('--animation-easing', defaultThemeConfig.animations.easing);
    });

    it('should convert between UI theme and ThemeConfig', () => {
      const uiTheme = {
        mode: 'dark' as const,
        primaryColor: '#ff0000',
        fontSize: 'medium' as const
      };

      const themeConfig = themeUtils.convertUIThemeToConfig(uiTheme);
      expect(themeConfig.mode).toBe('dark');
      expect(themeConfig.colors.primary).toBe('#ff0000');
      expect(isValidThemeConfig(themeConfig)).toBe(true);

      const convertedUITheme = themeUtils.convertConfigToUITheme(themeConfig);
      expect(convertedUITheme.mode).toBe('dark');
      expect(convertedUITheme.primaryColor).toBe('#ff0000');
      expect(convertedUITheme.fontSize).toBe('medium');
    });

    it('should sanitize theme mode correctly', () => {
      expect(themeUtils.sanitizeThemeMode('light')).toBe('light');
      expect(themeUtils.sanitizeThemeMode('dark')).toBe('dark');
      expect(themeUtils.sanitizeThemeMode('system')).toBe('system');
      expect(themeUtils.sanitizeThemeMode('invalid')).toBe('system');
      expect(themeUtils.sanitizeThemeMode(123)).toBe('system');
    });
  });

  describe('Theme Variants', () => {
    it('should create theme variants correctly', () => {
      const variants = themeUtils.createThemeVariants(defaultThemeConfig);

      expect(variants).toHaveProperty('base');
      expect(variants).toHaveProperty('highContrast');
      expect(variants).toHaveProperty('reducedMotion');
      expect(variants).toHaveProperty('minimal');

      expect(variants.base).toEqual(defaultThemeConfig);
      expect(variants.reducedMotion.animations.enabled).toBe(false);
      expect(variants.minimal.effects.glassMorphism).toBe(false);
    });
  });
});