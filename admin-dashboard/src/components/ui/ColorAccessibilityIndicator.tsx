import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { 
  validateColorAccessibility, 
  getColorblindSafeAlternative, 
  getVisualPattern,
  prefersHighContrast,
  type ColorAccessibilityReport 
} from '../../utils/colorAccessibility';

interface ColorAccessibilityIndicatorProps {
  foregroundColor: string;
  backgroundColor: string;
  isLargeText?: boolean;
  semanticType?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  showReport?: boolean;
  className?: string;
}

export const ColorAccessibilityIndicator: React.FC<ColorAccessibilityIndicatorProps> = ({
  foregroundColor,
  backgroundColor,
  isLargeText = false,
  semanticType = 'neutral',
  showReport = false,
  className = '',
}) => {
  const report = validateColorAccessibility(foregroundColor, backgroundColor, isLargeText);
  const safeColor = getColorblindSafeAlternative(semanticType);
  const pattern = getVisualPattern(semanticType);
  const highContrast = prefersHighContrast();

  const getStatusIcon = (report: ColorAccessibilityReport) => {
    if (report.meetsAAA) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (report.meetsAA) {
      return <Info className="w-4 h-4 text-blue-600" />;
    } else if (report.contrastRatio >= 3) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = (report: ColorAccessibilityReport) => {
    if (report.meetsAAA) {
      return 'AAA Compliant';
    } else if (report.meetsAA) {
      return 'AA Compliant';
    } else if (report.contrastRatio >= 3) {
      return 'Needs Improvement';
    } else {
      return 'Not Accessible';
    }
  };

  const getStatusColor = (report: ColorAccessibilityReport) => {
    if (report.meetsAAA) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (report.meetsAA) {
      return 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (report.contrastRatio >= 3) {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`color-accessibility-indicator ${className}`}>
      {/* Quick Status Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(report)}`}>
        {getStatusIcon(report)}
        <span>{getStatusText(report)}</span>
        <span className="text-xs opacity-75">
          {report.contrastRatio.toFixed(1)}:1
        </span>
      </div>

      {/* Detailed Report */}
      {showReport && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-3">Accessibility Report</h4>
          
          {/* Color Samples */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Original Colors</h5>
              <div 
                className="p-3 rounded border"
                style={{ 
                  backgroundColor: backgroundColor,
                  color: foregroundColor,
                  border: `2px solid ${foregroundColor}20`
                }}
              >
                Sample Text
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Colorblind-Safe Alternative</h5>
              <div 
                className={`p-3 rounded border pattern-${pattern.pattern}`}
                style={{ 
                  backgroundColor: backgroundColor,
                  color: safeColor,
                  border: `2px solid ${safeColor}20`
                }}
              >
                <span className="flex items-center gap-2">
                  Sample Text
                  <span className="text-xs">({pattern.icon})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contrast Ratios */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">Current Ratio</div>
              <div className="text-lg font-bold">{report.contrastRatio.toFixed(2)}:1</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">AA Required</div>
              <div className={`text-lg font-bold ${report.meetsAA ? 'text-green-600' : 'text-red-600'}`}>
                {isLargeText ? '3.0' : '4.5'}:1
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">AAA Required</div>
              <div className={`text-lg font-bold ${report.meetsAAA ? 'text-green-600' : 'text-red-600'}`}>
                {isLargeText ? '4.5' : '7.0'}:1
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Recommendations</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* High Contrast Mode Notice */}
          {highContrast && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 text-blue-800">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">
                  High contrast mode detected - enhanced accessibility features active
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorAccessibilityIndicator;