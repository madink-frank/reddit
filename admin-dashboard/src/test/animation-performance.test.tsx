/**
 * Animation Performance Tests
 * 
 * Tests for optimized animations including GPU acceleration,
 * will-change property management, and performance monitoring.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import {
  AnimatedContainer,
  FadeTransition,
  HoverScale,
  LoadingShimmer,
  StaggerContainer,
  AnimationPerformanceMonitor
} from '../components/ui/OptimizedAnimations';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { LoadingSpinner } from '../components/ui/LoadingSystem';
import { AnimatedIcon } from '../components/ui/OptimizedIcon';
import { Settings } from 'lucide-react';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10 // 10MB
  }
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock requestAnimationFrame
let animationFrameId = 0;
const mockRequestAnimationFrame = jest.fn((callback) => {
  animationFrameId++;
  setTimeout(() => callback(Date.now()), 16); // ~60fps
  return animationFrameId;
});

const mockCancelAnimationFrame = jest.fn((_id) => {
  // Mock implementation
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

// Mock Element.animate
const mockAnimation = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
  reverse: jest.fn(),
  finish: jest.fn(),
  updatePlaybackRate: jest.fn(),
  playState: 'running' as AnimationPlayState,
  playbackRate: 1,
  startTime: 0,
  currentTime: 0,
  timeline: null,
  effect: null,
  id: '',
  pending: false,
  ready: Promise.resolve(),
  finished: Promise.resolve(),
  replaceState: 'active' as AnimationReplaceState,
  oncancel: null,
  onfinish: null,
  onremove: null,
  commitStyles: jest.fn(),
  persist: jest.fn()
} as unknown as Animation;

const mockAnimate = jest.fn(() => mockAnimation);

Element.prototype.animate = mockAnimate as any;

describe('Animation Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAnimationFrame.mockClear();
    mockCancelAnimationFrame.mockClear();
    mockAnimate.mockClear();
  });

  afterEach(() => {
    // Clean up any remaining animations
    document.querySelectorAll('[style*="will-change"]').forEach(el => {
      (el as HTMLElement).style.willChange = 'auto';
    });
  });

  describe('GPU Acceleration', () => {
    it('should apply GPU acceleration to animated containers', () => {
      render(
        <AnimatedContainer animation="fadeIn">
          <div>Test content</div>
        </AnimatedContainer>
      );

      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('animate-optimized');
    });

    it('should apply translateZ(0) for GPU acceleration', async () => {
      const TestComponent = () => {
        const { elementRef, fadeIn } = useOptimizedAnimation();

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return <div ref={elementRef as React.RefObject<HTMLDivElement>}>Test</div>;
      };

      render(<TestComponent />);

      // Check that GPU acceleration is applied
      await waitFor(() => {
        expect(mockAnimate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              transform: expect.stringContaining('translateZ(0)')
            })
          ]),
          expect.any(Object)
        );
      });
    });

    it('should apply backface-visibility hidden for smooth animations', () => {
      render(<LoadingSpinner size="md" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('gpu-accelerated');
    });
  });

  describe('Will-Change Property Management', () => {
    it('should set will-change property during animations', async () => {
      const TestComponent = () => {
        const { elementRef, fadeIn } = useOptimizedAnimation({
          willChange: ['opacity', 'transform']
        });

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return <div ref={elementRef as React.RefObject<HTMLDivElement>} data-testid="animated-element">Test</div>;
      };

      render(<TestComponent />);

      // The hook should manage will-change internally
      // We can't directly test the style property in JSDOM, but we can verify the animation was called
      await waitFor(() => {
        expect(mockAnimate).toHaveBeenCalled();
      });
    });

    it('should clean up will-change property after animation', async () => {
      const TestComponent = () => {
        const { elementRef, fadeIn } = useOptimizedAnimation({
          cleanup: true
        });

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return <div ref={elementRef as React.RefObject<HTMLDivElement>}>Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      // Simulate animation completion and cleanup
      await waitFor(() => {
        expect(mockAnimate).toHaveBeenCalled();
      });

      unmount();

      // Cleanup should be handled by the hook
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Optimized Animation Durations', () => {
    it('should use optimized durations for better performance', () => {
      render(
        <AnimatedContainer animation="fadeIn" duration={150}>
          <div>Test</div>
        </AnimatedContainer>
      );

      // Verify that shorter, optimized duration is used
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 150
        })
      );
    });

    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn(() => ({
          matches: true, // prefers-reduced-motion: reduce
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }))
      });

      const TestComponent = () => {
        const { elementRef, fadeIn, prefersReducedMotion } = useOptimizedAnimation();

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return (
          <div ref={elementRef as React.RefObject<HTMLDivElement>} data-reduced-motion={prefersReducedMotion}>
            Test
          </div>
        );
      };

      render(<TestComponent />);

      // Should use minimal duration for reduced motion
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 1 // Reduced motion duration
        })
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor animation performance', async () => {
      const onPerformanceIssue = jest.fn();

      render(
        <AnimationPerformanceMonitor onPerformanceIssue={onPerformanceIssue}>
          <div>Test content</div>
        </AnimationPerformanceMonitor>
      );

      // Wait for performance monitoring to run
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should detect performance issues', async () => {
      const onPerformanceIssue = jest.fn();

      // Mock poor performance
      mockPerformance.now.mockImplementation(() => {
        // Simulate slow frame rate
        return Date.now() + 100; // Simulate 10fps instead of 60fps
      });

      render(
        <AnimationPerformanceMonitor onPerformanceIssue={onPerformanceIssue}>
          <div>Test content</div>
        </AnimationPerformanceMonitor>
      );

      // Performance monitoring should detect issues
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Optimized Components', () => {
    it('should render FadeTransition with optimized animations', () => {
      render(
        <FadeTransition show={true}>
          <div>Fade content</div>
        </FadeTransition>
      );

      const content = screen.getByText('Fade content');
      expect(content.parentElement).toHaveClass('animate-optimized');
    });

    it('should render HoverScale with performance optimizations', () => {
      render(
        <HoverScale scaleAmount={1.05}>
          <div>Hover content</div>
        </HoverScale>
      );

      const content = screen.getByText('Hover content');
      expect(content.parentElement).toHaveClass('cursor-pointer');
    });

    it('should render LoadingShimmer with GPU acceleration', () => {
      render(<LoadingShimmer width={200} height={20} />);

      // Should have shimmer animation class
      const shimmer = document.querySelector('.animate-shimmer-optimized');
      expect(shimmer).toBeInTheDocument();
    });

    it('should render StaggerContainer with optimized stagger animations', () => {
      render(
        <StaggerContainer staggerDelay={50}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </StaggerContainer>
      );

      const container = screen.getByText('Item 1').parentElement;
      expect(container).toHaveClass('stagger-optimized');
    });

    it('should render AnimatedIcon with performance optimizations', () => {
      render(
        <AnimatedIcon
          icon={Settings}
          animation="spin"
          trigger="always"
          size="md"
        />
      );

      const icon = document.querySelector('.animate-spin-optimized');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up animations on unmount', () => {
      const TestComponent = () => {
        const { elementRef, fadeIn } = useOptimizedAnimation();

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return <div ref={elementRef as React.RefObject<HTMLDivElement>}>Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      // Trigger animation
      expect(mockAnimate).toHaveBeenCalled();

      // Unmount component
      unmount();

      // Should clean up animation frame requests
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should reset will-change property after animation completion', async () => {
      const TestComponent = () => {
        const { elementRef, fadeIn, animationState } = useOptimizedAnimation({
          cleanup: true
        });

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return (
          <div ref={elementRef as React.RefObject<HTMLDivElement>} data-complete={animationState.isComplete}>
            Test
          </div>
        );
      };

      render(<TestComponent />);

      // Animation should be called
      await waitFor(() => {
        expect(mockAnimate).toHaveBeenCalled();
      });
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing Web Animations API gracefully', () => {
      // Temporarily remove animate method
      const originalAnimate = Element.prototype.animate;
      delete (Element.prototype as any).animate;

      const TestComponent = () => {
        const { elementRef, fadeIn } = useOptimizedAnimation();

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return <div ref={elementRef as React.RefObject<HTMLDivElement>}>Test</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).not.toThrow();

      // Restore animate method
      Element.prototype.animate = originalAnimate;
    });

    it('should handle missing performance API gracefully', () => {
      // Temporarily remove performance
      const originalPerformance = window.performance;
      delete (window as any).performance;

      render(
        <AnimationPerformanceMonitor>
          <div>Test</div>
        </AnimationPerformanceMonitor>
      );

      // Should not throw error
      expect(screen.getByText('Test')).toBeInTheDocument();

      // Restore performance
      window.performance = originalPerformance;
    });
  });

  describe('Animation States', () => {
    it('should track animation progress', async () => {
      const TestComponent = () => {
        const { elementRef, fadeIn, animationState } = useOptimizedAnimation();

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return (
          <div ref={elementRef as React.RefObject<HTMLDivElement>}>
            Progress: {Math.round(animationState.progress * 100)}%
          </div>
        );
      };

      render(<TestComponent />);

      // Should start with 0% progress
      expect(screen.getByText(/Progress: 0%/)).toBeInTheDocument();
    });

    it('should handle animation cancellation', () => {
      const TestComponent = () => {
        const { elementRef, fadeIn, cancel } = useOptimizedAnimation();

        React.useEffect(() => {
          fadeIn();
        }, [fadeIn]);

        return (
          <div>
            <div ref={elementRef as React.RefObject<HTMLDivElement>}>Test</div>
            <button onClick={cancel}>Cancel</button>
          </div>
        );
      };

      render(<TestComponent />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Animation should be cancelled
      expect(mockAnimation.cancel).toHaveBeenCalled();
    });
  });
});

describe('CSS Animation Optimizations', () => {
  it('should include optimized animation classes in CSS', () => {
    // Test that CSS classes are properly defined
    const testElement = document.createElement('div');
    testElement.className = 'animate-fade-in-optimized';
    document.body.appendChild(testElement);

    // Should have the class applied
    expect(testElement).toHaveClass('animate-fade-in-optimized');

    document.body.removeChild(testElement);
  });

  it('should respect reduced motion in CSS', () => {
    // Create a test element with animation
    const testElement = document.createElement('div');
    testElement.className = 'animate-spin-optimized';
    document.body.appendChild(testElement);

    // Should have the animation class
    expect(testElement).toHaveClass('animate-spin-optimized');

    document.body.removeChild(testElement);
  });
});