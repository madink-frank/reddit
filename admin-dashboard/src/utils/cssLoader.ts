/**
 * CSS Loading Utilities
 * 
 * Utilities for loading CSS asynchronously and managing critical CSS
 */

/**
 * Load CSS file asynchronously
 */
export function loadCSSAsync(href: string, media: string = 'all'): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Load non-critical CSS after page load
 */
export function loadNonCriticalCSS(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadNonCriticalCSSFiles();
    });
  } else {
    loadNonCriticalCSSFiles();
  }
}

/**
 * Load non-critical CSS files
 */
function loadNonCriticalCSSFiles(): void {
  const nonCriticalCSS = [
    '/src/styles/optimized/non-critical.css',
    '/src/styles/design-system/animations.css',
    '/src/styles/design-system/advanced-dashboard.css'
  ];

  nonCriticalCSS.forEach(href => {
    loadCSSAsync(href).catch(error => {
      console.warn('Failed to load non-critical CSS:', error);
    });
  });
}

/**
 * Preload CSS for better performance
 */
export function preloadCSS(href: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  
  // Convert to stylesheet after load
  link.onload = () => {
    link.rel = 'stylesheet';
  };
  
  document.head.appendChild(link);
}

/**
 * Remove critical CSS after non-critical CSS is loaded
 */
export function removeCriticalCSS(): void {
  const criticalCSS = document.getElementById('critical-css');
  if (criticalCSS) {
    // Wait a bit to ensure non-critical CSS is applied
    setTimeout(() => {
      criticalCSS.remove();
    }, 100);
  }
}

/**
 * Check if CSS is loaded
 */
export function isCSSLoaded(href: string): boolean {
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  return Array.from(links).some(link => {
    const linkElement = link as HTMLLinkElement;
    return linkElement.href && linkElement.href.includes(href);
  });
}

/**
 * Get CSS loading status
 */
export function getCSSLoadingStatus(): {
  critical: boolean;
  nonCritical: boolean;
  total: number;
  loaded: number;
} {
  const allLinks = document.querySelectorAll('link[rel="stylesheet"]');
  const loadedLinks = Array.from(allLinks).filter(link => 
    (link as HTMLLinkElement).sheet !== null
  );

  return {
    critical: document.getElementById('critical-css') !== null,
    nonCritical: isCSSLoaded('non-critical.css'),
    total: allLinks.length,
    loaded: loadedLinks.length
  };
}

/**
 * CSS loading performance metrics
 */
export class CSSPerformanceMonitor {
  private startTime: number;
  private metrics: {
    criticalCSSTime?: number;
    nonCriticalCSSTime?: number;
    totalCSSTime?: number;
  } = {};

  constructor() {
    this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.monitorCSSLoading();
  }

  private monitorCSSLoading(): void {
    // Monitor critical CSS
    if (document.getElementById('critical-css')) {
      this.metrics.criticalCSSTime = performance.now() - this.startTime;
    }

    // Monitor when all CSS is loaded
    const checkAllLoaded = () => {
      const status = getCSSLoadingStatus();
      if (status.loaded === status.total && status.nonCritical) {
        this.metrics.totalCSSTime = performance.now() - this.startTime;
        this.reportMetrics();
      } else {
        requestAnimationFrame(checkAllLoaded);
      }
    };

    requestAnimationFrame(checkAllLoaded);
  }

  private reportMetrics(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Report to analytics or monitoring service
      console.log('CSS Loading Metrics:', this.metrics);
      
      // Send to performance monitoring service
      if ('sendBeacon' in navigator) {
        const data = JSON.stringify({
          type: 'css-performance',
          metrics: this.metrics,
          timestamp: Date.now()
        });
        
        navigator.sendBeacon('/api/metrics', data);
      }
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * CSS optimization utilities
 */
export const CSSOptimizer = {
  /**
   * Enable CSS containment for better performance
   */
  enableContainment(element: HTMLElement, type: 'layout' | 'style' | 'paint' | 'size' | 'strict' = 'layout'): void {
    element.style.contain = type;
  },

  /**
   * Enable content visibility for better rendering performance
   */
  enableContentVisibility(element: HTMLElement, visibility: 'auto' | 'hidden' | 'visible' = 'auto'): void {
    (element.style as any).contentVisibility = visibility;
    
    if (visibility === 'auto') {
      // Set intrinsic size to prevent layout shifts
      (element.style as any).containIntrinsicSize = '0 500px';
    }
  },

  /**
   * Optimize animations for better performance
   */
  optimizeAnimation(element: HTMLElement): void {
    element.style.willChange = 'transform, opacity';
    element.style.transform = 'translateZ(0)'; // Force GPU acceleration
    
    // Clean up after animation
    const cleanup = () => {
      element.style.willChange = 'auto';
      element.removeEventListener('animationend', cleanup);
      element.removeEventListener('transitionend', cleanup);
    };
    
    element.addEventListener('animationend', cleanup);
    element.addEventListener('transitionend', cleanup);
  },

  /**
   * Lazy load CSS for components
   */
  async lazyLoadComponentCSS(componentName: string): Promise<void> {
    const href = `/src/styles/components/${componentName}.css`;
    
    if (!isCSSLoaded(href)) {
      await loadCSSAsync(href);
    }
  },

  /**
   * Preload CSS for route
   */
  preloadRouteCSS(routeName: string): void {
    const href = `/src/styles/pages/${routeName}.css`;
    preloadCSS(href);
  }
};

/**
 * Initialize CSS optimization
 */
export function initializeCSSOptimization(): void {
  // Start performance monitoring
  new CSSPerformanceMonitor();

  // Load non-critical CSS
  loadNonCriticalCSS();

  // Preload fonts
  const fonts = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  ];

  fonts.forEach(font => {
    preloadCSS(font);
  });

  // Enable CSS containment for main containers
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.container, .card, .component-container');
    containers.forEach(container => {
      CSSOptimizer.enableContainment(container as HTMLElement);
    });

    // Enable content visibility for below-fold content
    const belowFoldElements = document.querySelectorAll('.below-fold');
    belowFoldElements.forEach(element => {
      CSSOptimizer.enableContentVisibility(element as HTMLElement);
    });
  });
}

export default {
  loadCSSAsync,
  loadNonCriticalCSS,
  preloadCSS,
  removeCriticalCSS,
  isCSSLoaded,
  getCSSLoadingStatus,
  CSSPerformanceMonitor,
  CSSOptimizer,
  initializeCSSOptimization
};