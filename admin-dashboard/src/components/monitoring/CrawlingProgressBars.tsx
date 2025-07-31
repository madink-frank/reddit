/**
 * Crawling Progress Bars Component
 * 
 * Displays real-time progress bars and status indicators for active crawling jobs.
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { CrawlingJob } from '../../hooks/useCrawlingMonitoring';

interface CrawlingProgressBarsProps {
  jobs: CrawlingJob[];
  onCancelJob: (jobId: number) => Promise<void>;
  onRetryJob: (jobId: number) => Promise<void>;
  isLoading?: boolean;
}

interface ProgressBarProps {
  job: CrawlingJob;
  onCancel: () => void;
  onRetry: () => void;
}

const StatusIcon: React.FC<{ status: CrawlingJob['status'] }> = ({ status }) => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (status) {
    case 'running':
      return <Play {...iconProps} className="w-4 h-4 text-green-400 animate-pulse" />;
    case 'queued':
      return <Clock {...iconProps} className="w-4 h-4 text-blue-400" />;
    case 'completed':
      return <CheckCircle {...iconProps} className="w-4 h-4 text-green-400" />;
    case 'failed':
      return <XCircle {...iconProps} className="w-4 h-4 text-red-400" />;
    case 'cancelled':
      return <Square {...iconProps} className="w-4 h-4 text-gray-400" />;
    case 'retrying':
      return <RotateCcw {...iconProps} className="w-4 h-4 text-orange-400 animate-spin" />;
    default:
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-400" />;
  }
};

const PriorityBadge: React.FC<{ priority: CrawlingJob['priority'] }> = ({ priority }) => {
  const badgeClasses = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${badgeClasses[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
};

const ProgressBar: React.FC<ProgressBarProps> = ({ job, onCancel, onRetry }) => {
  const { progress, status, name, job_type, created_at, started_at, metrics, retry_count } = job;
  
  const formatDuration = (startTime: string): string => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatSpeed = (speed?: number): string => {
    if (!speed) return '0/s';
    if (speed < 1) return `${(speed * 60).toFixed(1)}/min`;
    return `${speed.toFixed(1)}/s`;
  };

  const getProgressColor = (percentage: number, status: string): string => {
    if (status === 'failed') return 'bg-red-500';
    if (status === 'completed') return 'bg-green-500';
    if (percentage < 30) return 'bg-blue-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const canCancel = ['queued', 'running', 'retrying'].includes(status);
  const canRetry = status === 'failed';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusIcon status={status} />
          <div>
            <h3 className="font-medium text-white">{name}</h3>
            <p className="text-sm text-gray-400">{job_type.replace('_', ' ')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <PriorityBadge priority={job.priority} />
          
          {/* Action Buttons */}
          <div className="flex space-x-1">
            {canCancel && (
              <button
                onClick={onCancel}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                title="Cancel Job"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            
            {canRetry && (
              <button
                onClick={onRetry}
                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                title="Retry Job"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">
            {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
          </span>
          <span className="text-gray-300">
            {progress.percentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.percentage, status)}`}
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
        
        {progress.message && (
          <p className="text-sm text-gray-400">{progress.message}</p>
        )}
      </div>

      {/* Metrics and Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Duration</div>
          <div className="text-white font-medium">
            {started_at ? formatDuration(started_at) : 'Not started'}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Speed</div>
          <div className="text-white font-medium flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>{formatSpeed(progress.speed)}</span>
          </div>
        </div>
        
        {metrics && (
          <>
            <div>
              <div className="text-gray-400">CPU</div>
              <div className="text-white font-medium flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>{metrics.cpu_usage.toFixed(1)}%</span>
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Memory</div>
              <div className="text-white font-medium">
                {metrics.memory_usage.toFixed(1)} MB
              </div>
            </div>
          </>
        )}
      </div>

      {/* Additional Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          Created: {new Date(created_at).toLocaleString()}
        </div>
        
        {retry_count > 0 && (
          <div className="flex items-center space-x-1">
            <RotateCcw className="w-3 h-3" />
            <span>Retry {retry_count}</span>
          </div>
        )}
        
        {job.points_consumed > 0 && (
          <div>
            Points: {job.points_consumed}
          </div>
        )}
      </div>

      {/* ETA */}
      {progress.eta && status === 'running' && (
        <div className="text-xs text-blue-400">
          ETA: {new Date(progress.eta).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export const CrawlingProgressBars: React.FC<CrawlingProgressBarsProps> = ({
  jobs,
  onCancelJob,
  onRetryJob,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-600 rounded w-32"></div>
                    <div className="h-3 bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-600 rounded w-16"></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-600 rounded w-20"></div>
                  <div className="h-3 bg-gray-600 rounded w-12"></div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="h-2 bg-gray-600 rounded-full w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Active Jobs</h3>
        <p className="text-gray-500">
          No crawling jobs are currently running. Use the trigger buttons to start new jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Active Jobs</h2>
        <div className="text-sm text-gray-400">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} running
        </div>
      </div>
      
      {jobs.map((job) => (
        <ProgressBar
          key={job.job_id}
          job={job}
          onCancel={() => onCancelJob(job.job_id)}
          onRetry={() => onRetryJob(job.job_id)}
        />
      ))}
    </div>
  );
};