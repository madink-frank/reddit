import React, { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../../stores/ui';

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'dashboard-theme',
}) => {
  const { mode: themeMode, setTheme: setThemeMode } = useTheme();
  
  // Resolve system theme
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  
  const resolvedTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(resolvedTheme);
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'
      );
    }
  }, [resolvedTheme]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (themeMode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Force re-render to update resolvedTheme
      setThemeMode({ mode: 'system' });
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, setThemeMode]);
  
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemeMode({ mode: theme });
    
    // Store in localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };
  
  const toggleTheme = () => {
    if (themeMode === 'light') {
      setTheme('dark');
    } else if (themeMode === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  
  // Initialize theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as 'light' | 'dark' | 'system' | null;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode({ mode: savedTheme });
      } else {
        setThemeMode({ mode: defaultTheme });
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      setThemeMode({ mode: defaultTheme });
    }
  }, [defaultTheme, setThemeMode, storageKey]);
  
  const contextValue: ThemeContextValue = {
    theme: themeMode,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Theme toggle component
export const ThemeToggle: React.FC<{
  className?: string;
  showLabel?: boolean;
}> = ({ className = '', showLabel = false }) => {
  const { theme, resolvedTheme, toggleTheme } = useThemeContext();
  
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return '';
    }
  };
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center gap-2 px-3 py-2 
        text-sm font-medium rounded-md
        bg-surface-primary hover:bg-surface-secondary
        border border-primary
        text-primary hover:text-secondary
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2
        ${className}
      `}
      title={`Current theme: ${getThemeLabel()} (${resolvedTheme}). Click to cycle themes.`}
      aria-label={`Switch theme. Current: ${getThemeLabel()}`}
    >
      {getThemeIcon()}
      {showLabel && <span>{getThemeLabel()}</span>}
    </button>
  );
};

// Theme status indicator
export const ThemeStatus: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { theme, resolvedTheme } = useThemeContext();
  
  return (
    <div className={`text-xs text-tertiary ${className}`}>
      Theme: {theme} {theme === 'system' && `(${resolvedTheme})`}
    </div>
  );
};

// Hook for theme-aware styling
export const useThemeAwareStyles = () => {
  const { resolvedTheme } = useThemeContext();
  
  const getThemeClass = (lightClass: string, darkClass: string) => {
    return resolvedTheme === 'dark' ? darkClass : lightClass;
  };
  
  const getThemeValue = <T,>(lightValue: T, darkValue: T): T => {
    return resolvedTheme === 'dark' ? darkValue : lightValue;
  };
  
  return {
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    getThemeClass,
    getThemeValue,
  };
};