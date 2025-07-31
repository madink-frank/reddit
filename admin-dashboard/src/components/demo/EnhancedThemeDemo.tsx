import React, { useState } from 'react';
import { Sun, Moon, Monitor, Palette, Settings, Eye, Zap, Sparkles } from 'lucide-react';
import { useEnhancedTheme, useThemeAwareStyles } from '../../hooks/useEnhancedTheme';
import { ThemeSwitch, ThemeStatus, ThemeCustomizer } from '../ui/ThemeSwitch';
import { themePresets } from '../../config/theme';

export const EnhancedThemeDemo: React.FC = () => {
  const theme = useEnhancedTheme();
  const styles = useThemeAwareStyles();
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">Enhanced Theme System</h1>
        <p className="text-secondary max-w-2xl mx-auto">
          Experience our comprehensive dark mode implementation with smooth transitions, 
          accessibility features, and customizable presets.
        </p>
      </div>

      {/* Current Theme Status */}
      <div className={`${styles.cardStyles} p-6 rounded-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">Current Theme Status</h2>
          <ThemeStatus showIcon={true} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-secondary">Theme Mode</div>
            <div className="flex items-center gap-2">
              {theme.theme === 'light' && <Sun size={16} className="text-yellow-500" />}
              {theme.theme === 'dark' && <Moon size={16} className="text-blue-400" />}
              {theme.theme === 'system' && <Monitor size={16} className="text-gray-500" />}
              <span className="font-medium text-primary capitalize">{theme.theme}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-secondary">Resolved Theme</div>
            <div className="flex items-center gap-2">
              {theme.resolvedTheme === 'light' ? (
                <Sun size={16} className="text-yellow-500" />
              ) : (
                <Moon size={16} className="text-blue-400" />
              )}
              <span className="font-medium text-primary capitalize">{theme.resolvedTheme}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-secondary">Custom Theme</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${theme.customThemeActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="font-medium text-primary">
                {theme.customThemeActive ? 'Active' : 'Default'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Controls */}
      <div className={`${styles.cardStyles} p-6 rounded-lg`}>
        <h2 className="text-xl font-semibold text-primary mb-4">Theme Controls</h2>
        
        <div className="space-y-6">
          {/* Basic Theme Switching */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Basic Theme Switching</h3>
            <div className="flex flex-wrap gap-4">
              <ThemeSwitch variant="compact" />
              <ThemeSwitch variant="expanded" showLabel={true} />
              <ThemeSwitch variant="dropdown" showLabel={true} />
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Theme Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(themePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => theme.applyPreset(key as keyof typeof themePresets)}
                  disabled={theme.isTransitioning}
                  className={`
                    p-3 rounded-lg border transition-all duration-200
                    ${styles.cardStyles} ${styles.hoverStyles}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${theme.isTransitioning ? 'animate-pulse' : ''}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border border-primary"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span className="font-medium text-primary capitalize">{key}</span>
                  </div>
                  <div className="text-xs text-secondary">
                    {preset.mode} theme
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Features */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Accessibility Features</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={theme.enableHighContrast}
                disabled={theme.isTransitioning}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-interactive-secondary hover:bg-interactive-secondary-hover
                  text-secondary hover:text-primary
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Eye size={16} />
                High Contrast
              </button>
              
              <button
                onClick={theme.disableAnimations}
                disabled={theme.isTransitioning}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-interactive-secondary hover:bg-interactive-secondary-hover
                  text-secondary hover:text-primary
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Zap size={16} />
                Disable Animations
              </button>
              
              <button
                onClick={theme.applyAccessibilityPreferences}
                disabled={theme.isTransitioning}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-interactive-secondary hover:bg-interactive-secondary-hover
                  text-secondary hover:text-primary
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Settings size={16} />
                Auto Accessibility
              </button>
            </div>
          </div>

          {/* Advanced Controls */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Advanced Controls</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCustomizer(true)}
                disabled={theme.isTransitioning}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-interactive-primary hover:bg-interactive-primary-hover
                  text-on-brand
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Palette size={16} />
                Custom Theme Editor
              </button>
              
              <button
                onClick={theme.resetTheme}
                disabled={theme.isTransitioning}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-interactive-secondary hover:bg-interactive-secondary-hover
                  text-secondary hover:text-primary
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Sparkles size={16} />
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Showcase */}
      <div className={`${styles.cardStyles} p-6 rounded-lg`}>
        <h2 className="text-xl font-semibold text-primary mb-4">Theme Showcase</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Example */}
          <div className="card-enhanced p-4 rounded-lg">
            <h3 className="font-semibold text-primary mb-2">Enhanced Card</h3>
            <p className="text-secondary text-sm mb-3">
              This card uses the enhanced theme system with hover effects and transitions.
            </p>
            <button className="btn-primary-enhanced px-3 py-1 rounded text-sm">
              Action Button
            </button>
          </div>

          {/* Status Indicators */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Status Indicators</h3>
            <div className="space-y-2">
              <div className="status-indicator success">Success Status</div>
              <div className="status-indicator warning">Warning Status</div>
              <div className="status-indicator error">Error Status</div>
              <div className="status-indicator info">Info Status</div>
            </div>
          </div>

          {/* Form Elements */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Form Elements</h3>
            <input
              type="text"
              placeholder="Enhanced input field"
              className="form-input-enhanced w-full"
            />
            <select className="form-input-enhanced w-full">
              <option>Select option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Theme Information */}
      <div className={`${styles.cardStyles} p-6 rounded-lg`}>
        <h2 className="text-xl font-semibold text-primary mb-4">Theme Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-primary mb-2">Features</h3>
            <ul className="space-y-1 text-sm text-secondary">
              <li>• Smooth theme transitions with CSS animations</li>
              <li>• System theme detection and auto-switching</li>
              <li>• Comprehensive dark mode color palette</li>
              <li>• Accessibility-first design approach</li>
              <li>• Customizable theme presets</li>
              <li>• High contrast mode support</li>
              <li>• Reduced motion preferences</li>
              <li>• Local storage persistence</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-primary mb-2">Technical Details</h3>
            <ul className="space-y-1 text-sm text-secondary">
              <li>• CSS custom properties for theming</li>
              <li>• React Context for state management</li>
              <li>• TypeScript for type safety</li>
              <li>• Zustand for persistent storage</li>
              <li>• Media queries for system detection</li>
              <li>• WCAG 2.1 AA compliance</li>
              <li>• Performance optimized transitions</li>
              <li>• Mobile-first responsive design</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Transition Status */}
      {theme.isTransitioning && (
        <div className="fixed bottom-4 right-4 bg-surface-primary border border-primary rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Applying theme changes...
          </div>
        </div>
      )}

      {/* Theme Customizer Modal */}
      <ThemeCustomizer
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
      />
    </div>
  );
};

export default EnhancedThemeDemo;