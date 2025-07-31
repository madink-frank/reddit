import React, { useState } from 'react';
import { 
  Eye, 
  Palette, 
  Sun, 
  Moon, 
  Settings,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { useColorAccessibility } from '../../hooks/useColorAccessibility';
import ColorAccessibilityIndicator from './ColorAccessibilityIndicator';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const {
    preferences,
    updatePreference,
    isAccessibilityModeActive,
  } = useColorAccessibility();

  const [activeTab, setActiveTab] = useState<'preferences' | 'testing' | 'info'>('preferences');

  if (!isOpen) return null;

  const colorTests = [
    {
      name: 'Primary Button',
      foreground: '#FFFFFF',
      background: '#3B82F6',
      semanticType: 'info' as const,
    },
    {
      name: 'Success Message',
      foreground: '#065F46',
      background: '#D1FAE5',
      semanticType: 'success' as const,
    },
    {
      name: 'Warning Alert',
      foreground: '#92400E',
      background: '#FEF3C7',
      semanticType: 'warning' as const,
    },
    {
      name: 'Error Message',
      foreground: '#991B1B',
      background: '#FEE2E2',
      semanticType: 'error' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Accessibility Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close accessibility panel"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Status Indicator */}
        {isAccessibilityModeActive && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Accessibility features active
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'preferences', label: 'Settings', icon: Settings },
            { id: 'testing', label: 'Color Test', icon: Palette },
            { id: 'info', label: 'Info', icon: Info },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Color Scheme */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Color Scheme</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updatePreference('colorScheme', 'light')}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      preferences.colorScheme === 'light'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => updatePreference('colorScheme', 'dark')}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      preferences.colorScheme === 'dark'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Contrast</h3>
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:border-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.highContrast}
                    onChange={(e) => updatePreference('highContrast', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">High Contrast</div>
                    <div className="text-xs text-gray-600">
                      Increases contrast ratios for better visibility
                    </div>
                  </div>
                </label>
              </div>

              {/* Colorblind Support */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Color Vision</h3>
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:border-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.colorblindSafe}
                    onChange={(e) => updatePreference('colorblindSafe', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Colorblind-Safe Colors</div>
                    <div className="text-xs text-gray-600">
                      Uses patterns and alternative colors for better distinction
                    </div>
                  </div>
                </label>
              </div>

              {/* Enhanced Focus */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Focus</h3>
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:border-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.enhancedFocus}
                    onChange={(e) => updatePreference('enhancedFocus', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Enhanced Focus Indicators</div>
                    <div className="text-xs text-gray-600">
                      More prominent focus outlines for keyboard navigation
                    </div>
                  </div>
                </label>
              </div>

              {/* Reduced Motion */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Motion</h3>
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:border-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.reducedMotion}
                    onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Reduce Motion</div>
                    <div className="text-xs text-gray-600">
                      Minimizes animations and transitions
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Test color combinations for accessibility compliance
              </div>
              
              {colorTests.map((test, index) => (
                <div key={index} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                  <ColorAccessibilityIndicator
                    foregroundColor={test.foreground}
                    backgroundColor={test.background}
                    semanticType={test.semanticType}
                    showReport={false}
                  />
                  
                  {/* Color preview */}
                  <div 
                    className="p-3 rounded border text-sm"
                    style={{
                      backgroundColor: test.background,
                      color: test.foreground,
                    }}
                  >
                    Sample text with these colors
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">About Accessibility Features</h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <strong className="text-gray-900">High Contrast:</strong> Increases the contrast ratio between text and background colors to meet WCAG AA/AAA standards.
                  </div>
                  
                  <div>
                    <strong className="text-gray-900">Colorblind-Safe Colors:</strong> Uses a scientifically-tested color palette that works for all types of color vision deficiency.
                  </div>
                  
                  <div>
                    <strong className="text-gray-900">Enhanced Focus:</strong> Provides more visible focus indicators for keyboard navigation users.
                  </div>
                  
                  <div>
                    <strong className="text-gray-900">Reduced Motion:</strong> Respects the user's preference for minimal animations and transitions.
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <strong>WCAG Compliance:</strong> These features help ensure the interface meets Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="text-xs text-gray-500 text-center">
            Settings are automatically saved and applied system-wide
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;