import React, { useState } from 'react';
import { 
  Eye, 
  Palette, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Settings,
  Monitor
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StatCard } from '../dashboard/StatCard';
import ColorAccessibilityIndicator from '../ui/ColorAccessibilityIndicator';
import AccessibilityPanel from '../ui/AccessibilityPanel';
import { useColorAccessibility } from '../../hooks/useColorAccessibility';

export const ColorAccessibilityDemo: React.FC = () => {
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const { preferences, isAccessibilityModeActive } = useColorAccessibility();

  const statusExamples = [
    {
      type: 'success' as const,
      title: 'Success Status',
      message: 'Operation completed successfully',
      icon: CheckCircle,
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      type: 'warning' as const,
      title: 'Warning Status',
      message: 'Please review this information',
      icon: AlertTriangle,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      type: 'error' as const,
      title: 'Error Status',
      message: 'An error occurred during processing',
      icon: XCircle,
      color: '#EF4444',
      bgColor: '#FEE2E2',
    },
    {
      type: 'info' as const,
      title: 'Information',
      message: 'Additional details available',
      icon: Info,
      color: '#3B82F6',
      bgColor: '#DBEAFE',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Color Accessibility Demo</h1>
          <p className="text-gray-600 mt-1">
            Demonstrating colorblind-safe colors, high contrast support, and visual patterns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAccessibilityModeActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <Eye className="w-4 h-4" />
              Accessibility Active
            </div>
          )}
          
          <Button
            variant="outline"
            icon={Settings}
            onClick={() => setShowAccessibilityPanel(true)}
          >
            Accessibility Settings
          </Button>
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Settings</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${preferences.highContrast ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>High Contrast: {preferences.highContrast ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${preferences.colorblindSafe ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>Colorblind Safe: {preferences.colorblindSafe ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${preferences.enhancedFocus ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>Enhanced Focus: {preferences.enhancedFocus ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${preferences.reducedMotion ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>Reduced Motion: {preferences.reducedMotion ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      {/* Status Messages Demo */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Status Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusExamples.map((status) => (
            <div key={status.type} className="space-y-3">
              <div 
                className={`p-4 rounded-lg border-l-4 status-${status.type}`}
                style={{
                  backgroundColor: status.bgColor,
                  borderLeftColor: status.color,
                }}
              >
                <div className="flex items-start gap-3">
                  <status.icon 
                    className="w-5 h-5 mt-0.5 flex-shrink-0" 
                    style={{ color: status.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{status.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{status.message}</p>
                  </div>
                </div>
              </div>
              
              <ColorAccessibilityIndicator
                foregroundColor={status.color}
                backgroundColor={status.bgColor}
                semanticType={status.type}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Button Variants Demo */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Interactive Elements</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" semanticType="info">
            Primary Action
          </Button>
          <Button variant="success" semanticType="success" icon={CheckCircle}>
            Success Action
          </Button>
          <Button variant="warning" semanticType="warning" icon={AlertTriangle}>
            Warning Action
          </Button>
          <Button variant="destructive" semanticType="error" icon={XCircle}>
            Destructive Action
          </Button>
          <Button variant="outline" semanticType="neutral">
            Secondary Action
          </Button>
        </div>
      </div>

      {/* Stat Cards Demo */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Data Visualization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={12345}
            change={{ value: 12, type: 'increase' }}
            icon={Monitor}
            trend="up"
          />
          <StatCard
            title="Revenue"
            value="$45,678"
            change={{ value: 8, type: 'decrease' }}
            icon={Palette}
            trend="down"
          />
          <StatCard
            title="Active Sessions"
            value={987}
            change={{ value: 0, type: 'neutral' }}
            icon={Eye}
            trend="stable"
          />
          <StatCard
            title="Conversion Rate"
            value="3.2%"
            change={{ value: 15, type: 'increase' }}
            icon={CheckCircle}
            trend="up"
          />
        </div>
      </div>

      {/* Color Contrast Testing */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Color Contrast Testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statusExamples.map((status) => (
            <ColorAccessibilityIndicator
              key={`test-${status.type}`}
              foregroundColor={status.color}
              backgroundColor={status.bgColor}
              semanticType={status.type}
              showReport={true}
            />
          ))}
        </div>
      </div>

      {/* Pattern Examples for Colorblind Users */}
      {preferences.colorblindSafe && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Visual Patterns (Colorblind-Safe Mode)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['checkered', 'diagonal-stripes', 'dots', 'horizontal-lines'].map((pattern) => (
              <div key={pattern} className="text-center">
                <div 
                  className={`w-16 h-16 mx-auto mb-2 pattern-${pattern} opacity-20`}
                  style={{ color: '#3B82F6' }}
                />
                <p className="text-sm text-gray-600 capitalize">
                  {pattern.replace('-', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">How to test accessibility features:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click "Accessibility Settings" to toggle different modes</li>
              <li>Enable "High Contrast" to see enhanced contrast ratios</li>
              <li>Enable "Colorblind Safe" to see alternative colors and patterns</li>
              <li>Enable "Enhanced Focus" and use Tab key to see improved focus indicators</li>
              <li>Check the color contrast reports below each status message</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={showAccessibilityPanel}
        onClose={() => setShowAccessibilityPanel(false)}
      />
    </div>
  );
};

export default ColorAccessibilityDemo;