/**
 * Performance Benchmark Dashboard
 * Comprehensive performance monitoring and optimization interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  Zap, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3,
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';
import { performanceOptimizer } from '../../utils/performanceOptimizer';
import { performanceConfig } from '../../utils/performanceConfig';

interface PerformanceMetrics {
  bundleSize: {
    total: number;
    gzipped: number;
    breakdown: Record<string, { size: number; files: number }>;
  };
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa: number;
  };
  coreWebVitals: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
  optimizations: Record<string, boolean>;
}

interface OptimizationRecommendation {
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export const PerformanceBenchmarkDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastBenchmarkTime, setLastBenchmarkTime] = useState<Date | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  useEffect(() => {
    // Load initial metrics
    loadPerformanceMetrics();
    
    // Start performance monitoring
    performanceOptimizer.startPerformanceMonitoring();
  }, []);

  const loadPerformanceMetrics = async () => {
    try {
      // Simulate loading metrics - in real implementation, this would fetch from actual sources
      const mockMetrics: PerformanceMetrics = {
        bundleSize: {
          total: 1970000, // 1.97 MB
          gzipped: 604470, // 604.47 KB
          breakdown: {
            javascript: { size: 1900000, files: 27 },
            css: { size: 54700, files: 1 },
            images: { size: 1460, files: 1 },
            other: { size: 13840, files: 2 }
          }
        },
        lighthouse: {
          performance: 87,
          accessibility: 87,
          bestPractices: 92,
          seo: 89,
          pwa: 89
        },
        coreWebVitals: {
          fcp: 1200,
          lcp: 2100,
          fid: 45,
          cls: 0.08,
          ttfb: 180
        },
        optimizations: performanceOptimizer.getOptimizationStatus()
      };

      setMetrics(mockMetrics);
      generateRecommendations(mockMetrics);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const generateRecommendations = (metrics: PerformanceMetrics) => {
    const recs: OptimizationRecommendation[] = [];

    // Bundle size recommendations
    if (metrics.bundleSize.total > 1500000) { // > 1.5MB
      recs.push({
        type: 'warning',
        category: 'Bundle Size',
        message: 'Large bundle size detected',
        impact: 'high',
        effort: 'medium',
        suggestions: [
          'Implement code splitting',
          'Remove unused dependencies',
          'Use dynamic imports for non-critical code'
        ]
      });
    }

    // Lighthouse score recommendations
    if (metrics.lighthouse.performance < 90) {
      recs.push({
        type: 'warning',
        category: 'Performance',
        message: 'Performance score below target',
        impact: 'high',
        effort: 'medium',
        suggestions: [
          'Optimize images and assets',
          'Implement lazy loading',
          'Reduce JavaScript execution time'
        ]
      });
    }

    // Core Web Vitals recommendations
    if (metrics.coreWebVitals.lcp > 2500) {
      recs.push({
        type: 'critical',
        category: 'Core Web Vitals',
        message: 'Largest Contentful Paint is too slow',
        impact: 'high',
        effort: 'high',
        suggestions: [
          'Optimize critical resources',
          'Implement resource preloading',
          'Reduce server response time'
        ]
      });
    }

    if (metrics.coreWebVitals.cls > 0.1) {
      recs.push({
        type: 'warning',
        category: 'Core Web Vitals',
        message: 'Cumulative Layout Shift is high',
        impact: 'medium',
        effort: 'low',
        suggestions: [
          'Add size attributes to images',
          'Reserve space for dynamic content',
          'Use CSS aspect-ratio for responsive images'
        ]
      });
    }

    // Optimization recommendations
    const optimizations = metrics.optimizations;
    if (!optimizations['code-splitting']) {
      recs.push({
        type: 'info',
        category: 'Optimization',
        message: 'Code splitting not enabled',
        impact: 'medium',
        effort: 'medium',
        suggestions: ['Enable code splitting to reduce initial bundle size']
      });
    }

    if (!optimizations['service-worker']) {
      recs.push({
        type: 'info',
        category: 'PWA',
        message: 'Service worker not implemented',
        impact: 'medium',
        effort: 'high',
        suggestions: ['Implement service worker for caching and offline support']
      });
    }

    setRecommendations(recs);
  };

  const runBenchmark = async () => {
    setIsRunningBenchmark(true);
    
    try {
      // Simulate running benchmark
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reload metrics
      await loadPerformanceMetrics();
      setLastBenchmarkTime(new Date());
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    try {
      // Simulate optimization process
      const steps = [
        'Analyzing bundle composition...',
        'Optimizing bundle size...',
        'Improving loading times...',
        'Enhancing Lighthouse scores...',
        'Finalizing optimizations...'
      ];

      for (let i = 0; i < steps.length; i++) {
        console.log(steps[i]);
        setOptimizationProgress((i + 1) / steps.length * 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Run comprehensive optimization
      const result = await performanceOptimizer.runComprehensiveOptimization();
      
      // Reload metrics to show improvements
      await loadPerformanceMetrics();
      
      console.log('Optimization complete:', result);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Benchmark</h2>
          <p className="text-muted-foreground">
            Monitor and optimize your application's performance
          </p>
          {lastBenchmarkTime && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastBenchmarkTime.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runBenchmark}
            disabled={isRunningBenchmark}
            variant="outline"
            icon={isRunningBenchmark ? RefreshCw : Activity}
          >
            {isRunningBenchmark ? 'Running...' : 'Run Benchmark'}
          </Button>
          <Button
            onClick={runOptimization}
            disabled={isOptimizing}
            icon={isOptimizing ? RefreshCw : Zap}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </div>
      </div>

      {/* Optimization Progress */}
      {isOptimizing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Optimization Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(optimizationProgress)}%</span>
              </div>
              <Progress value={optimizationProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lighthouse">Lighthouse</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.lighthouse.performance}/100</div>
                <Badge variant={getScoreBadgeVariant(metrics.lighthouse.performance)} className="mt-1">
                  {metrics.lighthouse.performance >= 90 ? 'Excellent' : 
                   metrics.lighthouse.performance >= 70 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(metrics.bundleSize.total)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.bundleSize.gzipped)} gzipped
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">LCP</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(metrics.coreWebVitals.lcp)}</div>
                <Badge variant={metrics.coreWebVitals.lcp <= 2500 ? 'default' : 'destructive'} className="mt-1">
                  {metrics.coreWebVitals.lcp <= 2500 ? 'Good' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recommendations.filter(r => r.type === 'critical' || r.type === 'warning').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {recommendations.filter(r => r.type === 'critical').length} critical
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common performance optimizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start" icon={Zap}>
                  Enable Code Splitting
                </Button>
                <Button variant="outline" className="justify-start" icon={TrendingUp}>
                  Optimize Images
                </Button>
                <Button variant="outline" className="justify-start" icon={Settings}>
                  Configure Caching
                </Button>
                <Button variant="outline" className="justify-start" icon={CheckCircle}>
                  Add Service Worker
                </Button>
                <Button variant="outline" className="justify-start" icon={BarChart3}>
                  Analyze Dependencies
                </Button>
                <Button variant="outline" className="justify-start" icon={Download}>
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lighthouse Tab */}
        <TabsContent value="lighthouse" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(metrics.lighthouse).map(([category, score]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {category === 'bestPractices' ? 'Best Practices' : category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </div>
                  <Progress value={score} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bundle Analysis Tab */}
        <TabsContent value="bundle" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bundle Composition</CardTitle>
                <CardDescription>Breakdown by file type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.bundleSize.breakdown).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="capitalize">{type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatBytes(data.size)}</div>
                        <div className="text-sm text-muted-foreground">{data.files} files</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Size Analysis</CardTitle>
                <CardDescription>Bundle size metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Size</span>
                    <span className="font-medium">{formatBytes(metrics.bundleSize.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gzipped Size</span>
                    <span className="font-medium">{formatBytes(metrics.bundleSize.gzipped)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compression Ratio</span>
                    <span className="font-medium">
                      {((1 - metrics.bundleSize.gzipped / metrics.bundleSize.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge variant={metrics.bundleSize.total > 2000000 ? 'destructive' : 'default'}>
                        {metrics.bundleSize.total > 2000000 ? 'Too Large' : 'Good'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(metrics.coreWebVitals).map(([metric, value]) => {
              const thresholds = performanceConfig.getThresholds();
              const metricThreshold = thresholds[metric as keyof typeof thresholds] as { good: number; poor: number };
              
              let status = 'good';
              if (metricThreshold) {
                if (value > metricThreshold.poor) status = 'poor';
                else if (value > metricThreshold.good) status = 'needs-improvement';
              }

              return (
                <Card key={metric}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium uppercase">
                      {metric}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      status === 'good' ? 'text-green-600' :
                      status === 'needs-improvement' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {metric === 'cls' ? value.toFixed(3) : formatTime(value)}
                    </div>
                    <Badge 
                      variant={status === 'good' ? 'default' : status === 'needs-improvement' ? 'secondary' : 'destructive'}
                      className="mt-1"
                    >
                      {status === 'good' ? 'Good' : status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {rec.type === 'critical' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : rec.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                      <CardTitle className="text-base">{rec.message}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">Impact: {rec.impact}</Badge>
                      <Badge variant="outline">Effort: {rec.effort}</Badge>
                    </div>
                  </div>
                  <CardDescription>{rec.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Suggestions:</p>
                    <ul className="text-sm space-y-1">
                      {rec.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceBenchmarkDashboard;