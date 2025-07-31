import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ImageAnalysisRequest,
  ImageAnalysisResult,
} from '@/types/advanced-dashboard';

interface ImageAnalysisState {
  // Current analysis data
  currentAnalysis: ImageAnalysisResult | null;
  analysisHistory: ImageAnalysisResult[];

  // Processing states
  isProcessing: boolean;
  processingQueue: ImageAnalysisRequest[];

  // Cache for results
  analysisCache: Map<string, ImageAnalysisResult>;

  // Configuration
  defaultOptions: {
    confidenceThreshold: number;
    ocrLanguage: string;
    maxObjects: number;
    detectFaces: boolean;
    extractColors: boolean;
  };

  // Statistics
  stats: {
    totalAnalyses: number;
    totalPointsSpent: number;
    averageProcessingTime: number;
    successRate: number;
    analysisTypeBreakdown: Record<string, number>;
  };

  // Actions
  startAnalysis: (request: ImageAnalysisRequest) => Promise<string>;
  getAnalysisResult: (id: string) => ImageAnalysisResult | null;
  clearAnalysisHistory: () => void;
  updateDefaultOptions: (options: Partial<ImageAnalysisState['defaultOptions']>) => void;

  // Batch operations
  startBatchAnalysis: (requests: ImageAnalysisRequest[]) => Promise<string[]>;
  getBatchResults: (ids: string[]) => ImageAnalysisResult[];

  // Cache management
  getCachedResult: (imageHash: string) => ImageAnalysisResult | null;
  setCachedResult: (imageHash: string, result: ImageAnalysisResult) => void;
  clearCache: () => void;

  // Utility functions
  calculateImageHash: (imageUrl: string) => string;
  updateStats: (result: ImageAnalysisResult) => void;

  // File handling
  uploadImage: (file: File) => Promise<string>;
  getImagePreview: (imageUrl: string) => Promise<string>;
}

export const useImageAnalysisStore = create<ImageAnalysisState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentAnalysis: null,
      analysisHistory: [],
      isProcessing: false,
      processingQueue: [],
      analysisCache: new Map(),

      defaultOptions: {
        confidenceThreshold: 0.7,
        ocrLanguage: 'en',
        maxObjects: 20,
        detectFaces: false,
        extractColors: true,
      },

      stats: {
        totalAnalyses: 0,
        totalPointsSpent: 0,
        averageProcessingTime: 0,
        successRate: 0,
        analysisTypeBreakdown: {},
      },

      // Analysis actions
      startAnalysis: async (request: ImageAnalysisRequest) => {
        const analysisId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const imageUrl = request.imageUrl || (request.imageFile ? URL.createObjectURL(request.imageFile) : '');
        const imageHash = get().calculateImageHash(imageUrl);

        // Check cache first
        const cachedResult = get().getCachedResult(imageHash);
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
          const result: ImageAnalysisResult = {
            id: analysisId,
            requestId: analysisId,
            imageUrl,
            processedAt: new Date(),
            processingTime: Math.random() * 8000 + 2000, // 2-10 seconds
            pointsConsumed: request.analysisTypes.length * 3, // 3 points per analysis type
            status: 'processing',
          };

          // Add to history immediately
          set((state) => {
            state.analysisHistory.unshift(result);
            state.currentAnalysis = result;
          });

          // Simulate processing delay
          setTimeout(() => {
            const completedResult: ImageAnalysisResult = {
              ...result,
              status: 'completed',

              // Add mock analysis results based on request types
              objectDetection: request.analysisTypes.includes('objects') ? {
                objects: [
                  {
                    label: 'person',
                    confidence: 85.5,
                    boundingBox: { x: 100, y: 50, width: 200, height: 300 },
                    category: 'literal',
                    attributes: {
                      color: 'blue',
                      size: 'medium',
                      position: 'foreground',
                    },
                  },
                  {
                    label: 'building',
                    confidence: 92.3,
                    boundingBox: { x: 300, y: 20, width: 400, height: 500 },
                    category: 'literal',
                  },
                ],
                summary: {
                  totalObjects: 2,
                  highConfidenceObjects: 2,
                  categories: ['person', 'building'],
                  dominantObjects: ['building', 'person'],
                },
              } : undefined,

              ocr: request.analysisTypes.includes('ocr') ? {
                extractedText: 'Sample extracted text from image',
                textBlocks: [
                  {
                    text: 'Sample text',
                    confidence: 95.2,
                    boundingBox: { x: 50, y: 100, width: 150, height: 30 },
                    language: 'en',
                    fontSize: 14,
                    fontStyle: 'regular',
                  },
                ],
                metadata: {
                  language: 'en',
                  textOrientation: 0,
                  processingTime: 1500,
                },
                structure: {
                  paragraphs: ['Sample extracted text from image'],
                  lines: ['Sample extracted text from image'],
                  words: ['Sample', 'extracted', 'text', 'from', 'image'],
                },
              } : undefined,

              classification: request.analysisTypes.includes('classification') ? {
                primaryCategory: 'photograph',
                categories: [
                  { name: 'photograph', confidence: 95.8 },
                  { name: 'outdoor', confidence: 87.2 },
                  { name: 'urban', confidence: 73.5 },
                ],
                imageType: 'photo',
                visualFeatures: {
                  dominantColors: [
                    { color: 'blue', percentage: 35.2, hex: '#3b82f6' },
                    { color: 'gray', percentage: 28.7, hex: '#6b7280' },
                    { color: 'white', percentage: 20.1, hex: '#ffffff' },
                  ],
                  brightness: 65.3,
                  contrast: 72.8,
                  saturation: 58.9,
                  sharpness: 81.2,
                },
                technicalInfo: {
                  width: 1920,
                  height: 1080,
                  format: 'JPEG',
                  fileSize: 245760, // bytes
                  quality: 'high',
                },
              } : undefined,

              faceDetection: request.analysisTypes.includes('faces') ? {
                faces: [
                  {
                    boundingBox: { x: 120, y: 80, width: 100, height: 120 },
                    confidence: 94.7,
                    attributes: {
                      age: 28,
                      gender: 'female',
                      emotion: {
                        dominant: 'happy',
                        scores: {
                          happy: 0.85,
                          neutral: 0.10,
                          sad: 0.03,
                          angry: 0.02,
                        },
                      },
                      landmarks: {
                        leftEye: { x: 140, y: 110 },
                        rightEye: { x: 180, y: 110 },
                        nose: { x: 160, y: 130 },
                        mouth: { x: 160, y: 150 },
                      },
                    },
                  },
                ],
                summary: {
                  totalFaces: 1,
                  averageConfidence: 94.7,
                  demographics: {
                    ageGroups: { '20-30': 1 },
                    genderDistribution: { female: 1 },
                  },
                },
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
              state.analysisCache.set(imageHash, completedResult);

              // Update stats
              state.stats.totalAnalyses++;
              state.stats.totalPointsSpent += completedResult.pointsConsumed;
              state.stats.averageProcessingTime =
                (state.stats.averageProcessingTime * (state.stats.totalAnalyses - 1) + completedResult.processingTime) /
                state.stats.totalAnalyses;

              // Update analysis type breakdown
              request.analysisTypes.forEach(type => {
                state.stats.analysisTypeBreakdown[type] = (state.stats.analysisTypeBreakdown[type] || 0) + 1;
              });

              // Remove from processing queue
              state.processingQueue = state.processingQueue.filter(req =>
                req.imageUrl !== request.imageUrl && req.imageFile !== request.imageFile
              );
              state.isProcessing = state.processingQueue.length > 0;
            });
          }, Math.random() * 5000 + 3000); // 3-8 seconds processing time

          return analysisId;
        } catch (error) {
          set((state) => {
            state.isProcessing = false;
            state.processingQueue = state.processingQueue.filter(req =>
              req.imageUrl !== request.imageUrl && req.imageFile !== request.imageFile
            );
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
      startBatchAnalysis: async (requests: ImageAnalysisRequest[]) => {
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
        return ids.map(id => state.getAnalysisResult(id)).filter(Boolean) as ImageAnalysisResult[];
      },

      // Cache management
      getCachedResult: (imageHash: string) => {
        return get().analysisCache.get(imageHash) || null;
      },

      setCachedResult: (imageHash: string, result: ImageAnalysisResult) => {
        set((state) => {
          state.analysisCache.set(imageHash, result);
        });
      },

      clearCache: () => {
        set((state) => {
          state.analysisCache.clear();
        });
      },

      // Utility functions
      calculateImageHash: (imageUrl: string) => {
        // Simple hash function - replace with proper hashing in production
        let hash = 0;
        for (let i = 0; i < imageUrl.length; i++) {
          const char = imageUrl.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
      },

      updateStats: (result: ImageAnalysisResult) => {
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

      // File handling
      uploadImage: async (file: File) => {
        // Simulate file upload - replace with actual upload logic
        return new Promise((resolve) => {
          setTimeout(() => {
            const url = URL.createObjectURL(file);
            resolve(url);
          }, 1000);
        });
      },

      getImagePreview: async (imageUrl: string) => {
        // Return the image URL for preview - in production, might need thumbnail generation
        return imageUrl;
      },


    }))
  )
);

// Real-time updates function - defined after store creation to avoid circular reference
export const subscribeToImageUpdates = (callback: (result: ImageAnalysisResult) => void) => {
  return useImageAnalysisStore.subscribe(
    (state) => state.currentAnalysis,
    (currentAnalysis) => {
      if (currentAnalysis) {
        callback(currentAnalysis);
      }
    }
  );
};

// Utility hooks for specific image analysis features
export const useImageObjectDetection = () => {
  const startAnalysis = useImageAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useImageAnalysisStore((state) => state.currentAnalysis);
  const defaultOptions = useImageAnalysisStore((state) => state.defaultOptions);

  const detectObjects = async (imageUrl: string, options?: { maxObjects?: number; confidenceThreshold?: number }) => {
    return startAnalysis({
      imageUrl,
      analysisTypes: ['objects'],
      options: {
        maxObjects: options?.maxObjects || defaultOptions.maxObjects,
        confidenceThreshold: options?.confidenceThreshold || defaultOptions.confidenceThreshold,
      },
    });
  };

  return {
    detectObjects,
    result: currentAnalysis?.objectDetection,
    isProcessing: useImageAnalysisStore((state) => state.isProcessing),
  };
};

export const useImageOCR = () => {
  const startAnalysis = useImageAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useImageAnalysisStore((state) => state.currentAnalysis);
  const defaultOptions = useImageAnalysisStore((state) => state.defaultOptions);

  const extractText = async (imageUrl: string, language?: string) => {
    return startAnalysis({
      imageUrl,
      analysisTypes: ['ocr'],
      options: {
        ocrLanguage: language || defaultOptions.ocrLanguage,
      },
    });
  };

  return {
    extractText,
    result: currentAnalysis?.ocr,
    isProcessing: useImageAnalysisStore((state) => state.isProcessing),
  };
};

export const useImageClassification = () => {
  const startAnalysis = useImageAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useImageAnalysisStore((state) => state.currentAnalysis);
  const defaultOptions = useImageAnalysisStore((state) => state.defaultOptions);

  const classifyImage = async (imageUrl: string) => {
    return startAnalysis({
      imageUrl,
      analysisTypes: ['classification'],
      options: {
        extractColors: defaultOptions.extractColors,
      },
    });
  };

  return {
    classifyImage,
    result: currentAnalysis?.classification,
    isProcessing: useImageAnalysisStore((state) => state.isProcessing),
  };
};

export const useImageFaceDetection = () => {
  const startAnalysis = useImageAnalysisStore((state) => state.startAnalysis);
  const currentAnalysis = useImageAnalysisStore((state) => state.currentAnalysis);
  const defaultOptions = useImageAnalysisStore((state) => state.defaultOptions);

  const detectFaces = async (imageUrl: string) => {
    return startAnalysis({
      imageUrl,
      analysisTypes: ['faces'],
      options: {
        detectFaces: true,
        confidenceThreshold: defaultOptions.confidenceThreshold,
      },
    });
  };

  return {
    detectFaces,
    result: currentAnalysis?.faceDetection,
    isProcessing: useImageAnalysisStore((state) => state.isProcessing),
  };
};