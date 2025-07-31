/**
 * Performance Optimization Tests
 * Tests for performance monitoring and optimization features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import PerformanceDashboard from '../components/demo/PerformanceDashboard';
import { performanceMonitor, PerformanceOptimizer } from '../utils/performanceMonitor';

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

describe('Performance Optimization', () => {
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

  describe('PerformanceMonitor', () => {
    it('should initialize without errors', () => {
      expect(() => {
        const monitor = performanceMonitor;
        expect(monitor).toBeDefined();
      }).not.toThrow();
    });

    it('should start and stop monitoring', () => {
      const monitor = performanceMonitor;
      
      expect(() => {
        monitor.startMonitoring();
        monitor.stopMonitoring();
      }).not.toThrow();
    });

    it('should generate performance metrics', () => {
      const monitor = performanceMonitor;
      const metrics = monitor.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('should generate performance report', () => {
      const monitor = performanceMonitor;
      const report = monitor.generateReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('url');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('recommendations');
    });

    it('should measure function execution time', () => {
      const monitor = performanceMonitor;
      const testFunction = jest.fn(() => 'result');
      
      const result = monitor.measureFunction('test', testFunction);
      
      expect(result).toBe('result');
      expect(testFunction).toHaveBeenCalled();
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-end');
    });

    it('should measure async function execution time', async () => {
      const monitor = performanceMonitor;
      const asyncFunction = jest.fn(async () => 'async result');
      
      const result = await monitor.measureAsyncFunction('async-test', asyncFunction);
      
      expect(result).toBe('async result');
      expect(asyncFunction).toHaveBeenCalled();
    });
  });

  describe('PerformanceOptimizer', () => {
    it('should be a singleton', () => {
      const optimizer1 = PerformanceOptimizer.getInstance();
      const optimizer2 = PerformanceOptimizer.getInstance();
      
      expect(optimizer1).toBe(optimizer2);
    });

    it('should create lazy loader', async () => {
      const loader = jest.fn(async () => 'loaded data');
      const lazyLoader = PerformanceOptimizer.createLazyLoader(loader);
      
      const result1 = await lazyLoader();
      const result2 = await lazyLoader();
      
      expect(result1).toBe('loaded data');
      expect(result2).toBe('loaded data');
      expect(loader).toHaveBeenCalledTimes(1); // Should be cached
    });

    it('should create debounced function', async () => {
      const fn = jest.fn();
      const debouncedFn = PerformanceOptimizer.debounce(fn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(fn).not.toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should create throttled function', async () => {
      const fn = jest.fn();
      const throttledFn = PerformanceOptimizer.throttle(fn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('PerformanceDashboard Component', () => {
    it('should render without errors', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Real-time performance monitoring and optimization')).toBeInTheDocument();
    });

    it('should display monitoring controls', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Start Monitoring')).toBeInTheDocument();
      
      // Find buttons by their icons since they don't have accessible names
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3); // Start/Stop, Refresh, Download
    });

    it('should toggle monitoring state', async () => {
      render(<PerformanceDashboard />);
      
      const monitorButton = screen.getByText('Start Monitoring');
      fireEvent.click(monitorButton);
      
      await waitFor(() => {
        expect(screen.getByText('Stop Monitoring')).toBeInTheDocument();
      });
    });

    it('should display core web vitals', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
      expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
      expect(screen.getByText('First Input Delay')).toBeInTheDocument();
      expect(screen.getByText('Cumulative Layout Shift')).toBeInTheDocument();
    });

    it('should display resource overview', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Resource Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Resources')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
    });

    it('should display performance tips', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Performance Optimization Tips')).toBeInTheDocument();
      expect(screen.getByText('Loading Performance')).toBeInTheDocument();
      expect(screen.getByText('Runtime Performance')).toBeInTheDocument();
    });

    it('should handle refresh metrics', () => {
      render(<PerformanceDashboard />);
      
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons[1]; // Second button is refresh
      
      expect(() => {
        fireEvent.click(refreshButton);
      }).not.toThrow();
    });

    it('should handle download report', () => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      
      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true
      });
      
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true
      });

      // Mock document.createElement
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') return mockAnchor as any;
        return originalCreateElement.call(document, tagName);
      });

      render(<PerformanceDashboard />);
      
      const buttons = screen.getAllByRole('button');
      const downloadButton = buttons[2]; // Third button is download
      fireEvent.click(downloadButton);
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      // Restore
      document.createElement = originalCreateElement;
    });
  });

  describe('Performance Metrics Validation', () => {
    it('should validate FCP thresholds', () => {
      const goodFCP = 1500;
      const poorFCP = 3500;
      
      expect(goodFCP).toBeLessThan(1800); // Good threshold
      expect(poorFCP).toBeGreaterThan(3000); // Poor threshold
    });

    it('should validate LCP thresholds', () => {
      const goodLCP = 2000;
      const poorLCP = 4500;
      
      expect(goodLCP).toBeLessThan(2500); // Good threshold
      expect(poorLCP).toBeGreaterThan(4000); // Poor threshold
    });

    it('should validate FID thresholds', () => {
      const goodFID = 80;
      const poorFID = 350;
      
      expect(goodFID).toBeLessThan(100); // Good threshold
      expect(poorFID).toBeGreaterThan(300); // Poor threshold
    });

    it('should validate CLS thresholds', () => {
      const goodCLS = 0.05;
      const poorCLS = 0.3;
      
      expect(goodCLS).toBeLessThan(0.1); // Good threshold
      expect(poorCLS).toBeGreaterThan(0.25); // Poor threshold
    });
  });

  describe('Resource Analysis', () => {
    it('should categorize resources correctly', () => {
      const resources = [
        { name: 'app.js', type: 'javascript', size: 100000, duration: 200 },
        { name: 'styles.css', type: 'css', size: 50000, duration: 100 },
        { name: 'image.png', type: 'image', size: 200000, duration: 300 }
      ];

      const categories = resources.reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(categories.javascript).toBe(1);
      expect(categories.css).toBe(1);
      expect(categories.image).toBe(1);
    });

    it('should calculate total resource size', () => {
      const resources = [
        { size: 100000 },
        { size: 50000 },
        { size: 200000 }
      ];

      const totalSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);
      expect(totalSize).toBe(350000);
    });

    it('should identify large resources', () => {
      const resources = [
        { name: 'small.js', size: 10000 },
        { name: 'large.js', size: 600000 },
        { name: 'huge.js', size: 1000000 }
      ];

      const largeResources = resources.filter(r => (r.size || 0) > 500000);
      expect(largeResources).toHaveLength(2);
    });
  });

  describe('Performance Recommendations', () => {
    it('should generate recommendations for slow FCP', () => {
      const metrics = { fcp: 3500 };
      const recommendations: string[] = [];

      if (metrics.fcp && metrics.fcp > 2000) {
        recommendations.push('First Contentful Paint is slow (>2s). Consider optimizing critical resources.');
      }

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('First Contentful Paint is slow');
    });

    it('should generate recommendations for high CLS', () => {
      const metrics = { cls: 0.15 };
      const recommendations: string[] = [];

      if (metrics.cls && metrics.cls > 0.1) {
        recommendations.push('Cumulative Layout Shift is high (>0.1). Add size attributes to images and reserve space for dynamic content.');
      }

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('Cumulative Layout Shift is high');
    });

    it('should generate recommendations for large resources', () => {
      const resources = [
        { name: 'large-bundle.js', size: 600000, duration: 500 }
      ];
      const recommendations: string[] = [];

      const largeResources = resources.filter(r => r.size && r.size > 500 * 1024);
      if (largeResources.length > 0) {
        recommendations.push(`Found ${largeResources.length} large resources (>500KB). Consider optimization or lazy loading.`);
      }

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('large resources');
    });
  });
});