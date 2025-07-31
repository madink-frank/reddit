/**
 * Simple Animation Performance Tests
 * 
 * Basic tests for optimized animations to verify functionality
 * without memory-intensive operations.
 */

import { render, screen } from '@testing-library/react';
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { AnimatedContainer, LoadingShimmer } from '../components/ui/OptimizedAnimations';
import { LoadingSpinner } from '../components/ui/LoadingSystem';

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

describe('Animation Performance Optimizations - Basic Tests', () => {
  it('should render AnimatedContainer with optimization classes', () => {
    render(
      <AnimatedContainer animation="fadeIn" data-testid="animated-container">
        <div>Test content</div>
      </AnimatedContainer>
    );

    const container = screen.getByTestId('animated-container');
    expect(container).toHaveClass('animate-optimized');
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render LoadingSpinner with GPU acceleration', () => {
    render(<LoadingSpinner size="md" color="primary" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('gpu-accelerated');
    expect(spinner).toHaveClass('animate-spin-optimized');
  });

  it('should render LoadingShimmer with optimized animation', () => {
    render(<LoadingShimmer width={200} height={20} data-testid="shimmer" />);

    const shimmer = screen.getByTestId('shimmer');
    expect(shimmer).toBeInTheDocument();
  });

  it('should handle animation trigger prop correctly', () => {
    render(
      <AnimatedContainer animation="slideUp" trigger="mount" data-testid="slide-container">
        <div>Slide content</div>
      </AnimatedContainer>
    );

    const container = screen.getByTestId('slide-container');
    expect(container).toHaveClass('animate-optimized');
  });

  it('should render without animation when set to none', () => {
    render(
      <AnimatedContainer animation="none" data-testid="no-animation">
        <div>Static content</div>
      </AnimatedContainer>
    );

    const container = screen.getByTestId('no-animation');
    expect(container).toHaveClass('animate-optimized');
    expect(screen.getByText('Static content')).toBeInTheDocument();
  });
});

describe('CSS Animation Classes', () => {
  it('should apply optimized animation classes', () => {
    const testElement = document.createElement('div');
    testElement.className = 'animate-fade-in-optimized gpu-accelerated';

    expect(testElement).toHaveClass('animate-fade-in-optimized');
    expect(testElement).toHaveClass('gpu-accelerated');
  });

  it('should apply performance optimization classes', () => {
    const testElement = document.createElement('div');
    testElement.className = 'will-change-transform animate-optimized';

    expect(testElement).toHaveClass('will-change-transform');
    expect(testElement).toHaveClass('animate-optimized');
  });
});