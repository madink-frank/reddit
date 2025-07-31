// Advanced Dashboard Types - NLP Analysis, Image Processing, and Real-time Monitoring

// ============================================================================
// NLP Analysis Types
// ============================================================================

export interface NLPAnalysisRequest {
  text: string;
  analysisTypes: ('morphological' | 'sentiment' | 'similarity' | 'keywords')[];
  options?: {
    language?: string;
    similarityThreshold?: number;
    keywordLimit?: number;
    confidenceThreshold?: number;
  };
}

export interface MorphologicalAnalysis {
  morphemes: {
    text: string;
    pos: string; // part of speech
    lemma: string;
    features: string[];
    confidence: number;
  }[];
  structure: {
    root: string;
    prefixes: string[];
    suffixes: string[];
  };
  linguisticFeatures: {
    wordCount: number;
    sentenceCount: number;
    averageWordLength: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  confidence: number;
  label: 'positive' | 'negative' | 'neutral';
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
}

export interface TextSimilarity {
  similarityScore: number; // 0 to 100
  matchedSegments: {
    text1: string;
    text2: string;
    similarity: number;
    startIndex1: number;
    endIndex1: number;
    startIndex2: number;
    endIndex2: number;
  }[];
  overallMatch: 'exact' | 'high' | 'moderate' | 'low' | 'none';
}

export interface KeywordExtraction {
  keywords: {
    word: string;
    frequency: number;
    importance: number;
    context: string[];
    sentiment?: number;
  }[];
  phrases: {
    phrase: string;
    frequency: number;
    importance: number;
  }[];
  wordCloud: {
    word: string;
    size: number;
    color: string;
    weight: number;
  }[];
  categories: {
    category: string;
    keywords: string[];
    relevance: number;
  }[];
}

export interface NLPAnalysisResult {
  id: string;
  requestId: string;
  text: string;
  processedAt: Date;
  processingTime: number; // milliseconds
  pointsConsumed: number;
  
  morphological?: MorphologicalAnalysis;
  sentiment?: SentimentAnalysis;
  similarity?: TextSimilarity;
  keywords?: KeywordExtraction;
  
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// Image Processing Types
// ============================================================================

export interface ImageAnalysisRequest {
  imageUrl?: string;
  imageFile?: File;
  analysisTypes: ('objects' | 'ocr' | 'classification' | 'faces' | 'text')[];
  options?: {
    confidenceThreshold?: number;
    ocrLanguage?: string;
    maxObjects?: number;
    detectFaces?: boolean;
    extractColors?: boolean;
  };
}

export interface ObjectDetection {
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
    attributes?: {
      color?: string;
      size?: 'small' | 'medium' | 'large';
      position?: 'foreground' | 'background';
    };
  }[];
  summary: {
    totalObjects: number;
    highConfidenceObjects: number;
    categories: string[];
    dominantObjects: string[];
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
    language?: string;
    fontSize?: number;
    fontStyle?: string;
  }[];
  metadata: {
    language: string;
    textOrientation: number;
    processingTime: number;
    pageCount?: number;
  };
  structure: {
    paragraphs: string[];
    lines: string[];
    words: string[];
  };
}

export interface ImageClassification {
  primaryCategory: string;
  categories: {
    name: string;
    confidence: number;
    subcategories?: string[];
  }[];
  imageType: 'photo' | 'graphic' | 'text' | 'mixed' | 'screenshot';
  visualFeatures: {
    dominantColors: {
      color: string;
      percentage: number;
      hex: string;
    }[];
    brightness: number; // 0-100
    contrast: number; // 0-100
    saturation: number; // 0-100
    sharpness: number; // 0-100
  };
  technicalInfo: {
    width: number;
    height: number;
    format: string;
    fileSize?: number;
    quality?: 'low' | 'medium' | 'high';
  };
}

export interface FaceDetection {
  faces: {
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
    attributes?: {
      age?: number;
      gender?: 'male' | 'female';
      emotion?: {
        dominant: string;
        scores: Record<string, number>;
      };
      landmarks?: {
        leftEye: { x: number; y: number };
        rightEye: { x: number; y: number };
        nose: { x: number; y: number };
        mouth: { x: number; y: number };
      };
    };
  }[];
  summary: {
    totalFaces: number;
    averageConfidence: number;
    demographics?: {
      ageGroups: Record<string, number>;
      genderDistribution: Record<string, number>;
    };
  };
}

export interface ImageAnalysisResult {
  id: string;
  requestId: string;
  imageUrl: string;
  processedAt: Date;
  processingTime: number;
  pointsConsumed: number;
  
  objectDetection?: ObjectDetection;
  ocr?: OCRResult;
  classification?: ImageClassification;
  faceDetection?: FaceDetection;
  
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// Real-time Monitoring Types
// ============================================================================

export interface CrawlingJobStatus {
  id: string;
  name: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  progress: {
    collected: number;
    total: number;
    percentage: number;
    elapsedTime: number; // seconds
    estimatedTimeRemaining?: number; // seconds
    speed: number; // items per second
  };
  metrics: {
    successRate: number;
    errorRate: number;
    retryCount: number;
    pointsConsumed: number;
    dataSize: number; // bytes
  };
  schedule: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
    nextRun?: Date;
    lastRun?: Date;
    isActive: boolean;
  };
  configuration: {
    keywords: string[];
    subreddits: string[];
    maxPosts: number;
    includeComments: boolean;
    enableNLP: boolean;
    enableImageAnalysis: boolean;
  };
}

export interface SystemMetrics {
  timestamp: Date;
  performance: {
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
    diskUsage: number; // percentage
    networkLatency: number; // milliseconds
  };
  processing: {
    queueSize: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageProcessingTime: number; // milliseconds
  };
  resources: {
    availablePoints: number;
    pointsUsedToday: number;
    apiCallsRemaining: number;
    storageUsed: number; // bytes
  };
}

export interface RealTimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'crawling' | 'analysis' | 'system' | 'billing';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  actions?: {
    label: string;
    action: string;
    params?: Record<string, unknown>;
  }[];
  autoHide?: boolean;
  duration?: number;
}

export interface LiveDashboardData {
  systemStatus: 'healthy' | 'warning' | 'critical' | 'maintenance';
  activeCrawlingJobs: CrawlingJobStatus[];
  systemMetrics: SystemMetrics;
  recentNotifications: RealTimeNotification[];
  quickStats: {
    totalPostsToday: number;
    analysisCompleted: number;
    pointsRemaining: number;
    systemUptime: number; // seconds
  };
}

// ============================================================================
// Point-based Billing Types
// ============================================================================

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'debit' | 'credit' | 'refund';
  amount: number;
  operation: 'crawling' | 'nlp_analysis' | 'image_analysis' | 'export' | 'purchase' | 'bonus';
  description: string;
  metadata?: {
    jobId?: string;
    analysisType?: string;
    itemCount?: number;
    processingTime?: number;
  };
  timestamp: Date;
  balanceAfter: number;
}

export interface UserBilling {
  userId: string;
  currentPoints: number;
  totalSpent: number;
  totalPurchased: number;
  usageHistory: PointTransaction[];
  spendingLimits: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  notifications: {
    lowBalance: boolean;
    dailyLimit: boolean;
    weeklyLimit: boolean;
    monthlyLimit: boolean;
  };
  subscription?: {
    plan: 'basic' | 'pro' | 'enterprise';
    monthlyAllowance: number;
    renewalDate: Date;
    autoTopup: boolean;
  };
}

export interface BillingAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  usage: {
    crawling: number;
    nlpAnalysis: number;
    imageAnalysis: number;
    exports: number;
    total: number;
  };
  trends: {
    date: string;
    points: number;
    operations: number;
  }[];
  projections: {
    estimatedMonthlyUsage: number;
    recommendedTopup: number;
    costOptimizationSuggestions: string[];
  };
}

// ============================================================================
// Data Visualization Types
// ============================================================================

export interface ChartConfiguration {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'wordcloud' | 'heatmap' | 'scatter' | 'area';
  data: ChartDataPoint[];
  options: {
    responsive: boolean;
    darkTheme: boolean;
    interactive: boolean;
    exportable: boolean;
    realTime?: boolean;
    refreshInterval?: number; // seconds
  };
  styling: {
    colors: string[];
    fontSize: number;
    showLegend: boolean;
    showGrid: boolean;
    animation: boolean;
  };
}

export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface SentimentTimelineData {
  timestamp: Date;
  positive: number;
  negative: number;
  neutral: number;
  volume: number;
  averageScore: number;
  subreddit?: string;
  keyword?: string;
}

export interface WordFrequencyData {
  word: string;
  frequency: number;
  sentiment?: number;
  subreddit?: string;
  trend: 'rising' | 'falling' | 'stable';
  contexts: string[];
}

export interface PerformanceMetricsData {
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  threshold?: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
}

// ============================================================================
// Export and Reporting Types
// ============================================================================

export interface ExportRequest {
  id: string;
  dataType: 'posts' | 'analysis' | 'images' | 'reports' | 'metrics';
  format: 'excel' | 'csv' | 'json' | 'pdf' | 'xml';
  filters?: {
    dateRange?: { start: Date; end: Date };
    keywords?: string[];
    subreddits?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    analysisTypes?: string[];
    minConfidence?: number;
  };
  options?: {
    includeAnalysis?: boolean;
    includeImages?: boolean;
    includeMetadata?: boolean;
    maxRecords?: number;
    compression?: boolean;
  };
  scheduling?: {
    recurring: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    nextExecution?: Date;
  };
}

export interface ExportResult {
  id: string;
  requestId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  downloadUrl?: string;
  fileSize?: number;
  recordCount?: number;
  processingTime?: number;
  pointsConsumed: number;
  expiresAt: Date;
  error?: string;
  metadata?: {
    format: string;
    compression: boolean;
    checksum: string;
  };
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportRequest['format'];
  dataType: ExportRequest['dataType'];
  defaultOptions: ExportRequest['options'];
}

export interface ExportField {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}

// ============================================================================
// Business Intelligence Types
// ============================================================================

export interface TrendForecast {
  keyword: string;
  currentTrend: 'rising' | 'falling' | 'stable';
  prediction: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
  factors: {
    seasonality: number;
    momentum: number;
    external: number;
  };
  recommendations: string[];
}

export interface BrandMonitoring {
  brand: string;
  mentions: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  sentiment: {
    overall: number;
    trend: 'improving' | 'declining' | 'stable';
    breakdown: Record<string, number>;
  };
  reach: {
    subreddits: string[];
    totalUsers: number;
    engagement: number;
  };
  competitors?: {
    name: string;
    mentions: number;
    sentiment: number;
  }[];
}

export interface AdvertisingAnalytics {
  campaign: string;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number; // click-through rate
    cpa: number; // cost per acquisition
    roi: number; // return on investment
  };
  audience: {
    demographics: Record<string, number>;
    interests: string[];
    behavior: Record<string, number>;
  };
  optimization: {
    suggestions: string[];
    predictedImprovement: number;
    confidenceLevel: number;
  };
}

// ============================================================================
// WebSocket and Real-time Communication Types
// ============================================================================

export interface WebSocketMessage {
  type: 'update' | 'notification' | 'error' | 'heartbeat';
  channel: string;
  data: unknown;
  timestamp: Date;
  id: string;
}

export interface RealTimeSubscription {
  channel: string;
  filters?: Record<string, unknown>;
  callback: (data: unknown) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat?: Date;
  reconnectAttempts: number;
  latency?: number; // milliseconds
  subscriptions: string[];
}