/**
 * Animation Performance Demo
 * 
 * Demonstrates the optimized animations with performance monitoring
 * and comparison between standard and optimized implementations.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  AnimatedContainer,
  FadeTransition,
  HoverScale,
  LoadingShimmer,
  StaggerContainer,
  PulseAnimation,
  BounceAnimation,
  AnimationPerformanceMonitor
} from '../ui/OptimizedAnimations';
import { LoadingSpinner } from '../ui/LoadingSystem';
import { AnimatedIcon } from '../ui/OptimizedIcon';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';
import {
  Settings,
  Zap,
  Activity,
  TrendingUp,
  Cpu,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  frameDrops: number;
  memoryUsage: number;
}

export const AnimationPerformanceDemo: React.FC = () => {
  const [showFadeDemo, setShowFadeDemo] = useState(false);
  const [showStaggerDemo, setShowStaggerDemo] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameDrops: 0,
    memoryUsage: 0
  });
  const [animationCount, setAnimationCount] = useState(0);
  const [isStressTest, setIsStressTest] = useState(false);

  const { elementRef, fadeIn, slideUp, scaleIn, bounce, animationState } = useOptimizedAnimation<HTMLDivElement>();

  const handlePerformanceIssue = (metrics: PerformanceMetrics) => {
    setPerformanceMetrics(metrics);
    console.warn('Animation performance issue detected:', metrics);
  };

  const triggerStressTest = () => {
    setIsStressTest(true);
    setAnimationCount(50);

    // Reset after 5 seconds
    setTimeout(() => {
      setIsStressTest(false);
      setAnimationCount(0);
    }, 5000);
  };

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AnimationPerformanceMonitor onPerformanceIssue={handlePerformanceIssue}>
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Animation Performance Demo</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Showcasing GPU-accelerated animations with performance monitoring
          </p>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.fps)}`}>
                  {performanceMetrics.fps} FPS
                </div>
                <div className="text-sm text-gray-500">Frame Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceMetrics.frameDrops}
                </div>
                <div className="text-sm text-gray-500">Frame Drops</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceMetrics.memoryUsage} MB
                </div>
                <div className="text-sm text-gray-500">Memory Usage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Optimized Animations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              GPU-Accelerated Animations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fade Transition Demo */}
            <div>
              <h4 className="font-medium mb-3">Fade Transition (Optimized)</h4>
              <div className="flex items-center gap-4">
                <Button onClick={() => setShowFadeDemo(!showFadeDemo)}>
                  Toggle Fade Demo
                </Button>
                <FadeTransition show={showFadeDemo} duration={200}>
                  <Badge variant="secondary" className="px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    GPU Accelerated Content
                  </Badge>
                </FadeTransition>
              </div>
            </div>

            {/* Hover Scale Demo */}
            <div>
              <h4 className="font-medium mb-3">Hover Scale (Optimized)</h4>
              <div className="flex gap-4">
                <HoverScale scaleAmount={1.05}>
                  <Card className="w-32 h-20 flex items-center justify-center cursor-pointer">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </Card>
                </HoverScale>
                <HoverScale scaleAmount={1.1}>
                  <Card className="w-32 h-20 flex items-center justify-center cursor-pointer">
                    <Cpu className="h-6 w-6 text-green-600" />
                  </Card>
                </HoverScale>
              </div>
            </div>

            {/* Loading Animations */}
            <div>
              <h4 className="font-medium mb-3">Optimized Loading States</h4>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <LoadingSpinner size="md" color="primary" />
                  <div className="text-xs mt-2">Spinner</div>
                </div>
                <div className="text-center">
                  <AnimatedIcon icon={Settings} animation="spin" trigger="always" size="md" />
                  <div className="text-xs mt-2">Icon Spin</div>
                </div>
                <div className="flex-1">
                  <LoadingShimmer width="100%" height={20} />
                  <div className="text-xs mt-2">Shimmer Effect</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stagger Animation Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Stagger Animations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => setShowStaggerDemo(!showStaggerDemo)}>
                {showStaggerDemo ? 'Hide' : 'Show'} Stagger Demo
              </Button>

              {showStaggerDemo && (
                <StaggerContainer staggerDelay={100} animation="slideUp">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="p-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">Staggered Item {index + 1}</div>
                          <div className="text-sm text-gray-500">
                            Delay: {index * 100}ms
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Animation Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Animation Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => fadeIn()} variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Fade In
                </Button>
                <Button onClick={() => slideUp()} variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Slide Up
                </Button>
                <Button onClick={() => scaleIn()} variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Scale In
                </Button>
                <Button onClick={() => bounce()} variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Bounce
                </Button>
              </div>

              <div
                ref={elementRef}
                className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold"
              >
                Animation Target
                {animationState.isAnimating && (
                  <Badge variant="secondary" className="ml-2">
                    {Math.round(animationState.progress * 100)}%
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Micro-Interactions */}
        <Card>
          <CardHeader>
            <CardTitle>Optimized Micro-Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PulseAnimation intensity="subtle">
                <Card className="p-4 text-center cursor-pointer">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm">Subtle Pulse</div>
                </Card>
              </PulseAnimation>

              <BounceAnimation trigger="hover" intensity="normal">
                <Card className="p-4 text-center cursor-pointer">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-sm">Hover Bounce</div>
                </Card>
              </BounceAnimation>

              <div className="micro-scale">
                <Card className="p-4 text-center cursor-pointer">
                  <Cpu className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm">Micro Scale</div>
                </Card>
              </div>

              <div className="micro-bounce">
                <Card className="p-4 text-center cursor-pointer">
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-sm">Micro Bounce</div>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Performance Stress Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={triggerStressTest}
                  disabled={isStressTest}
                  variant={isStressTest ? "secondary" : "primary"}
                >
                  {isStressTest ? 'Running Stress Test...' : 'Start Stress Test'}
                </Button>
                <Badge variant="outline">
                  Active Animations: {animationCount}
                </Badge>
              </div>

              {isStressTest && (
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Array.from({ length: animationCount }).map((_, index) => (
                    <AnimatedContainer
                      key={index}
                      animation={['fadeIn', 'slideUp', 'scaleIn', 'bounce'][index % 4] as any}
                      duration={200 + (index % 3) * 100}
                      delay={index * 20}
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded animate-pulse-optimized" />
                    </AnimatedContainer>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Optimization Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Implemented Optimizations</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• GPU acceleration with translateZ(0)</li>
                  <li>• Proper will-change property management</li>
                  <li>• Optimized animation durations (150-250ms)</li>
                  <li>• Automatic cleanup after animations</li>
                  <li>• Reduced motion preference support</li>
                  <li>• Memory-efficient stagger animations</li>
                  <li>• Performance monitoring and alerts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">📊 Performance Benefits</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 60fps smooth animations</li>
                  <li>• Reduced CPU usage</li>
                  <li>• Lower memory consumption</li>
                  <li>• Better battery life on mobile</li>
                  <li>• Improved accessibility</li>
                  <li>• Consistent cross-browser performance</li>
                  <li>• Automatic performance degradation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimationPerformanceMonitor>
  );
};

export default AnimationPerformanceDemo;