import { lazy } from 'react';

// Lazy load chart components for better performance
export const LineChart = lazy(() => 
  import('./LineChart').then(module => ({ default: module.LineChart }))
);

export const BarChart = lazy(() => 
  import('./BarChart').then(module => ({ default: module.BarChart }))
);

export const PieChart = lazy(() => 
  import('./PieChart').then(module => ({ default: module.PieChart }))
);

export const TrendLineChart = lazy(() => 
  import('./TrendLineChart').then(module => ({ default: module.TrendLineChart }))
);

export const KeywordFrequencyChart = lazy(() => 
  import('./KeywordFrequencyChart').then(module => ({ default: module.KeywordFrequencyChart }))
);

export const SubredditDistributionChart = lazy(() => 
  import('./SubredditDistributionChart').then(module => ({ default: module.SubredditDistributionChart }))
);

export const SentimentTimelineChart = lazy(() => 
  import('./SentimentTimelineChart').then(module => ({ default: module.SentimentTimelineChart }))
);

export const WordFrequencyChart = lazy(() => 
  import('./WordFrequencyChart').then(module => ({ default: module.WordFrequencyChart }))
);

export const KeywordNetworkChart = lazy(() => 
  import('./KeywordNetworkChart').then(module => ({ default: module.KeywordNetworkChart }))
);

export const RealTimePerformanceDashboard = lazy(() => 
  import('./RealTimePerformanceDashboard').then(module => ({ default: module.RealTimePerformanceDashboard }))
);

export const SystemHealthHeatmap = lazy(() => 
  import('./SystemHealthHeatmap').then(module => ({ default: module.SystemHealthHeatmap }))
);

export const ComparativeAnalysisChart = lazy(() => 
  import('./ComparativeAnalysisChart').then(module => ({ default: module.ComparativeAnalysisChart }))
);

export const TrendCorrelationChart = lazy(() => 
  import('./TrendCorrelationChart').then(module => ({ default: module.TrendCorrelationChart }))
);

// Non-lazy exports for components that are always needed
export { ChartContainer } from './ChartContainer';
export { 
  BaseChartProps, 
  chartOptions, 
  darkChartOptions, 
  chartColors, 
  generateColors, 
  generateGradient 
} from './BaseChart';

export type { LineChartData } from './LineChart';
export type { BarChartData } from './BarChart';
export type { PieChartData } from './PieChart';
export type { SentimentTimelineData, SentimentCorrelationData } from './SentimentTimelineChart';
export type { WordFrequencyData } from './WordFrequencyChart';
export type { KeywordNode, KeywordEdge, KeywordNetworkData } from './KeywordNetworkChart';
export type { PerformanceMetric, SystemAlert, PerformanceThresholds } from './RealTimePerformanceDashboard';
export type { HeatmapDataPoint, SystemHealthData } from './SystemHealthHeatmap';
export type { ComparisonDataPoint, ComparisonDataset, ComparisonMetric } from './ComparativeAnalysisChart';
export type { TrendDataPoint, TrendSeries, CorrelationResult, PatternMatch } from './TrendCorrelationChart';