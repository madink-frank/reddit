/**
 * Optimized Animation Components
 * 
 * Performance-optimized animation components with GPU acceleration,
 * proper will-change management, and reduced motion support.
 * 
 * Features:
 * - GPU-accelerated animations
 * - Automatic will-change property management
 * - Reduced motion preference support
 * - Optimized animation durations
 * - Memory-efficient cleanup
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { useOptimizedAnimation, useOptimizedHover } from '../../hooks/useOptimizedAnimation';

// Base animated container with performance optimizations
interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn' | 'bounce' | 'none';
  duration?: number;
  delay?: number;
  trigger?: 'mount' | 'hover' | 'manual';
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(({
  animation = 'fadeIn',
  duration = 300,
  delay = 0,
  trigger = 'mount',
  children,
  className,
  onAnimationComplete,
  ...props
}, ref) => {
  const { elementRef, fadeIn, slideUp, slideDown, scaleIn, bounce, animationState } = useOptimizedAnimation<HTMLDivElement>({
    duration,
    delay,
    cleanup: true
  });

  // Combine refs
  const combinedRef = (node: HTMLDivElement) => {
    elementRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    if (trigger === 'mount' && animation !== 'none') {
      const animationMap = {
        fadeIn,
        slideUp,
        slideDown,
        scaleIn,
        bounce
      };

      animationMap[animation]?.();
    }
  }, [trigger, animation, fadeIn, slideUp, slideDown, scaleIn, bounce]);

  useEffect(() => {
    if (animationState.isComplete && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [animationState.isComplete, onAnimationComplete]);

  return (
    <div
      ref={combinedRef}
      className={cn('animate-optimized', className)}
      {...props}
    >
      {children}
    </div>
  );
});

AnimatedContainer.displayName = 'AnimatedContainer';

// Optimized fade transition component
interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  onEnter?: () => void;
  onExit?: () => void;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  children,
  className,
  duration = 200,
  onEnter,
  onExit
}) => {
  const { elementRef, fadeIn, fadeOut, animationState } = useOptimizedAnimation<HTMLDivElement>({
    duration,
    cleanup: true
  });
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        fadeIn();
        onEnter?.();
      }, 10);
    } else {
      fadeOut();
      onExit?.();
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [show, fadeIn, fadeOut, duration, onEnter, onExit]);

  if (!shouldRender) return null;

  return (
    <div
      ref={elementRef}
      className={cn('animate-optimized', className)}
      style={{ opacity: show ? 1 : 0 }}
    >
      {children}
    </div>
  );
};

// Optimized slide transition component
interface SlideTransitionProps {
  show: boolean;
  direction: 'up' | 'down' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  direction,
  children,
  className,
  duration = 250
}) => {
  const { elementRef, animate } = useOptimizedAnimation<HTMLDivElement>({
    duration,
    cleanup: true
  });
  const [shouldRender, setShouldRender] = useState(show);

  const getTransformValues = () => {
    const distance = 20;
    switch (direction) {
      case 'up':
        return [`translateZ(0) translateY(${distance}px)`, 'translateZ(0) translateY(0)'];
      case 'down':
        return [`translateZ(0) translateY(-${distance}px)`, 'translateZ(0) translateY(0)'];
      case 'left':
        return [`translateZ(0) translateX(${distance}px)`, 'translateZ(0) translateX(0)'];
      case 'right':
        return [`translateZ(0) translateX(-${distance}px)`, 'translateZ(0) translateX(0)'];
      default:
        return ['translateZ(0) translateY(20px)', 'translateZ(0) translateY(0)'];
    }
  };

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        const [from, to] = getTransformValues();
        animate([
          { opacity: 0, transform: from },
          { opacity: 1, transform: to }
        ]);
      }, 10);
    } else {
      const [from, to] = getTransformValues();
      animate([
        { opacity: 1, transform: to },
        { opacity: 0, transform: from }
      ]);
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [show, animate, duration, direction]);

  if (!shouldRender) return null;

  return (
    <div ref={elementRef} className={cn('animate-optimized', className)}>
      {children}
    </div>
  );
};

// Optimized hover scale component
interface HoverScaleProps extends React.HTMLAttributes<HTMLDivElement> {
  scaleAmount?: number;
  duration?: number;
  children: React.ReactNode;
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(({
  scaleAmount = 1.02,
  duration = 150,
  children,
  className,
  ...props
}, ref) => {
  const { elementRef, isHovered } = useOptimizedHover<HTMLDivElement>({
    scaleAmount,
    duration
  });

  // Combine refs
  const combinedRef = (node: HTMLDivElement) => {
    elementRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <div
      ref={combinedRef}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </div>
  );
});

HoverScale.displayName = 'HoverScale';

// Optimized loading shimmer component
interface LoadingShimmerProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  lines?: number;
}

export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({
  width = '100%',
  height = 20,
  className,
  variant = 'rectangular',
  lines = 1
}) => {
  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = shimmerRef.current;
    if (!element) return;

    // Apply performance optimizations
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';

    return () => {
      element.style.willChange = 'auto';
    };
  }, []);

  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-shimmer-optimized';
  
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4'
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            ref={index === 0 ? shimmerRef : undefined}
            className={cn(baseClasses, variantClasses[variant], className)}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={shimmerRef}
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};

// Optimized stagger animation container
interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  animation?: 'fadeIn' | 'slideUp' | 'scaleIn';
  children: React.ReactNode;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  staggerDelay = 100,
  animation = 'fadeIn',
  children,
  className,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply stagger animation to children
    const childElements = Array.from(container.children) as HTMLElement[];
    
    childElements.forEach((child, index) => {
      // Apply performance optimizations
      child.style.willChange = 'transform, opacity';
      child.style.transform = 'translateZ(0)';
      child.style.animationDelay = `${index * staggerDelay}ms`;
      
      // Add animation class based on type
      const animationClasses = {
        fadeIn: 'animate-fade-in-optimized',
        slideUp: 'animate-slide-up-optimized',
        scaleIn: 'animate-scale-optimized'
      };
      
      child.classList.add(animationClasses[animation]);
    });

    // Cleanup function
    return () => {
      childElements.forEach(child => {
        child.style.willChange = 'auto';
        child.style.animationDelay = '';
        child.classList.remove(
          'animate-fade-in-optimized',
          'animate-slide-up-optimized',
          'animate-scale-optimized'
        );
      });
    };
  }, [staggerDelay, animation]);

  return (
    <div
      ref={containerRef}
      className={cn('stagger-optimized', className)}
      style={{ '--stagger-delay': `${staggerDelay}ms` } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
};

// Optimized pulse animation component
interface PulseAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number;
  intensity?: 'subtle' | 'normal' | 'strong';
  children: React.ReactNode;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  duration = 2000,
  intensity = 'normal',
  children,
  className,
  ...props
}) => {
  const { elementRef, pulse } = useOptimizedAnimation<HTMLDivElement>({
    duration,
    cleanup: true
  });

  const intensityMap = {
    subtle: 1.01,
    normal: 1.02,
    strong: 1.05
  };

  useEffect(() => {
    pulse({
      duration,
      iterationCount: 'infinite'
    });
  }, [pulse, duration]);

  return (
    <div
      ref={elementRef}
      className={cn('animate-optimized', className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Optimized bounce animation component
interface BounceAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger?: 'mount' | 'hover' | 'click';
  intensity?: 'subtle' | 'normal' | 'strong';
  children: React.ReactNode;
}

export const BounceAnimation: React.FC<BounceAnimationProps> = ({
  trigger = 'mount',
  intensity = 'normal',
  children,
  className,
  ...props
}) => {
  const { elementRef, bounce } = useOptimizedAnimation<HTMLDivElement>({
    cleanup: true
  });

  const intensityMap = {
    subtle: 4,
    normal: 8,
    strong: 12
  };

  const handleTrigger = () => {
    bounce({
      duration: 600
    });
  };

  useEffect(() => {
    if (trigger === 'mount') {
      handleTrigger();
    }
  }, [trigger]);

  const eventHandlers = trigger === 'hover' 
    ? { onMouseEnter: handleTrigger }
    : trigger === 'click'
    ? { onClick: handleTrigger }
    : {};

  return (
    <div
      ref={elementRef}
      className={cn('animate-optimized', className)}
      {...eventHandlers}
      {...props}
    >
      {children}
    </div>
  );
};

// Performance monitoring component
interface AnimationPerformanceMonitorProps {
  children: React.ReactNode;
  onPerformanceIssue?: (metrics: {
    fps: number;
    frameDrops: number;
    memoryUsage: number;
  }) => void;
}

export const AnimationPerformanceMonitor: React.FC<AnimationPerformanceMonitorProps> = ({
  children,
  onPerformanceIssue
}) => {
  const monitorRef = useRef<HTMLDivElement>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    frameDrops: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measurePerformance = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const frameDrops = Math.max(0, 60 - fps);
        
        // Estimate memory usage (simplified)
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        
        const metrics = {
          fps,
          frameDrops,
          memoryUsage: Math.round(memoryUsage / 1024 / 1024) // MB
        };
        
        setPerformanceMetrics(metrics);
        
        // Alert if performance is poor
        if (fps < 30 || frameDrops > 10) {
          onPerformanceIssue?.(metrics);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [onPerformanceIssue]);

  return (
    <div ref={monitorRef} data-performance-metrics={JSON.stringify(performanceMetrics)}>
      {children}
    </div>
  );
};

export default {
  AnimatedContainer,
  FadeTransition,
  SlideTransition,
  HoverScale,
  LoadingShimmer,
  StaggerContainer,
  PulseAnimation,
  BounceAnimation,
  AnimationPerformanceMonitor
};