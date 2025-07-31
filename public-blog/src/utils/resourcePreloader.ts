// Resource preloading and CDN integration utilities

export interface PreloadConfig {
  priority: 'high' | 'low';
  as: 'image' | 'script' | 'style' | 'font' | 'fetch';
  crossOrigin?: 'anonymous' | 'use-credentials';
  type?: string;
}

export interface CDNConfig {
  baseUrl: string;
  imageTransforms: {
    quality: number;
    format: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    resize: 'fit' | 'fill' | 'crop';
  };
  cacheControl: string;
}

// Default CDN configuration (can be overridden via environment variables)
export const DEFAULT_CDN_CONFIG: CDNConfig = {
  baseUrl: process.env.VITE_CDN_BASE_URL || '',
  imageTransforms: {
    quality: 85,
    format: 'auto',
    resize: 'fit',
  },
  cacheControl: 'public, max-age=31536000', // 1 year
};

class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private cdnConfig: CDNConfig;

  constructor(cdnConfig: CDNConfig = DEFAULT_CDN_CONFIG) {
    this.cdnConfig = cdnConfig;
  }

  // Preload a resource
  preload(url: string, config: Partial<PreloadConfig> = {}): void {
    if (this.preloadedResources.has(url)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = this.optimizeUrl(url);
    link.as = config.as || 'fetch';
    
    if (config.crossOrigin) {
      link.crossOrigin = config.crossOrigin;
    }
    
    if (config.type) {
      link.type = config.type;
    }

    // Set priority hint if supported
    if ('fetchPriority' in link && config.priority) {
      (link as any).fetchPriority = config.priority;
    }

    document.head.appendChild(link);
    this.preloadedResources.add(url);
  }

  // Prefetch a resource (lower priority)
  prefetch(url: string): void {
    if (this.preloadedResources.has(url)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = this.optimizeUrl(url);
    
    document.head.appendChild(link);
    this.preloadedResources.add(url);
  }

  // Preload critical images
  preloadImages(urls: string[], priority: 'high' | 'low' = 'high'): void {
    urls.forEach(url => {
      this.preload(url, { as: 'image', priority });
    });
  }

  // Preload fonts
  preloadFonts(urls: string[]): void {
    urls.forEach(url => {
      this.preload(url, { 
        as: 'font', 
        crossOrigin: 'anonymous',
        priority: 'high'
      });
    });
  }

  // Optimize URL with CDN transformations
  private optimizeUrl(url: string): string {
    if (!this.cdnConfig.baseUrl || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // If URL is already absolute, return as-is
    if (url.startsWith('http')) {
      return url;
    }

    // Construct CDN URL
    const cdnUrl = new URL(url, this.cdnConfig.baseUrl);
    
    // Add image transformations for image resources
    if (this.isImageUrl(url)) {
      const params = new URLSearchParams();
      params.set('q', this.cdnConfig.imageTransforms.quality.toString());
      params.set('f', this.cdnConfig.imageTransforms.format);
      params.set('fit', this.cdnConfig.imageTransforms.resize);
      
      cdnUrl.search = params.toString();
    }

    return cdnUrl.toString();
  }

  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  // Clear preloaded resources tracking
  clear(): void {
    this.preloadedResources.clear();
  }
}

// Global preloader instance
export const resourcePreloader = new ResourcePreloader();

// Preload critical resources for the blog
export const preloadCriticalResources = (): void => {
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-var.woff2',
    '/fonts/inter-var-italic.woff2',
  ];
  
  resourcePreloader.preloadFonts(criticalFonts);

  // Preload hero images or critical images
  const criticalImages = [
    '/images/hero-bg.webp',
    '/images/logo.svg',
  ];
  
  resourcePreloader.preloadImages(criticalImages, 'high');
};

// DNS prefetch for external domains
export const prefetchDNS = (domains: string[]): void => {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
};

// Preconnect to external domains
export const preconnectDomains = (domains: string[]): void => {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `//${domain}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// React hook for resource preloading
export const useResourcePreload = (
  resources: Array<{ url: string; config?: Partial<PreloadConfig> }>,
  condition: boolean = true
): void => {
  React.useEffect(() => {
    if (!condition) return;

    resources.forEach(({ url, config }) => {
      resourcePreloader.preload(url, config);
    });
  }, [resources, condition]);
};

// React hook for image preloading
export const useImagePreload = (
  images: string[],
  priority: 'high' | 'low' = 'low'
): void => {
  React.useEffect(() => {
    if (images.length === 0) return;

    resourcePreloader.preloadImages(images, priority);
  }, [images, priority]);
};

// Intersection Observer for progressive loading
export class ProgressiveLoader {
  private observer: IntersectionObserver;
  private loadedElements = new WeakSet();

  constructor(
    private onIntersect: (element: Element) => void,
    options: IntersectionObserverInit = { rootMargin: '50px' }
  ) {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);
  }

  observe(element: Element): void {
    if (this.loadedElements.has(element)) return;
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.observer.unobserve(element);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
        this.loadedElements.add(entry.target);
        this.onIntersect(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  disconnect(): void {
    this.observer.disconnect();
  }
}

// Service Worker registration for caching
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New content is available. Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Import React for hooks
import React from 'react';