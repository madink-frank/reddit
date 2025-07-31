import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { ICON_SIZES } from '@/constants/design-tokens';

export type SystemStatusType = 'healthy' | 'warning' | 'critical' | 'unknown' | 'loading';

interface SystemStatusIndicatorProps {
  status: SystemStatusType;
  name: string;
  details?: string;
  lastChecked?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface StatusConfig {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
  description: string;
}

const STATUS_CONFIG: Record<SystemStatusType, StatusConfig> = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    label: 'Healthy',
    description: 'System is operating normally'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    label: 'Warning',
    description: 'System has minor issues that need attention'
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    label: 'Critical',
    description: 'System has critical issues requiring immediate attention'
  },
  unknown: {
    icon: XCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    label: 'Unknown',
    description: 'System status cannot be determined'
  },
  loading: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    label: 'Checking',
    description: 'System status is being checked'
  }
};

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  status,
  name,
  details,
  lastChecked,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const config = STATUS_CONFIG[status];
  const IconComponent = config.icon;
  
  // Get standardized icon size based on component size
  const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'md' : 'base';
  const iconClass = ICON_SIZES[iconSize];

  // Format last checked time
  const formatLastChecked = (timestamp?: string) => {
    if (!timestamp) return null;
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch {
      return null;
    }
  };

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{name}</div>
      <div className="text-xs opacity-90">{config.description}</div>
      {details && (
        <div className="text-xs opacity-75 border-t border-gray-600 pt-1 mt-1">
          {details}
        </div>
      )}
      {lastChecked && (
        <div className="text-xs opacity-60">
          Last checked: {formatLastChecked(lastChecked)}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex items-center ${className}`}>
      <Tooltip content={tooltipContent} position="top">
        <div className="flex items-center space-x-2">
          <div className={`
            flex items-center justify-center rounded-full p-1
            ${config.bgColor} transition-colors duration-200
            ${size === 'sm' ? 'p-0.5' : size === 'lg' ? 'p-1.5' : 'p-1'}
          `}>
            <IconComponent 
              className={`
                ${iconClass} ${config.color} 
                ${status === 'loading' ? 'animate-spin' : ''}
                transition-colors duration-200
              `}
            />
          </div>
          
          {showLabel && (
            <div className="flex flex-col">
              <span className={`
                text-sm font-medium ${config.textColor}
                ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
              `}>
                {config.label}
              </span>
              {details && size !== 'sm' && (
                <span className="text-xs text-gray-500 truncate max-w-32">
                  {details}
                </span>
              )}
            </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

// Utility function to determine status from string values
export const getSystemStatus = (statusValue: string | undefined): SystemStatusType => {
  if (!statusValue) return 'unknown';
  
  const normalizedStatus = statusValue.toLowerCase();
  
  switch (normalizedStatus) {
    case 'healthy':
    case 'ok':
    case 'online':
    case 'active':
    case 'running':
      return 'healthy';
    case 'warning':
    case 'degraded':
    case 'slow':
      return 'warning';
    case 'critical':
    case 'error':
    case 'failed':
    case 'offline':
    case 'down':
      return 'critical';
    case 'loading':
    case 'checking':
    case 'pending':
      return 'loading';
    default:
      return 'unknown';
  }
};

// Status badge component for compact display
export const SystemStatusBadge: React.FC<{
  status: SystemStatusType;
  className?: string;
}> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      ${config.bgColor} ${config.textColor} ${className}
    `}>
      <config.icon className="icon-xs mr-1" />
      {config.label}
    </span>
  );
};