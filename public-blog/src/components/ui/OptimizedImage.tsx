import React from 'react';
import { OptimizedImage as BaseOptimizedImage } from '@utils/imageOptimization';

// Re-export the optimized image component for easier use
export const OptimizedImage = BaseOptimizedImage;

// Example usage component with common blog image patterns
interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const BlogImage: React.FC<BlogImageProps> = ({
  src,
  alt,
  caption,
  width = 800,
  height = 450,
  className = '',
}) => {
  return (
    <figure className={`my-6 ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg shadow-md"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        formats={['avif', 'webp', 'jpg']}
        quality="high"
        lazy={true}
        placeholder="blur"
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-gray-600 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// Hero image component with priority loading
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  className = '',
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1200}
      height={600}
      className={`w-full h-64 md:h-96 object-cover ${className}`}
      sizes="100vw"
      formats={['avif', 'webp', 'jpg']}
      quality="high"
      lazy={false} // Don't lazy load hero images
      placeholder="blur"
      priority
    />
  );
};

// Thumbnail image component
interface ThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const dimensions = {
    sm: { width: 64, height: 64 },
    md: { width: 96, height: 96 },
    lg: { width: 128, height: 128 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      formats={['avif', 'webp', 'jpg']}
      quality="medium"
      lazy={true}
      placeholder="blur"
    />
  );
};