// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useEnhancedTheme, useThemeAwareStyles } from '../hooks/useEnhancedTheme';
import { ThemeSwitch, ThemeStatus } from '../components/ui/ThemeSwitch';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { themePresets } from '../config/theme';

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
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    contains: jest.fn(),
  },
  style: {
    setProperty: jest.fn(),
  },
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme="light">
    {children}
  </ThemeProvider>
);

describe('Enhanced Theme System', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
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

  describe('useEnhancedTheme Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
      expect(result.current.isLight).toBe(true);
      expect(result.current.isSystemTheme).toBe(false);
      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.systemThemeSupported).toBe(true);
    });

    it('should toggle theme correctly', async () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      expect(result.current.theme).toBe('light');
      
      act(() => {
        result.current.toggleTheme();
      });
      
      // Should transition to dark
      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });

    it('should apply theme presets correctly', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.applyPreset('midnight');
      });
      
      expect(result.current.customThemeActive).toBe(true);
      expect(result.current.themeConfig.colors.primary).toBe(themePresets.midnight.colors.primary);
    });

    it('should handle accessibility preferences', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.enableHighContrast();
      });
      
      expect(result.current.customThemeActive).toBe(true);
      
      act(() => {
        result.current.disableAnimations();
      });
      
      expect(result.current.themeConfig.animations.enabled).toBe(false);
    });

    it('should provide theme utility functions', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      const lightClass = result.current.getThemeClass('light-class', 'dark-class');
      expect(lightClass).toBe('light-class');
      
      const lightValue = result.current.getThemeValue('light-value', 'dark-value');
      expect(lightValue).toBe('light-value');
      
      // Switch to dark theme
      act(() => {
        result.current.setTheme('dark');
      });
      
      const darkClass = result.current.getThemeClass('light-class', 'dark-class');
      expect(darkClass).toBe('dark-class');
      
      const darkValue = result.current.getThemeValue('light-value', 'dark-value');
      expect(darkValue).toBe('dark-value');
    });

    it('should reset theme to default', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      // Apply a custom preset first
      act(() => {
        result.current.applyPreset('ocean');
      });
      
      expect(result.current.customThemeActive).toBe(true);
      
      // Reset to default
      act(() => {
        result.current.resetTheme();
      });
      
      expect(result.current.customThemeActive).toBe(false);
    });

    it('should handle system theme detection', () => {
      // Mock system preference as dark
      Object.defineProperty(window, 'matchMedia', {
        value: createMatchMediaMock(true),
        writable: true,
      });
      
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.setTheme('system');
      });
      
      expect(result.current.theme).toBe('system');
      expect(result.current.isSystemTheme).toBe(true);
      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('useThemeAwareStyles Hook', () => {
    it('should provide theme-aware style classes', () => {
      const { result } = renderHook(() => useThemeAwareStyles(), {
        wrapper: TestWrapper,
      });
      
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
      expect(result.current.isLight).toBe(true);
      expect(result.current.cardStyles).toContain('bg-white');
      expect(result.current.textStyles).toContain('text-gray-900');
    });

    it('should update styles when theme changes', () => {
      const TestComponent = () => {
        const theme = useEnhancedTheme();
        const styles = useThemeAwareStyles();
        
        return (
          <div>
            <div data-testid="card" className={styles.cardStyles}>Card</div>
            <button onClick={() => theme.setTheme('dark')}>Toggle Dark</button>
          </div>
        );
      };
      
      render(<TestComponent />, { wrapper: TestWrapper });
      
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-white');
      
      fireEvent.click(screen.getByText('Toggle Dark'));
      
      // After theme change, styles should update
      expect(card.className).toContain('bg-gray-800');
    });
  });

  describe('ThemeSwitch Component', () => {
    it('should render compact variant correctly', () => {
      render(
        <ThemeSwitch variant="compact" />,
        { wrapper: TestWrapper }
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch theme'));
    });

    it('should render expanded variant correctly', () => {
      render(
        <ThemeSwitch variant="expanded" showLabel={true} />,
        { wrapper: TestWrapper }
      );
      
      const lightButton = screen.getByRole('button', { name: /light/i });
      const darkButton = screen.getByRole('button', { name: /dark/i });
      const systemButton = screen.getByRole('button', { name: /system/i });
      
      expect(lightButton).toBeInTheDocument();
      expect(darkButton).toBeInTheDocument();
      expect(systemButton).toBeInTheDocument();
    });

    it('should render dropdown variant correctly', () => {
      render(
        <ThemeSwitch variant="dropdown" showLabel={true} />,
        { wrapper: TestWrapper }
      );
      
      const dropdownButton = screen.getByRole('button');
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(dropdownButton);
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should handle theme switching', () => {
      const TestComponent = () => {
        const theme = useEnhancedTheme();
        return (
          <div>
            <div data-testid="current-theme">{theme.theme}</div>
            <ThemeSwitch variant="compact" />
          </div>
        );
      };
      
      render(<TestComponent />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  describe('ThemeStatus Component', () => {
    it('should display current theme status', () => {
      render(
        <ThemeStatus showIcon={true} />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('light')).toBeInTheDocument();
    });

    it('should show system theme resolution', () => {
      const TestComponent = () => {
        const theme = useEnhancedTheme();
        
        React.useEffect(() => {
          theme.setTheme('system');
        }, [theme]);
        
        return <ThemeStatus showIcon={true} />;
      };
      
      render(<TestComponent />, { wrapper: TestWrapper });
      
      expect(screen.getByText(/system/i)).toBeInTheDocument();
    });
  });

  describe('Theme Transitions', () => {
    it('should add transition classes during theme change', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('theme-transitioning');
    });

    it('should remove transition classes after animation', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.isTransitioning).toBe(true);
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(documentElementMock.classList.remove).toHaveBeenCalledWith('theme-transitioning');
      expect(result.current.isTransitioning).toBe(false);
      
      jest.useRealTimers();
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference to localStorage', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashboard-theme',
        'dark'
      );
    });

    it('should save theme config to localStorage', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.applyPreset('midnight');
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'advanced-dashboard-theme',
        expect.stringContaining('"colors"')
      );
    });
  });

  describe('Accessibility Features', () => {
    it('should apply high contrast theme', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.enableHighContrast();
      });
      
      expect(result.current.customThemeActive).toBe(true);
      // High contrast should use black/white colors
      expect(result.current.themeConfig.colors.primary).toBe('#000000');
    });

    it('should disable animations for accessibility', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.disableAnimations();
      });
      
      expect(result.current.themeConfig.animations.enabled).toBe(false);
      expect(result.current.themeConfig.animations.duration).toBe(0);
    });

    it('should apply accessibility preferences automatically', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
        writable: true,
      });
      
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      act(() => {
        result.current.applyAccessibilityPreferences();
      });
      
      expect(result.current.themeConfig.animations.enabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });
      
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      expect(() => {
        act(() => {
          result.current.setTheme('dark');
        });
      }).not.toThrow();
    });

    it('should handle invalid theme config gracefully', () => {
      const { result } = renderHook(() => useEnhancedTheme(), {
        wrapper: TestWrapper,
      });
      
      expect(() => {
        act(() => {
          result.current.applyTheme({} as any);
        });
      }).not.toThrow();
    });
  });
});