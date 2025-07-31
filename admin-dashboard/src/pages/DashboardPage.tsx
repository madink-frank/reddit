import React, { useState } from 'react';
import {
  Activity,
  FileText,
  Hash,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Plus,
  Play,
  Wand2,
  Brain,
  Image,
  BarChart3,
  Zap
} from 'lucide-react';
import { DashboardGrid, DashboardLayout, DashboardSection } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { QuickActionButton } from '../components/dashboard/QuickActionButton';
import { SystemHealthItem } from '../components/dashboard/SystemHealthItem';
import { useDashboardStats, useSystemHealth, useRecentActivity } from '../hooks/useDashboard';
import { useAdvancedDashboard } from '../hooks/useAdvancedDashboard';
import type { RecentActivity } from '../services/dashboardService';
import { Modal } from '../components/ui/Modal';
import { AddKeywordForm } from '../components/forms/AddKeywordForm';
import { ContentGenerationForm } from '../components/forms/ContentGenerationForm';
import {
  CrawlingStatusWidget,
  SystemHealthWidget,
  QuickAnalysisWidget,
  NotificationCenterWidget
} from '../components/dashboard/RealTimeMonitoringWidgets';
import {
  AnalysisToolShortcuts,
  AnalysisPreviewWidget,
  WorkflowShortcuts
} from '../components/dashboard/AnalysisToolPreviews';
import { FeatureIntegrationHub } from '../components/dashboard/FeatureIntegrationHub';
import { ErrorHandler, useErrorHandler } from '../components/common/ErrorHandler';
import { UserDocumentation } from '../components/help/UserDocumentation';



interface ActivityItemProps {
  activity: RecentActivity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'keyword_added':
        return <Hash className="w-4 h-4 text-primary" />;
      case 'crawling_completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'crawling_started':
        return <Activity className="w-4 h-4 text-warning" />;
      case 'crawling_failed':
        return <AlertTriangle className="w-4 h-4 text-error" />;
      case 'content_generated':
        return <FileText className="w-4 h-4 text-accent" />;
      default:
        return <Activity className="w-4 h-4 text-secondary" />;
    }
  };

  const getActivityBgColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'keyword_added':
        return 'bg-primary/20';
      case 'crawling_completed':
        return 'bg-success/20';
      case 'crawling_started':
        return 'bg-warning/20';
      case 'crawling_failed':
        return 'bg-error/20';
      case 'content_generated':
        return 'bg-accent/20';
      default:
        return 'bg-surface-secondary';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-primary hover:bg-surface-secondary transition-colors">
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 ${getActivityBgColor(activity.type)} rounded-lg flex items-center justify-center`}>
          {getActivityIcon(activity.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary">
          {activity.title}
        </p>
        {activity.description && (
          <p className="text-xs text-secondary mt-1">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-tertiary mt-2">
          {formatTimeAgo(activity.timestamp)}
        </p>
      </div>
    </div>
  );
};



const DashboardPage: React.FC = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useDashboardStats();

  const {
    data: health,
    isLoading: healthLoading,
    error: healthError
  } = useSystemHealth();

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError
  } = useRecentActivity();

  useAdvancedDashboard();

  // Modal states
  const [isAddKeywordModalOpen, setIsAddKeywordModalOpen] = useState(false);
  const [isContentGenerationModalOpen, setIsContentGenerationModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Error handling
  const {
    errors,
    addError,
    dismissError,
    retryError,
    reportError
  } = useErrorHandler();

  // Loading states for quick actions
  const [quickActionLoading, setQuickActionLoading] = useState<{
    addKeyword: boolean;
    startCrawling: boolean;
    generateContent: boolean;
  }>({
    addKeyword: false,
    startCrawling: false,
    generateContent: false
  });

  // Fallback data for when API is not available
  const fallbackStats = {
    active_keywords_count: 24,
    active_keywords_change: 12,
    total_posts_count: 1247,
    total_posts_change: 8,
    active_crawling_count: 3,
    active_crawling_change: 0,
    generated_content_count: 18,
    generated_content_change: 25,
    trending_keywords: []
  };

  const displayStats = stats || fallbackStats;
  const isLoading = statsLoading;

  // Quick action handlers
  const handleAddKeyword = () => {
    setQuickActionLoading(prev => ({ ...prev, addKeyword: true }));
    // Small delay to show loading state
    setTimeout(() => {
      setQuickActionLoading(prev => ({ ...prev, addKeyword: false }));
      setIsAddKeywordModalOpen(true);
    }, 300);
  };

  const handleStartCrawling = async () => {
    try {
      setQuickActionLoading(prev => ({ ...prev, startCrawling: true }));
      setActionFeedback({ type: 'info', message: 'Starting crawling process...' });

      // TODO: Implement actual crawling start API call
      setTimeout(() => {
        setQuickActionLoading(prev => ({ ...prev, startCrawling: false }));
        setActionFeedback({ type: 'success', message: 'Crawling started successfully!' });
        setTimeout(() => setActionFeedback(null), 3000);
      }, 1500);
    } catch (error) {
      setQuickActionLoading(prev => ({ ...prev, startCrawling: false }));
      setActionFeedback({ type: 'error', message: 'Failed to start crawling. Please try again.' });
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleGenerateContent = () => {
    setQuickActionLoading(prev => ({ ...prev, generateContent: true }));
    // Small delay to show loading state
    setTimeout(() => {
      setQuickActionLoading(prev => ({ ...prev, generateContent: false }));
      setIsContentGenerationModalOpen(true);
    }, 300);
  };



  return (
    <DashboardLayout>
      {/* Page Header */}
      <header className="mb-8" role="banner">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary" id="dashboard-title">
              Advanced Dashboard
            </h1>
            <p className="mt-2 text-secondary" id="dashboard-description">
              Real-time analytics, NLP analysis, and intelligent monitoring for Reddit content
            </p>
          </div>

          {/* Quick stats in header */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {displayStats.active_crawling_count}
              </div>
              <div className="text-xs text-tertiary">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {displayStats.total_posts_count.toLocaleString()}
              </div>
              <div className="text-xs text-tertiary">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                98.5%
              </div>
              <div className="text-xs text-tertiary">Success Rate</div>
            </div>
          </div>

          {/* Help Button */}
          <div className="ml-6">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-primary rounded-md hover:bg-surface-secondary transition-colors"
              aria-label="Open help and documentation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
          </div>
        </div>
      </header>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <section
          className={`mb-6 dashboard-card ${actionFeedback.type === 'success' ? 'border-l-4 border-l-success' :
            actionFeedback.type === 'error' ? 'border-l-4 border-l-error' :
              'border-l-4 border-l-info'
            }`}
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center">
            {actionFeedback.type === 'success' && <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />}
            {actionFeedback.type === 'error' && <AlertTriangle className="w-5 h-5 text-error" aria-hidden="true" />}
            {actionFeedback.type === 'info' && <RefreshCw className="w-5 h-5 text-info animate-spin" aria-hidden="true" />}
            <div className="ml-3">
              <p className="text-sm font-medium text-primary">
                {actionFeedback.message}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Error Handler */}
      <ErrorHandler
        errors={errors}
        onDismiss={dismissError}
        onRetry={retryError}
        onReport={reportError}
        maxVisible={3}
        autoHideDelay={8000}
      />

      {/* Error Banner */}
      {statsError && (
        <div className="mb-6 dashboard-card border-l-4 border-l-error">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-primary">
                Unable to load dashboard statistics
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Showing cached data. Click refresh to try again.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => {
                    refetchStats();
                    addError({
                      type: 'network',
                      severity: 'medium',
                      message: 'Retrying dashboard statistics load',
                      feature: 'Dashboard',
                      action: 'Refresh Stats',
                      retryable: true,
                      userFriendly: true
                    });
                  }}
                  className="btn-secondary text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Cards */}
      <section aria-labelledby="stats-section-title" className="mb-8" role="region" aria-label="Key performance metrics">
        <h2 id="stats-section-title" className="sr-only">Dashboard Statistics</h2>
        <DashboardGrid>
          <StatCard
            title="Active Keywords"
            value={displayStats.active_keywords_count}
            change={{ value: displayStats.active_keywords_change, type: 'increase' }}
            icon={Hash}
            iconColor="text-primary"
            loading={isLoading}
            variant="glass"
          />
          <StatCard
            title="Total Posts"
            value={displayStats.total_posts_count}
            change={{ value: displayStats.total_posts_change, type: 'increase' }}
            icon={FileText}
            iconColor="text-success"
            loading={isLoading}
            variant="glass"
          />
          <StatCard
            title="Active Crawling"
            value={displayStats.active_crawling_count}
            change={{ value: displayStats.active_crawling_change, type: 'increase' }}
            icon={Activity}
            iconColor="text-warning"
            loading={isLoading}
            variant="glass"
          />
          <StatCard
            title="Generated Content"
            value={displayStats.generated_content_count}
            change={{ value: displayStats.generated_content_change, type: 'increase' }}
            icon={TrendingUp}
            iconColor="text-accent"
            loading={isLoading}
            variant="glass"
          />
        </DashboardGrid>
      </section>

      {/* Advanced Metrics Row */}
      <section aria-labelledby="advanced-metrics-title" className="mt-6">
        <h2 id="advanced-metrics-title" className="sr-only">Advanced Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Advanced performance metrics">
          <article className="dashboard-card text-center" aria-labelledby="nlp-metric">
            <div className="text-2xl font-bold text-primary mb-1" aria-label="0 NLP analyses this month">
              0
            </div>
            <div id="nlp-metric" className="text-sm text-secondary">NLP Analyses</div>
            <div className="text-xs text-tertiary mt-1">This month</div>
          </article>

          <article className="dashboard-card text-center" aria-labelledby="image-metric">
            <div className="text-2xl font-bold text-accent mb-1" aria-label="0 images processed this month">
              0
            </div>
            <div id="image-metric" className="text-sm text-secondary">Images Processed</div>
            <div className="text-xs text-tertiary mt-1">This month</div>
          </article>

          <article className="dashboard-card text-center" aria-labelledby="points-metric">
            <div className="text-2xl font-bold text-success mb-1" aria-label="0 points used today">
              0
            </div>
            <div id="points-metric" className="text-sm text-secondary">Points Used</div>
            <div className="text-xs text-tertiary mt-1">Today</div>
          </article>

          <article className="dashboard-card text-center" aria-labelledby="response-metric">
            <div className="text-2xl font-bold text-warning mb-1" aria-label="0 milliseconds average response time in last 24 hours">
              0ms
            </div>
            <div id="response-metric" className="text-sm text-secondary">Avg Response</div>
            <div className="text-xs text-tertiary mt-1">Last 24h</div>
          </article>
        </div>
      </section>

      {/* Enhanced Quick Actions */}
      <section className="mt-8" aria-labelledby="quick-actions-title">
        <DashboardSection title="Quick Actions" variant="elevated">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" role="group" aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" className="sr-only">Quick Actions</h2>
            <QuickActionButton
              title="Add Keyword"
              description="Track new topics"
              icon={Plus}
              iconColor="text-primary"
              onClick={handleAddKeyword}
              loading={quickActionLoading.addKeyword}
              variant="primary"
            />
            <QuickActionButton
              title="Start Crawling"
              description="Begin collection"
              icon={Play}
              iconColor="text-success"
              onClick={handleStartCrawling}
              loading={quickActionLoading.startCrawling}
              variant="success"
            />
            <QuickActionButton
              title="NLP Analysis"
              description="Analyze text"
              icon={Brain}
              iconColor="text-accent"
              onClick={() => window.location.href = '/admin/nlp-analysis'}
              variant="accent"
            />
            <QuickActionButton
              title="Image Analysis"
              description="Process images"
              icon={Image}
              iconColor="text-secondary"
              onClick={() => window.location.href = '/admin/image-analysis'}
              variant="secondary"
            />
            <QuickActionButton
              title="View Analytics"
              description="Data insights"
              icon={BarChart3}
              iconColor="text-info"
              onClick={() => window.location.href = '/admin/advanced-analytics'}
              variant="info"
            />
            <QuickActionButton
              title="Generate Content"
              description="AI content"
              icon={Wand2}
              iconColor="text-warning"
              onClick={handleGenerateContent}
              loading={quickActionLoading.generateContent}
              variant="warning"
            />
          </div>
        </DashboardSection>
      </section>

      {/* Real-time Monitoring Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        <CrawlingStatusWidget className="xl:col-span-1" />
        <SystemHealthWidget className="xl:col-span-1" />
        <QuickAnalysisWidget className="xl:col-span-1" />
        <NotificationCenterWidget className="xl:col-span-1" />
      </div>

      {/* Enhanced Dashboard Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* System Status Section */}
        <DashboardSection title="Detailed System Status" variant="glass">
          {healthLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 px-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="loading-skeleton w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <div className="loading-skeleton h-4 rounded w-24 mb-1" />
                      <div className="loading-skeleton h-3 rounded w-16" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="loading-skeleton w-6 h-6 rounded-full" />
                    <div className="loading-skeleton h-4 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : healthError ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
              <p className="text-sm text-secondary">Unable to load system health</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary mt-4 text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <SystemHealthItem
                name="Database"
                status={health?.database || 'healthy'}
                details={health?.details?.database_latency ? `${health.details.database_latency}ms latency` : undefined}
                metrics={{
                  latency: health?.details?.database_latency
                }}
              />
              <SystemHealthItem
                name="Redis Cache"
                status={health?.redis || 'healthy'}
                details={health?.details?.redis_latency ? `${health.details.redis_latency}ms latency` : undefined}
                metrics={{
                  latency: health?.details?.redis_latency
                }}
              />
              <SystemHealthItem
                name="Celery Workers"
                status={health?.celery || 'warning'}
                details={health?.details ? `${health.details.active_workers}/${health.details.total_workers} workers active` : '2/3 workers active'}
                metrics={{
                  active_workers: health?.details?.active_workers,
                  total_workers: health?.details?.total_workers
                }}
              />
              <SystemHealthItem
                name="Reddit API"
                status={health?.reddit_api || 'healthy'}
                details={health?.details?.api_rate_limit ? `${health.details.api_rate_limit.remaining} requests remaining` : undefined}
                metrics={{
                  rate_limit_remaining: health?.details?.api_rate_limit?.remaining
                }}
              />
            </div>
          )}
        </DashboardSection>

        {/* Enhanced Quick Stats Section */}
        <DashboardSection title="Performance Insights" variant="glass">
          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="loading-skeleton h-4 rounded w-32" />
                  <div className="loading-skeleton h-5 rounded w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Posts Today</span>
                <span className="text-lg font-semibold text-primary">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Avg. Posts/Hour</span>
                <span className="text-lg font-semibold text-primary">5.3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Top Subreddit</span>
                <span className="text-lg font-semibold text-accent">r/technology</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Success Rate</span>
                <span className="text-lg font-semibold text-success">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Analysis Queue</span>
                <span className="text-lg font-semibold text-warning">12 pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Response Time</span>
                <span className="text-lg font-semibold text-info">245ms</span>
              </div>
            </div>
          )}
        </DashboardSection>
      </div>

      {/* Analysis Tools Section */}
      <div className="mt-8">
        <AnalysisToolShortcuts />
      </div>

      {/* Analysis Results and Workflow Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <AnalysisPreviewWidget className="lg:col-span-2" />

        <div className="space-y-6">
          <div className="dashboard-card glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-info/20 rounded-lg">
                <Zap className="w-5 h-5 text-info" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Quick Actions</h3>
                <p className="text-sm text-secondary">One-click operations</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/nlp-analysis'}
                className="btn-secondary w-full text-sm justify-start"
              >
                <Brain className="w-4 h-4" />
                Analyze Selected Posts
              </button>

              <button
                onClick={() => window.location.href = '/admin/image-analysis'}
                className="btn-secondary w-full text-sm justify-start"
              >
                <Image className="w-4 h-4" />
                Process Images
              </button>

              <button
                onClick={() => window.location.href = '/admin/export'}
                className="btn-secondary w-full text-sm justify-start"
              >
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </button>

              <button
                onClick={() => window.location.href = '/admin/forecasting'}
                className="btn-secondary w-full text-sm justify-start"
              >
                <TrendingUp className="w-4 h-4" />
                View Trends
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Shortcuts */}
      <div className="mt-8">
        <WorkflowShortcuts />
      </div>

      {/* Feature Integration Hub */}
      <div className="mt-8">
        <FeatureIntegrationHub />
      </div>

      {/* Recent Activity Feed */}
      <DashboardSection
        title="Recent Activity"
        className="mt-8"
        variant="glass"
        action={
          <button className="btn-ghost text-sm">
            View All
          </button>
        }
      >
        {activitiesLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="flex-shrink-0">
                  <div className="icon-lg bg-gray-200 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activitiesError ? (
          <div className="text-center py-8">
            <AlertTriangle className="icon-lg text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Unable to load recent activities</p>
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-tertiary mx-auto mb-4" />
            <p className="text-sm text-secondary">No recent activities</p>
            <p className="text-xs text-tertiary mt-1">
              Activities will appear here as you use the platform
            </p>
          </div>
        )}
      </DashboardSection>

      {/* Add Keyword Modal */}
      <Modal
        isOpen={isAddKeywordModalOpen}
        onClose={() => setIsAddKeywordModalOpen(false)}
        title="Add New Keyword"
        size="md"
      >
        <AddKeywordForm
          onSuccess={() => {
            setActionFeedback({ type: 'success', message: 'Keyword added successfully!' });
            setIsAddKeywordModalOpen(false);
            setTimeout(() => setActionFeedback(null), 3000);
          }}
          onCancel={() => setIsAddKeywordModalOpen(false)}
        />
      </Modal>

      {/* Content Generation Modal */}
      <Modal
        isOpen={isContentGenerationModalOpen}
        onClose={() => setIsContentGenerationModalOpen(false)}
        title="Generate Content"
        size="lg"
      >
        <ContentGenerationForm
          onSubmit={(_data) => {
            // TODO: Implement content generation
            setActionFeedback({ type: 'info', message: 'Generating content...' });
            setTimeout(() => {
              setActionFeedback({ type: 'success', message: 'Content generated successfully!' });
              setIsContentGenerationModalOpen(false);
              setTimeout(() => setActionFeedback(null), 3000);
            }, 2000);
          }}
          onCancel={() => setIsContentGenerationModalOpen(false)}
        />
      </Modal>

      {/* Help Documentation Modal */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Dashboard Help & Documentation"
        size="xl"
      >
        <UserDocumentation
          currentFeature="dashboard"
          showTutorials={true}
          onStartTutorial={(tutorialId) => {
            console.log('Starting tutorial:', tutorialId);
            setIsHelpModalOpen(false);
            // TODO: Implement tutorial system
          }}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default DashboardPage;