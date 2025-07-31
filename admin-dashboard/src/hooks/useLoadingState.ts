/**
 * Enhanced Loading State Hook
 * 
 * Provides time-based loading feedback and state management
 * according to UI design improvements spec task 11
 */

import { useState, useEffect, useCallback } from 'react';

interface LoadingStateOptions {
  initialMessage?: string;
  timeThresholds?: {
    normal: number;      // Default: 2000ms
    slow: number;        // Default: 5000ms
    verySlow: number;    // Default: 10000ms
  };
  messages?: {
    normal: string;
    slow: string;
    verySlow: string;
    timeout: string;
  };
  timeout?: number;      // Auto-timeout after this duration
  onTimeout?: () => void;
}

interface LoadingState {
  isLoading: boolean;
  message: string;
  duration: number;
  phase: 'normal' | 'slow' | 'very-slow' | 'timeout';
  progress?: number;
}

const defaultOptions: Required<LoadingStateOptions> = {
  initialMessage: 'Loading...',
  timeThresholds: {
    normal: 2000,
    slow: 5000,
    verySlow: 10000
  },
  messages: {
    normal: 'Loading...',
    slow: 'Still loading, please wait...',
    verySlow: 'This is taking longer than usual...',
    timeout: 'Loading is taking too long. Please try again.'
  },
  timeout: 30000, // 30 seconds
  onTimeout: () => {}
};

export function useLoadingState(options: LoadingStateOptions = {}) {
  const config = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    message: config.initialMessage,
    duration: 0,
    phase: 'normal'
  });

  const [startTime, setStartTime] = useState<number | null>(null);

  // Start loading
  const startLoading = useCallback((initialProgress?: number) => {
    const now = Date.now();
    setStartTime(now);
    setState({
      isLoading: true,
      message: config.messages.normal,
      duration: 0,
      phase: 'normal',
      progress: initialProgress
    });
  }, [config.messages.normal]);

  // Stop loading
  const stopLoading = useCallback(() => {
    setStartTime(null);
    setState(prev => ({
      ...prev,
      isLoading: false,
      duration: 0,
      phase: 'normal'
    }));
  }, []);

  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100)
    }));
  }, []);

  // Update loading message manually
  const updateMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message
    }));
  }, []);

  // Effect to handle time-based updates
  useEffect(() => {
    if (!state.isLoading || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      let newPhase: LoadingState['phase'] = 'normal';
      let newMessage = config.messages.normal;

      if (elapsed >= config.timeThresholds.verySlow) {
        newPhase = 'very-slow';
        newMessage = config.messages.verySlow;
      } else if (elapsed >= config.timeThresholds.slow) {
        newPhase = 'slow';
        newMessage = config.messages.slow;
      }

      // Check for timeout
      if (config.timeout && elapsed >= config.timeout) {
        newPhase = 'timeout';
        newMessage = config.messages.timeout;
        config.onTimeout();
        stopLoading();
        return;
      }

      setState(prev => ({
        ...prev,
        duration: elapsed,
        phase: newPhase,
        message: newMessage
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [
    state.isLoading,
    startTime,
    config.timeThresholds,
    config.messages,
    config.timeout,
    config.onTimeout,
    stopLoading
  ]);

  return {
    ...state,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    // Utility methods
    isNormalLoading: state.phase === 'normal',
    isSlowLoading: state.phase === 'slow',
    isVerySlowLoading: state.phase === 'very-slow',
    hasTimedOut: state.phase === 'timeout',
    // Formatted duration
    formattedDuration: state.duration > 0 ? `${Math.round(state.duration / 1000)}s` : '0s'
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const startLoading = useCallback((key: string, options?: LoadingStateOptions) => {
    const config = { ...defaultOptions, ...options };
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        message: config.messages.normal,
        duration: 0,
        phase: 'normal'
      }
    }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const updateProgress = useCallback((key: string, progress: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.min(Math.max(progress, 0), 100)
      }
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key]?.isLoading || false;
    }
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates[key] || {
      isLoading: false,
      message: '',
      duration: 0,
      phase: 'normal' as const
    };
  }, [loadingStates]);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    updateProgress,
    isLoading,
    getLoadingState,
    // Utility methods
    loadingCount: Object.keys(loadingStates).length,
    loadingKeys: Object.keys(loadingStates)
  };
}

// Hook for progressive loading with stages
export function useProgressiveLoading(stages: string[]) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const loadingState = useLoadingState({
    initialMessage: stages[0] || 'Loading...'
  });

  const nextStage = useCallback(() => {
    if (currentStage < stages.length - 1) {
      const nextStageIndex = currentStage + 1;
      setCurrentStage(nextStageIndex);
      setStageProgress(0);
      loadingState.updateMessage(stages[nextStageIndex]);
    }
  }, [currentStage, stages, loadingState]);

  const updateStageProgress = useCallback((progress: number) => {
    setStageProgress(progress);
    // Calculate overall progress
    const overallProgress = ((currentStage + (progress / 100)) / stages.length) * 100;
    loadingState.updateProgress(overallProgress);
  }, [currentStage, stages.length, loadingState]);

  const reset = useCallback(() => {
    setCurrentStage(0);
    setStageProgress(0);
    loadingState.stopLoading();
  }, [loadingState]);

  return {
    ...loadingState,
    currentStage,
    stageProgress,
    stageName: stages[currentStage] || '',
    totalStages: stages.length,
    nextStage,
    updateStageProgress,
    reset,
    isLastStage: currentStage === stages.length - 1
  };
}

export default useLoadingState;