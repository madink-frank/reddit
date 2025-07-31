import React from 'react';

/**
 * Image Format Support and Conversion Utilities
 * Provides comprehensive support for modern image formats
 */

export type SupportedImageFormat = 'avif' | 'webp' | 'jpeg' | 'png' | 'gif';

export interface ImageFormatSupport {
  avif: boolean;
  webp: boolean;
  jpeg: boolean;
  png: boolean;
  gif: boolean;
}

/**
 * Cache for format support detection results
 */
let formatSupportCache: ImageFormatSupport | null = null;

/**
 * Detect browser support for various image formats
 */
export async function detectImageFormatSupport(): Promise<ImageFormatSupport> {
  if (formatSupportCache) {
    return formatSupportCache;
  }

  const support: ImageFormatSupport = {
    avif: false,
    webp: false,
    jpeg: true, // Always supported
    png: true,  // Always supported
    gif: true   // Always supported
  };

  // Test AVIF support
  try {
    const avifSupported = await testImageFormat(
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    );
    support.avif = avifSupported;
  } catch {
    support.avif = false;
  }

  // Test WebP support
  try {
    const webpSupported = await testImageFormat(
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    );
    support.webp = webpSupported;
  } catch {
    support.webp = false;
  }

  formatSupportCache = support;
  return support;
}

/**
 * Test if a specific image format is supported
 */
function testImageFormat(dataUri: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.height === 2);
    img.onerror = () => resolve(false);
    img.src = dataUri;
  });
}

/**
 * Get the best supported image format for a given image
 */
export async function getBestImageFormat(
  originalFormat: string = 'jpeg'
): Promise<SupportedImageFormat> {
  const support = await detectImageFormatSupport();
  
  // For animated images, prefer original format
  if (originalFormat.toLowerCase() === 'gif') {
    return 'gif';
  }
  
  // Return the best supported format in order of preference
  if (support.avif) return 'avif';
  if (support.webp) return 'webp';
  
  // Fallback to original or JPEG
  return (originalFormat.toLowerCase() as SupportedImageFormat) || 'jpeg';
}

/**
 * Generate image URLs with format fallbacks
 */
export interface ImageUrlOptions {
  baseUrl: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: SupportedImageFormat;
  dpr?: number; // Device pixel ratio
}

export function generateImageUrl(options: ImageUrlOptions): string {
  const { baseUrl, width, height, quality = 75, format, dpr = 1 } = options;
  
  const params = new URLSearchParams();
  
  if (width) params.set('w', (width * dpr).toString());
  if (height) params.set('h', (height * dpr).toString());
  if (quality !== 75) params.set('q', quality.toString());
  if (format && format !== 'jpeg') params.set('f', format);
  if (dpr !== 1) params.set('dpr', dpr.toString());
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate responsive image sources with format support
 */
export async function generateResponsiveImageSources(
  baseUrl: string,
  sizes: number[] = [320, 640, 1024, 1280, 1920],
  quality: number = 75
): Promise<{
  avif?: string;
  webp?: string;
  fallback: string;
}> {
  const support = await detectImageFormatSupport();
  const sources: any = {};
  
  // Generate AVIF sources if supported
  if (support.avif) {
    sources.avif = sizes
      .map(size => generateImageUrl({ baseUrl, width: size, quality, format: 'avif' }) + ` ${size}w`)
      .join(', ');
  }
  
  // Generate WebP sources if supported
  if (support.webp) {
    sources.webp = sizes
      .map(size => generateImageUrl({ baseUrl, width: size, quality, format: 'webp' }) + ` ${size}w`)
      .join(', ');
  }
  
  // Generate fallback sources
  sources.fallback = sizes
    .map(size => generateImageUrl({ baseUrl, width: size, quality }) + ` ${size}w`)
    .join(', ');
  
  return sources;
}

/**
 * Smart image component that automatically selects the best format
 */
export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function SmartImage({
  src,
  alt,
  width,
  height,
  quality = 75,
  sizes,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  onLoad,
  onError,
  ...props
}: SmartImageProps) {
  const [imageSources, setImageSources] = React.useState<{
    avif?: string;
    webp?: string;
    fallback: string;
  } | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Generate responsive sources
  React.useEffect(() => {
    const generateSources = async () => {
      const responsiveSizes = width 
        ? [Math.floor(width * 0.5), width, Math.floor(width * 1.5), Math.floor(width * 2)]
        : [320, 640, 1024, 1280];
      
      const sources = await generateResponsiveImageSources(src, responsiveSizes, quality);
      setImageSources(sources);
    };

    generateSources();
  }, [src, width, quality]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    onError?.(event);
  };

  if (!imageSources) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{ width, height, aspectRatio: width && height ? `${width}/${height}` : undefined }}
      />
    );
  }

  return (
    <picture className={className}>
      {/* AVIF source */}
      {imageSources.avif && (
        <source
          srcSet={imageSources.avif}
          sizes={sizes}
          type="image/avif"
        />
      )}
      
      {/* WebP source */}
      {imageSources.webp && (
        <source
          srcSet={imageSources.webp}
          sizes={sizes}
          type="image/webp"
        />
      )}
      
      {/* Fallback image */}
      <img
        src={generateImageUrl({ baseUrl: src, width, height, quality })}
        srcSet={imageSources.fallback}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${placeholder === 'blur' && blurDataURL && !isLoaded ? 'blur-sm' : ''}`}
        style={{
          backgroundImage: placeholder === 'blur' && blurDataURL ? `url(${blurDataURL})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </picture>
  );
}

/**
 * Preload critical images with format optimization
 */
export async function preloadImages(
  images: Array<{
    src: string;
    width?: number;
    height?: number;
    quality?: number;
  }>
): Promise<void> {
  const support = await detectImageFormatSupport();
  
  const preloadPromises = images.map(async ({ src, width, height, quality = 75 }) => {
    const format = await getBestImageFormat();
    const optimizedUrl = generateImageUrl({ baseUrl: src, width, height, quality, format });
    
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedUrl;
      
      if (support.avif && format === 'avif') {
        link.type = 'image/avif';
      } else if (support.webp && format === 'webp') {
        link.type = 'image/webp';
      }
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload image: ${optimizedUrl}`));
      
      document.head.appendChild(link);
    });
  });
  
  try {
    await Promise.all(preloadPromises);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
}

/**
 * Image format conversion utilities for client-side processing
 */
export class ImageConverter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
  }

  /**
   * Convert image to specified format
   */
  async convertImage(
    file: File,
    format: 'webp' | 'jpeg' | 'png',
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        this.ctx.drawImage(img, 0, 0);
        
        this.canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error(`Failed to convert image to ${format}`));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Resize image while maintaining aspect ratio
   */
  async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    format: 'webp' | 'jpeg' | 'png' = 'webp',
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = this.calculateResizeDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(img, 0, 0, width, height);
        
        this.canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error(`Failed to resize and convert image to ${format}`));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateResizeDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }
}

// Export a singleton instance (lazy initialization)
let _imageConverter: ImageConverter | null = null;
export const imageConverter = {
  convertImage: (file: File, format: 'webp' | 'jpeg' | 'png', quality: number = 0.8) => {
    if (!_imageConverter) {
      _imageConverter = new ImageConverter();
    }
    return _imageConverter.convertImage(file, format, quality);
  },
  resizeImage: (file: File, maxWidth: number, maxHeight: number, format: 'webp' | 'jpeg' | 'png' = 'webp', quality: number = 0.8) => {
    if (!_imageConverter) {
      _imageConverter = new ImageConverter();
    }
    return _imageConverter.resizeImage(file, maxWidth, maxHeight, format, quality);
  }
};