import React, { useEffect, useRef } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EnhancedSkeleton } from '../ui/LoadingSystem';
import { useColorAccessibility } from '../../hooks/useColorAccessibility';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  loading?: boolean;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  progress?: number; // 0-100 for progress bar
  variant?: 'default' | 'gradient' | 'colorful' | 'glass' | 'elevated';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-white',
  bgGradient = 'from-blue-500 to-blue-600',
  loading = false,
  trend,
  progress,
  variant = 'gradient',
}) => {
  const { applyAccessibilityClasses, preferences, getAccessibleColor } = useColorAccessibility();
  const cardRef = useRef<HTMLElement>(null);

  // Determine semantic type based on change or trend
  const getSemanticType = (): string => {
    if (change?.type === 'increase' || trend === 'up') return 'success';
    if (change?.type === 'decrease' || trend === 'down') return 'error';
    if (change?.type === 'neutral' || trend === 'stable') return 'neutral';
    return 'info';
  };

  const semanticType = getSemanticType();

  // Apply accessibility classes when preferences change
  useEffect(() => {
    const element = cardRef.current;
    if (element) {
      applyAccessibilityClasses(element, semanticType);
    }
  }, [applyAccessibilityClasses, semanticType, preferences]);
  // Enhanced loading state with shimmer animation
  if (loading) {
    return (
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <EnhancedSkeleton height={16} width="75%" animation="shimmer" />
              <EnhancedSkeleton height={32} width="50%" animation="shimmer" />
              <EnhancedSkeleton height={12} width="33%" animation="shimmer" />
            </div>
            <EnhancedSkeleton height={48} width={48} variant="rectangular" animation="shimmer" />
          </div>
          {progress !== undefined && (
            <div className="mt-4">
              <EnhancedSkeleton height={8} animation="shimmer" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Determine change indicator styling and icon with accessibility support
  const getChangeIndicator = () => {
    if (!change) return null;

    const changeType = change.type;
    const changeValue = Math.abs(change.value);
    
    let colorClass = '';
    let ChangeIcon = Minus;
    let prefix = '';
    let accessibleColor = '';

    switch (changeType) {
      case 'increase':
        colorClass = 'text-success';
        accessibleColor = getAccessibleColor('success');
        ChangeIcon = TrendingUp;
        prefix = '+';
        break;
      case 'decrease':
        colorClass = 'text-error';
        accessibleColor = getAccessibleColor('error');
        ChangeIcon = TrendingDown;
        prefix = '-';
        break;
      case 'neutral':
        colorClass = 'text-secondary';
        accessibleColor = getAccessibleColor('neutral');
        ChangeIcon = Minus;
        prefix = '';
        break;
    }

    return (
      <div 
        className={`ml-3 flex items-center text-sm font-medium ${colorClass} status-${changeType}`}
        style={preferences.colorblindSafe ? { color: accessibleColor } : undefined}
      >
        <ChangeIcon className="icon-xs mr-1" aria-hidden="true" />
        <span>
          {prefix}{changeValue}%
        </span>
        <span className="sr-only">
          {changeType === 'increase' ? 'Increased' : changeType === 'decrease' ? 'Decreased' : 'No change'} by {changeValue} percent
        </span>
      </div>
    );
  };

  // Format value with proper number formatting
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getCardClasses = () => {
    const baseClasses = "dashboard-card hover-lift gpu-accelerated animate-fade-in-up";
    
    switch (variant) {
      case 'glass':
        return `${baseClasses} glass`;
      case 'elevated':
        return `${baseClasses} elevated`;
      case 'gradient':
        return `${baseClasses} bg-gradient-to-br ${bgGradient}`;
      case 'colorful':
        return `${baseClasses} glow`;
      default:
        return baseClasses;
    }
  };

  const titleId = `stat-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const descriptionId = `${titleId}-description`;

  return (
    <article 
      ref={cardRef}
      className={getCardClasses()}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0" role="presentation">
            <div className={`p-3 rounded-lg bg-surface-secondary`} aria-hidden="true">
              <Icon 
                className={`icon-lg ${iconColor}`} 
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt 
                id={titleId}
                className="text-sm font-medium text-secondary truncate"
              >
                {title}
              </dt>
              <dd className="flex items-baseline mt-1">
                <div className="text-3xl font-bold text-primary" aria-label={`${title} value: ${formatValue(value)}`}>
                  {formatValue(value)}
                </div>
                {getChangeIndicator()}
              </dd>
            </dl>
            <div id={descriptionId} className="sr-only">
              {title} statistic showing {formatValue(value)}
              {change && `, ${change.type === 'increase' ? 'increased' : change.type === 'decrease' ? 'decreased' : 'unchanged'} by ${Math.abs(change.value)} percent`}
              {trend && `, trend is ${trend === 'up' ? 'increasing' : trend === 'down' ? 'decreasing' : 'stable'}`}
            </div>
          </div>
        </div>
        
        {/* Optional trend indicator */}
        {trend && (
          <div className="mt-4 pt-4 border-t border-primary">
            <div className="flex items-center text-xs text-tertiary">
              <span>Trend: </span>
              <span className={`ml-1 font-medium ${
                trend === 'up' ? 'text-success' : 
                trend === 'down' ? 'text-error' : 
                'text-secondary'
              }`}>
                {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};