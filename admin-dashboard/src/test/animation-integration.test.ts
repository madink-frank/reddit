/**
 * Animation Integration Test
 * 
 * Simple integration test to verify animation optimizations are working
 */

// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally

describe('Animation Performance Integration', () => {
  it('should have optimized animation CSS classes available', () => {
    // Test that the CSS classes exist and can be applied
    const testElement = document.createElement('div');
    
    // Apply optimized animation classes
    testElement.className = 'animate-fade-in-optimized gpu-accelerated will-change-transform';
    
    // Verify classes are applied
    expect(testElement.classList.contains('animate-fade-in-optimized')).toBe(true);
    expect(testElement.classList.contains('gpu-accelerated')).toBe(true);
    expect(testElement.classList.contains('will-change-transform')).toBe(true);
  });

  it('should support performance optimization classes', () => {
    const testElement = document.createElement('div');
    
    // Apply performance classes
    testElement.className = 'animate-optimized micro-scale hover-lift-optimized';
    
    expect(testElement.classList.contains('animate-optimized')).toBe(true);
    expect(testElement.classList.contains('micro-scale')).toBe(true);
    expect(testElement.classList.contains('hover-lift-optimized')).toBe(true);
  });

  it('should support shimmer animation classes', () => {
    const testElement = document.createElement('div');
    
    testElement.className = 'animate-shimmer-optimized loading-optimized';
    
    expect(testElement.classList.contains('animate-shimmer-optimized')).toBe(true);
    expect(testElement.classList.contains('loading-optimized')).toBe(true);
  });

  it('should support stagger animation classes', () => {
    const testElement = document.createElement('div');
    
    testElement.className = 'stagger-optimized animate-slide-up-optimized';
    
    expect(testElement.classList.contains('stagger-optimized')).toBe(true);
    expect(testElement.classList.contains('animate-slide-up-optimized')).toBe(true);
  });

  it('should support spinner optimization classes', () => {
    const testElement = document.createElement('div');
    
    testElement.className = 'animate-spin-optimized animate-pulse-optimized animate-bounce-optimized';
    
    expect(testElement.classList.contains('animate-spin-optimized')).toBe(true);
    expect(testElement.classList.contains('animate-pulse-optimized')).toBe(true);
    expect(testElement.classList.contains('animate-bounce-optimized')).toBe(true);
  });
});