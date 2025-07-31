import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Settings } from 'lucide-react';
import { useThemeContext } from '../providers/ThemeProvider';
import { useAdvancedTheme } from '../../hooks/useAdvancedDashboard';
import { ThemeConfig, themePresets } from '../../config/theme';

interface ThemeSwitchProps {
  variant?: 'compact' | 'expanded' | 'dropdown';
  showLabel?: boolean;
  showPresets?: boolean;
  className?: string;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  variant = 'compact',
  showLabel = false,
  showPresets = false,
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme } = useThemeContext();
  const { themeConfig, applyTheme } = useAdvancedTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle theme change with animation
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setIsAnimating(true);

    // Add transition class to document
    document.documentElement.classList.add('theme-transitioning');

    // Change theme
    setTheme(newTheme);

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsAnimating(false);
    }, 300);
  };

  // Handle preset theme application
  const handlePresetChange = (presetConfig: ThemeConfig) => {
    setIsAnimating(true);
    document.documentElement.classList.add('theme-transitioning');

    applyTheme(presetConfig);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsAnimating(false);
    }, 300);
  };

  // Get theme icon
  const getThemeIcon = (themeMode: string, size = 20) => {
    const iconProps = { size, className: 'transition-transform duration-200' };

    switch (themeMode) {
      case 'light':
        return <Sun {...iconProps} />;
      case 'dark':
        return <Moon {...iconProps} />;
      case 'system':
        return <Monitor {...iconProps} />;
      default:
        return <Monitor {...iconProps} />;
    }
  };

  // Get theme label
  const getThemeLabel = (themeMode: string) => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={() => {
          const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
          const currentIndex = modes.indexOf(theme);
          const nextIndex = (currentIndex + 1) % modes.length;
          handleThemeChange(modes[nextIndex]);
        }}
        disabled={isAnimating}
        className={`
          inline-flex items-center justify-center
          w-10 h-10 rounded-lg
          bg-surface-secondary hover:bg-surface-tertiary
          border border-primary
          text-secondary hover:text-primary
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isAnimating ? 'animate-pulse' : ''}
          ${className}
        `}
        title={`Current theme: ${getThemeLabel(theme)} (${resolvedTheme}). Click to cycle themes.`}
        aria-label={`Switch theme. Current: ${getThemeLabel(theme)}`}
      >
        <div className={isAnimating ? 'animate-spin' : ''}>
          {getThemeIcon(theme)}
        </div>
      </button>
    );
  }

  // Expanded variant
  if (variant === 'expanded') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-secondary">
            Theme:
          </span>
        )}
        <div className="inline-flex rounded-lg bg-surface-secondary border border-primary p-1">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleThemeChange(mode)}
              disabled={isAnimating}
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-md
                text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${theme === mode
                  ? 'bg-interactive-primary text-on-brand shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-surface-tertiary'
                }
                ${isAnimating && theme === mode ? 'animate-pulse' : ''}
              `}
              title={`Switch to ${getThemeLabel(mode)} theme`}
              aria-label={`Switch to ${getThemeLabel(mode)} theme`}
              aria-pressed={theme === mode}
            >
              <div className={isAnimating && theme === mode ? 'animate-spin' : ''}>
                {getThemeIcon(mode, 16)}
              </div>
              {showLabel && getThemeLabel(mode)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isAnimating}
          className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-lg
            bg-surface-secondary hover:bg-surface-tertiary
            border border-primary
            text-secondary hover:text-primary
            text-sm font-medium
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isAnimating ? 'animate-pulse' : ''}
          `}
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
        >
          <div className={isAnimating ? 'animate-spin' : ''}>
            {getThemeIcon(theme, 16)}
          </div>
          {showLabel && getThemeLabel(theme)}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-surface-primary border border-primary rounded-lg shadow-lg z-dropdown">
            <div className="py-1">
              {/* Theme Mode Options */}
              <div className="px-3 py-2 text-xs font-semibold text-tertiary uppercase tracking-wider border-b border-secondary">
                Theme Mode
              </div>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    handleThemeChange(mode);
                    setIsDropdownOpen(false);
                  }}
                  disabled={isAnimating}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2
                    text-sm text-left
                    hover:bg-surface-secondary
                    transition-colors duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${theme === mode ? 'bg-surface-secondary text-primary' : 'text-secondary'}
                  `}
                  role="menuitem"
                >
                  {getThemeIcon(mode, 16)}
                  <span>{getThemeLabel(mode)}</span>
                  {theme === mode && (
                    <div className="ml-auto w-2 h-2 bg-interactive-primary rounded-full" />
                  )}
                </button>
              ))}

              {/* Theme Presets */}
              {showPresets && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-tertiary uppercase tracking-wider border-t border-secondary mt-1">
                    <div className="flex items-center gap-2">
                      <Palette size={12} />
                      Presets
                    </div>
                  </div>
                  {Object.entries(themePresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => {
                        handlePresetChange(preset);
                        setIsDropdownOpen(false);
                      }}
                      disabled={isAnimating}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2
                        text-sm text-left
                        hover:bg-surface-secondary
                        transition-colors duration-150
                        disabled:opacity-50 disabled:cursor-not-allowed
                        text-secondary
                      `}
                      role="menuitem"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-primary"
                        style={{ backgroundColor: preset.colors.primary }}
                      />
                      <span className="capitalize">{key}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Backdrop */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-dropdown-backdrop"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    );
  }

  return null;
};

// Theme transition styles
export const ThemeTransitionStyles = () => (
  <style>{`
    .theme-transitioning,
    .theme-transitioning *,
    .theme-transitioning *:before,
    .theme-transitioning *:after {
      transition: background-color 300ms ease-in-out,
                  border-color 300ms ease-in-out,
                  color 300ms ease-in-out,
                  box-shadow 300ms ease-in-out !important;
      transition-delay: 0ms !important;
    }
  `}</style>
);

// Theme status indicator component
export const ThemeStatus: React.FC<{
  className?: string;
  showIcon?: boolean;
}> = ({ className = '', showIcon = true }) => {
  const { theme, resolvedTheme } = useThemeContext();
  const { themeConfig } = useAdvancedTheme();

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-tertiary ${className}`}>
      {showIcon && (
        <div className="w-3 h-3">
          {theme === 'light' && <Sun size={12} />}
          {theme === 'dark' && <Moon size={12} />}
          {theme === 'system' && <Monitor size={12} />}
        </div>
      )}
      <span>
        {theme === 'system' ? `System (${resolvedTheme})` : theme}
      </span>
      {themeConfig.colors.primary !== '#3b82f6' && (
        <div
          className="w-2 h-2 rounded-full border border-primary"
          style={{ backgroundColor: themeConfig.colors.primary }}
          title="Custom theme active"
        />
      )}
    </div>
  );
};

// Advanced theme customizer component
export const ThemeCustomizer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { themeConfig, applyTheme } = useAdvancedTheme();
  const [customConfig, setCustomConfig] = useState<ThemeConfig>(themeConfig);

  useEffect(() => {
    setCustomConfig(themeConfig);
  }, [themeConfig]);

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    setCustomConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleApplyCustomTheme = () => {
    applyTheme(customConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal bg-overlay flex items-center justify-center p-4">
      <div className="bg-surface-primary border border-primary rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-secondary">
          <h3 className="text-lg font-semibold text-primary">Theme Customizer</h3>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Color Customization */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Colors</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(customConfig.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-secondary mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)}
                      className="w-8 h-8 rounded border border-primary cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-surface-secondary border border-primary rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animation Settings */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Animations</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customConfig.animations.enabled}
                  onChange={(e) => setCustomConfig(prev => ({
                    ...prev,
                    animations: { ...prev.animations, enabled: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-secondary">Enable animations</span>
              </label>
              <div>
                <label className="block text-xs text-secondary mb-1">Duration (ms)</label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={customConfig.animations.duration}
                  onChange={(e) => setCustomConfig(prev => ({
                    ...prev,
                    animations: { ...prev.animations, duration: parseInt(e.target.value) }
                  }))}
                  className="w-full"
                />
                <span className="text-xs text-tertiary">{customConfig.animations.duration}ms</span>
              </div>
            </div>
          </div>

          {/* Effects Settings */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Effects</h4>
            <div className="space-y-2">
              {Object.entries(customConfig.effects).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setCustomConfig(prev => ({
                      ...prev,
                      effects: { ...prev.effects, [key]: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm text-secondary capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCustomTheme}
            className="px-4 py-2 bg-interactive-primary text-on-brand rounded-lg text-sm font-medium hover:bg-interactive-primary-hover transition-colors"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitch;