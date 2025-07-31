import { render, screen } from '@testing-library/react';
import { Input } from '../components/ui/Input';

// Mock icon component for testing
const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    data-testid="mock-icon" 
    width={size} 
    height={size} 
    className={className}
  >
    <circle cx="50%" cy="50%" r="40%" />
  </svg>
);

// Mock JSX element icon
const MockJSXIcon = (
  <svg data-testid="mock-jsx-icon" width="16" height="16">
    <rect width="100%" height="100%" />
  </svg>
);

describe('Input Icon Utilities', () => {
  describe('getIconSize function', () => {
    it('should render icons with correct sizes for different input sizes', () => {
      const { rerender } = render(
        <Input leftIcon={MockIcon} size="sm" data-testid="input-sm" />
      );
      
      let icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('width', '14');
      expect(icon).toHaveAttribute('height', '14');
      
      rerender(<Input leftIcon={MockIcon} size="md" data-testid="input-md" />);
      icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
      
      rerender(<Input leftIcon={MockIcon} size="lg" data-testid="input-lg" />);
      icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('width', '18');
      expect(icon).toHaveAttribute('height', '18');
    });
  });

  describe('renderIcon function', () => {
    it('should render React component icons correctly', () => {
      render(<Input leftIcon={MockIcon} data-testid="input-with-component-icon" />);
      
      const icon = screen.getByTestId('mock-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('flex-shrink-0');
    });

    it('should render JSX element icons correctly', () => {
      render(<Input leftIcon={MockJSXIcon} data-testid="input-with-jsx-icon" />);
      
      const icon = screen.getByTestId('mock-jsx-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('flex-shrink-0');
      expect(icon).toHaveStyle({ width: '16px', height: '16px' });
    });

    it('should apply custom className to icon container', () => {
      render(
        <Input 
          leftIcon={MockIcon} 
          leftIconClassName="text-blue-500" 
          data-testid="input-with-custom-class" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('text-blue-500');
    });

    it('should set aria-hidden="true" on icon containers', () => {
      render(<Input leftIcon={MockIcon} data-testid="input-with-aria" />);
      
      const iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should handle invalid icon types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<Input leftIcon={'invalid-icon' as any} data-testid="input-with-invalid-icon" />);
      
      // Icon should not render
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should return null when no icon is provided', () => {
      render(<Input data-testid="input-without-icon" />);
      
      // No icon containers should be present
      const input = screen.getByTestId('input-without-icon');
      const iconContainers = input.parentElement?.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers?.length).toBe(0);
    });
  });

  describe('getIconPositionClasses function', () => {
    it('should apply correct positioning classes for left icons', () => {
      const { rerender } = render(<Input leftIcon={MockIcon} size="sm" />);
      
      let iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('left-2.5');
      
      rerender(<Input leftIcon={MockIcon} size="md" />);
      iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('left-3');
      
      rerender(<Input leftIcon={MockIcon} size="lg" />);
      iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('left-4');
    });

    it('should apply correct positioning classes for right icons', () => {
      const { rerender } = render(<Input rightIcon={MockIcon} size="sm" />);
      
      let iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('right-2.5');
      
      rerender(<Input rightIcon={MockIcon} size="md" />);
      iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('right-3');
      
      rerender(<Input rightIcon={MockIcon} size="lg" />);
      iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveClass('right-4');
    });
  });

  describe('Icon precedence and state handling', () => {
    it('should not render right icon when success state is present', () => {
      render(<Input rightIcon={MockIcon} success={true} />);
      
      // Right icon should not be rendered
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
      
      // Success indicator should be present (SVG with checkmark path)
      const successIcon = screen.getByRole('textbox').parentElement?.querySelector('svg[aria-hidden="true"]');
      expect(successIcon).toBeInTheDocument();
      expect(successIcon).toHaveClass('text-success');
    });

    it('should not render right icon when error state is present', () => {
      render(<Input rightIcon={MockIcon} error="Test error" />);
      
      // Right icon should not be rendered
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
      
      // Error indicator should be present (SVG with error icon)
      const errorIcon = screen.getByRole('textbox').parentElement?.querySelector('svg[aria-hidden="true"]');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('text-error');
    });

    it('should render left icon even when state indicators are present', () => {
      render(<Input leftIcon={MockIcon} error="Test error" />);
      
      // Left icon should still be rendered
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      
      // Error indicator should also be present
      const errorIcon = screen.getByRole('textbox').parentElement?.querySelector('svg[aria-hidden="true"]:not([data-testid])');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('text-error');
    });
  });

  describe('Error handling', () => {
    it('should handle icon rendering errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with an invalid icon that will be caught by our renderIcon function
      const invalidIcon = null as any;
      
      render(<Input leftIcon={invalidIcon} />);
      
      // Component should still render without crashing
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      // No icon should be rendered
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });
});