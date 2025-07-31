import { cacheService, AnalysisCacheKey } from './cacheService';

// Image Analysis interfaces
export interface ObjectDetectionResult {
  objects: {
    label: string;
    confidence: number; // 0 to 100
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    category: 'literal' | 'inferred';
  }[];
  summary: {
    totalObjects: number;
    highConfidenceObjects: number;
    categories: string[];
  };
}

export interface OCRResult {
  extractedText: string;
  textBlocks: {
    text: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  language: string;
  processingTime: number;
}

export interface ImageClassificationResult {
  primaryCategory: string;
  categories: {
    name: string;
    confidence: number;
  }[];
  imageType: 'photo' | 'graphic' | 'text' | 'mixed';
  visualFeatures: {
    dominantColors: string[];
    brightness: number;
    contrast: number;
  };
}

export interface ImageAnalysisOptions {
  confidenceThreshold?: number;
  ocrLanguage?: string;
  maxObjects?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
}

export class ImageAnalysisService {
  private static instance: ImageAnalysisService;
  private processingQueue: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  /**
   * Perform object detection on image
   */
  async detectObjects(
    imageUrl: string,
    options: ImageAnalysisOptions = {}
  ): Promise<ObjectDetectionResult> {
    const { enableCaching = true, cacheTTL = 7200 } = options; // 2 hours default
    
    // Generate cache key
    const contentHash = cacheService.generateContentHash(imageUrl);
    const cacheKey: AnalysisCacheKey = {
      type: 'objects',
      contentHash,
      options: { 
        confidenceThreshold: options.confidenceThreshold,
        maxObjects: options.maxObjects 
      }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<ObjectDetectionResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `objects_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performObjectDetection(imageUrl, options);
    this.processingQueue.set(processingKey, processingPromise);

    try {
      const result = await processingPromise;
      
      // Cache the result
      if (enableCaching) {
        await cacheService.set(cacheKey, result, cacheTTL);
      }
      
      return result;
    } finally {
      this.processingQueue.delete(processingKey);
    }
  }

  /**
   * Perform OCR on image
   */
  async extractText(
    imageUrl: string,
    options: ImageAnalysisOptions = {}
  ): Promise<OCRResult> {
    const { enableCaching = true, cacheTTL = 7200 } = options;
    
    // Generate cache key
    const contentHash = cacheService.generateContentHash(imageUrl);
    const cacheKey: AnalysisCacheKey = {
      type: 'ocr',
      contentHash,
      options: { 
        ocrLanguage: options.ocrLanguage 
      }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<OCRResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `ocr_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performOCR(imageUrl, options);
    this.processingQueue.set(processingKey, processingPromise);

    try {
      const result = await processingPromise;
      
      // Cache the result
      if (enableCaching) {
        await cacheService.set(cacheKey, result, cacheTTL);
      }
      
      return result;
    } finally {
      this.processingQueue.delete(processingKey);
    }
  }

  /**
   * Classify image content
   */
  async classifyImage(
    imageUrl: string,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageClassificationResult> {
    const { enableCaching = true, cacheTTL = 7200 } = options;
    
    // Generate cache key
    const contentHash = cacheService.generateContentHash(imageUrl);
    const cacheKey: AnalysisCacheKey = {
      type: 'image',
      contentHash,
      options: { 
        operation: 'classification',
        confidenceThreshold: options.confidenceThreshold 
      }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<ImageClassificationResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `classification_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performImageClassification(imageUrl, options);
    this.processingQueue.set(processingKey, processingPromise);

    try {
      const result = await processingPromise;
      
      // Cache the result
      if (enableCaching) {
        await cacheService.set(cacheKey, result, cacheTTL);
      }
      
      return result;
    } finally {
      this.processingQueue.delete(processingKey);
    }
  }

  /**
   * Comprehensive image analysis
   */
  async analyzeImage(
    imageUrl: string,
    analysisTypes: ('objects' | 'ocr' | 'classification')[],
    options: ImageAnalysisOptions = {}
  ): Promise<{
    objects?: ObjectDetectionResult;
    ocr?: OCRResult;
    classification?: ImageClassificationResult;
  }> {
    const results: any = {};

    // Process each analysis type in parallel
    const promises = analysisTypes.map(async (type) => {
      switch (type) {
        case 'objects':
          return { type, result: await this.detectObjects(imageUrl, options) };
        case 'ocr':
          return { type, result: await this.extractText(imageUrl, options) };
        case 'classification':
          return { type, result: await this.classifyImage(imageUrl, options) };
        default:
          return { type, result: null };
      }
    });

    const analysisResults = await Promise.all(promises);
    
    analysisResults.forEach(({ type, result }) => {
      if (result) {
        results[type] = result;
      }
    });

    return results;
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyze(
    imageUrls: string[],
    analysisTypes: ('objects' | 'ocr' | 'classification')[],
    options: ImageAnalysisOptions = {}
  ): Promise<{
    objects?: ObjectDetectionResult[];
    ocr?: OCRResult[];
    classification?: ImageClassificationResult[];
  }> {
    const results: any = {};

    // Process each analysis type
    for (const analysisType of analysisTypes) {
      const promises = imageUrls.map(imageUrl => {
        switch (analysisType) {
          case 'objects':
            return this.detectObjects(imageUrl, options);
          case 'ocr':
            return this.extractText(imageUrl, options);
          case 'classification':
            return this.classifyImage(imageUrl, options);
          default:
            return Promise.resolve(null);
        }
      });

      results[analysisType] = await Promise.all(promises);
    }

    return results;
  }

  /**
   * Invalidate cache for specific image
   */
  async invalidateCache(imageUrl: string): Promise<void> {
    const contentHash = cacheService.generateContentHash(imageUrl);
    
    // Invalidate all analysis types for this image
    const analysisTypes: ('objects' | 'ocr' | 'image')[] = [
      'objects', 'ocr', 'image'
    ];

    for (const type of analysisTypes) {
      const cacheKey: AnalysisCacheKey = {
        type,
        contentHash,
        options: {}
      };
      
      await cacheService.delete(cacheKey);
    }
  }

  /**
   * Clear all image analysis cache
   */
  async clearCache(): Promise<void> {
    await cacheService.invalidateByType('objects');
    await cacheService.invalidateByType('ocr');
    await cacheService.invalidateByType('image');
  }

  /**
   * Get cache statistics for image analysis
   */
  async getCacheStats(): Promise<any> {
    return cacheService.getStats();
  }

  // Private methods for actual analysis (mock implementations)
  private async performObjectDetection(
    imageUrl: string,
    options: ImageAnalysisOptions
  ): Promise<ObjectDetectionResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock object detection
    const mockObjects = [
      { label: 'person', category: 'literal' as const },
      { label: 'car', category: 'literal' as const },
      { label: 'tree', category: 'literal' as const },
      { label: 'building', category: 'literal' as const },
      { label: 'happiness', category: 'inferred' as const },
      { label: 'urban environment', category: 'inferred' as const }
    ];

    const numObjects = Math.floor(Math.random() * 5) + 1;
    const selectedObjects = mockObjects
      .sort(() => Math.random() - 0.5)
      .slice(0, numObjects);

    const objects = selectedObjects.map((obj, index) => ({
      label: obj.label,
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
      boundingBox: {
        x: Math.floor(Math.random() * 200),
        y: Math.floor(Math.random() * 200),
        width: Math.floor(Math.random() * 100) + 50,
        height: Math.floor(Math.random() * 100) + 50
      },
      category: obj.category
    }));

    const highConfidenceObjects = objects.filter(obj => obj.confidence >= 80).length;
    const categories = [...new Set(objects.map(obj => obj.label))];

    return {
      objects,
      summary: {
        totalObjects: objects.length,
        highConfidenceObjects,
        categories
      }
    };
  }

  private async performOCR(
    imageUrl: string,
    options: ImageAnalysisOptions
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));

    // Mock OCR results
    const mockTexts = [
      'Welcome to our store',
      'Special offer: 50% off',
      'Open 24/7',
      'Free parking available',
      'Contact us: (555) 123-4567'
    ];

    const numTexts = Math.floor(Math.random() * 3) + 1;
    const selectedTexts = mockTexts
      .sort(() => Math.random() - 0.5)
      .slice(0, numTexts);

    const textBlocks = selectedTexts.map((text, index) => ({
      text,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      boundingBox: {
        x: Math.floor(Math.random() * 100),
        y: index * 50 + Math.floor(Math.random() * 20),
        width: text.length * 8 + Math.floor(Math.random() * 50),
        height: 30 + Math.floor(Math.random() * 20)
      }
    }));

    const extractedText = textBlocks.map(block => block.text).join('\n');

    return {
      extractedText,
      textBlocks,
      language: options.ocrLanguage || 'en',
      processingTime: Date.now() - startTime
    };
  }

  private async performImageClassification(
    imageUrl: string,
    options: ImageAnalysisOptions
  ): Promise<ImageClassificationResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1000));

    // Mock classification results
    const mockCategories = [
      { name: 'outdoor', confidence: 85 },
      { name: 'urban', confidence: 78 },
      { name: 'daytime', confidence: 92 },
      { name: 'people', confidence: 65 },
      { name: 'architecture', confidence: 71 }
    ];

    const selectedCategories = mockCategories
      .filter(cat => cat.confidence >= (options.confidenceThreshold || 60))
      .sort((a, b) => b.confidence - a.confidence);

    const imageTypes: ('photo' | 'graphic' | 'text' | 'mixed')[] = 
      ['photo', 'graphic', 'text', 'mixed'];
    const imageType = imageTypes[Math.floor(Math.random() * imageTypes.length)];

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const dominantColors = colors
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2);

    return {
      primaryCategory: selectedCategories[0]?.name || 'unknown',
      categories: selectedCategories,
      imageType,
      visualFeatures: {
        dominantColors,
        brightness: Math.floor(Math.random() * 100),
        contrast: Math.floor(Math.random() * 100)
      }
    };
  }
}

// Export singleton instance
export const imageAnalysisService = ImageAnalysisService.getInstance();
export default imageAnalysisService;