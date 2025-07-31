// Test for theme switching functionality
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { renderHook, act } from '@testing-library/react';
import { useAdvancedTheme } from '../hooks/useAdvancedDashboard';
import {
  ThemeConfig,
  ThemeMode,
  defaultThemeConfig} from '../config/theme';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock window.matchMedia
const createMatchMediaMock = (matches = false) => jest.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)' ? matches : false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock document.documentElement
const documentElementMock = {
  setAttribute: jest.fn(),
  style: {
    setProperty: jest.fn(),
  },
  classList: {
    toggle: jest.fn(),
  },
};

describe('Theme Switching Functionality', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Default matchMedia mock (system prefers light)
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMediaMock(false),
      writable: true,
    });
    
    Object.defineProperty(document, 'documentElement', {
      value: documentElementMock,
      writable: true,
    });
    
    // Clear localStorage mock
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useAdvancedTheme Hook', () => {
    it('should initialize with default theme config', () => {
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig).toEqual(defaultThemeConfig);
      // When system mode is used and system prefers light, currentTheme should be 'light'
      expect(result.current.currentTheme).toBe('light');
    });

    it('should load saved theme config from localStorage', () => {
      const savedConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'dark',
        colors: {
          ...defaultThemeConfig.colors,
          primary: '#ff0000',
        },
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig).toEqual(savedConfig);
      expect(result.current.currentTheme).toBe('dark');
    });

    it('should toggle theme from light to dark', () => {
      const initialConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'light',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig.mode).toBe('light');
      
      act(() => {
        result.current.toggleTheme();
      });
      
      expect(result.current.themeConfig.mode).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'advanced-dashboard-theme',
        JSON.stringify({
          ...initialConfig,
          mode: 'dark',
        })
      );
    });

    it('should toggle theme from dark to light', () => {
      const initialConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'dark',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig.mode).toBe('dark');
      
      act(() => {
        result.current.toggleTheme();
      });
      
      expect(result.current.themeConfig.mode).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'advanced-dashboard-theme',
        JSON.stringify({
          ...initialConfig,
          mode: 'light',
        })
      );
    });

    it('should toggle theme from system to light', () => {
      const initialConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'system',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig.mode).toBe('system');
      
      act(() => {
        result.current.toggleTheme();
      });
      
      expect(result.current.themeConfig.mode).toBe('light');
    });

    it('should apply theme configuration correctly', () => {
      const testConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'dark',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#111111',
          surface: '#222222',
          text: '#ffffff',
        },
      };
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      act(() => {
        result.current.applyTheme(testConfig);
      });
      
      expect(result.current.themeConfig).toEqual(testConfig);
      expect(documentElementMock.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(documentElementMock.style.setProperty).toHaveBeenCalledWith('--color-theme-primary', '#ff0000');
      expect(documentElementMock.style.setProperty).toHaveBeenCalledWith('--color-theme-secondary', '#00ff00');
      expect(documentElementMock.style.setProperty).toHaveBeenCalledWith('--color-theme-accent', '#0000ff');
    });

    it('should reset theme to default', () => {
      const customConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'dark',
        colors: {
          ...defaultThemeConfig.colors,
          primary: '#ff0000',
        },
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig).toEqual(customConfig);
      
      act(() => {
        result.current.resetTheme();
      });
      
      expect(result.current.themeConfig).toEqual(defaultThemeConfig);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'advanced-dashboard-theme',
        JSON.stringify(defaultThemeConfig)
      );
    });

    it('should handle invalid theme config gracefully', () => {
      const invalidConfig = {
        mode: 'invalid',
        colors: { primary: '#000' }, // missing required properties
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      // Should fall back to default config
      expect(result.current.themeConfig).toEqual(defaultThemeConfig);
    });

    it('should handle system theme detection correctly', () => {
      const systemConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'system',
      };
      
      // Mock system preference as dark
      Object.defineProperty(window, 'matchMedia', {
        value: createMatchMediaMock(true),
        writable: true,
      });
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(systemConfig));
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(result.current.themeConfig.mode).toBe('system');
      expect(result.current.currentTheme).toBe('dark');
    });

    it('should listen for system theme changes when mode is system', () => {
      const systemConfig: ThemeConfig = {
        ...defaultThemeConfig,
        mode: 'system',
      };
      
      const mockAddEventListener = jest.fn();
      const mockRemoveEventListener = jest.fn();
      
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockReturnValue({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: mockAddEventListener,
          removeEventListener: mockRemoveEventListener,
          dispatchEvent: jest.fn(),
        }),
        writable: true,
      });
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(systemConfig));
      
      const { unmount } = renderHook(() => useAdvancedTheme());
      
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Theme Type Safety', () => {
    it('should properly type theme mode in toggleTheme function', () => {
      const { result } = renderHook(() => useAdvancedTheme());
      
      // This test verifies that the type fixes are working
      // The toggleTheme function should properly type newMode as ThemeMode
      act(() => {
        result.current.toggleTheme();
      });
      
      // Verify that the theme mode is a valid ThemeMode value
      const validModes: ThemeMode[] = ['light', 'dark', 'system'];
      expect(validModes).toContain(result.current.themeConfig.mode);
    });

    it('should maintain type safety when applying custom themes', () => {
      const { result } = renderHook(() => useAdvancedTheme());
      
      const customTheme: ThemeConfig = {
        mode: 'dark', // This should be properly typed as ThemeMode
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
      
      act(() => {
        result.current.applyTheme(customTheme);
      });
      
      expect(result.current.themeConfig).toEqual(customTheme);
      expect(result.current.themeConfig.mode).toBe('dark');
    });
  });

  describe('Runtime Error Prevention', () => {
    it('should not throw errors when switching between themes', () => {
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(() => {
        act(() => {
          result.current.toggleTheme();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.toggleTheme();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.resetTheme();
        });
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });
      
      const { result } = renderHook(() => useAdvancedTheme());
      
      expect(() => {
        act(() => {
          result.current.toggleTheme();
        });
      }).not.toThrow();
    });

    it('should handle DOM manipulation errors gracefully', () => {
      const { result } = renderHook(() => useAdvancedTheme());
      
      // Get initial theme mode
      const initialMode = result.current.themeConfig.mode;
      
      // Mock document.documentElement to throw an error after initialization
      documentElementMock.setAttribute.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      // The theme toggle should not throw an error even if DOM manipulation fails
      expect(() => {
        act(() => {
          result.current.toggleTheme();
        });
      }).not.toThrow();
      
      // The theme config should still be updated even if DOM manipulation fails
      const expectedMode = initialMode === 'light' ? 'dark' : 'light';
      expect(result.current.themeConfig.mode).toBe(expectedMode);
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme changes across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useAdvancedTheme());
      
      act(() => {
        result.current.toggleTheme();
      });
      
      const themeAfterToggle = result.current.themeConfig.mode;
      
      rerender();
      
      expect(result.current.themeConfig.mode).toBe(themeAfterToggle);
    });

    it('should save theme config to localStorage on changes', () => {
      const { result } = renderHook(() => useAdvancedTheme());
      
      act(() => {
        result.current.toggleTheme();
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'advanced-dashboard-theme',
        expect.stringContaining('"mode":')
      );
    });
  });
});