/**
 * Manual Trigger Buttons Component
 * 
 * Provides manual trigger buttons with loading states and feedback for crawling operations.
 */

import React, { useState } from 'react';
import { 
  Play, 
  TrendingUp, 
  Zap, 
  Settings, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ManualTriggerButtonsProps {
  onTriggerKeywordCrawl: (keywordId: number, limit?: number, priority?: string) => Promise<any>;
  onTriggerTrendingCrawl: (limit?: number, priority?: string) => Promise<any>;
  onTriggerAllKeywordsCrawl: (priority?: string) => Promise<any>;
  keywords?: Array<{ id: number; keyword: string; is_active: boolean }>;
  isConnected: boolean;
}

interface TriggerButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  lastResult?: {
    success: boolean;
    message: string;
    timestamp: Date;
  };
}

interface TriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const TriggerButton: React.FC<TriggerButtonProps> = ({
  title,
  description,
  icon,
  onClick,
  isLoading,
  disabled = false,
  color = 'blue',
  lastResult
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400',
    orange: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400'
  };

  const disabledClasses = 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed';

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`w-full p-4 rounded-lg border transition-all duration-200 ${
          disabled || isLoading ? disabledClasses : colorClasses[color]
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              icon
            )}
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm opacity-75">{description}</p>
          </div>
          
          <div className="flex-shrink-0">
            <Play className="w-4 h-4" />
          </div>
        </div>
      </button>
      
      {/* Last Result Feedback */}
      {lastResult && (
        <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded ${
          lastResult.success 
            ? 'text-green-400 bg-green-500/10' 
            : 'text-red-400 bg-red-500/10'
        }`}>
          {lastResult.success ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>{lastResult.message}</span>
          <span className="text-gray-500">
            {lastResult.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

const TriggerModal: React.FC<TriggerModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ManualTriggerButtons: React.FC<ManualTriggerButtonsProps> = ({
  onTriggerKeywordCrawl,
  onTriggerTrendingCrawl,
  onTriggerAllKeywordsCrawl,
  keywords = [],
  isConnected
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [lastResults, setLastResults] = useState<Record<string, any>>({});
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showTrendingModal, setShowTrendingModal] = useState(false);
  const [showAllKeywordsModal, setShowAllKeywordsModal] = useState(false);

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const setResult = (key: string, success: boolean, message: string) => {
    setLastResults(prev => ({
      ...prev,
      [key]: {
        success,
        message,
        timestamp: new Date()
      }
    }));
  };

  const handleKeywordCrawl = async (keywordId: number, limit: number, priority: string) => {
    const key = `keyword_${keywordId}`;
    setLoading(key, true);
    
    try {
      const result = await onTriggerKeywordCrawl(keywordId, limit, priority);
      setResult(key, true, `Job ${result.job_id} started successfully`);
      setShowKeywordModal(false);
    } catch (error) {
      setResult(key, false, error instanceof Error ? error.message : 'Failed to start job');
    } finally {
      setLoading(key, false);
    }
  };

  const handleTrendingCrawl = async (limit: number, priority: string) => {
    const key = 'trending';
    setLoading(key, true);
    
    try {
      const result = await onTriggerTrendingCrawl(limit, priority);
      setResult(key, true, `Job ${result.job_id} started successfully`);
      setShowTrendingModal(false);
    } catch (error) {
      setResult(key, false, error instanceof Error ? error.message : 'Failed to start job');
    } finally {
      setLoading(key, false);
    }
  };

  const handleAllKeywordsCrawl = async (priority: string) => {
    const key = 'all_keywords';
    setLoading(key, true);
    
    try {
      const result = await onTriggerAllKeywordsCrawl(priority);
      setResult(key, true, `Job ${result.job_id} started successfully`);
      setShowAllKeywordsModal(false);
    } catch (error) {
      setResult(key, false, error instanceof Error ? error.message : 'Failed to start job');
    } finally {
      setLoading(key, false);
    }
  };

  const activeKeywords = keywords.filter(k => k.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Manual Triggers</h2>
          <p className="text-sm text-gray-400">Start crawling jobs manually</p>
        </div>
        
        <div className={`flex items-center space-x-2 text-sm ${
          isConnected ? 'text-green-400' : 'text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm">
            Real-time connection unavailable. Jobs can still be triggered but updates may be delayed.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Keyword Crawl */}
        <TriggerButton
          title="Keyword Crawl"
          description={`Crawl specific keywords (${activeKeywords.length} active)`}
          icon={<Zap className="w-5 h-5" />}
          onClick={() => setShowKeywordModal(true)}
          isLoading={loadingStates.keyword || false}
          disabled={activeKeywords.length === 0}
          color="blue"
          lastResult={lastResults.keyword}
        />

        {/* Trending Crawl */}
        <TriggerButton
          title="Trending Posts"
          description="Crawl trending posts from popular subreddits"
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => setShowTrendingModal(true)}
          isLoading={loadingStates.trending || false}
          color="green"
          lastResult={lastResults.trending}
        />

        {/* All Keywords Crawl */}
        <TriggerButton
          title="All Keywords"
          description={`Crawl all active keywords (${activeKeywords.length})`}
          icon={<Settings className="w-5 h-5" />}
          onClick={() => setShowAllKeywordsModal(true)}
          isLoading={loadingStates.all_keywords || false}
          disabled={activeKeywords.length === 0}
          color="purple"
          lastResult={lastResults.all_keywords}
        />
      </div>

      {/* Keyword Crawl Modal */}
      <TriggerModal
        isOpen={showKeywordModal}
        onClose={() => setShowKeywordModal(false)}
        title="Start Keyword Crawl"
      >
        <KeywordCrawlForm
          keywords={activeKeywords}
          onSubmit={handleKeywordCrawl}
          isLoading={loadingStates.keyword || false}
        />
      </TriggerModal>

      {/* Trending Crawl Modal */}
      <TriggerModal
        isOpen={showTrendingModal}
        onClose={() => setShowTrendingModal(false)}
        title="Start Trending Crawl"
      >
        <TrendingCrawlForm
          onSubmit={handleTrendingCrawl}
          isLoading={loadingStates.trending || false}
        />
      </TriggerModal>

      {/* All Keywords Crawl Modal */}
      <TriggerModal
        isOpen={showAllKeywordsModal}
        onClose={() => setShowAllKeywordsModal(false)}
        title="Start All Keywords Crawl"
      >
        <AllKeywordsCrawlForm
          keywordCount={activeKeywords.length}
          onSubmit={handleAllKeywordsCrawl}
          isLoading={loadingStates.all_keywords || false}
        />
      </TriggerModal>
    </div>
  );
};

// Form Components
const KeywordCrawlForm: React.FC<{
  keywords: Array<{ id: number; keyword: string }>;
  onSubmit: (keywordId: number, limit: number, priority: string) => void;
  isLoading: boolean;
}> = ({ keywords, onSubmit, isLoading }) => {
  const [selectedKeyword, setSelectedKeyword] = useState(keywords[0]?.id || 0);
  const [limit, setLimit] = useState(100);
  const [priority, setPriority] = useState('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedKeyword, limit, priority);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Keyword
        </label>
        <select
          value={selectedKeyword}
          onChange={(e) => setSelectedKeyword(Number(e.target.value))}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          {keywords.map((keyword) => (
            <option key={keyword.id} value={keyword.id}>
              {keyword.keyword}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Limit
        </label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          min="1"
          max="1000"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Starting...' : 'Start Crawl'}</span>
      </button>
    </form>
  );
};

const TrendingCrawlForm: React.FC<{
  onSubmit: (limit: number, priority: string) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [limit, setLimit] = useState(100);
  const [priority, setPriority] = useState('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(limit, priority);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Posts per Subreddit
        </label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          min="1"
          max="1000"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <TrendingUp className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Starting...' : 'Start Crawl'}</span>
      </button>
    </form>
  );
};

const AllKeywordsCrawlForm: React.FC<{
  keywordCount: number;
  onSubmit: (priority: string) => void;
  isLoading: boolean;
}> = ({ keywordCount, onSubmit, isLoading }) => {
  const [priority, setPriority] = useState('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(priority);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-400 text-sm">
          This will start crawling jobs for all {keywordCount} active keywords.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Settings className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Starting...' : 'Start All Crawls'}</span>
      </button>
    </form>
  );
};