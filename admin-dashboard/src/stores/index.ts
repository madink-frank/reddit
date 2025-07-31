// Advanced Dashboard Store Exports

// Core stores
export { useNLPAnalysisStore } from './nlpAnalysis';
export { useImageAnalysisStore } from './imageAnalysis';
export { useRealTimeMonitoringStore } from './realTimeMonitoring';

// Existing stores
export { useAuthStore } from './auth';
export { useUIStore } from './ui';
export { useFiltersStore } from './filters';

// Store utilities and hooks
export * from './nlpAnalysis';
export * from './imageAnalysis';
export * from './realTimeMonitoring';

// Combined store hook for advanced dashboard
import { useNLPAnalysisStore } from './nlpAnalysis';
import { useImageAnalysisStore } from './imageAnalysis';
import { useRealTimeMonitoringStore } from './realTimeMonitoring';

export const useAdvancedDashboardStores = () => {
  const nlpStore = useNLPAnalysisStore();
  const imageStore = useImageAnalysisStore();
  const monitoringStore = useRealTimeMonitoringStore();
  
  return {
    nlp: nlpStore,
    image: imageStore,
    monitoring: monitoringStore,
  };
};

// Store initialization utility
export const initializeAdvancedStores = async () => {
  try {
    // Initialize real-time monitoring connection
    const monitoringStore = useRealTimeMonitoringStore.getState();
    await monitoringStore.connect();
    
    // Set up default NLP options
    const nlpStore = useNLPAnalysisStore.getState();
    nlpStore.updateDefaultOptions({
      language: 'en',
      similarityThreshold: 0.8,
      keywordLimit: 50,
      confidenceThreshold: 0.7,
    });
    
    // Set up default image analysis options
    const imageStore = useImageAnalysisStore.getState();
    imageStore.updateDefaultOptions({
      confidenceThreshold: 0.7,
      ocrLanguage: 'en',
      maxObjects: 20,
      detectFaces: false,
      extractColors: true,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize advanced stores:', error);
    return { success: false, error };
  }
};

// Store cleanup utility
export const cleanupAdvancedStores = () => {
  try {
    const monitoringStore = useRealTimeMonitoringStore.getState();
    monitoringStore.disconnect();
    
    const nlpStore = useNLPAnalysisStore.getState();
    nlpStore.clearCache();
    
    const imageStore = useImageAnalysisStore.getState();
    imageStore.clearCache();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to cleanup advanced stores:', error);
    return { success: false, error };
  }
};