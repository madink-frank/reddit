import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Database,
  Wifi,
  Server,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useCrawlingMonitoring } from '@/hooks/useCrawlingMonitoring';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CrawlingStatusWidgetProps {
  className?: string;
}

export const CrawlingStatusWidget: React.FC<CrawlingStatusWidgetProps> = ({
  className = ''
}) => {
  const { data: crawlingData, isLoading } = useCrawlingMonitoring();
  const { isConnected, lastMessage } = useWebSocket('/ws/crawling-status');

  const [liveMetrics, setLiveMetrics] = useState({
    activeJobs: 0,
    completedToday: 0,
    successRate: 0,
    avgSpeed: 0,
    queueSize: 0
  });

  useEffect(() => {
    if (lastMessage) {
      setLiveMetrics(lastMessage);
    }
  }, [lastMessage]);

  const displayMetrics = crawlingData || liveMetrics;

  if (isLoading) {
    return (
      <div className={`dashboard-card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Live Crawling Status</h3>
          <div className="loading-spinner" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="loading-skeleton h-4 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-card glass ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/20 rounded-lg">
            <Activity className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">Live Crawling Status</h3>
            <p className="text-sm text-secondary">Real-time monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
          <span className="text-xs text-secondary">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {displayMetrics.activeJobs}
          </div>
          <div className="text-sm text-secondary">Active Jobs</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {displayMetrics.completedToday}
          </div>
          <div className="text-sm text-secondary">Completed Today</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {displayMetrics.successRate}%
          </div>
          <div className="text-sm text-secondary">Success Rate</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-warning mb-1">
            {displayMetrics.avgSpeed}
          </div>
          <div className="text-sm text-secondary">Items/min</div>
        </div>
      </div>

      {displayMetrics.queueSize > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-secondary">Queue Progress</span>
            <span className="text-sm text-primary">{displayMetrics.queueSize} pending</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill animated"
              style={{ width: `${Math.max(10, 100 - (displayMetrics.queueSize / 100) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1 text-sm">
          <Play className="w-4 h-4" />
          Start New Job
        </button>
        <button className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface SystemHealthWidgetProps {
  className?: string;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  className = ''
}) => {
  const { isConnected, lastMessage } = useWebSocket('/ws/system-health');
  const [healthData, setHealthData] = useState({
    database: { status: 'healthy', latency: 45 },
    redis: { status: 'healthy', latency: 12 },
    celery: { status: 'warning', activeWorkers: 2, totalWorkers: 3 },
    api: { status: 'healthy', responseTime: 120 }
  });

  useEffect(() => {
    if (lastMessage) {
      setHealthData(lastMessage);
    }
  }, [lastMessage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className={`dashboard-card glass ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/20 rounded-lg">
            <Server className="w-5 h-5 text-info" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">System Health</h3>
            <p className="text-sm text-secondary">Live monitoring</p>
          </div>
        </div>

        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
      </div>

      <div className="space-y-4">
        {Object.entries(healthData).map(([service, data]) => {
          const StatusIcon = getStatusIcon(data.status);

          return (
            <div key={service} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-4 h-4 ${getStatusColor(data.status)}`} />
                <div>
                  <div className="text-sm font-medium text-primary capitalize">
                    {service}
                  </div>
                  <div className="text-xs text-secondary">
                    {'latency' in data && `${data.latency}ms`}
                    {'responseTime' in data && `${data.responseTime}ms`}
                    {'activeWorkers' in data && `${data.activeWorkers}/${data.totalWorkers} workers`}
                  </div>
                </div>
              </div>

              <div className={`status-indicator ${data.status}`}>
                {data.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface QuickAnalysisWidgetProps {
  className?: string;
}

export const QuickAnalysisWidget: React.FC<QuickAnalysisWidgetProps> = ({
  className = ''
}) => {
  const [recentAnalyses, setRecentAnalyses] = useState([
    {
      id: '1',
      type: 'sentiment',
      text: 'Great product, highly recommend!',
      result: { score: 0.8, label: 'positive' },
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '2',
      type: 'nlp',
      text: 'The new update has some issues...',
      result: { sentiment: -0.3, keywords: ['update', 'issues'] },
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: '3',
      type: 'image',
      text: 'Product screenshot analysis',
      result: { objects: 3, confidence: 0.92 },
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    }
  ]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'sentiment': return TrendingUp;
      case 'nlp': return Zap;
      case 'image': return Activity;
      default: return Activity;
    }
  };

  return (
    <div className={`dashboard-card glass ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">Recent Analysis</h3>
            <p className="text-sm text-secondary">Latest results</p>
          </div>
        </div>

        <button className="btn-ghost text-sm">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {recentAnalyses.map((analysis) => {
          const AnalysisIcon = getAnalysisIcon(analysis.type);

          return (
            <div key={analysis.id} className="flex items-start gap-3">
              <div className="p-1.5 bg-surface-secondary rounded-lg">
                <AnalysisIcon className="w-3 h-3 text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-primary truncate">
                  {analysis.text}
                </div>
                <div className="text-xs text-secondary mt-1">
                  {analysis.type} • {formatTimeAgo(analysis.timestamp)}
                </div>

                {analysis.type === 'sentiment' && analysis.result.score !== undefined && (
                  <div className="mt-2">
                    <div className="sentiment-bar h-1 rounded-full">
                      <div
                        className="sentiment-positive h-full rounded-full"
                        style={{ width: `${(analysis.result.score + 1) * 50}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface NotificationCenterWidgetProps {
  className?: string;
}

export const NotificationCenterWidget: React.FC<NotificationCenterWidgetProps> = ({
  className = ''
}) => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'success',
      title: 'Crawling job completed',
      message: 'Successfully collected 150 posts from r/technology',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      read: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Low points balance',
      message: 'You have 50 points remaining',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      read: false
    },
    {
      id: '3',
      type: 'info',
      title: 'Analysis complete',
      message: 'NLP analysis finished for 25 posts',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  return (
    <div className={`dashboard-card glass ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/20 rounded-lg relative">
            <Activity className="w-5 h-5 text-warning" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">Notifications</h3>
            <p className="text-sm text-secondary">{unreadCount} unread</p>
          </div>
        </div>

        <button className="btn-ghost text-sm">
          Mark All Read
        </button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification ${notification.type} ${!notification.read ? 'font-medium' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-primary">
                  {notification.title}
                </div>
                <div className="text-xs text-secondary mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-tertiary mt-2">
                  {formatTimeAgo(notification.timestamp)}
                </div>
              </div>

              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};