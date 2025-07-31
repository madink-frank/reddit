# Enhanced Loading System

This document describes the enhanced loading system implemented for task 11 of the UI design improvements spec.

## Overview

The enhanced loading system provides:
- **Skeleton loading animations** with shimmer effects
- **Unified progress bars and spinners** with consistent styling
- **Time-based feedback** that adapts messages based on loading duration
- **Accessibility improvements** with proper ARIA labels
- **Performance optimizations** with GPU-accelerated animations

## Components

### LoadingSpinner

A unified spinner component with multiple sizes and colors.

```tsx
import { LoadingSpinner } from '../ui/LoadingSystem';

// Basic usage
<LoadingSpinner />

// With size and color
<LoadingSpinner size="lg" color="success" />
```

**Props:**
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
- `className`: Additional CSS classes

### ProgressBar

Enhanced progress bar with animations and variants.

```tsx
import { ProgressBar } from '../ui/LoadingSystem';

// Basic progress bar
<ProgressBar value={50} />

// With percentage display and animation
<ProgressBar 
  value={75} 
  showPercentage 
  animated 
  variant="success" 
/>
```

**Props:**
- `value`: Progress value (0-100)
- `max`: Maximum value (default: 100)
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'success' | 'warning' | 'error'
- `showPercentage`: Show percentage text
- `animated`: Enable smooth animations

### EnhancedSkeleton

Skeleton loading with shimmer animation.

```tsx
import { EnhancedSkeleton } from '../ui/LoadingSystem';

// Single skeleton
<EnhancedSkeleton height={20} width="80%" animation="shimmer" />

// Multiple lines
<EnhancedSkeleton lines={3} animation="shimmer" />

// Different variants
<EnhancedSkeleton variant="circular" width={40} height={40} />
```

**Props:**
- `width`: Width (string or number)
- `height`: Height (string or number)
- `variant`: 'text' | 'rectangular' | 'circular'
- `animation`: 'pulse' | 'wave' | 'shimmer'
- `lines`: Number of lines for text skeleton

### TimedLoading

Loading component with time-based feedback messages.

```tsx
import { TimedLoading } from '../ui/LoadingSystem';

<TimedLoading isLoading={loading}>
  <YourContent />
</TimedLoading>
```

**Features:**
- Automatically updates messages based on loading time
- Shows loading duration after 5 seconds
- Customizable time thresholds and messages

### LoadingWrapper

Wrapper component that shows skeleton while loading.

```tsx
import { LoadingWrapper } from '../ui/LoadingSystem';

<LoadingWrapper 
  isLoading={loading} 
  skeleton="card"
>
  <YourCard />
</LoadingWrapper>
```

**Skeleton Types:**
- `text`: Simple text lines
- `card`: Card with title, content, and buttons
- `table`: Table with headers and rows
- `chart`: Chart with title and placeholder
- `list`: List items with avatars

## Advanced Components

### LoadingButton

Button with integrated loading state.

```tsx
import { LoadingButton } from '../ui/LoadingComponents';

<LoadingButton
  isLoading={submitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save Changes
</LoadingButton>
```

### InlineLoading

Inline loading for content areas.

```tsx
import { InlineLoading } from '../ui/LoadingComponents';

<InlineLoading 
  isLoading={loading}
  skeleton="list"
  message="Loading data..."
>
  <YourList />
</InlineLoading>
```

### ProgressiveLoading

Multi-stage loading with progress tracking.

```tsx
import { ProgressiveLoading } from '../ui/LoadingComponents';

<ProgressiveLoading
  stages={['Initializing...', 'Loading data...', 'Processing...']}
  currentStage={currentStage}
  stageProgress={stageProgress}
  overallProgress={overallProgress}
/>
```

### SmartLoading

Intelligent loading with automatic time-based feedback.

```tsx
import { SmartLoading } from '../ui/LoadingComponents';

<SmartLoading isLoading={loading}>
  <YourContent />
</SmartLoading>
```

### LoadingOverlay

Full-screen loading overlay.

```tsx
import { LoadingOverlay } from '../ui/LoadingComponents';

<LoadingOverlay
  isLoading={loading}
  message="Processing your request..."
  backdrop="blur"
  showProgress
  progress={uploadProgress}
/>
```

## Hooks

### useLoadingState

Hook for managing loading state with time-based feedback.

```tsx
import { useLoadingState } from '../../hooks/useLoadingState';

const MyComponent = () => {
  const loadingState = useLoadingState({
    messages: {
      normal: 'Loading...',
      slow: 'Still processing...',
      verySlow: 'Almost done...',
      timeout: 'Request timed out'
    },
    timeThresholds: {
      normal: 2000,
      slow: 5000,
      verySlow: 10000
    },
    timeout: 30000
  });

  const handleLoad = async () => {
    loadingState.startLoading();
    try {
      await fetchData();
    } finally {
      loadingState.stopLoading();
    }
  };

  return (
    <div>
      {loadingState.isLoading && (
        <div>
          <LoadingSpinner />
          <p>{loadingState.message}</p>
          {loadingState.duration > 5000 && (
            <p>Loading time: {loadingState.formattedDuration}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

### useProgressiveLoading

Hook for multi-stage loading processes.

```tsx
import { useProgressiveLoading } from '../../hooks/useLoadingState';

const MyComponent = () => {
  const progressiveLoading = useProgressiveLoading([
    'Initializing...',
    'Loading data...',
    'Processing results...',
    'Finalizing...'
  ]);

  const handleProcess = async () => {
    progressiveLoading.startLoading();
    
    // Stage 1
    await initialize();
    progressiveLoading.updateStageProgress(100);
    progressiveLoading.nextStage();
    
    // Stage 2
    await loadData();
    progressiveLoading.updateStageProgress(100);
    progressiveLoading.nextStage();
    
    // Continue for other stages...
    
    progressiveLoading.reset();
  };

  return (
    <ProgressiveLoading
      stages={progressiveLoading.stages}
      currentStage={progressiveLoading.currentStage}
      stageProgress={progressiveLoading.stageProgress}
      overallProgress={progressiveLoading.progress}
    />
  );
};
```

## CSS Animations

The system includes optimized CSS animations:

```css
/* Shimmer animation for skeletons */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Wave animation for alternative skeleton style */
@keyframes wave {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

.animate-wave {
  position: relative;
  overflow: hidden;
}

.animate-wave::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: wave 1.6s linear 0.5s infinite;
}
```

## Accessibility Features

- **ARIA Labels**: All loading components include proper `role="status"` and `aria-label` attributes
- **Screen Reader Support**: Loading states are announced to screen readers
- **Keyboard Navigation**: Loading buttons remain focusable but disabled
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Supports high contrast mode

## Performance Optimizations

- **GPU Acceleration**: Animations use `transform` and `opacity` for better performance
- **Will-Change**: Appropriate use of `will-change` property for animations
- **Efficient Re-renders**: Components are optimized to prevent unnecessary re-renders
- **Timer Cleanup**: Proper cleanup of intervals and timeouts

## Migration Guide

### From Old Loading Spinner

```tsx
// Old
<div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />

// New
<LoadingSpinner size="md" color="primary" />
```

### From Custom Skeletons

```tsx
// Old
<div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded" />

// New
<EnhancedSkeleton height={16} width="75%" animation="shimmer" />
```

### From Basic Loading States

```tsx
// Old
{loading && <div>Loading...</div>}

// New
<TimedLoading isLoading={loading}>
  <YourContent />
</TimedLoading>
```

## Best Practices

1. **Use Appropriate Skeleton Types**: Match skeleton type to content structure
2. **Provide Time-based Feedback**: Use `TimedLoading` or `SmartLoading` for long operations
3. **Show Progress When Possible**: Use progress bars for operations with known duration
4. **Consider User Context**: Use different loading styles based on user expectations
5. **Test with Slow Networks**: Verify loading states work well with slow connections
6. **Accessibility First**: Always include proper ARIA labels and respect user preferences

## Examples

See `LoadingStatesDemo.tsx` for comprehensive examples of all loading components and their usage patterns.

## Testing

The loading system includes comprehensive tests covering:
- Component rendering and props
- Time-based behavior
- Accessibility features
- Performance characteristics
- Hook functionality

Run tests with:
```bash
npm test -- loading-system.test.tsx
```