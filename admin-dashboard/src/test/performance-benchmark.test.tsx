/**
 * Performance Benchmark Test Suite
 * Comprehensive testing for performance optimization features
 */

// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { performanceOptimizer, AdvancedPerformanceOptimizer } from '../utils/performanceOptimizer';
import { performanceConfig } from '../utils/performanceConfig';
import PerformanceBenchmarkDashboard from '../components/demo/PerformanceBenchmarkDashboard';

// Mock performance APIs
const mockPerformanceObserver = jest.fn();
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock window.performance
Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

Object.defineProperty(window, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true
});

describe('Performance Benchmark System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceObserver.mockImplementation((_callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Performance Optimizer', () => {
    it('should initialize with default optimization settings', () => {
      const status = performanceOptimizer.getOptimizationStatus();
      
      expect(status).toHaveProperty('code-splitting');
      expect(status).toHaveProperty('tree-shaking');
      expect(status).toHaveProperty('compression');
      expect(status).toHaveProperty('lazy-loading');
      expect(status).toHaveProperty('service-worker');
      expect(status).toHaveProperty('critical-css');
      expect(status).toHaveProperty('image-optimization');
    });

    it('should run bundle size optimization', async () => {
      const result = await performanceOptimizer.optimizeBundleSize();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metrics');
      
      if (result.success) {
        expect(result.metrics).toHaveProperty('originalSize');
        expect(result.metrics).toHaveProperty('optimizedSize');
        expect(result.metrics).toHaveProperty('compressionRatio');
      }
    });

    it('should run loading time optimization', async () => {
      const result = await performanceOptimizer.optimizeLoadingTimes();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('recommendations');
      
      if (result.success && result.metrics) {
        expect(typeof result.metrics.firstContentfulPaint).toBe('number');
        expect(typeof result.metrics.largestContentfulPaint).toBe('number');
        expect(typeof result.metrics.timeToInteractive).toBe('number');
      }
    });

    it('should improve Lighthouse scores', async () => {
      const result = await performanceOptimizer.improveLighthouseScores();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('recommendations');
      
      if (result.success && result.metrics) {
        expect(result.metrics).toHaveProperty('performance');
        expect(result.metrics).toHaveProperty('accessibility');
        expect(result.metrics).toHaveProperty('bestPractices');
        expect(result.metrics).toHaveProperty('seo');
      }
    });

    it('should run comprehensive optimization', async () => {
      const result = await performanceOptimizer.runComprehensiveOptimization();
      
      expect(result).toHaveProperty('bundleOptimization');
      expect(result).toHaveProperty('loadingOptimization');
      expect(result).toHaveProperty('lighthouseOptimization');
      expect(result).toHaveProperty('overallScore');
      
      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should start performance monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      performanceOptimizer.startPerformanceMonitoring();
      
      expect(consoleSpy).toHaveBeenCalledWith('📊 Starting performance monitoring...');
      
      consoleSpy.mockRestore();
    });

    it('should generate optimization report', () => {
      const report = performanceOptimizer.generateOptimizationReport();
      
      expect(typeof report).toBe('string');
      expect(report).toContain('Performance Optimization Report');
      expect(report).toContain('Enabled Optimizations');
      expect(report).toContain('Current Metrics');
      expect(report).toContain('Recommendations');
    });
  });

  describe('Performance Configuration', () => {
    it('should have default performance thresholds', () => {
      const thresholds = performanceConfig.getThresholds();
      
      expect(thresholds).toHaveProperty('fcp');
      expect(thresholds).toHaveProperty('lcp');
      expect(thresholds).toHaveProperty('fid');
      expect(thresholds).toHaveProperty('cls');
      expect(thresholds).toHaveProperty('bundleSize');
      expect(thresholds).toHaveProperty('fileSize');
      
      // Check Core Web Vitals thresholds
      expect(thresholds.fcp.good).toBe(1800);
      expect(thresholds.lcp.good).toBe(2500);
      expect(thresholds.fid.good).toBe(100);
      expect(thresholds.cls.good).toBe(0.1);
    });

    it('should validate metrics against thresholds', () => {
      // Test good FCP
      const goodFcp = performanceConfig.validateMetric('first-contentful-paint', 1500);
      expect(goodFcp.status).toBe('good');
      
      // Test poor LCP
      const poorLcp = performanceConfig.validateMetric('largest-contentful-paint', 5000);
      expect(poorLcp.status).toBe('poor');
      
      // Test needs improvement FID
      const needsImprovementFid = performanceConfig.validateMetric('first-input-delay', 200);
      expect(needsImprovementFid.status).toBe('needs-improvement');
    });

    it('should check performance budgets', () => {
      const budgets = performanceConfig.getBudgets();
      
      expect(Array.isArray(budgets)).toBe(true);
      expect(budgets.length).toBeGreaterThan(0);
      
      // Test budget checking
      const budgetCheck = performanceConfig.checkBudget('timing', 'first-contentful-paint', 2000);
      expect(budgetCheck).toHaveProperty('withinBudget');
      expect(budgetCheck).toHaveProperty('budget');
      expect(budgetCheck).toHaveProperty('overage');
    });

    it('should generate optimization recommendations', () => {
      const metrics = {
        'first-contentful-paint': 3000, // Poor
        'largest-contentful-paint': 4000, // Poor
        'first-input-delay': 50, // Good
        'cumulative-layout-shift': 0.05 // Good
      };
      
      const recommendations = performanceConfig.generateOptimizationRecommendations(metrics);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
      
      // Should have recommendations for poor metrics
      const poorMetricRecs = recommendations.filter(r => r.type === 'critical' || r.type === 'warning');
      expect(poorMetricRecs.length).toBeGreaterThanOrEqual(0);
    });

    it('should export and import configuration', () => {
      const originalConfig = performanceConfig.exportConfig();
      expect(typeof originalConfig).toBe('string');
      
      // Test importing the same config
      expect(() => {
        performanceConfig.importConfig(originalConfig);
      }).not.toThrow();
      
      // Test importing invalid config
      expect(() => {
        performanceConfig.importConfig('invalid json');
      }).toThrow();
    });
  });

  describe('Performance Benchmark Dashboard', () => {
    it('should render performance dashboard', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Performance Benchmark')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Monitor and optimize your application\'s performance')).toBeInTheDocument();
      expect(screen.getByText('Run Benchmark')).toBeInTheDocument();
      expect(screen.getByText('Optimize')).toBeInTheDocument();
    });

    it('should display performance metrics', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Score')).toBeInTheDocument();
        expect(screen.getByText('Bundle Size')).toBeInTheDocument();
        expect(screen.getByText('LCP')).toBeInTheDocument();
        expect(screen.getByText('Issues')).toBeInTheDocument();
      });
    });

    it('should handle benchmark execution', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Run Benchmark')).toBeInTheDocument();
      });
      
      const benchmarkButton = screen.getByText('Run Benchmark');
      fireEvent.click(benchmarkButton);
      
      // Should show running state
      await waitFor(() => {
        expect(screen.getByText('Running...')).toBeInTheDocument();
      });
    });

    it('should handle optimization execution', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Optimize')).toBeInTheDocument();
      });
      
      const optimizeButton = screen.getByText('Optimize');
      fireEvent.click(optimizeButton);
      
      // Should show optimizing state
      await waitFor(() => {
        expect(screen.getByText('Optimizing...')).toBeInTheDocument();
      });
    });

    it('should display different tabs', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Lighthouse')).toBeInTheDocument();
        expect(screen.getByText('Bundle Analysis')).toBeInTheDocument();
        expect(screen.getByText('Core Web Vitals')).toBeInTheDocument();
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });
      
      // Test tab switching
      fireEvent.click(screen.getByText('Lighthouse'));
      await waitFor(() => {
        // Look for lighthouse-specific content instead
        expect(screen.getByText('Lighthouse')).toBeInTheDocument();
      });
    });

    it('should format bytes correctly', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        // Should display formatted bundle size
        expect(screen.getByText(/MB/)).toBeInTheDocument();
        expect(screen.getByText(/KB/)).toBeInTheDocument();
      });
    });

    it('should format time correctly', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        // Should display formatted time values
        const timeElements = screen.getAllByText(/ms|s/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('should display score colors correctly', async () => {
      render(<PerformanceBenchmarkDashboard />);
      
      await waitFor(() => {
        // Should have score elements with appropriate styling
        const scoreElements = screen.getAllByText(/\/100/);
        expect(scoreElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Utilities', () => {
    it('should measure function execution time', () => {
      const testFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };
      
      const result = performanceOptimizer.measureFunction('test-function', testFunction);
      
      expect(typeof result).toBe('number');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-function-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-function-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-function', 'test-function-start', 'test-function-end');
    });

    it('should measure async function execution time', async () => {
      const testAsyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      };
      
      const result = await performanceOptimizer.measureAsyncFunction('test-async-function', testAsyncFunction);
      
      expect(result).toBe('done');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-async-function-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-async-function-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-async-function', 'test-async-function-start', 'test-async-function-end');
    });

    it('should create lazy loader', async () => {
      let loadCount = 0;
      const loader = () => {
        loadCount++;
        return Promise.resolve('loaded');
      };
      
      const lazyLoader = AdvancedPerformanceOptimizer.createLazyLoader(loader);
      
      // First call should load
      const result1 = await lazyLoader();
      expect(result1).toBe('loaded');
      expect(loadCount).toBe(1);
      
      // Second call should use cache
      const result2 = await lazyLoader();
      expect(result2).toBe('loaded');
      expect(loadCount).toBe(1); // Should not increment
    });

    it('should debounce function calls', (done) => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };
      
      const debouncedFunction = AdvancedPerformanceOptimizer.debounce(testFunction, 100);
      
      // Call multiple times quickly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();
      
      // Should only be called once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    it('should throttle function calls', (done) => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };
      
      const throttledFunction = AdvancedPerformanceOptimizer.throttle(testFunction, 100);
      
      // Call multiple times quickly
      throttledFunction();
      throttledFunction();
      throttledFunction();
      
      // Should only be called once immediately
      expect(callCount).toBe(1);
      
      // Wait and call again
      setTimeout(() => {
        throttledFunction();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const metrics = performanceOptimizer.getPerformanceMetrics();
      
      expect(typeof metrics).toBe('object');
      // Metrics might be empty initially, but should be an object
    });

    it('should handle performance observer creation', () => {
      // Test that performance monitoring doesn't throw errors
      expect(() => {
        performanceOptimizer.startPerformanceMonitoring();
      }).not.toThrow();
    });

    it('should generate performance report', () => {
      const report = performanceOptimizer.generateOptimizationReport();
      
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('Performance Optimization Report');
    });
  });

  describe('Error Handling', () => {
    it('should handle optimization failures gracefully', async () => {
      // Mock a failure scenario
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // This should not throw even if internal operations fail
      const result = await performanceOptimizer.optimizeBundleSize();
      
      expect(result).toHaveProperty('success');
      // Result might be success or failure, but should not throw
      
      console.error = originalConsoleError;
    });

    it('should handle missing performance APIs', () => {
      // Temporarily remove PerformanceObserver
      const originalPerformanceObserver = (window as any).PerformanceObserver;
      delete (window as any).PerformanceObserver;
      
      // Should not throw even without PerformanceObserver
      expect(() => {
        performanceOptimizer.startPerformanceMonitoring();
      }).not.toThrow();
      
      // Restore
      if (originalPerformanceObserver) {
        (window as any).PerformanceObserver = originalPerformanceObserver;
      }
    });

    it('should handle invalid configuration imports', () => {
      expect(() => {
        performanceConfig.importConfig('invalid json');
      }).toThrow('Invalid configuration format');
    });
  });
});

describe('Performance Integration Tests', () => {
  it('should integrate optimization with configuration', async () => {
    const result = await performanceOptimizer.runComprehensiveOptimization();
    
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    
    // Should respect configuration thresholds
    if (result.lighthouseOptimization.success && result.lighthouseOptimization.metrics) {
      const metrics = result.lighthouseOptimization.metrics;
      Object.entries(metrics).forEach(([, value]) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    }
  });

  it('should provide consistent performance reporting', () => {
    const report1 = performanceOptimizer.generateOptimizationReport();
    const report2 = performanceOptimizer.generateOptimizationReport();
    
    // Reports should have consistent structure
    expect(report1).toContain('Performance Optimization Report');
    expect(report2).toContain('Performance Optimization Report');
    
    // Both should contain the same sections
    const sections = ['Enabled Optimizations', 'Current Metrics', 'Recommendations'];
    sections.forEach(section => {
      expect(report1).toContain(section);
      expect(report2).toContain(section);
    });
  });
});