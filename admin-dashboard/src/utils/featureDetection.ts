// Feature detection utilities for progressive enhancement

// Browser capability detection
export interface BrowserCapabilities {
  webSocket: boolean;
  intersectionObserver: boolean;
  webWorkers: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  canvas: boolean;
  webGL: boolean;
  geolocation: boolean;
  notifications: boolean;
  serviceWorker: boolean;
  webAssembly: boolean;
  es6Modules: boolean;
  asyncAwait: boolean;
  fetch: boolean;
  promises: boolean;
  webRTC: boolean;
  fileAPI: boolean;
  dragAndDrop: boolean;
  touchEvents: boolean;
  pointerEvents: boolean;
  cssGrid: boolean;
  cssFlexbox: boolean;
  cssCustomProperties: boolean;
  cssAnimations: boolean;
  cssTransitions: boolean;
}

// Performance capabilities
export interface PerformanceCapabilities {
  deviceMemory: number | null;
  hardwareConcurrency: number;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

// Device capabilities
export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl';
  pixelRatio: number;
  colorScheme: 'light' | 'dark' | 'no-preference';
  reducedMotion: boolean;
  highContrast: boolean;
}

class FeatureDetector {
  private static instance: FeatureDetector;
  private browserCapabilities: BrowserCapabilities | null = null;
  private performanceCapabilities: PerformanceCapabilities | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;

  private constructor() { }

  static getInstance(): FeatureDetector {
    if (!FeatureDetector.instance) {
      FeatureDetector.instance = new FeatureDetector();
    }
    return FeatureDetector.instance;
  }

  /**
   * Detect browser capabilities
   */
  detectBrowserCapabilities(): BrowserCapabilities {
    if (this.browserCapabilities) {
      return this.browserCapabilities;
    }

    this.browserCapabilities = {
      webSocket: typeof WebSocket !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      canvas: this.hasCanvas(),
      webGL: this.hasWebGL(),
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webAssembly: typeof WebAssembly !== 'undefined',
      es6Modules: this.hasES6Modules(),
      asyncAwait: this.hasAsyncAwait(),
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      webRTC: this.hasWebRTC(),
      fileAPI: typeof FileReader !== 'undefined',
      dragAndDrop: this.hasDragAndDrop(),
      touchEvents: 'ontouchstart' in window,
      pointerEvents: typeof PointerEvent !== 'undefined',
      cssGrid: this.hasCSSGrid(),
      cssFlexbox: this.hasCSSFlexbox(),
      cssCustomProperties: this.hasCSSCustomProperties(),
      cssAnimations: this.hasCSSAnimations(),
      cssTransitions: this.hasCSSTransitions()
    };

    return this.browserCapabilities;
  }

  /**
   * Detect performance capabilities
   */
  detectPerformanceCapabilities(): PerformanceCapabilities {
    if (this.performanceCapabilities) {
      return this.performanceCapabilities;
    }

    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    this.performanceCapabilities = {
      deviceMemory: nav.deviceMemory || null,
      hardwareConcurrency: nav.hardwareConcurrency || 1,
      connectionType: connection?.type || null,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: Boolean(connection?.saveData)
    };

    return this.performanceCapabilities;
  }

  /**
   * Detect device capabilities
   */
  detectDeviceCapabilities(): DeviceCapabilities {
    if (this.deviceCapabilities) {
      return this.deviceCapabilities;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent) && !isMobile;
    const isDesktop = !isMobile && !isTablet;

    const screenSize = this.getScreenSize();
    const pixelRatio = window.devicePixelRatio || 1;

    this.deviceCapabilities = {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenSize,
      pixelRatio,
      colorScheme: this.getColorScheme(),
      reducedMotion: this.prefersReducedMotion(),
      highContrast: this.prefersHighContrast()
    };

    return this.deviceCapabilities;
  }

  /**
   * Get comprehensive feature support
   */
  getFeatureSupport() {
    return {
      browser: this.detectBrowserCapabilities(),
      performance: this.detectPerformanceCapabilities(),
      device: this.detectDeviceCapabilities()
    };
  }

  /**
   * Check if a specific feature is supported
   */
  isSupported(feature: keyof BrowserCapabilities): boolean {
    const capabilities = this.detectBrowserCapabilities();
    return capabilities[feature];
  }

  /**
   * Get device performance tier
   */
  getPerformanceTier(): 'low' | 'medium' | 'high' {
    const perf = this.detectPerformanceCapabilities();
    const device = this.detectDeviceCapabilities();

    // Low-end device indicators
    if (
      (perf.deviceMemory && perf.deviceMemory <= 2) ||
      perf.hardwareConcurrency <= 2 ||
      perf.saveData ||
      (perf.effectiveType !== null && ['slow-2g', '2g'].includes(perf.effectiveType)) ||
      device.isMobile
    ) {
      return 'low';
    }

    // High-end device indicators
    if (
      (perf.deviceMemory && perf.deviceMemory >= 8) ||
      perf.hardwareConcurrency >= 8 ||
      (perf.effectiveType !== null && perf.effectiveType === '4g') ||
      (perf.downlink && perf.downlink >= 10)
    ) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Check if device should use reduced features
   */
  shouldUseReducedFeatures(): boolean {
    const perf = this.detectPerformanceCapabilities();
    const device = this.detectDeviceCapabilities();

    return (
      perf.saveData ||
      device.reducedMotion ||
      this.getPerformanceTier() === 'low' ||
      (perf.effectiveType !== null && ['slow-2g', '2g', '3g'].includes(perf.effectiveType))
    );
  }

  // Private helper methods

  private hasLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private hasSessionStorage(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private hasCanvas(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  private hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      );
    } catch {
      return false;
    }
  }

  private hasES6Modules(): boolean {
    try {
      return typeof Symbol !== 'undefined' &&
        typeof Symbol.iterator !== 'undefined';
    } catch {
      return false;
    }
  }

  private hasAsyncAwait(): boolean {
    try {
      return (async () => { })().constructor === Promise;
    } catch {
      return false;
    }
  }

  private hasWebRTC(): boolean {
    return !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );
  }

  private hasDragAndDrop(): boolean {
    return 'draggable' in document.createElement('div');
  }

  private hasCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }

  private hasCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }

  private hasCSSCustomProperties(): boolean {
    return CSS.supports('--custom', 'property');
  }

  private hasCSSAnimations(): boolean {
    return CSS.supports('animation', 'none');
  }

  private hasCSSTransitions(): boolean {
    return CSS.supports('transition', 'none');
  }

  private getScreenSize(): 'sm' | 'md' | 'lg' | 'xl' {
    const width = window.innerWidth;
    if (width < 640) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  }

  private getColorScheme(): 'light' | 'dark' | 'no-preference' {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'no-preference';
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }
}

// Progressive enhancement configuration
export interface ProgressiveConfig {
  enableAdvancedFeatures: boolean;
  enableAnimations: boolean;
  enableRealTime: boolean;
  enableCaching: boolean;
  enableOffline: boolean;
  maxConcurrentRequests: number;
  imageQuality: 'low' | 'medium' | 'high';
  chartComplexity: 'simple' | 'detailed';
}

/**
 * Get progressive enhancement configuration based on device capabilities
 */
export function getProgressiveConfig(): ProgressiveConfig {
  const detector = FeatureDetector.getInstance();
  const tier = detector.getPerformanceTier();
  const shouldReduce = detector.shouldUseReducedFeatures();
  const capabilities = detector.getFeatureSupport();

  const baseConfig: ProgressiveConfig = {
    enableAdvancedFeatures: true,
    enableAnimations: true,
    enableRealTime: true,
    enableCaching: true,
    enableOffline: true,
    maxConcurrentRequests: 6,
    imageQuality: 'high',
    chartComplexity: 'detailed'
  };

  if (shouldReduce || tier === 'low') {
    return {
      ...baseConfig,
      enableAdvancedFeatures: false,
      enableAnimations: !capabilities.device.reducedMotion,
      enableRealTime: capabilities.browser.webSocket,
      maxConcurrentRequests: 2,
      imageQuality: 'low',
      chartComplexity: 'simple'
    };
  }

  if (tier === 'medium') {
    return {
      ...baseConfig,
      maxConcurrentRequests: 4,
      imageQuality: 'medium'
    };
  }

  return baseConfig;
}

/**
 * Feature detection hook for React components
 */
export function useFeatureDetection() {
  const detector = FeatureDetector.getInstance();

  return {
    capabilities: detector.getFeatureSupport(),
    isSupported: (feature: keyof BrowserCapabilities) => detector.isSupported(feature),
    performanceTier: detector.getPerformanceTier(),
    shouldUseReducedFeatures: detector.shouldUseReducedFeatures(),
    progressiveConfig: getProgressiveConfig()
  };
}

// Export singleton instance
export const featureDetector = FeatureDetector.getInstance();
export default featureDetector;