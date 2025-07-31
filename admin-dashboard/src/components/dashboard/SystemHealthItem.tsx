import React from 'react';
import { SystemStatusIndicator, getSystemStatus, SystemStatusType } from '@/components/ui/SystemStatusIndicator';

interface SystemHealthItemProps {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | string;
  details?: string;
  lastChecked?: string;
  metrics?: {
    latency?: number;
    uptime?: number;
    usage?: number;
    [key: string]: any;
  };
  className?: string;
}

export const SystemHealthItem: React.FC<SystemHealthItemProps> = ({
  name,
  status,
  details,
  lastChecked,
  metrics,
  className = ''
}) => {
  // Convert string status to standardized SystemStatusType
  const systemStatus: SystemStatusType = getSystemStatus(status);
  
  // Format metrics for display
  const formatMetrics = () => {
    if (!metrics) return details;
    
    const metricStrings: string[] = [];
    
    if (metrics.latency !== undefined) {
      metricStrings.push(`${metrics.latency}ms latency`);
    }
    
    if (metrics.uptime !== undefined) {
      metricStrings.push(`${metrics.uptime}% uptime`);
    }
    
    if (metrics.usage !== undefined) {
      metricStrings.push(`${metrics.usage}% usage`);
    }
    
    // Add any other custom metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (!['latency', 'uptime', 'usage'].includes(key) && value !== undefined) {
        metricStrings.push(`${key}: ${value}`);
      }
    });
    
    return metricStrings.length > 0 ? metricStrings.join(' • ') : details;
  };

  const formattedDetails = formatMetrics();

  return (
    <div className={`
      flex items-center justify-between py-3 px-4 rounded-lg
      hover:bg-gray-50 transition-colors duration-200
      border border-transparent hover:border-gray-200
      ${className}
    `}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <SystemStatusIndicator
          status={systemStatus}
          name={name}
          details={formattedDetails}
          lastChecked={lastChecked}
          showLabel={false}
          size="md"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 truncate">
              {name}
            </span>
            <SystemStatusIndicator
              status={systemStatus}
              name={name}
              details={formattedDetails}
              lastChecked={lastChecked}
              showLabel={true}
              size="sm"
              className="ml-2"
            />
          </div>
          
          {formattedDetails && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {formattedDetails}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact version for smaller spaces
export const SystemHealthItemCompact: React.FC<SystemHealthItemProps> = ({
  name,
  status,
  details,
  lastChecked,
  metrics,
  className = ''
}) => {
  const systemStatus: SystemStatusType = getSystemStatus(status);
  const formattedDetails = metrics ? 
    Object.entries(metrics).map(([key, value]) => `${key}: ${value}`).join(', ') : 
    details;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <SystemStatusIndicator
          status={systemStatus}
          name={name}
          details={formattedDetails}
          lastChecked={lastChecked}
          showLabel={false}
          size="sm"
        />
        <span className="text-sm text-gray-900">{name}</span>
      </div>
      
      <div className="text-right">
        <SystemStatusIndicator
          status={systemStatus}
          name={name}
          details={formattedDetails}
          lastChecked={lastChecked}
          showLabel={true}
          size="sm"
        />
      </div>
    </div>
  );
};