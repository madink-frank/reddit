import React, { useState, useEffect } from 'react';
import { Image, Download, Settings, Zap, Camera, Palette } from 'lucide-react';
import { OptimizedIcon, LoadingIcon, IconButton, BadgedIcon, AnimatedIcon } from '../ui/OptimizedIcon';
import { LazyImage } from '../common/LazyLoader';
import { SmartImage } from '../../utils/imageFormatSupport';
import { imageOptimizationService } from '../../services/imageOptimizationService';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const ImageOptimizationDemo: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(imageOptimizationService.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOptimizeImages = async () => {
    setIsLoading(true);
    try {
      const sampleImages = [
        'https://picsum.photos/800/600?random=1',
        'https://picsum.photos/800/600?random=2',
        'https://picsum.photos/800/600?random=3'
      ];

      await imageOptimizationService.optimizeImages(sampleImages, {
        width: 400,
        height: 300,
        quality: 80
      });

      setStats(imageOptimizationService.getStats());
    } catch (error) {
      console.error('Failed to optimize images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    imageOptimizationService.clearCache();
    setStats(imageOptimizationService.getStats());
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Image & Icon Optimization Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Demonstrating optimized images, lazy loading, WebP support, and SVG icon optimization
        </p>
      </div>

      {/* Icon Optimization Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <OptimizedIcon icon={Palette} size="lg" />
            Optimized Icons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Standard Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Standard Sizes</h3>
            <div className="flex items-center gap-4">
              <OptimizedIcon icon={Settings} size="sm" title="Small (16px)" />
              <OptimizedIcon icon={Settings} size="md" title="Medium (24px)" />
              <OptimizedIcon icon={Settings} size="lg" title="Large (32px)" />
              <OptimizedIcon icon={Settings} size="xl" title="Extra Large (48px)" />
            </div>
          </div>

          {/* Loading Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Loading States</h3>
            <div className="flex items-center gap-4">
              <LoadingIcon icon={Download} loading={isLoading} size="md" />
              <LoadingIcon icon={Camera} loading={false} size="md" />
              <LoadingIcon icon={Zap} loading={true} size="md" />
            </div>
          </div>

          {/* Icon Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Icon Buttons</h3>
            <div className="flex items-center gap-4">
              <IconButton
                icon={Download}
                aria-label="Download"
                variant="primary"
                size="sm"
                onClick={handleOptimizeImages}
                loading={isLoading}
              />
              <IconButton
                icon={Settings}
                aria-label="Settings"
                variant="outline"
                size="md"
              />
              <IconButton
                icon={Camera}
                aria-label="Camera"
                variant="ghost"
                size="lg"
              />
            </div>
          </div>

          {/* Badged Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Badged Icons</h3>
            <div className="flex items-center gap-4">
              <BadgedIcon
                icon={Image}
                size="lg"
                badge={{ show: true, count: 5, color: 'red', position: 'top-right' }}
              />
              <BadgedIcon
                icon={Download}
                size="lg"
                badge={{ show: true, count: 99, color: 'blue', position: 'top-left' }}
              />
              <BadgedIcon
                icon={Settings}
                size="lg"
                badge={{ show: true, color: 'green', position: 'bottom-right' }}
              />
            </div>
          </div>

          {/* Animated Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Animated Icons</h3>
            <div className="flex items-center gap-4">
              <AnimatedIcon icon={Settings} animation="spin" trigger="always" size="md" />
              <AnimatedIcon icon={Zap} animation="pulse" trigger="hover" size="md" />
              <AnimatedIcon icon={Camera} animation="bounce" trigger="hover" size="md" />
              <AnimatedIcon icon={Download} animation="scale" trigger="hover" size="md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Optimization Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <OptimizedIcon icon={Image} size="lg" />
            Optimized Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lazy Loading Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Lazy Loading with Format Optimization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <LazyImage
                  src="https://picsum.photos/400/300?random=1"
                  alt="Sample image 1"
                  className="w-full h-48 object-cover rounded-lg"
                  quality={80}
                />
                <p className="text-sm text-gray-600">Standard lazy loading</p>
              </div>

              <div className="space-y-2">
                <LazyImage
                  src="https://picsum.photos/400/300?random=2"
                  alt="Sample image 2"
                  className="w-full h-48 object-cover rounded-lg"
                  priority={true}
                  quality={90}
                />
                <p className="text-sm text-gray-600">Priority loading</p>
              </div>

              <div className="space-y-2">
                <LazyImage
                  src="https://picsum.photos/400/300?random=3"
                  alt="Sample image 3"
                  className="w-full h-48 object-cover rounded-lg"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Sh//Z"
                  quality={75}
                />
                <p className="text-sm text-gray-600">With blur placeholder</p>
              </div>
            </div>
          </div>

          {/* Smart Image Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Smart Images with Format Detection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SmartImage
                src="https://picsum.photos/600/400?random=4"
                alt="Smart image example"
                width={600}
                height={400}
                className="w-full h-64 object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={85}
              />
              <SmartImage
                src="https://picsum.photos/600/400?random=5"
                alt="Smart image with priority"
                width={600}
                height={400}
                className="w-full h-64 object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true}
                quality={90}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <OptimizedIcon icon={Zap} size="lg" />
            Optimization Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.cachedImages}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Cached Images
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.formatSupport?.webp ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    WebP Support
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.formatSupport?.avif ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    AVIF Support
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Current Configuration</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Quality: {stats.config.quality}%</div>
                  <div>Max Width: {stats.config.maxWidth}px</div>
                  <div>Max Height: {stats.config.maxHeight}px</div>
                  <div>Lazy Loading: {stats.config.enableLazyLoading ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleOptimizeImages}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <LoadingIcon icon={Download} loading={isLoading} size="sm" />
                  Optimize Sample Images
                </Button>

                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <OptimizedIcon icon={Zap} size="sm" />
                  Clear Cache
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <LoadingIcon icon={Settings} loading={true} size="lg" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading statistics...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageOptimizationDemo;