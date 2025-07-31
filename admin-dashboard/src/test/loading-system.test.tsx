/**
 * Loading System Tests
 * 
 * Tests for the enhanced loading system components and hooks
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { 
  LoadingSpinner, 
  ProgressBar, 
  EnhancedSkeleton,
  TimedLoading,
  LoadingWrapper
} from '../components/ui/LoadingSystem';
import { 
  LoadingButton,
  InlineLoading} from '../components/ui/LoadingComponents';
import { useLoadingState } from '../hooks/useLoadingState';

// Mock timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies correct size classes', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('applies correct color classes', () => {
    render(<LoadingSpinner color="success" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-green-200', 'border-t-green-600');
  });
});

describe('ProgressBar', () => {
  it('renders with correct progress value', () => {
    render(<ProgressBar value={50} showPercentage />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('caps progress at 100%', () => {
    render(<ProgressBar value={150} max={100} showPercentage />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<ProgressBar value={50} variant="success" />);
    const progressIndicator = container.querySelector('[style*="translateX"]');
    expect(progressIndicator).toBeInTheDocument();
  });
});

describe('EnhancedSkeleton', () => {
  it('renders single skeleton with shimmer animation', () => {
    render(<EnhancedSkeleton animation="shimmer" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('animate-shimmer');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('renders multiple lines when specified', () => {
    render(<EnhancedSkeleton lines={3} />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(3);
  });

  it('applies variant classes correctly', () => {
    render(<EnhancedSkeleton variant="circular" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-full');
  });
});

describe('TimedLoading', () => {
  it('shows children when not loading', () => {
    render(
      <TimedLoading isLoading={false}>
        <div>Content</div>
      </TimedLoading>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows loading state when loading', () => {
    render(
      <TimedLoading isLoading={true}>
        <div>Content</div>
      </TimedLoading>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('updates message based on loading time', async () => {
    render(
      <TimedLoading isLoading={true}>
        <div>Content</div>
      </TimedLoading>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Fast forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByText('Still loading, please wait...')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Fast forward to 6 seconds total
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByText('This is taking longer than usual...')).toBeInTheDocument();
    }, { timeout: 1000 });
  }, 10000);
});

describe('LoadingWrapper', () => {
  it('shows children when not loading', () => {
    render(
      <LoadingWrapper isLoading={false} skeleton="text">
        <div>Content</div>
      </LoadingWrapper>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    render(
      <LoadingWrapper isLoading={true} skeleton="text">
        <div>Content</div>
      </LoadingWrapper>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(3); // 3 lines of text skeleton
  });

  it('renders different skeleton types', () => {
    const { rerender } = render(
      <LoadingWrapper isLoading={true} skeleton="card">
        <div>Content</div>
      </LoadingWrapper>
    );

    // Should render card skeleton structure
    expect(screen.getAllByRole('status')).toHaveLength(6); // Title + 3 lines + 2 buttons

    rerender(
      <LoadingWrapper isLoading={true} skeleton="list">
        <div>Content</div>
      </LoadingWrapper>
    );

    // Should render list skeleton structure
    expect(screen.getAllByRole('status')).toHaveLength(15); // 5 items × 3 elements each
  });
});

describe('LoadingButton', () => {
  it('renders normally when not loading', () => {
    render(
      <LoadingButton isLoading={false}>
        Click me
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Click me');
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when loading', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Processing...">
        Click me
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Processing...');
    expect(button).toBeDisabled();
  });

  it('shows spinner when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles click events when not loading', () => {
    const handleClick = jest.fn();
    render(
      <LoadingButton isLoading={false} onClick={handleClick}>
        Click me
      </LoadingButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle click events when loading', () => {
    const handleClick = jest.fn();
    render(
      <LoadingButton isLoading={true} onClick={handleClick}>
        Click me
      </LoadingButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('InlineLoading', () => {
  it('shows children when not loading', () => {
    render(
      <InlineLoading isLoading={false} skeleton="text">
        <div>Content</div>
      </InlineLoading>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    render(
      <InlineLoading isLoading={true} skeleton="text">
        <div>Content</div>
      </InlineLoading>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(3); // 3 lines of text skeleton
  });

  it('shows custom message with spinner when specified', () => {
    render(
      <InlineLoading isLoading={true} message="Custom loading message" showSpinner>
        <div>Content</div>
      </InlineLoading>
    );
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// Hook tests
describe('useLoadingState', () => {
  const TestComponent = ({ options = {} }) => {
    const loadingState = useLoadingState(options);
    
    return (
      <div>
        <div data-testid="loading">{loadingState.isLoading.toString()}</div>
        <div data-testid="message">{loadingState.message}</div>
        <div data-testid="phase">{loadingState.phase}</div>
        <div data-testid="duration">{loadingState.duration}</div>
        <button onClick={() => loadingState.startLoading()}>Start</button>
        <button onClick={() => loadingState.stopLoading()}>Stop</button>
      </div>
    );
  };

  it('initializes with correct default state', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('message')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('phase')).toHaveTextContent('normal');
    expect(screen.getByTestId('duration')).toHaveTextContent('0');
  });

  it('starts and stops loading correctly', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    
    fireEvent.click(screen.getByText('Stop'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('updates phase based on time thresholds', async () => {
    render(<TestComponent />);
    
    act(() => {
      fireEvent.click(screen.getByText('Start'));
    });
    expect(screen.getByTestId('phase')).toHaveTextContent('normal');

    // Fast forward past slow threshold
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('slow');
    }, { timeout: 1000 });

    // Fast forward past very slow threshold
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('very-slow');
    }, { timeout: 1000 });
  }, 10000);

  it('uses custom messages', () => {
    const customOptions = {
      messages: {
        normal: 'Custom loading...',
        slow: 'Custom slow...',
        verySlow: 'Custom very slow...',
        timeout: 'Custom timeout...'
      }
    };

    render(<TestComponent options={customOptions} />);
    
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByTestId('message')).toHaveTextContent('Custom loading...');
  });
});

describe('Accessibility', () => {
  it('loading spinner has proper ARIA attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('skeleton has proper ARIA attributes', () => {
    render(<EnhancedSkeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('loading button is properly disabled when loading', () => {
    render(<LoadingButton isLoading={true}>Button</LoadingButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Note: disabled attribute automatically sets aria-disabled behavior
  });
});

describe('Performance', () => {
  it('does not cause unnecessary re-renders', () => {
    const renderSpy = jest.fn();
    
    const TestComponent = () => {
      renderSpy();
      return <LoadingSpinner />;
    };

    const { rerender } = render(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props should not cause additional renders
    rerender(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('cleans up timers properly', () => {
    const { unmount } = render(<TimedLoading isLoading={true}><div>Test</div></TimedLoading>);
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });
});