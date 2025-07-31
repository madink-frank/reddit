// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { 
  detectImageFormatSupport, 
  getBestImageFormat,
  generateImageUrl,
  generateResponsiveImageSources,
  imageConverter
} from '../utils/imageFormatSupport';
import { optimizeSVG } from '../utils/svgOptimization';
import { imageOptimizationService } from '../services/imageOptimizationService';

// Mock DOM APIs
Object.defineProperty(global, 'Image', {
  value: class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src: string = '';
    height: number = 2;
    width: number = 2;
    
    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }
});

// Mock canvas and document methods
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class MockCanvas {
    width: number = 0;
    height: number = 0;
    
    getContext() {
      return {
        drawImage: jest.fn(),
      };
    }
    
    toBlob(callback: (blob: Blob | null) => void) {
      const blob = new Blob(['mock'], { type: 'image/webp' });
      setTimeout(() => callback(blob), 0);
    }
  }
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return new (global as any).HTMLCanvasElement();
    }
    return {
      rel: '',
      as: '',
      href: '',
      type: '',
      onload: null,
      onerror: null
    };
  })
});

describe('Image Format Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect image format support', async () => {
    const support = await detectImageFormatSupport();
    
    expect(support).toHaveProperty('avif');
    expect(support).toHaveProperty('webp');
    expect(support).toHaveProperty('jpeg');
    expect(support).toHaveProperty('png');
    expect(support).toHaveProperty('gif');
    
    // JPEG, PNG, GIF should always be supported
    expect(support.jpeg).toBe(true);
    expect(support.png).toBe(true);
    expect(support.gif).toBe(true);
  });

  it('should get best image format', async () => {
    const format = await getBestImageFormat();
    expect(['avif', 'webp', 'jpeg']).toContain(format);
  });

  it('should generate image URL with parameters', () => {
    const url = generateImageUrl({
      baseUrl: 'https://example.com/image.jpg',
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp'
    });
    
    expect(url).toContain('w=800');
    expect(url).toContain('h=600');
    expect(url).toContain('q=80');
    expect(url).toContain('f=webp');
  });

  it('should generate responsive image sources', async () => {
    const sources = await generateResponsiveImageSources(
      'https://example.com/image.jpg',
      [320, 640, 1024],
      75
    );
    
    expect(sources).toHaveProperty('fallback');
    expect(sources.fallback).toContain('320w');
    expect(sources.fallback).toContain('640w');
    expect(sources.fallback).toContain('1024w');
  });
});

describe('SVG Optimization', () => {
  it('should optimize SVG content', () => {
    const svgContent = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <!-- This is a comment -->
        <metadata>Some metadata</metadata>
        <title>Icon title</title>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        <g></g>
      </svg>
    `;
    
    const optimized = optimizeSVG(svgContent, {
      removeComments: true,
      removeMetadata: true,
      removeEmptyGroups: true
    });
    
    expect(optimized).not.toContain('<!-- This is a comment -->');
    expect(optimized).not.toContain('<metadata>');
    expect(optimized).not.toContain('<title>');
    expect(optimized).not.toContain('<g></g>');
    expect(optimized).toContain('<path');
  });

  it('should preserve essential SVG attributes', () => {
    const svgContent = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" fill="none"/>
      </svg>
    `;
    
    const optimized = optimizeSVG(svgContent);
    
    expect(optimized).toContain('viewBox="0 0 24 24"');
    expect(optimized).toContain('stroke="currentColor"');
    expect(optimized).toContain('d="M12 2l3.09');
  });
});

describe('Image Converter', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should convert image to WebP format', async () => {
    const mockFile = new File(['mock'], 'test.jpg', { type: 'image/jpeg' });
    
    const result = await imageConverter.convertImage(mockFile, 'webp', 0.8);
    
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/webp');
  });

  it('should resize image while maintaining aspect ratio', async () => {
    const mockFile = new File(['mock'], 'test.jpg', { type: 'image/jpeg' });
    
    const result = await imageConverter.resizeImage(mockFile, 800, 600, 'webp', 0.8);
    
    expect(result).toBeInstanceOf(Blob);
  });
});

describe('Image Optimization Service', () => {
  beforeEach(async () => {
    await imageOptimizationService.initialize();
    imageOptimizationService.clearCache();
  });

  it('should optimize a single image', async () => {
    const asset = await imageOptimizationService.optimizeImage(
      'https://example.com/image.jpg',
      { width: 800, height: 600, quality: 80 }
    );
    
    expect(asset).toHaveProperty('id');
    expect(asset).toHaveProperty('originalUrl', 'https://example.com/image.jpg');
    expect(asset).toHaveProperty('optimizedUrls');
    expect(asset).toHaveProperty('metadata');
    
    expect(asset.optimizedUrls).toHaveProperty('avif');
    expect(asset.optimizedUrls).toHaveProperty('webp');
    expect(asset.optimizedUrls).toHaveProperty('jpeg');
  });

  it('should cache optimized images', async () => {
    const url = 'https://example.com/image.jpg';
    const options = { width: 800, height: 600 };
    
    // First call
    const asset1 = await imageOptimizationService.optimizeImage(url, options);
    
    // Second call should return cached result
    const asset2 = await imageOptimizationService.optimizeImage(url, options);
    
    expect(asset1).toBe(asset2); // Same object reference
  });

  it('should optimize multiple images in batch', async () => {
    const urls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];
    
    const assets = await imageOptimizationService.optimizeImages(urls, {
      width: 800,
      height: 600,
      concurrency: 2
    });
    
    expect(assets).toHaveLength(3);
    assets.forEach(asset => {
      expect(asset).toHaveProperty('optimizedUrls');
      expect(asset).toHaveProperty('metadata');
    });
  });

  it('should update configuration', () => {
    const newConfig = {
      quality: 90,
      maxWidth: 2048,
      enableLazyLoading: false
    };
    
    imageOptimizationService.updateConfig(newConfig);
    const config = imageOptimizationService.getConfig();
    
    expect(config.quality).toBe(90);
    expect(config.maxWidth).toBe(2048);
    expect(config.enableLazyLoading).toBe(false);
  });

  it('should provide optimization statistics', () => {
    const stats = imageOptimizationService.getStats();
    
    expect(stats).toHaveProperty('cachedImages');
    expect(stats).toHaveProperty('formatSupport');
    expect(stats).toHaveProperty('config');
    
    expect(typeof stats.cachedImages).toBe('number');
    expect(typeof stats.config).toBe('object');
  });

  it('should clear cache', async () => {
    // Add some images to cache
    await imageOptimizationService.optimizeImage('https://example.com/image1.jpg');
    await imageOptimizationService.optimizeImage('https://example.com/image2.jpg');
    
    let stats = imageOptimizationService.getStats();
    expect(stats.cachedImages).toBeGreaterThan(0);
    
    // Clear cache
    imageOptimizationService.clearCache();
    
    stats = imageOptimizationService.getStats();
    expect(stats.cachedImages).toBe(0);
  });

  it('should remove specific image from cache', async () => {
    const url1 = 'https://example.com/image1.jpg';
    const url2 = 'https://example.com/image2.jpg';
    
    await imageOptimizationService.optimizeImage(url1);
    await imageOptimizationService.optimizeImage(url2);
    
    let stats = imageOptimizationService.getStats();
    expect(stats.cachedImages).toBe(2);
    
    imageOptimizationService.removeFromCache(url1);
    
    stats = imageOptimizationService.getStats();
    expect(stats.cachedImages).toBe(1);
  });
});

describe('Performance Tests', () => {
  it('should handle large batch optimization efficiently', async () => {
    const urls = Array.from({ length: 50 }, (_, i) => `https://example.com/image${i}.jpg`);
    
    const startTime = performance.now();
    const assets = await imageOptimizationService.optimizeImages(urls, {
      concurrency: 10
    });
    const endTime = performance.now();
    
    expect(assets).toHaveLength(50);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should optimize SVG content quickly', () => {
    const largeSvg = `
      <svg viewBox="0 0 1000 1000">
        ${Array.from({ length: 100 }, (_, i) => 
          `<circle cx="${i * 10}" cy="${i * 10}" r="5" fill="red"/>`
        ).join('')}
      </svg>
    `;
    
    const startTime = performance.now();
    const optimized = optimizeSVG(largeSvg);
    const endTime = performance.now();
    
    expect(optimized).toContain('<circle');
    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
  });
});