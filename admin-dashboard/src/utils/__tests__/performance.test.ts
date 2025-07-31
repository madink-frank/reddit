import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  PerformanceMonitor,
  ResourcePerformance,
  MemoryMonitor,
  FrameRateMonitor,
  PerformanceBudget,
  initializePerformanceMonitoring
} from '../performance'

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock performance API
    global.performance = {
      ...global.performance,
      now: vi.fn(() => Date.now()),
      timing: {
        navigationStart: 0,
        responseStart: 100,
      } as any,
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
    } as any
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('PerformanceMonitor', () => {
    it('initializes and gets metrics', () => {
      const monitor = new PerformanceMonitor()
      const metrics = monitor.getMetrics()
      
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
    })

    it('logs metrics to console', () => {
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
      
      const monitor = new PerformanceMonitor()
      monitor.logMetrics()
      
      expect(consoleSpy).toHaveBeenCalledWith('Performance Metrics')
      expect(consoleGroupEndSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })

    it('disconnects observers', () => {
      const monitor = new PerformanceMonitor()
      expect(() => monitor.disconnect()).not.toThrow()
    })
  })

  describe('ResourcePerformance', () => {
    it('measures resource load time', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })
      
      const loadTime = await ResourcePerformance.measureResourceLoad('test.js')
      expect(loadTime).toBeGreaterThanOrEqual(0)
    })

    it('gets resource timing information', () => {
      const mockEntry = { name: 'test.js', transferSize: 1024 }
      global.performance.getEntriesByName = vi.fn().mockReturnValue([mockEntry])
      
      const timing = ResourcePerformance.getResourceTiming('test.js')
      expect(timing).toEqual(mockEntry)
    })

    it('analyzes bundle sizes', () => {
      const mockEntries = [
        { name: 'app.js', transferSize: 2048, requestStart: 0, responseEnd: 100 },
        { name: 'styles.css', transferSize: 1024, requestStart: 0, responseEnd: 50 }
      ]
      global.performance.getEntriesByType = vi.fn().mockReturnValue(mockEntries)
      
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
      
      ResourcePerformance.analyzeBundleSizes()
      
      expect(consoleSpy).toHaveBeenCalledWith('Bundle Analysis')
      expect(consoleGroupEndSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })
  })

  describe('MemoryMonitor', () => {
    it('gets memory usage when available', () => {
      (global.performance as any).memory = {
        usedJSHeapSize: 10485760, // 10MB
        totalJSHeapSize: 20971520, // 20MB
        jsHeapSizeLimit: 104857600 // 100MB
      }
      
      const memory = MemoryMonitor.getMemoryUsage()
      expect(memory).toEqual({
        used: 10,
        total: 20,
        limit: 100
      })
    })

    it('returns null when memory API not available', () => {
      delete (global.performance as any).memory
      
      const memory = MemoryMonitor.getMemoryUsage()
      expect(memory).toBeNull()
    })

    it('starts and stops memory monitoring', () => {
      const stopMonitoring = MemoryMonitor.startMemoryMonitoring(100)
      expect(typeof stopMonitoring).toBe('function')
      
      stopMonitoring()
    })
  })

  describe('FrameRateMonitor', () => {
    it('starts and stops monitoring', () => {
      const monitor = new FrameRateMonitor()
      
      monitor.start()
      expect(monitor.getFPS()).toBe(0) // Initial value
      
      monitor.stop()
    })
  })

  describe('PerformanceBudget', () => {
    it('checks performance budget', () => {
      const metrics = {
        fcp: 2000, // Over budget (1800)
        lcp: 2000, // Under budget (2500)
        fid: 50,   // Under budget (100)
        cls: 0.2,  // Over budget (0.1)
        ttfb: 500  // Under budget (800)
      }
      
      const result = PerformanceBudget.checkBudget(metrics)
      
      expect(result.passed).toBe(false)
      expect(result.violations).toHaveLength(2) // FCP and CLS violations
      expect(result.violations[0]).toContain('FCP')
      expect(result.violations[1]).toContain('CLS')
    })

    it('sets custom budgets', () => {
      PerformanceBudget.setBudgets({ fcp: 2000 })
      
      const metrics = { fcp: 1900 }
      const result = PerformanceBudget.checkBudget(metrics)
      
      expect(result.passed).toBe(true)
    })
  })

  describe('initializePerformanceMonitoring', () => {
    it('returns performance monitor instance', () => {
      const monitor = initializePerformanceMonitoring()
      expect(monitor).toBeInstanceOf(PerformanceMonitor)
    })
  })
})