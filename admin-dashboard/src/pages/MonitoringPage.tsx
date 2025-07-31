/**
 * Monitoring Page
 * 
 * Real-time crawling monitoring dashboard with live metrics, progress tracking, and manual controls.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useCrawlingMonitoring } from '../hooks/useCrawlingMonitoring';
import { LiveMetricsDisplay } from '../components/monitoring/LiveMetricsDisplay';
import { CrawlingProgressBars } from '../components/monitoring/CrawlingProgressBars';
import { ManualTriggerButtons } from '../components/monitoring/ManualTriggerButtons';

interface Keyword {
  id: number;
  keyword: string;
  is_active: boolean;
}

const MonitoringPage: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const {
    activeJobs,
    queueStats,
    isLoading,
    isConnected,
    error,
    refreshData,
    triggerKeywordCrawl,
    triggerTrendingCrawl,
    triggerAllKeywordsCrawl,
    cancelJob,
    retryJob
  } = useCrawlingMonitoring();

  // Fetch keywords for manual triggers
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/keywords', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setKeywords(data);
        }
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
      } finally {
        setKeywordsLoading(false);
      }
    };

    fetchKeywords();
  }, []);

  const handleRefresh = async () => {
    await refreshData();
    setLastRefresh(new Date());
  };

  const handleCancelJob = async (jobId: number) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      // You could add a toast notification here
    }
  };

  const handleRetryJob = async (jobId: number) => {
    try {
      await retryJob(jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Real-Time Monitoring</h1>
            <p className="text-gray-400 mt-1">
              Monitor crawling jobs and system performance in real-time
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${isConnected
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
              }`}>
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-400">Connection Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Live Metrics */}
        <section>
          <LiveMetricsDisplay />
        </section>

        {/* Manual Triggers */}
        <section>
          {keywordsLoading ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ManualTriggerButtons
              onTriggerKeywordCrawl={triggerKeywordCrawl}
              onTriggerTrendingCrawl={triggerTrendingCrawl}
              onTriggerAllKeywordsCrawl={triggerAllKeywordsCrawl}
              keywords={keywords}
              isConnected={isConnected}
            />
          )}
        </section>

        {/* Active Jobs Progress */}
        <section>
          <CrawlingProgressBars
            jobs={activeJobs}
            onCancelJob={handleCancelJob}
            onRetryJob={handleRetryJob}
            isLoading={isLoading}
          />
        </section>

        {/* Queue Statistics */}
        {queueStats && (
          <section className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Queue Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {queueStats.total_queue_length}
                </div>
                <div className="text-sm text-gray-400">Total Queued</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {queueStats.active_jobs_count}
                </div>
                <div className="text-sm text-gray-400">Active Jobs</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {queueStats.enqueued_count || 0}
                </div>
                <div className="text-sm text-gray-400">Enqueued Today</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {queueStats.dequeued_count || 0}
                </div>
                <div className="text-sm text-gray-400">Processed Today</div>
              </div>
            </div>

            {/* Priority Queue Breakdown */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium text-white mb-3">Priority Queues</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-400">
                    {queueStats.urgent_queue_length}
                  </div>
                  <div className="text-xs text-gray-400">Urgent</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-400">
                    {queueStats.high_queue_length}
                  </div>
                  <div className="text-xs text-gray-400">High</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-400">
                    {queueStats.normal_queue_length}
                  </div>
                  <div className="text-xs text-gray-400">Normal</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-400">
                    {queueStats.low_queue_length}
                  </div>
                  <div className="text-xs text-gray-400">Low</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8">
          <p>
            Last updated: {lastRefresh.toLocaleString()} •
            Auto-refresh: {isConnected ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;