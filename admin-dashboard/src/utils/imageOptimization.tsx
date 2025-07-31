import React, { useState, useRef, useEffect } from 'react';

/**
 * Props for the OptimizedImage component
 */
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  placeholder?: string;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
}

/**
 * Optimized image component with lazy loading and WebP support
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  webpSrc,
  placeholder,
  lazy = true,
  className = '',
  onLoad,
  onError,
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
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    onError?.(event);
  };

  // Don't render anything if lazy loading and not in view
  if (lazy && !isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ aspectRatio: '16/9' }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  return (
    <picture>
      {/* WebP source for modern browsers */}
      {webpSrc && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        {...props}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      
      {/* Error fallback */}
      {hasError && (
        <div
          className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${className}`}
        >
          <div className="text-gray-400 text-sm">Failed to load image</div>
        </div>
      )}
    </picture>
  );
};

/**
 * Generate responsive image URLs for different screen sizes
 */
export const generateResponsiveImageUrls = (baseUrl: string, sizes: number[] = [320, 640, 1024, 1280]) => {
  return sizes.map(size => `${baseUrl}?w=${size}&q=75 ${size}w`).join(', ');
};

/**
 * Convert image to WebP format (client-side)
 */
export const convertToWebP = (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Check if browser supports AVIF format
 */
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

/**
 * Get the best supported image format
 */
export const getBestImageFormat = async (): Promise<'avif' | 'webp' | 'original'> => {
  try {
    if (await supportsAVIF()) return 'avif';
    if (await supportsWebP()) return 'webp';
    return 'original';
  } catch {
    return 'original';
  }
};

/**
 * Generate srcSet for responsive images with format support
 */
export const generateResponsiveSrcSet = (
  baseUrl: string, 
  sizes: number[] = [320, 640, 1024, 1280],
  format?: 'webp' | 'avif'
): string => {
  const formatParam = format ? `&f=${format}` : '';
  return sizes
    .map(size => `${baseUrl}?w=${size}&q=75${formatParam} ${size}w`)
    .join(', ');
};

/**
 * Advanced image optimization with multiple format support
 */
interface AdvancedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  avifSrc?: string;
  placeholder?: string;
  blurDataURL?: string;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const AdvancedImage: React.FC<AdvancedImageProps> = ({
  src,
  alt,
  webpSrc,
  avifSrc,
  placeholder,
  blurDataURL,
  lazy = true,
  priority = false,
  className = '',
  onLoad,
  onError,
  sizes,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || blurDataURL || '');
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView, priority]);

  // Load the actual image when in view
  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      
      img.src = src;
    }
  }, [isInView, src, isLoaded, hasError, onLoad, onError]);

  const shouldShowPlaceholder = !isInView || (!isLoaded && !hasError);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      <picture>
        {/* AVIF source for modern browsers */}
        {avifSrc && isInView && (
          <source srcSet={avifSrc} type="image/avif" sizes={sizes} />
        )}
        
        {/* WebP source for modern browsers */}
        {webpSrc && isInView && (
          <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
        )}
        
        <img
          src={currentSrc}
          alt={alt}
          className={`transition-all duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${blurDataURL && !isLoaded ? 'blur-sm scale-110' : ''}`}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          sizes={sizes}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
          {...props}
        />
      </picture>
      
      {/* Loading placeholder */}
      {shouldShowPlaceholder && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Failed to load image</div>
        </div>
      )}
    </div>
  );
};