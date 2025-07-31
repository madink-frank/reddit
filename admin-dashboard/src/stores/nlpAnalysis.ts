import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  NLPAnalysisRequest,
  NLPAnalysisResult,
} from '@/types/advanced-dashboard';

interface NLPAnalysisState {
  // Current analysis data
  currentAnalysis: NLPAnalysisResult | null;
  analysisHistory: NLPAnalysisResult[];

  // Processing states
  isProcessing: boolean;
  processingQueue: NLPAnalysisRequest[];

  // Cache for results
  analysisCache: Map<string, NLPAnalysisResult>;

  // Configuration
  defaultOptions: {
    language: string;
    similarityThreshold: number;
    keywordLimit: number;
    confidenceThreshold: number;
  };

  // Statistics
  stats: {
    totalAnalyses: number;
    totalPointsSpent: number;
    averageProcessingTime: number;
    successRate: number;
  };

  // Actions
  startAnalysis: (request: NLPAnalysisRequest) => Promise<string>;
  getAnalysisResult: (id: string) => NLPAnalysisResult | null;
  clearAnalysisHistory: () => void;
  updateDefaultOptions: (options: Partial<NLPAnalysisState['defaultOptions']>) => void;

  // Batch operations
  startBatchAnalysis: (requests: NLPAnalysisRequest[]) => Promise<string[]>;
  getBatchResults: (ids: string[]) => NLPAnalysisResult[];

  // Cache management
  getCachedResult: (textHash: string) => NLPAnalysisResult | null;
  setCachedResult: (textHash: string, result: NLPAnalysisResult) => void;
  clearCache: () => void;

  // Utility functions
  calculateTextHash: (text: string) => string;
  updateStats: (result: NLPAnalysisResult) => void;
}

export const useNLPAnalysisStore = create<NLPAnalysisState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentAnalysis: null,
      analysisHistory: [],
      isProcessing: false,
      processingQueue: [],
      analysisCache: new Map(),

      defaultOptions: {
        language: 'en',
        similarityThreshold: 0.8,
        keywordLimit: 50,
        confidenceThreshold: 0.7,
      },

      stats: {
        totalAnalyses: 0,
        totalPointsSpent: 0,
        averageProcessingTime: 0,
        successRate: 0,
      },

      // Analysis actions
      startAnalysis: async (request: NLPAnalysisRequest) => {
        const analysisId = `nlp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const textHash = get().calculateTextHash(request.text);

        // Check cache first
        const cachedResult = get().getCachedResult(textHash);
        if (cachedResult) {
          set((state) => {
            state.currentAnalysis = cachedResult;
          });
          return cachedResult.id;
        }

        set((state) => {
          state.isProcessing = true;
          state.processingQueue.push(request);
        });

        try {
          // Simulate API call - replace with actual API integration
          const result: NLPAnalysisResult = {
            id: analysisId,
            requestId: analysisId,
            text: request.text,
            processedAt: new Date(),
            processingTime: Math.random() * 5000 + 1000, // 1-6 seconds
            pointsConsumed: request.analysisTypes.length * 2, // 2 points per analysis type
            status: 'processing',
          };

          // Add to history immediately
          set((state) => {
            state.analysisHistory.unshift(result);
            state.currentAnalysis = result;
          });

          // Simulate processing delay
          setTimeout(() => {
            const completedResult: NLPAnalysisResult = {
              ...result,
              status: 'completed',
              // Add mock analysis results based on request types
              morphological: request.analysisTypes.includes('morphological') ? {
                morphemes: [
                  {
                    text: 'example',
                    pos: 'noun',
                    lemma: 'example',
                    features: ['singular'],
                    confidence: 0.95,
                  },
                ],
                structure: {
                  root: 'example',
                  prefixes: [],
                  suffixes: [],
                },
                linguisticFeatures: {
                  wordCount: request.text.split(' ').length,
                  sentenceCount: request.text.split('.').length,
                  averageWordLength: request.text.replace(/\s/g, '').length / request.text.split(' ').length,
                  complexity: 'moderate',
                },
              } : undefined,

              sentiment: request.analysisTypes.includes('sentiment') ? {
                score: Math.random() * 2 - 1, // -1 to 1
                confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1
                label: Math.random() > 0.5 ? 'positive' : 'negative',
                breakdown: {
                  positive: Math.random() * 0.6 + 0.2,
                  negative: Math.random() * 0.4 + 0.1,
                  neutral: Math.random() * 0.3 + 0.1,
                },
              } : undefined,

              keywords: request.analysisTypes.includes('keywords') ? {
                keywords: [
                  {
                    word: 'example',
                    frequency: 3,
                    importance: 0.8,
                    context: ['example context'],
                    sentiment: 0.2,
                  },
                ],
                phrases: [
                  {
                    phrase: 'example phrase',
                    frequency: 2,
                    importance: 0.6,
                  },
                ],
                wordCloud: [
                  {
                    word: 'example',
                    size: 24,
                    color: '#3b82f6',
                    weight: 0.8,
                  },
                ],
                categories: [
                  {
                    category: 'general',
                    keywords: ['example'],
                    relevance: 0.7,
                  },
                ],
              } : undefined,
            };

            set((state) => {
              // Update in history
              const index = state.analysisHistory.findIndex(a => a.id === analysisId);
              if (index !== -1) {
                state.analysisHistory[index] = completedResult;
              }

              // Update current if it's the same
              if (state.currentAnalysis?.id === analysisId) {
                state.currentAnalysis = completedResult;
              }

              // Cache the result
              state.analysisCache.set(textHash, completedResult);

              // Update stats
              state.stats.totalAnalyses++;
              state.stats.totalPointsSpent += completedResult.pointsConsumed;
              state.stats.averageProcessingTime =
                (state.stats.averageProcessingTime * (state.stats.totalAnalyses - 1) + completedResult.processingTime) /
                state.stats.totalAnalyses;

              // Remove from processing queue
              state.processingQueue = state.processingQueue.filter(req => req.text !== request.text);
              state.isProcessing = state.processingQueue.length > 0;
            });
          }, Math.random() * 3000 + 2000); // 2-5 seconds processing time

          return analysisId;
        } catch (error) {
          set((state) => {
            state.isProcessing = false;
            state.processingQueue = state.processingQueue.filter(req => req.text !== request.text);
          });
          throw error;
        }
      },

      getAnalysisResult: (id: string) => {
        const state = get();
        return state.analysisHistory.find(analysis => analysis.id === id) || null;
      },

      clearAnalysisHistory: () => {
        set((state) => {
          state.analysisHistory = [];
          state.currentAnalysis = null;
        });
      },

      updateDefaultOptions: (options) => {
        set((state) => {
          Object.assign(state.defaultOptions, options);
        });
      },

      // Batch operations
      startBatchAnalysis: async (requests: NLPAnalysisRequest[]) => {
        const ids: string[] = [];

        for (const request of requests) {
          try {
            const id = await get().startAnalysis(request);
            ids.push(id);
          } catch (error) {
            console.error('Batch analysis failed for request:', request, error);
          }
        }

        return ids;
      },

      getBatchResults: (ids: string[]) => {
        const state = get();
        return ids.map(id => state.getAnalysisResult(id)).filter(Boolean) as NLPAnalysisResult[];
      },

      // Cache management
      getCachedResult: (textHash: string) => {
        return get().analysisCache.get(textHash) || null;
      },

      setCachedResult: (textHash: string, result: NLPAnalysisResult) => {
        set((state) => {
          state.analysisCache.set(textHash, result);
        });
      },

      clearCache: () => {
        set((state) => {
          state.analysisCache.clear();
        });
      },

      // Utility functions
      calculateTextHash: (text: string) => {
        // Simple hash function - replace with proper hashing in production
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          const char = text.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
      },

      updateStats: (result: NLPAnalysisResult) => {
        set((state) => {
          state.stats.totalAnalyses++;
          state.stats.totalPointsSpent += result.pointsConsumed;
          state.stats.averageProcessingTime =
            (state.stats.averageProcessingTime * (state.stats.totalAnalyses - 1) + result.processingTime) /
            state.stats.totalAnalyses;

          // Calculate success rate
          const successfulAnalyses = state.analysisHistory.filter(a => a.status === 'completed').length;
          state.stats.successRate = successfulAnalyses / state.stats.totalAnalyses;
        });
      },


    }))
  )
);

// Real-time updates function - defined after store creation to avoid circular reference
export const subscribeToNLPUpdates = (callback: (result: NLPAnalysisResult) => void) => {
  return useNLPAnalysisStore.subscribe(
    (state) => state.currentAnalysis,
    (currentAnalysis) => {
      if (currentAnalysis) {
        callback(currentAnalysis);
      }
    }
  );
};

// Utility hooks for specific NLP features
export const useNLPMorphological = () => {
  const startAnalysis = useNLPAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useNLPAnalysisStore((state) => state.currentAnalysis);

  const analyzeMorphology = async (text: string) => {
    return startAnalysis({
      text,
      analysisTypes: ['morphological'],
    });
  };

  return {
    analyzeMorphology,
    result: currentAnalysis?.morphological,
    isProcessing: useNLPAnalysisStore((state) => state.isProcessing),
  };
};

export const useNLPSentiment = () => {
  const startAnalysis = useNLPAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useNLPAnalysisStore((state) => state.currentAnalysis);

  const analyzeSentiment = async (text: string) => {
    return startAnalysis({
      text,
      analysisTypes: ['sentiment'],
    });
  };

  return {
    analyzeSentiment,
    result: currentAnalysis?.sentiment,
    isProcessing: useNLPAnalysisStore((state) => state.isProcessing),
  };
};

export const useNLPKeywords = () => {
  const startAnalysis = useNLPAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useNLPAnalysisStore((state) => state.currentAnalysis);
  const defaultOptions = useNLPAnalysisStore((state) => state.defaultOptions);

  const extractKeywords = async (text: string, limit?: number) => {
    return startAnalysis({
      text,
      analysisTypes: ['keywords'],
      options: {
        keywordLimit: limit || defaultOptions.keywordLimit,
      },
    });
  };

  return {
    extractKeywords,
    result: currentAnalysis?.keywords,
    isProcessing: useNLPAnalysisStore((state) => state.isProcessing),
  };
};

export const useNLPSimilarity = () => {
  const startAnalysis = useNLPAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useNLPAnalysisStore((state) => state.currentAnalysis);
  const defaultOptions = useNLPAnalysisStore((state) => state.defaultOptions);

  const compareSimilarity = async (text1: string, text2: string) => {
    // For similarity, we'll analyze both texts and compare
    // This is a simplified approach - in production, you'd have a dedicated similarity endpoint
    return startAnalysis({
      text: `${text1}\n---COMPARE---\n${text2}`,
      analysisTypes: ['similarity'],
      options: {
        similarityThreshold: defaultOptions.similarityThreshold,
      },
    });
  };

  return {
    compareSimilarity,
    result: currentAnalysis?.similarity,
    isProcessing: useNLPAnalysisStore((state) => state.isProcessing),
  };
};