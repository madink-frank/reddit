/**
 * Image Optimization Service
 * Centralized service for handling image optimization, lazy loading, and format conversion
 */

import {
  detectImageFormatSupport,
  generateResponsiveImageSources,
  preloadImages,
  imageConverter,
  type SupportedImageFormat
} from '../utils/imageFormatSupport';

export interface OptimizationConfig {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  formats: SupportedImageFormat[];
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  placeholderType: 'blur' | 'skeleton' | 'none';
}

export interface ImageAsset {
  id: string;
  originalUrl: string;
  optimizedUrls: Record<SupportedImageFormat, string>;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  placeholder?: string;
}

class ImageOptimizationService {
  private config: OptimizationConfig;
  private cache: Map<string, ImageAsset> = new Map();
  private formatSupport: any = null;

  constructor() {
    this.config = {
      quality: 75,
      maxWidth: 1920,
      maxHeight: 1080,
      formats: ['avif', 'webp', 'jpeg'],
      enableLazyLoading: true,
      enablePreloading: false,
      placeholderType: 'skeleton'
    };
  }

  /**
   * Initialize the service and detect format support
   */
  async initialize(): Promise<void> {
    this.formatSupport = await detectImageFormatSupport();
    console.log('Image format support detected:', this.formatSupport);
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Optimize a single image
   */
  async optimizeImage(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      priority?: boolean;
    } = {}
  ): Promise<ImageAsset> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const {
      width = this.config.maxWidth,
      height = this.config.maxHeight,
      quality = this.config.quality,
      priority = false
    } = options;

    try {
      // Generate responsive sources for different formats
      const sources = await generateResponsiveImageSources(url, [width], quality);

      // Create optimized URLs for each supported format
      const optimizedUrls: Record<SupportedImageFormat, string> = {
        avif: sources.avif || sources.fallback,
        webp: sources.webp || sources.fallback,
        jpeg: sources.fallback,
        png: sources.fallback,
        gif: sources.fallback
      };

      // Generate placeholder if needed
      let placeholder: string | undefined;
      if (this.config.placeholderType === 'blur') {
        placeholder = await this.generateBlurPlaceholder(url);
      }

      const asset: ImageAsset = {
        id: cacheKey,
        originalUrl: url,
        optimizedUrls,
        metadata: {
          width,
          height,
          format: 'jpeg', // Default format
          size: 0 // Would need to be calculated from actual image
        },
        placeholder
      };

      this.cache.set(cacheKey, asset);

      // Preload if priority is set
      if (priority && this.config.enablePreloading) {
        await this.preloadImage(asset);
      }

      return asset;
    } catch (error) {
      console.error('Failed to optimize image:', error);

      // Return fallback asset
      const fallbackAsset: ImageAsset = {
        id: cacheKey,
        originalUrl: url,
        optimizedUrls: {
          avif: url,
          webp: url,
          jpeg: url,
          png: url,
          gif: url
        },
        metadata: {
          width,
          height,
          format: 'jpeg',
          size: 0
        }
      };

      this.cache.set(cacheKey, fallbackAsset);
      return fallbackAsset;
    }
  }

  /**
   * Optimize multiple images in batch
   */
  async optimizeImages(
    urls: string[],
    options: {
      width?: number;
      height?: number;
      quality?: number;
      concurrency?: number;
    } = {}
  ): Promise<ImageAsset[]> {
    const { concurrency = 5 } = options;
    const results: ImageAsset[] = [];

    // Process images in batches to avoid overwhelming the browser
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => this.optimizeImage(url, options));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to optimize image ${batch[index]}:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Preload critical images
   */
  async preloadCriticalImages(
    images: Array<{
      url: string;
      width?: number;
      height?: number;
      quality?: number;
    }>
  ): Promise<void> {
    if (!this.config.enablePreloading) return;

    try {
      await preloadImages(
        images.map(({ url, width, height, quality }) => ({
          src: url,
          width,
          height,
          quality
        }))
      );
    } catch (error) {
      console.warn('Failed to preload some critical images:', error);
    }
  }

  /**
   * Generate blur placeholder for an image
   */
  private async generateBlurPlaceholder(url: string): Promise<string> {
    try {
      // Create a small, low-quality version for blur placeholder
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const img = new Image();
      img.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Create a very small version (10x10) for blur effect
          canvas.width = 10;
          canvas.height = 10;

          ctx.drawImage(img, 0, 0, 10, 10);

          // Convert to low-quality JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
          resolve(dataUrl);
        };

        img.onerror = () => reject(new Error('Failed to load image for placeholder'));
        img.src = url;
      });
    } catch (error) {
      console.warn('Failed to generate blur placeholder:', error);
      return '';
    }
  }

  /**
   * Preload a single image asset
   */
  private async preloadImage(asset: ImageAsset): Promise<void> {
    const bestFormat = this.getBestSupportedFormat();
    const urlToPreload = asset.optimizedUrls[bestFormat];

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = urlToPreload;

      if (bestFormat === 'avif') {
        link.type = 'image/avif';
      } else if (bestFormat === 'webp') {
        link.type = 'image/webp';
      }

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload: ${urlToPreload}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Get the best supported image format
   */
  private getBestSupportedFormat(): SupportedImageFormat {
    if (!this.formatSupport) return 'jpeg';

    if (this.formatSupport.avif) return 'avif';
    if (this.formatSupport.webp) return 'webp';
    return 'jpeg';
  }

  /**
   * Convert uploaded image to optimized format
   */
  async convertUploadedImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: SupportedImageFormat;
    } = {}
  ): Promise<Blob> {
    const {
      maxWidth = this.config.maxWidth,
      maxHeight = this.config.maxHeight,
      quality = this.config.quality / 100, // Convert to 0-1 range
      format = this.getBestSupportedFormat()
    } = options;

    try {
      // Map format to supported converter formats
      const converterFormat = this.mapToConverterFormat(format);

      // Resize and convert the image
      const optimizedBlob = await imageConverter.resizeImage(
        file,
        maxWidth,
        maxHeight,
        converterFormat,
        quality
      );

      return optimizedBlob;
    } catch (error) {
      console.error('Failed to convert uploaded image:', error);
      throw error;
    }
  }

  /**
   * Map SupportedImageFormat to converter-supported formats
   */
  private mapToConverterFormat(format: SupportedImageFormat): 'webp' | 'jpeg' | 'png' {
    switch (format) {
      case 'avif':
        // AVIF not supported by converter, fallback to WebP
        return 'webp';
      case 'webp':
        return 'webp';
      case 'png':
        return 'png';
      case 'gif':
        // GIF not supported by converter, fallback to PNG for transparency
        return 'png';
      case 'jpeg':
      default:
        return 'jpeg';
    }
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    cachedImages: number;
    formatSupport: any;
    config: OptimizationConfig;
  } {
    return {
      cachedImages: this.cache.size,
      formatSupport: this.formatSupport,
      config: this.config
    };
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove specific image from cache
   */
  removeFromCache(url: string): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => key.startsWith(url));
    keysToRemove.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();

// Initialize the service when the module is loaded
if (typeof window !== 'undefined') {
  imageOptimizationService.initialize().catch(console.error);
}

export default imageOptimizationService;