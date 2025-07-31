import React, { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';

// Image optimization configuration
export const IMAGE_CONFIG = {
  // Supported formats in order of preference
  formats: ['avif', 'webp', 'jpg', 'png'] as const,
  // Quality settings
  quality: {
    high: 90,
    medium: 75,
    low: 60,
  },
  // Breakpoints for responsive images
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    large: 1440,
  },
  // Lazy loading threshold
  rootMargin: '50px',
} as const;

export type ImageFormat = typeof IMAGE_CONFIG.formats[number];
export type ImageQuality = keyof typeof IMAGE_CONFIG.quality;

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: ImageQuality;
  formats?: ImageFormat[];
  sizes?: string;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty' | string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate srcSet for different formats and sizes
export const generateSrcSet = (
  src: string,
  width: number,
  formats: ImageFormat[] = ['webp', 'jpg'],
  quality: ImageQuality = 'medium'
): string => {
  const qualityValue = IMAGE_CONFIG.quality[quality];
  const sizes = [width, Math.floor(width * 0.75), Math.floor(width * 0.5)];
  
  return formats
    .map(format => 
      sizes
        .map(size => `${optimizeImageUrl(src, size, format, qualityValue)} ${size}w`)
        .join(', ')
    )
    .join(', ');
};

// Generate optimized image URL (placeholder for CDN integration)
export const optimizeImageUrl = (
  src: string,
  width?: number,
  format?: ImageFormat,
  quality?: number
): string => {
  // In a real implementation, this would integrate with a CDN like Cloudinary, ImageKit, etc.
  // For now, we'll return the original URL with query parameters for future CDN integration
  const url = new URL(src, window.location.origin);
  
  if (width) url.searchParams.set('w', width.toString());
  if (format) url.searchParams.set('f', format);
  if (quality) url.searchParams.set('q', quality.toString());
  
  return url.toString();
};

// Generate blur placeholder
export const generateBlurPlaceholder = (width: number, height: number): string => {
  // Generate a simple SVG blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Optimized Image Component with lazy loading
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 'medium',
  formats = ['webp', 'jpg'],
  sizes,
  lazy = true,
  placeholder = 'blur',
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: IMAGE_CONFIG.rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate responsive image sources
  const optimizedSrc = width 
    ? optimizeImageUrl(src, width, formats[0], IMAGE_CONFIG.quality[quality])
    : src;

  const srcSet = width && formats.length > 1
    ? generateSrcSet(src, width, formats, quality)
    : undefined;

  // Generate placeholder
  const placeholderSrc = placeholder === 'blur' && width && height
    ? generateBlurPlaceholder(width, height)
    : placeholder === 'empty'
    ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    : typeof placeholder === 'string'
    ? placeholder
    : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ filter: 'blur(10px)' }}
        />
      )}
      
      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          {...props}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreload = (src: string, priority: boolean = false) => {
  useEffect(() => {
    if (!src) return;

    const link = document.createElement('link');
    link.rel = priority ? 'preload' : 'prefetch';
    link.as = 'image';
    link.href = src;
    
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, priority]);
};

// Utility to get optimal image dimensions
export const getOptimalImageSize = (
  containerWidth: number,
  aspectRatio: number = 16/9,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } => {
  const width = Math.ceil(containerWidth * devicePixelRatio);
  const height = Math.ceil(width / aspectRatio);
  
  return { width, height };
};