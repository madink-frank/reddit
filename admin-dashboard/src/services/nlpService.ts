import { cacheService, AnalysisCacheKey } from './cacheService';

// NLP Analysis interfaces
export interface SentimentResult {
  score: number; // -1 to 1
  confidence: number;
  label: 'positive' | 'negative' | 'neutral';
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface MorphologicalResult {
  morphemes: {
    text: string;
    pos: string; // part of speech
    lemma: string;
    features: string[];
  }[];
  structure: {
    root: string;
    prefixes: string[];
    suffixes: string[];
  };
}

export interface KeywordResult {
  keywords: {
    word: string;
    frequency: number;
    importance: number;
  }[];
  wordCloud: {
    word: string;
    size: number;
    color: string;
  }[];
}

export interface SimilarityResult {
  similarityScore: number; // 0 to 100
  matchedSegments: {
    text1: string;
    text2: string;
    similarity: number;
  }[];
}

export interface NLPAnalysisOptions {
  language?: string;
  similarityThreshold?: number;
  keywordLimit?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
}

export class NLPService {
  private static instance: NLPService;
  private processingQueue: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  /**
   * Perform sentiment analysis on text
   */
  async analyzeSentiment(
    text: string, 
    options: NLPAnalysisOptions = {}
  ): Promise<SentimentResult> {
    const { enableCaching = true, cacheTTL = 3600 } = options;
    
    // Generate cache key
    const contentHash = cacheService.generateContentHash(text);
    const cacheKey: AnalysisCacheKey = {
      type: 'sentiment',
      contentHash,
      options: { language: options.language }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<SentimentResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `sentiment_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performSentimentAnalysis(text, options);
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
   * Perform morphological analysis on text
   */
  async analyzeMorphology(
    text: string, 
    options: NLPAnalysisOptions = {}
  ): Promise<MorphologicalResult> {
    const { enableCaching = true, cacheTTL = 3600 } = options;
    
    // Generate cache key
    const contentHash = cacheService.generateContentHash(text);
    const cacheKey: AnalysisCacheKey = {
      type: 'morphological',
      contentHash,
      options: { language: options.language }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<MorphologicalResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `morphological_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performMorphologicalAnalysis(text, options);
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
   * Extract keywords from text
   */
  async extractKeywords(
    text: string, 
    options: NLPAnalysisOptions = {}
  ): Promise<KeywordResult> {
    const { enableCaching = true, cacheTTL = 3600 } = options;
    
    // Generate cache key
    const contentHash = cacheService.generateContentHash(text);
    const cacheKey: AnalysisCacheKey = {
      type: 'keywords',
      contentHash,
      options: { 
        language: options.language,
        keywordLimit: options.keywordLimit 
      }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<KeywordResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `keywords_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performKeywordExtraction(text, options);
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
   * Calculate text similarity
   */
  async calculateSimilarity(
    text1: string,
    text2: string,
    options: NLPAnalysisOptions = {}
  ): Promise<SimilarityResult> {
    const { enableCaching = true, cacheTTL = 3600 } = options;
    
    // Generate cache key based on both texts
    const combinedText = `${text1}|||${text2}`;
    const contentHash = cacheService.generateContentHash(combinedText);
    const cacheKey: AnalysisCacheKey = {
      type: 'nlp',
      contentHash,
      options: { 
        operation: 'similarity',
        similarityThreshold: options.similarityThreshold 
      }
    };

    // Try to get from cache first
    if (enableCaching) {
      const cachedResult = await cacheService.get<SimilarityResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if already processing
    const processingKey = `similarity_${contentHash}`;
    if (this.processingQueue.has(processingKey)) {
      return this.processingQueue.get(processingKey)!;
    }

    // Start processing
    const processingPromise = this.performSimilarityAnalysis(text1, text2, options);
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
   * Batch analyze multiple texts
   */
  async batchAnalyze(
    texts: string[],
    analysisTypes: ('sentiment' | 'morphological' | 'keywords')[],
    options: NLPAnalysisOptions = {}
  ): Promise<{
    sentiment?: SentimentResult[];
    morphological?: MorphologicalResult[];
    keywords?: KeywordResult[];
  }> {
    const results: any = {};

    // Process each analysis type
    for (const analysisType of analysisTypes) {
      const promises = texts.map(text => {
        switch (analysisType) {
          case 'sentiment':
            return this.analyzeSentiment(text, options);
          case 'morphological':
            return this.analyzeMorphology(text, options);
          case 'keywords':
            return this.extractKeywords(text, options);
          default:
            return Promise.resolve(null);
        }
      });

      results[analysisType] = await Promise.all(promises);
    }

    return results;
  }

  /**
   * Invalidate cache for specific content
   */
  async invalidateCache(text: string): Promise<void> {
    const contentHash = cacheService.generateContentHash(text);
    
    // Invalidate all analysis types for this content
    const analysisTypes: ('sentiment' | 'morphological' | 'keywords')[] = [
      'sentiment', 'morphological', 'keywords'
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
   * Clear all NLP cache
   */
  async clearCache(): Promise<void> {
    await cacheService.invalidateByType('sentiment');
    await cacheService.invalidateByType('morphological');
    await cacheService.invalidateByType('keywords');
    await cacheService.invalidateByType('nlp');
  }

  // Private methods for actual analysis (mock implementations)
  private async performSentimentAnalysis(
    text: string, 
    options: NLPAnalysisOptions
  ): Promise<SentimentResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Mock sentiment analysis
    const words = text.toLowerCase().split(/\s+/);
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate'];

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords > 0 
      ? (positiveCount - negativeCount) / totalSentimentWords 
      : 0;

    const positive = totalSentimentWords > 0 ? positiveCount / totalSentimentWords : 0.33;
    const negative = totalSentimentWords > 0 ? negativeCount / totalSentimentWords : 0.33;
    const neutral = 1 - positive - negative;

    return {
      score,
      confidence: Math.min(0.95, 0.5 + Math.abs(score) * 0.5),
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      breakdown: {
        positive: Math.round(positive * 100) / 100,
        negative: Math.round(negative * 100) / 100,
        neutral: Math.round(neutral * 100) / 100
      }
    };
  }

  private async performMorphologicalAnalysis(
    text: string, 
    options: NLPAnalysisOptions
  ): Promise<MorphologicalResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // Mock morphological analysis
    const words = text.split(/\s+/).slice(0, 10); // Limit for demo
    const morphemes = words.map(word => ({
      text: word,
      pos: this.getMockPOS(word),
      lemma: word.toLowerCase().replace(/s$/, '').replace(/ed$/, '').replace(/ing$/, ''),
      features: this.getMockFeatures(word)
    }));

    return {
      morphemes,
      structure: {
        root: words[0]?.toLowerCase() || '',
        prefixes: ['un-', 're-', 'pre-'].filter(() => Math.random() > 0.8),
        suffixes: ['-ing', '-ed', '-s'].filter(() => Math.random() > 0.7)
      }
    };
  }

  private async performKeywordExtraction(
    text: string, 
    options: NLPAnalysisOptions
  ): Promise<KeywordResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

    // Mock keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const keywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, options.keywordLimit || 20)
      .map(([word, frequency]) => ({
        word,
        frequency,
        importance: frequency / words.length
      }));

    const wordCloud = keywords.map(({ word, frequency }) => ({
      word,
      size: Math.min(40, 12 + frequency * 4),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

    return {
      keywords,
      wordCloud
    };
  }

  private async performSimilarityAnalysis(
    text1: string,
    text2: string,
    options: NLPAnalysisOptions
  ): Promise<SimilarityResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));

    // Simple similarity calculation (Jaccard similarity)
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarityScore = (intersection.size / union.size) * 100;

    // Find matched segments
    const matchedSegments = Array.from(intersection).slice(0, 5).map(word => ({
      text1: word,
      text2: word,
      similarity: 100
    }));

    return {
      similarityScore: Math.round(similarityScore * 100) / 100,
      matchedSegments
    };
  }

  private getMockPOS(word: string): string {
    const posOptions = ['NOUN', 'VERB', 'ADJ', 'ADV', 'PREP', 'DET', 'PRON'];
    if (word.endsWith('ing')) return 'VERB';
    if (word.endsWith('ly')) return 'ADV';
    if (word.endsWith('ed')) return 'VERB';
    return posOptions[Math.floor(Math.random() * posOptions.length)];
  }

  private getMockFeatures(word: string): string[] {
    const features = [];
    if (word.endsWith('s')) features.push('Number=Plur');
    if (word.endsWith('ed')) features.push('Tense=Past');
    if (word.endsWith('ing')) features.push('Aspect=Prog');
    return features;
  }
}

// Export singleton instance
export const nlpService = NLPService.getInstance();
export default nlpService;