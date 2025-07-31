/**
 * Resource preloading utilities for better performance
 */

/**
 * Preload CSS files
 */
export const preloadCSS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload CSS: ${href}`));
    document.head.appendChild(link);
  });
};

/**
 * Preload JavaScript modules
 */
export const preloadJS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload JS: ${href}`));
    document.head.appendChild(link);
  });
};

/**
 * Preload images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
};

/**
 * Preload fonts
 */
export const preloadFont = (href: string, type: string = 'font/woff2'): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    link.crossOrigin = 'anonymous';
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload font: ${href}`));
    document.head.appendChild(link);
  });
};

/**
 * Prefetch resources for future navigation
 */
export const prefetchResource = (href: string): void => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * DNS prefetch for external domains
 */
export const dnsPrefetch = (domain: string): void => {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
};

/**
 * Preconnect to external domains
 */
export const preconnect = (domain: string): void => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  document.head.appendChild(link);
};

/**
 * Critical resource preloader for the admin dashboard
 */
export const preloadCriticalResources = () => {
  // Preconnect to API domain
  if (import.meta.env.VITE_API_URL) {
    preconnect(import.meta.env.VITE_API_URL);
  }
  
  // DNS prefetch for external services
  dnsPrefetch('//fonts.googleapis.com');
  dnsPrefetch('//fonts.gstatic.com');
  
  // Preload critical fonts (if using external fonts)
  // preloadFont('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  return Promise.resolve();
};

/**
 * Lazy load resources when they come into view
 */
export class LazyResourceLoader {
  private observer: IntersectionObserver;
  private loadedResources = new Set<string>();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.dataset.src;
            if (src && !this.loadedResources.has(src)) {
              this.loadResource(element, src);
              this.loadedResources.add(src);
              this.observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  private loadResource(element: HTMLElement, src: string) {
    if (element.tagName === 'IMG') {
      (element as HTMLImageElement).src = src;
    } else if (element.tagName === 'IFRAME') {
      (element as HTMLIFrameElement).src = src;
    }
  }

  observe(element: HTMLElement) {
    this.observer.observe(element);
  }

  disconnect() {
    this.observer.disconnect();
  }
}

/**
 * Global lazy resource loader instance
 */
export const lazyResourceLoader = new LazyResourceLoader();