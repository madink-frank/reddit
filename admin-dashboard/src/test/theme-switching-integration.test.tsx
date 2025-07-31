// Integration test for theme switching in component context
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useAdvancedTheme } from '../hooks/useAdvancedDashboard';

// Test component that uses the theme hook
const ThemeTestComponent: React.FC = () => {
  const { themeConfig, toggleTheme, currentTheme } = useAdvancedTheme();

  return (
    <div data-testid="theme-container" data-theme={currentTheme}>
      <div data-testid="current-theme">{currentTheme}</div>
      <div data-testid="theme-mode">{themeConfig.mode}</div>
      <div data-testid="primary-color">{themeConfig.colors.primary}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

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

describe('Theme Switching Integration', () => {
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

  it('should render with default theme and allow toggling', () => {
    render(<ThemeTestComponent />);
    
    // Check initial state (system mode with light preference)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('system');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#3b82f6');
    
    // Toggle theme (system -> light)
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    // Check that theme changed to light (since system was showing light, toggle goes to light mode)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    
    // Toggle again (light -> dark)
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    // Check that theme changed to dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('should handle system theme preference correctly', () => {
    // Mock system preference as dark
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMediaMock(true),
      writable: true,
    });
    
    render(<ThemeTestComponent />);
    
    // Check initial state (system mode with dark preference)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('system');
  });

  it('should persist theme changes', () => {
    render(<ThemeTestComponent />);
    
    // Toggle theme (system -> light)
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    // Verify localStorage was called to save the theme
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'advanced-dashboard-theme',
      expect.stringContaining('"mode":"light"')
    );
  });

  it('should load saved theme from localStorage', () => {
    const savedTheme = {
      mode: 'dark',
      colors: {
        primary: '#ff0000',
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
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTheme));
    
    render(<ThemeTestComponent />);
    
    // Check that saved theme is loaded
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');
  });

  it('should handle invalid saved theme gracefully', () => {
    const invalidTheme = {
      mode: 'invalid',
      colors: { primary: '#000' }, // missing required properties
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidTheme));
    
    render(<ThemeTestComponent />);
    
    // Should fall back to default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('system');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#3b82f6');
  });

  it('should not crash when DOM manipulation fails', () => {
    // Mock DOM methods to throw errors
    documentElementMock.setAttribute.mockImplementation(() => {
      throw new Error('DOM error');
    });
    
    expect(() => {
      render(<ThemeTestComponent />);
    }).not.toThrow();
    
    expect(() => {
      fireEvent.click(screen.getByTestId('toggle-theme'));
    }).not.toThrow();
  });

  it('should not crash when localStorage fails', () => {
    // Mock localStorage to throw errors
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage is full');
    });
    
    expect(() => {
      render(<ThemeTestComponent />);
    }).not.toThrow();
    
    expect(() => {
      fireEvent.click(screen.getByTestId('toggle-theme'));
    }).not.toThrow();
  });
});