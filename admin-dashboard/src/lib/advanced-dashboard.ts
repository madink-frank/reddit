// Advanced Dashboard Infrastructure Utilities

import {
  useNLPAnalysisStore,
  useImageAnalysisStore,
  useRealTimeMonitoringStore,
} from '../stores';

/**
 * Initialize all advanced dashboard stores and connections
 */
export const initializeAdvancedDashboard = async () => {
  console.log('🚀 Initializing Advanced Dashboard Infrastructure...');

  try {
    // Initialize real-time monitoring connection
    const monitoringStore = useRealTimeMonitoringStore.getState();
    await monitoringStore.connect();

    // Set up default subscriptions
    monitoringStore.subscribe({
      channel: 'crawling-jobs',
      callback: (data) => {
        console.log('📊 Crawling job update:', data);
      },
    });

    monitoringStore.subscribe({
      channel: 'system-metrics',
      callback: (data) => {
        console.log('📈 System metrics update:', data);
      },
    });

    monitoringStore.subscribe({
      channel: 'notifications',
      callback: (notification) => {
        console.log('🔔 New notification:', notification);
      },
    });

    // Initialize NLP analysis store with default options
    const nlpStore = useNLPAnalysisStore.getState();
    nlpStore.updateDefaultOptions({
      language: 'en',
      similarityThreshold: 0.8,
      keywordLimit: 50,
      confidenceThreshold: 0.7,
    });

    // Initialize image analysis store with default options
    const imageStore = useImageAnalysisStore.getState();
    imageStore.updateDefaultOptions({
      confidenceThreshold: 0.7,
      ocrLanguage: 'en',
      maxObjects: 20,
      detectFaces: false,
      extractColors: true,
    });

    console.log('✅ Advanced Dashboard Infrastructure initialized successfully');

    return {
      success: true,
      message: 'Advanced dashboard infrastructure initialized',
    };
  } catch (error) {
    console.error('❌ Failed to initialize advanced dashboard:', error);

    return {
      success: false,
      message: 'Failed to initialize advanced dashboard infrastructure',
      error,
    };
  }
};

/**
 * Cleanup advanced dashboard resources
 */
export const cleanupAdvancedDashboard = () => {
  console.log('🧹 Cleaning up Advanced Dashboard Infrastructure...');

  try {
    // Disconnect real-time monitoring
    const monitoringStore = useRealTimeMonitoringStore.getState();
    monitoringStore.disconnect();

    // Clear analysis caches
    const nlpStore = useNLPAnalysisStore.getState();
    nlpStore.clearCache();

    const imageStore = useImageAnalysisStore.getState();
    imageStore.clearCache();

    console.log('✅ Advanced Dashboard Infrastructure cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to cleanup advanced dashboard:', error);
  }
};

/**
 * Get advanced dashboard health status
 */
export const getAdvancedDashboardHealth = () => {
  const monitoringStore = useRealTimeMonitoringStore.getState();
  const nlpStore = useNLPAnalysisStore.getState();
  const imageStore = useImageAnalysisStore.getState();

  return {
    realTimeMonitoring: {
      connected: monitoringStore.connectionStatus.connected,
      subscriptions: monitoringStore.connectionStatus.subscriptions.length,
      latency: monitoringStore.connectionStatus.latency,
      reconnectAttempts: monitoringStore.connectionStatus.reconnectAttempts,
    },
    nlpAnalysis: {
      totalAnalyses: nlpStore.stats.totalAnalyses,
      successRate: nlpStore.stats.successRate,
      averageProcessingTime: nlpStore.stats.averageProcessingTime,
      cacheSize: nlpStore.analysisCache.size,
      isProcessing: nlpStore.isProcessing,
    },
    imageAnalysis: {
      totalAnalyses: imageStore.stats.totalAnalyses,
      successRate: imageStore.stats.successRate,
      averageProcessingTime: imageStore.stats.averageProcessingTime,
      cacheSize: imageStore.analysisCache.size,
      isProcessing: imageStore.isProcessing,
    },
  };
};

/**
 * Advanced dashboard configuration
 */
export const ADVANCED_DASHBOARD_CONFIG = {
  // Real-time monitoring settings
  monitoring: {
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000, // 30 seconds
    notificationRetention: 100,
    metricsRetention: 1000,
  },

  // NLP analysis settings
  nlp: {
    defaultLanguage: 'en',
    defaultSimilarityThreshold: 0.8,
    defaultKeywordLimit: 50,
    defaultConfidenceThreshold: 0.7,
    cacheExpiration: 3600000, // 1 hour
    batchSize: 10,
  },

  // Image analysis settings
  image: {
    defaultConfidenceThreshold: 0.7,
    defaultOcrLanguage: 'en',
    defaultMaxObjects: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
    cacheExpiration: 3600000, // 1 hour
  },

  // UI settings
  ui: {
    animationDuration: 300,
    toastDuration: 5000,
    loadingDebounce: 500,
    refreshInterval: 30000, // 30 seconds
  },

  // Performance settings
  performance: {
    virtualScrollThreshold: 100,
    lazyLoadOffset: 200,
    debounceDelay: 300,
    throttleDelay: 100,
  },
} as const;

/**
 * Utility functions for advanced dashboard features
 */
export const advancedDashboardUtils = {
  /**
   * Format processing time for display
   */
  formatProcessingTime: (milliseconds: number): string => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    }
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Format confidence score as percentage
   */
  formatConfidence: (confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
  },

  /**
   * Generate color for sentiment score
   */
  getSentimentColor: (score: number): string => {
    if (score > 0.1) return 'var(--color-status-success)';
    if (score < -0.1) return 'var(--color-status-error)';
    return 'var(--color-status-neutral)';
  },

  /**
   * Generate status color based on value and thresholds
   */
  getStatusColor: (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return 'var(--color-status-error)';
    if (value >= thresholds.warning) return 'var(--color-status-warning)';
    return 'var(--color-status-success)';
  },

  /**
   * Debounce function for performance optimization
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Throttle function for performance optimization
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  /**
   * Generate unique ID
   */
  generateId: (prefix = 'id'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  },

  /**
   * Validate image file
   */
  validateImageFile: (file: File): { valid: boolean; error?: string } => {
    const config = ADVANCED_DASHBOARD_CONFIG.image;

    // Check file size
    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${advancedDashboardUtils.formatFileSize(config.maxFileSize)}`,
      };
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !(config.supportedFormats as readonly string[]).includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file format. Supported: ${config.supportedFormats.join(', ')}`,
      };
    }

    return { valid: true };
  },

  /**
   * Calculate text complexity score
   */
  calculateTextComplexity: (text: string): 'simple' | 'moderate' | 'complex' => {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    const complexityScore = (avgWordsPerSentence * 0.6) + (avgWordLength * 0.4);

    if (complexityScore < 10) return 'simple';
    if (complexityScore < 20) return 'moderate';
    return 'complex';
  },
};