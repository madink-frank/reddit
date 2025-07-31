import { useEffect, useState, useCallback } from 'react';
import { 
  useNLPAnalysisStore,
  useImageAnalysisStore,
  useRealTimeMonitoringStore,
  initializeAdvancedStores,
  cleanupAdvancedStores,
} from '../stores';
import { 
  initializeAdvancedDashboard,
  cleanupAdvancedDashboard,
  getAdvancedDashboardHealth,
} from '../lib/advanced-dashboard';
import { themeUtils, type ThemeConfig, type ThemeMode, isValidThemeConfig, defaultThemeConfig } from '../config/theme';

interface AdvancedDashboardState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  health: ReturnType<typeof getAdvancedDashboardHealth> | null;
}

interface AdvancedDashboardActions {
  initialize: () => Promise<void>;
  cleanup: () => void;
  checkHealth: () => void;
  refreshConnection: () => Promise<void>;
}

/**
 * Main hook for advanced dashboard functionality
 */
export const useAdvancedDashboard = (): AdvancedDashboardState & AdvancedDashboardActions => {
  const [state, setState] = useState<AdvancedDashboardState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    health: null,
  });

  const initialize = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize stores
      const storeResult = await initializeAdvancedStores();
      if (!storeResult.success) {
        throw new Error('Failed to initialize stores');
      }

      // Initialize dashboard infrastructure
      const dashboardResult = await initializeAdvancedDashboard();
      if (!dashboardResult.success) {
        throw new Error('Failed to initialize dashboard infrastructure');
      }

      // Get initial health status
      const health = getAdvancedDashboardHealth();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        health,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  const cleanup = useCallback(() => {
    try {
      cleanupAdvancedStores();
      cleanupAdvancedDashboard();
      
      setState({
        isInitialized: false,
        isLoading: false,
        error: null,
        health: null,
      });
    } catch (error) {
      console.error('Failed to cleanup advanced dashboard:', error);
    }
  }, []);

  const checkHealth = useCallback(() => {
    try {
      const health = getAdvancedDashboardHealth();
      setState(prev => ({ ...prev, health }));
    } catch (error) {
      console.error('Failed to check dashboard health:', error);
    }
  }, []);

  const refreshConnection = useCallback(async () => {
    const monitoringStore = useRealTimeMonitoringStore.getState();
    try {
      await monitoringStore.reconnect();
      checkHealth();
    } catch (error) {
      console.error('Failed to refresh connection:', error);
    }
  }, [checkHealth]);

  // Auto-initialize on mount
  useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);

  // Health check interval
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [state.isInitialized, checkHealth]);

  return {
    ...state,
    initialize,
    cleanup,
    checkHealth,
    refreshConnection,
  };
};

/**
 * Hook for NLP analysis functionality
 */
export const useNLPDashboard = () => {
  const store = useNLPAnalysisStore();
  
  return {
    // State
    currentAnalysis: store.currentAnalysis,
    analysisHistory: store.analysisHistory,
    isProcessing: store.isProcessing,
    stats: store.stats,
    
    // Actions
    startAnalysis: store.startAnalysis,
    startBatchAnalysis: store.startBatchAnalysis,
    getAnalysisResult: store.getAnalysisResult,
    clearAnalysisHistory: store.clearAnalysisHistory,
    
    // Utilities
    getCachedResult: store.getCachedResult,
    updateDefaultOptions: store.updateDefaultOptions,
  };
};

/**
 * Hook for image analysis functionality
 */
export const useImageDashboard = () => {
  const store = useImageAnalysisStore();
  
  return {
    // State
    currentAnalysis: store.currentAnalysis,
    analysisHistory: store.analysisHistory,
    isProcessing: store.isProcessing,
    stats: store.stats,
    
    // Actions
    startAnalysis: store.startAnalysis,
    startBatchAnalysis: store.startBatchAnalysis,
    getAnalysisResult: store.getAnalysisResult,
    clearAnalysisHistory: store.clearAnalysisHistory,
    uploadImage: store.uploadImage,
    
    // Utilities
    getCachedResult: store.getCachedResult,
    updateDefaultOptions: store.updateDefaultOptions,
  };
};

/**
 * Hook for real-time monitoring functionality
 */
export const useMonitoringDashboard = () => {
  const store = useRealTimeMonitoringStore();
  
  return {
    // Connection state
    connectionStatus: store.connectionStatus,
    liveData: store.liveData,
    
    // Data
    crawlingJobs: store.crawlingJobs,
    systemMetrics: store.systemMetrics,
    notifications: store.notifications,
    
    // Actions
    connect: store.connect,
    disconnect: store.disconnect,
    reconnect: store.reconnect,
    
    // Job control
    startCrawlingJob: store.startCrawlingJob,
    pauseCrawlingJob: store.pauseCrawlingJob,
    stopCrawlingJob: store.stopCrawlingJob,
    restartCrawlingJob: store.restartCrawlingJob,
    
    // Manual triggers
    triggerManualCrawl: store.triggerManualCrawl,
    triggerSystemHealthCheck: store.triggerSystemHealthCheck,
    
    // Notifications
    addNotification: store.addNotification,
    clearNotifications: store.clearNotifications,
    markNotificationAsRead: store.markNotificationAsRead,
    getUnreadNotifications: store.getUnreadNotifications,
    
    // Utilities
    getJobById: store.getJobById,
    getLatestMetrics: store.getLatestMetrics,
  };
};

/**
 * Hook for theme management
 */
export const useAdvancedTheme = () => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const loadedConfig = themeUtils.loadThemeConfig();
    // Ensure the loaded config is valid
    return isValidThemeConfig(loadedConfig) ? loadedConfig : defaultThemeConfig;
  });

  const applyTheme = useCallback((config: ThemeConfig) => {
    // Validate config before applying
    if (!isValidThemeConfig(config)) {
      console.warn('Invalid theme configuration provided');
      return;
    }
    
    themeUtils.applyTheme(config);
    themeUtils.saveThemeConfig(config);
    setThemeConfig(config);
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode: ThemeMode = themeConfig.mode === 'light' ? 'dark' : 'light';
    const newConfig = { ...themeConfig, mode: newMode };
    applyTheme(newConfig);
  }, [themeConfig, applyTheme]);

  const resetTheme = useCallback(() => {
    applyTheme(defaultThemeConfig);
  }, [applyTheme]);

  // Apply theme on mount and when config changes
  useEffect(() => {
    themeUtils.applyTheme(themeConfig);
  }, [themeConfig]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeConfig.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      themeUtils.applyTheme(themeConfig);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeConfig]);

  return {
    themeConfig,
    applyTheme,
    toggleTheme,
    resetTheme,
    currentTheme: themeConfig.mode === 'system' 
      ? themeUtils.getSystemTheme() 
      : themeConfig.mode,
  };
};

/**
 * Hook for dashboard performance monitoring
 */
export const useDashboardPerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    connectionLatency: 0,
    cacheHitRate: 0,
  });

  const updateMetrics = useCallback(() => {
    // Get performance metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const renderTime = navigation.loadEventEnd - navigation.loadEventStart;

    // Get memory usage (if available)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    // Get connection latency from monitoring store
    const monitoringStore = useRealTimeMonitoringStore.getState();
    const connectionLatency = monitoringStore.connectionStatus.latency || 0;

    // Calculate cache hit rates
    const nlpStore = useNLPAnalysisStore.getState();
    const imageStore = useImageAnalysisStore.getState();
    const totalRequests = nlpStore.stats.totalAnalyses + imageStore.stats.totalAnalyses;
    const cacheHits = nlpStore.analysisCache.size + imageStore.analysisCache.size;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    setMetrics({
      renderTime,
      memoryUsage,
      connectionLatency,
      cacheHitRate,
    });
  }, []);

  // Update metrics periodically
  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return {
    metrics,
    updateMetrics,
  };
};

/**
 * Hook for dashboard keyboard shortcuts
 */
export const useDashboardShortcuts = () => {
  const { toggleTheme } = useAdvancedTheme();
  const monitoringStore = useRealTimeMonitoringStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Shift + T: Toggle theme
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleTheme();
      }

      // Ctrl/Cmd + Shift + R: Refresh connection
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        monitoringStore.reconnect();
      }

      // Ctrl/Cmd + Shift + H: Trigger health check
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        monitoringStore.triggerSystemHealthCheck();
      }

      // Escape: Clear notifications
      if (event.key === 'Escape') {
        monitoringStore.clearNotifications();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, monitoringStore]);

  return {
    shortcuts: [
      { key: 'Ctrl+Shift+T', description: 'Toggle theme' },
      { key: 'Ctrl+Shift+R', description: 'Refresh connection' },
      { key: 'Ctrl+Shift+H', description: 'Health check' },
      { key: 'Escape', description: 'Clear notifications' },
    ],
  };
};

export default useAdvancedDashboard;