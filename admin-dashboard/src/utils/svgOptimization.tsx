import React from 'react';

/**
 * SVG Optimization Utilities
 * Provides tools for optimizing SVG icons and graphics
 */

export interface SVGOptimizationOptions {
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeUnusedDefs?: boolean;
  removeEmptyGroups?: boolean;
  minifyStyles?: boolean;
  removeDefaultAttrs?: boolean;
  precision?: number;
}

/**
 * Optimize SVG content by removing unnecessary elements and attributes
 */
export function optimizeSVG(svgContent: string, options: SVGOptimizationOptions = {}): string {
  const {
    removeComments = true,
    removeMetadata = true,
    removeUnusedDefs = true,
    removeEmptyGroups = true,
    minifyStyles = true,
    removeDefaultAttrs = true,
    precision = 2
  } = options;

  let optimized = svgContent;

  // Remove XML comments
  if (removeComments) {
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Remove metadata elements
  if (removeMetadata) {
    optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    optimized = optimized.replace(/<title[\s\S]*?<\/title>/gi, '');
    optimized = optimized.replace(/<desc[\s\S]*?<\/desc>/gi, '');
  }

  // Remove empty groups
  if (removeEmptyGroups) {
    optimized = optimized.replace(/<g[^>]*>\s*<\/g>/gi, '');
  }

  // Remove default attributes
  if (removeDefaultAttrs) {
    optimized = optimized.replace(/\s+fill="none"/gi, '');
    optimized = optimized.replace(/\s+stroke="none"/gi, '');
    optimized = optimized.replace(/\s+stroke-width="1"/gi, '');
  }

  // Minify inline styles
  if (minifyStyles) {
    optimized = optimized.replace(/style="([^"]*?)"/gi, (match, styles) => {
      const minified = styles
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*:\s*/g, ':')
        .replace(/;\s*$/, '');
      return `style="${minified}"`;
    });
  }

  // Round numeric values to specified precision
  if (precision >= 0) {
    optimized = optimized.replace(/(\d+\.\d+)/g, (match) => {
      return parseFloat(match).toFixed(precision).replace(/\.?0+$/, '');
    });
  }

  // Remove unnecessary whitespace
  optimized = optimized.replace(/\s+/g, ' ').trim();

  return optimized;
}

/**
 * Create an optimized SVG icon component
 */
export interface OptimizedSVGIconProps {
  content: string;
  size?: number | string;
  className?: string;
  title?: string;
  'aria-label'?: string;
  role?: string;
}

/**
 * SVG Icon component with built-in optimization
 */
export function OptimizedSVGIcon({
  content,
  size = 24,
  className = '',
  title,
  'aria-label': ariaLabel,
  role = 'img',
  ...props
}: OptimizedSVGIconProps & React.SVGProps<SVGSVGElement>) {
  const optimizedContent = optimizeSVG(content);
  
  // Extract viewBox from the SVG content if present
  const viewBoxMatch = optimizedContent.match(/viewBox="([^"]*?)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  // Extract path data from the SVG content
  const pathMatch = optimizedContent.match(/<path[^>]*d="([^"]*?)"[^>]*>/);
  const pathData = pathMatch ? pathMatch[1] : '';

  // Extract other path attributes
  const fillMatch = optimizedContent.match(/<path[^>]*fill="([^"]*?)"[^>]*>/);
  const strokeMatch = optimizedContent.match(/<path[^>]*stroke="([^"]*?)"[^>]*>/);
  const strokeWidthMatch = optimizedContent.match(/<path[^>]*stroke-width="([^"]*?)"[^>]*>/);

  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      width={sizeValue}
      height={sizeValue}
      viewBox={viewBox}
      className={className}
      role={role}
      aria-label={ariaLabel || title}
      {...props}
    >
      {title && <title>{title}</title>}
      <path
        d={pathData}
        fill={fillMatch ? fillMatch[1] : 'currentColor'}
        stroke={strokeMatch ? strokeMatch[1] : 'none'}
        strokeWidth={strokeWidthMatch ? strokeWidthMatch[1] : undefined}
      />
    </svg>
  );
}

/**
 * SVG sprite system for efficient icon loading
 */
class SVGSpriteManager {
  private sprites: Map<string, string> = new Map();
  private spriteElement: SVGSVGElement | null = null;

  /**
   * Add an SVG to the sprite system
   */
  addSprite(id: string, svgContent: string): void {
    const optimized = optimizeSVG(svgContent);
    this.sprites.set(id, optimized);
    this.updateSpriteElement();
  }

  /**
   * Get SVG content by ID
   */
  getSprite(id: string): string | undefined {
    return this.sprites.get(id);
  }

  /**
   * Create or update the sprite element in the DOM
   */
  private updateSpriteElement(): void {
    if (!this.spriteElement) {
      this.spriteElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.spriteElement.style.display = 'none';
      this.spriteElement.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.spriteElement);
    }

    // Clear existing content
    this.spriteElement.innerHTML = '';

    // Add all sprites as symbols
    this.sprites.forEach((content, id) => {
      const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
      symbol.id = `sprite-${id}`;
      
      // Extract viewBox from content
      const viewBoxMatch = content.match(/viewBox="([^"]*?)"/);
      if (viewBoxMatch) {
        symbol.setAttribute('viewBox', viewBoxMatch[1]);
      }

      // Extract inner content (everything between <svg> tags)
      const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
      if (innerMatch) {
        symbol.innerHTML = innerMatch[1];
      }

      this.spriteElement!.appendChild(symbol);
    });
  }

  /**
   * Create a reference to a sprite
   */
  createSpriteReference(id: string, props: OptimizedSVGIconProps): JSX.Element {
    const { size = 24, className = '', title, 'aria-label': ariaLabel, role = 'img' } = props;
    const sizeValue = typeof size === 'number' ? `${size}px` : size;

    return (
      <svg
        width={sizeValue}
        height={sizeValue}
        className={className}
        role={role}
        aria-label={ariaLabel || title}
      >
        {title && <title>{title}</title>}
        <use href={`#sprite-${id}`} />
      </svg>
    );
  }
}

// Global sprite manager instance
export const svgSpriteManager = new SVGSpriteManager();

/**
 * Hook for using SVG sprites
 */
export function useSVGSprite(id: string, svgContent?: string) {
  React.useEffect(() => {
    if (svgContent && !svgSpriteManager.getSprite(id)) {
      svgSpriteManager.addSprite(id, svgContent);
    }
  }, [id, svgContent]);

  return {
    SpriteIcon: (props: OptimizedSVGIconProps) => 
      svgSpriteManager.createSpriteReference(id, props),
    isLoaded: !!svgSpriteManager.getSprite(id)
  };
}

/**
 * Preload SVG icons for better performance
 */
export async function preloadSVGIcons(icons: Record<string, string>): Promise<void> {
  const promises = Object.entries(icons).map(async ([id, url]) => {
    try {
      const response = await fetch(url);
      const svgContent = await response.text();
      svgSpriteManager.addSprite(id, svgContent);
    } catch (error) {
      console.warn(`Failed to preload SVG icon: ${id}`, error);
    }
  });

  await Promise.all(promises);
}

/**
 * Convert Lucide React icons to optimized SVG
 */
export function optimizeLucideIcon(IconComponent: React.ComponentType<any>) {
  return React.forwardRef<SVGSVGElement, OptimizedSVGIconProps & { color?: string; strokeWidth?: number }>((props, ref) => {
    const { size = 24, className = '', ...rest } = props;
    
    return (
      <IconComponent
        ref={ref}
        size={size}
        className={className}
        {...rest}
      />
    );
  });
}