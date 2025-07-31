/**
 * CSS Optimization Tests
 * 
 * Tests for CSS optimization functionality including:
 * - Critical CSS extraction
 * - CSS loading utilities
 * - Performance monitoring
 * - CSS purging
 */

// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { 
  getCriticalCSS, 
  isCriticalClass, 
  extractCriticalCSS,
  generateInlineCriticalCSS,
  CSS_OPTIMIZATION_CONFIG 
} from '../utils/criticalCSS';
import { 
  loadCSSAsync, 
  preloadCSS, 
  isCSSLoaded, 
  getCSSLoadingStatus,
  CSSPerformanceMonitor,
  CSSOptimizer 
} from '../utils/cssLoader';

// Mock DOM methods
const mockDocument = {
  createElement: jest.fn(),
  head: {
    appendChild: jest.fn()
  },
  getElementById: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 'complete'
};

const mockWindow = {
  performance: {
    now: jest.fn(() => 100)
  },
  navigator: {
    sendBeacon: jest.fn()
  },
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16))
};

// Setup DOM mocks
beforeEach(() => {
  Object.defineProperty(globalThis, 'document', { value: mockDocument, writable: true });
  Object.defineProperty(globalThis, 'window', { value: mockWindow, writable: true });
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up global mocks
});

describe('Critical CSS Utilities', () => {
  describe('getCriticalCSS', () => {
    it('should return critical CSS string', () => {
      const criticalCSS = getCriticalCSS();
      
      expect(criticalCSS).toContain('box-sizing: border-box');
      expect(criticalCSS).toContain('.container');
      expect(criticalCSS).toContain('.btn-primary');
      expect(criticalCSS).toContain('.sr-only');
    });

    it('should include accessibility styles', () => {
      const criticalCSS = getCriticalCSS();
      
      expect(criticalCSS).toContain('.sr-only');
      expect(criticalCSS).toContain('.skip-link');
      expect(criticalCSS).toContain('prefers-reduced-motion');
      expect(criticalCSS).toContain('prefers-contrast');
    });

    it('should include critical animations', () => {
      const criticalCSS = getCriticalCSS();
      
      expect(criticalCSS).toContain('@keyframes pulse');
      expect(criticalCSS).toContain('.animate-pulse');
    });
  });

  describe('isCriticalClass', () => {
    it('should identify critical layout classes', () => {
      expect(isCriticalClass('container')).toBe(true);
      expect(isCriticalClass('flex')).toBe(true);
      expect(isCriticalClass('grid')).toBe(true);
      expect(isCriticalClass('block')).toBe(true);
      expect(isCriticalClass('hidden')).toBe(true);
    });

    it('should identify critical spacing classes', () => {
      expect(isCriticalClass('p-4')).toBe(true);
      expect(isCriticalClass('m-2')).toBe(true);
      expect(isCriticalClass('px-6')).toBe(true);
      expect(isCriticalClass('my-8')).toBe(true);
    });

    it('should identify critical typography classes', () => {
      expect(isCriticalClass('text-3xl')).toBe(true);
      expect(isCriticalClass('text-lg')).toBe(true);
      expect(isCriticalClass('font-bold')).toBe(true);
      expect(isCriticalClass('font-semibold')).toBe(true);
    });

    it('should identify critical color classes', () => {
      expect(isCriticalClass('text-gray-900')).toBe(true);
      expect(isCriticalClass('bg-white')).toBe(true);
      expect(isCriticalClass('bg-blue-600')).toBe(true);
    });

    it('should identify critical component classes', () => {
      expect(isCriticalClass('btn-primary')).toBe(true);
      expect(isCriticalClass('btn-secondary')).toBe(true);
      expect(isCriticalClass('card')).toBe(true);
    });

    it('should identify critical accessibility classes', () => {
      expect(isCriticalClass('sr-only')).toBe(true);
      expect(isCriticalClass('skip-link')).toBe(true);
      expect(isCriticalClass('keyboard-navigation')).toBe(true);
    });

    it('should identify critical animation classes', () => {
      expect(isCriticalClass('animate-pulse')).toBe(true);
    });

    it('should not identify non-critical classes', () => {
      expect(isCriticalClass('animate-spin')).toBe(false);
      expect(isCriticalClass('animate-bounce')).toBe(false);
      expect(isCriticalClass('text-5xl')).toBe(false);
      expect(isCriticalClass('bg-purple-500')).toBe(false);
    });
  });

  describe('extractCriticalCSS', () => {
    it('should separate critical and non-critical CSS', () => {
      const fullCSS = `
        .container { width: 100%; }
        .btn-primary { background: blue; }
        .animate-spin { animation: spin 1s; }
        .text-5xl { font-size: 3rem; }
      `;

      const { critical, nonCritical } = extractCriticalCSS(fullCSS);

      expect(critical).toContain('.container');
      expect(critical).toContain('.btn-primary');
      expect(nonCritical).toContain('.animate-spin');
      expect(nonCritical).toContain('.text-5xl');
    });

    it('should handle media queries correctly', () => {
      const fullCSS = `
        @media (prefers-reduced-motion: reduce) { * { animation: none; } }
        @media (min-width: 768px) { .container { max-width: 768px; } }
        @media (hover: hover) { .btn:hover { background: red; } }
      `;

      const { critical, nonCritical } = extractCriticalCSS(fullCSS);

      expect(critical).toContain('prefers-reduced-motion');
      expect(critical).toContain('min-width: 768px');
      expect(nonCritical).toContain('hover: hover');
    });
  });

  describe('generateInlineCriticalCSS', () => {
    it('should generate inline style tag', () => {
      const inlineCSS = generateInlineCriticalCSS();
      
      expect(inlineCSS).toContain('<style id="critical-css">');
      expect(inlineCSS).toContain('</style>');
      expect(inlineCSS).toContain('box-sizing: border-box');
    });
  });

  describe('CSS_OPTIMIZATION_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(CSS_OPTIMIZATION_CONFIG.maxCriticalSize).toBe(14 * 1024);
      expect(CSS_OPTIMIZATION_CONFIG.alwaysCritical).toContain('container');
      expect(CSS_OPTIMIZATION_CONFIG.alwaysCritical).toContain('btn-primary');
      expect(CSS_OPTIMIZATION_CONFIG.neverCritical).toContain('animate-spin');
      expect(CSS_OPTIMIZATION_CONFIG.neverCritical).toContain('dark:');
    });
  });
});

describe('CSS Loading Utilities', () => {
  describe('loadCSSAsync', () => {
    it('should create and append link element', async () => {
      const mockLink = {
        rel: '',
        href: '',
        media: '',
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockLink);

      const promise = loadCSSAsync('/test.css', 'screen');

      // Simulate successful load
      setTimeout(() => {
        if (mockLink.onload) mockLink.onload();
      }, 10);

      await promise;

      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('stylesheet');
      expect(mockLink.href).toBe('/test.css');
      expect(mockLink.media).toBe('screen');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockLink);
    });

    it('should reject on load error', async () => {
      const mockLink = {
        rel: '',
        href: '',
        media: '',
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockLink);

      const promise = loadCSSAsync('/test.css');

      // Simulate load error
      setTimeout(() => {
        if (mockLink.onerror) mockLink.onerror();
      }, 10);

      await expect(promise).rejects.toThrow('Failed to load CSS: /test.css');
    });
  });

  describe('preloadCSS', () => {
    it('should create preload link element', () => {
      const mockLink = {
        rel: '',
        as: '',
        href: '',
        onload: null as any
      };

      mockDocument.createElement.mockReturnValue(mockLink);

      preloadCSS('/test.css');

      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('preload');
      expect(mockLink.as).toBe('style');
      expect(mockLink.href).toBe('/test.css');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockLink);
    });

    it('should convert to stylesheet after load', () => {
      const mockLink = {
        rel: 'preload',
        as: '',
        href: '',
        onload: null as any
      };

      mockDocument.createElement.mockReturnValue(mockLink);

      preloadCSS('/test.css');

      // Simulate load event
      if (mockLink.onload) mockLink.onload();

      expect(mockLink.rel).toBe('stylesheet');
    });
  });

  describe('isCSSLoaded', () => {
    it('should return true if CSS is loaded', () => {
      const mockLinks = [
        { href: 'http://localhost/test.css' },
        { href: 'http://localhost/other.css' }
      ];

      mockDocument.querySelectorAll.mockReturnValue(mockLinks);

      expect(isCSSLoaded('test.css')).toBe(true);
      expect(isCSSLoaded('missing.css')).toBe(false);
    });
  });

  describe('getCSSLoadingStatus', () => {
    it('should return correct loading status', () => {
      const mockLinks = [
        { sheet: {}, href: 'http://localhost/test.css' }, // loaded
        { sheet: null, href: 'http://localhost/other.css' } // not loaded
      ];

      mockDocument.querySelectorAll.mockReturnValue(mockLinks);
      mockDocument.getElementById.mockReturnValue({ id: 'critical-css' });

      const status = getCSSLoadingStatus();

      expect(status.critical).toBe(true);
      expect(status.total).toBe(2);
      expect(status.loaded).toBe(1);
    });
  });

  describe('CSSPerformanceMonitor', () => {
    it('should initialize with start time', () => {
      mockWindow.performance.now.mockReturnValue(100);


      expect(mockWindow.performance.now).toHaveBeenCalled();
    });

    it('should return metrics', () => {
      const monitor = new CSSPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(typeof metrics).toBe('object');
    });
  });

  describe('CSSOptimizer', () => {
    describe('enableContainment', () => {
      it('should set CSS containment property', () => {
        const mockElement = {
          style: {}
        } as HTMLElement;

        CSSOptimizer.enableContainment(mockElement, 'layout');

        expect(mockElement.style.contain).toBe('layout');
      });
    });

    describe('enableContentVisibility', () => {
      it('should set content visibility property', () => {
        const mockElement = {
          style: {}
        } as any;

        CSSOptimizer.enableContentVisibility(mockElement, 'auto');

        expect(mockElement.style.contentVisibility).toBe('auto');
        expect(mockElement.style.containIntrinsicSize).toBe('0 500px');
      });
    });

    describe('optimizeAnimation', () => {
      it('should set animation optimization properties', () => {
        const mockElement = {
          style: {},
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        } as any;

        CSSOptimizer.optimizeAnimation(mockElement);

        expect(mockElement.style.willChange).toBe('transform, opacity');
        expect(mockElement.style.transform).toBe('translateZ(0)');
        expect(mockElement.addEventListener).toHaveBeenCalledWith('animationend', expect.any(Function));
        expect(mockElement.addEventListener).toHaveBeenCalledWith('transitionend', expect.any(Function));
      });
    });

    describe('lazyLoadComponentCSS', () => {
      it('should load component CSS if not already loaded', async () => {
        mockDocument.querySelectorAll.mockReturnValue([]);

        const mockLink = {
          rel: '',
          href: '',
          media: '',
          onload: null as any,
          onerror: null as any
        };

        mockDocument.createElement.mockReturnValue(mockLink);

        const promise = CSSOptimizer.lazyLoadComponentCSS('TestComponent');

        // Simulate successful load
        setTimeout(() => {
          if (mockLink.onload) mockLink.onload();
        }, 10);

        await promise;

        expect(mockLink.href).toBe('/src/styles/components/TestComponent.css');
      });
    });

    describe('preloadRouteCSS', () => {
      it('should preload route CSS', () => {
        const mockLink = {
          rel: '',
          as: '',
          href: '',
          onload: null as any
        };

        mockDocument.createElement.mockReturnValue(mockLink);

        CSSOptimizer.preloadRouteCSS('dashboard');

        expect(mockLink.href).toBe('/src/styles/pages/dashboard.css');
        expect(mockLink.rel).toBe('preload');
        expect(mockLink.as).toBe('style');
      });
    });
  });
});

describe('CSS Optimization Integration', () => {
  it('should work together for complete optimization', async () => {
    // Test the complete flow
    const criticalCSS = getCriticalCSS();
    expect(criticalCSS).toBeTruthy();

    const inlineCSS = generateInlineCriticalCSS();
    expect(inlineCSS).toContain(criticalCSS);

    // Mock successful CSS loading
    const mockLink = {
      rel: '',
      href: '',
      media: '',
      onload: null as any,
      onerror: null as any
    };

    mockDocument.createElement.mockReturnValue(mockLink);

    const loadPromise = loadCSSAsync('/non-critical.css');

    // Simulate load
    setTimeout(() => {
      if (mockLink.onload) mockLink.onload();
    }, 10);

    await loadPromise;

    expect(mockDocument.head.appendChild).toHaveBeenCalled();
  });

  it('should handle performance monitoring', () => {
    mockWindow.performance.now.mockReturnValue(100);
    mockDocument.getElementById.mockReturnValue({ id: 'critical-css' });

    const monitor = new CSSPerformanceMonitor();
    const metrics = monitor.getMetrics();

    expect(metrics).toBeDefined();
    expect(typeof metrics).toBe('object');
  });

  it('should optimize elements correctly', () => {
    const mockElement = {
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as any;

    CSSOptimizer.enableContainment(mockElement);
    CSSOptimizer.enableContentVisibility(mockElement);
    CSSOptimizer.optimizeAnimation(mockElement);

    expect(mockElement.style.contain).toBe('layout');
    expect(mockElement.style.contentVisibility).toBe('auto');
    expect(mockElement.style.willChange).toBe('transform, opacity');
  });
});