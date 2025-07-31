/**
 * Optimized Animation Hook
 * 
 * Provides performance-optimized animation utilities with proper will-change management,
 * GPU acceleration, and reduced motion support.
 * 
 * Features:
 * - Automatic will-change property management
 * - GPU acceleration for smooth animations
 * - Reduced motion preference support
 * - Performance monitoring and cleanup
 * - Optimized animation durations
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  playState?: 'running' | 'paused';
  willChange?: string[];
  gpuAcceleration?: boolean;
  cleanup?: boolean;
}

export interface AnimationState {
  isAnimating: boolean;
  isComplete: boolean;
  progress: number;
  duration: number;
}

/**
 * Hook for managing optimized animations with performance monitoring
 */
export const useOptimizedAnimation = <T extends HTMLElement = HTMLElement>(options: AnimationOptions = {}) => {
  const elementRef = useRef<T | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    isComplete: false,
    progress: 0,
    duration: 0
  });

  const {
    duration = 300,
    easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    delay = 0,
    fillMode = 'both',
    iterationCount = 1,
    direction = 'normal',
    willChange = ['transform', 'opacity'],
    gpuAcceleration = true,
    cleanup = true
  } = options;

  // Check for reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Apply performance optimizations to element
  const applyOptimizations = useCallback((element: HTMLElement) => {
    if (!element) return;

    // Apply will-change property
    element.style.willChange = willChange.join(', ');

    // Apply GPU acceleration if enabled
    if (gpuAcceleration) {
      element.style.transform = element.style.transform || 'translateZ(0)';
      element.style.backfaceVisibility = 'hidden';
      element.style.perspective = '1000px';
    }

    // Add performance optimization class
    element.classList.add('animate-optimized');
  }, [willChange, gpuAcceleration]);

  // Clean up optimizations
  const cleanupOptimizations = useCallback((element: HTMLElement) => {
    if (!element || !cleanup) return;

    // Reset will-change to auto for better performance
    element.style.willChange = 'auto';

    // Remove GPU acceleration if it was applied
    if (gpuAcceleration) {
      element.style.transform = element.style.transform?.replace('translateZ(0)', '') || '';
      if (!element.style.transform.trim()) {
        element.style.removeProperty('transform');
      }
      element.style.removeProperty('backface-visibility');
      element.style.removeProperty('perspective');
    }

    // Remove optimization classes
    element.classList.remove('animate-optimized', 'animation-cleanup');
    element.classList.add('animation-complete');
  }, [cleanup, gpuAcceleration]);

  // Create optimized animation
  const animate = useCallback((
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    customOptions?: Partial<AnimationOptions>
  ) => {
    const element = elementRef.current;
    if (!element) return null;

    // Use reduced duration for reduced motion preference
    const effectiveDuration = prefersReducedMotion() ? 1 : (customOptions?.duration || duration);

    // Apply optimizations before animation
    applyOptimizations(element);

    // Create animation with optimized options
    const iterationValue = customOptions?.iterationCount || iterationCount;
    const animation = element.animate(keyframes, {
      duration: effectiveDuration,
      easing: customOptions?.easing || easing,
      delay: customOptions?.delay || delay,
      fill: customOptions?.fillMode || fillMode,
      iterations: iterationValue === 'infinite' ? Infinity : iterationValue as number,
      direction: customOptions?.direction || direction
    });

    // Store animation reference
    animationRef.current = animation;

    // Update animation state
    setAnimationState({
      isAnimating: true,
      isComplete: false,
      progress: 0,
      duration: effectiveDuration
    });

    // Monitor animation progress
    const startTime = performance.now();
    const updateProgress = () => {
      if (!animation || animation.playState === 'finished') return;

      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / effectiveDuration, 1);

      setAnimationState(prev => ({
        ...prev,
        progress
      }));

      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);

    // Handle animation completion
    animation.addEventListener('finish', () => {
      setAnimationState({
        isAnimating: false,
        isComplete: true,
        progress: 1,
        duration: effectiveDuration
      });

      // Clean up optimizations after animation
      setTimeout(() => {
        cleanupOptimizations(element);
      }, 100);
    });

    // Handle animation cancellation
    animation.addEventListener('cancel', () => {
      setAnimationState({
        isAnimating: false,
        isComplete: false,
        progress: 0,
        duration: effectiveDuration
      });
      cleanupOptimizations(element);
    });

    return animation;
  }, [
    duration, easing, delay, fillMode, iterationCount, direction,
    applyOptimizations, cleanupOptimizations, prefersReducedMotion
  ]);

  // Predefined optimized animations
  const fadeIn = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 0, transform: 'translateZ(0)' },
      { opacity: 1, transform: 'translateZ(0)' }
    ], { duration: 150, ...customOptions });
  }, [animate]);

  const fadeOut = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 1, transform: 'translateZ(0)' },
      { opacity: 0, transform: 'translateZ(0)' }
    ], { duration: 150, ...customOptions });
  }, [animate]);

  const slideUp = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 0, transform: 'translateZ(0) translateY(20px)' },
      { opacity: 1, transform: 'translateZ(0) translateY(0)' }
    ], { duration: 250, ...customOptions });
  }, [animate]);

  const slideDown = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 0, transform: 'translateZ(0) translateY(-20px)' },
      { opacity: 1, transform: 'translateZ(0) translateY(0)' }
    ], { duration: 250, ...customOptions });
  }, [animate]);

  const scaleIn = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 0, transform: 'translateZ(0) scale(0.9)' },
      { opacity: 1, transform: 'translateZ(0) scale(1)' }
    ], { duration: 200, ...customOptions });
  }, [animate]);

  const scaleOut = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 1, transform: 'translateZ(0) scale(1)' },
      { opacity: 0, transform: 'translateZ(0) scale(0.9)' }
    ], { duration: 200, ...customOptions });
  }, [animate]);

  const bounce = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { transform: 'translateZ(0) translateY(0)' },
      { transform: 'translateZ(0) translateY(-8px)', offset: 0.4 },
      { transform: 'translateZ(0) translateY(-4px)', offset: 0.7 },
      { transform: 'translateZ(0) translateY(-2px)', offset: 0.9 },
      { transform: 'translateZ(0) translateY(0)' }
    ], { duration: 600, easing: 'ease-out', ...customOptions });
  }, [animate]);

  const pulse = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { opacity: 1, transform: 'translateZ(0) scale(1)' },
      { opacity: 0.7, transform: 'translateZ(0) scale(1.02)' },
      { opacity: 1, transform: 'translateZ(0) scale(1)' }
    ], { duration: 1000, iterationCount: 'infinite', ...customOptions });
  }, [animate]);

  const spin = useCallback((customOptions?: Partial<AnimationOptions>) => {
    return animate([
      { transform: 'translateZ(0) rotate(0deg)' },
      { transform: 'translateZ(0) rotate(360deg)' }
    ], { duration: 1000, iterationCount: 'infinite', easing: 'linear', ...customOptions });
  }, [animate]);

  // Cancel current animation
  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
  }, []);

  // Pause/resume animation
  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
      if (elementRef.current) {
        cleanupOptimizations(elementRef.current);
      }
    };
  }, [cancel, cleanupOptimizations]);

  return {
    elementRef,
    animationState,
    animate,
    fadeIn,
    fadeOut,
    slideUp,
    slideDown,
    scaleIn,
    scaleOut,
    bounce,
    pulse,
    spin,
    cancel,
    pause,
    resume,
    prefersReducedMotion: prefersReducedMotion()
  };
};

/**
 * Hook for managing hover animations with performance optimization
 */
export const useOptimizedHover = <T extends HTMLElement = HTMLElement>(options: {
  scaleAmount?: number;
  duration?: number;
  easing?: string;
  willChange?: string[];
} = {}) => {
  const elementRef = useRef<T | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    scaleAmount = 1.02,
    duration = 150,
    easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    willChange = ['transform']
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Apply optimizations
    element.style.willChange = willChange.join(', ');
    element.style.transform = element.style.transform || 'translateZ(0)';
    element.style.transition = `transform ${duration}ms ${easing}`;

    const handleMouseEnter = () => {
      setIsHovered(true);
      element.style.transform = `translateZ(0) scale(${scaleAmount})`;
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      element.style.transform = 'translateZ(0) scale(1)';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.style.willChange = 'auto';
    };
  }, [scaleAmount, duration, easing, willChange]);

  return { elementRef, isHovered };
};

/**
 * Hook for managing loading animations with performance optimization
 */
export const useOptimizedLoading = <T extends HTMLElement = HTMLElement>(isLoading: boolean) => {
  const elementRef = useRef<T | null>(null);
  const { fadeIn, fadeOut } = useOptimizedAnimation();

  useEffect(() => {
    if (!elementRef.current) return;

    if (isLoading) {
      // Apply loading optimizations
      elementRef.current.style.willChange = 'opacity, transform';
      elementRef.current.classList.add('loading-optimized');
      fadeIn({ duration: 200 });
    } else {
      // Clean up loading state
      fadeOut({ duration: 200 });
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.style.willChange = 'auto';
          elementRef.current.classList.remove('loading-optimized');
        }
      }, 200);
    }
  }, [isLoading, fadeIn, fadeOut]);

  return { elementRef };
};

export default useOptimizedAnimation;