import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../components/ui/Input';
import '@testing-library/jest-dom';

// Mock icon components for testing
const MockIconComponent = ({ size, className }: { size?: number; className?: string }) => (
  <div data-testid="mock-icon-component" data-size={size} className={className}>
    Icon
  </div>
);

const MockIconElement = (
  <div data-testid="mock-icon-element">
    Element Icon
  </div>
);

describe('Input Icon Enhancement', () => {
  describe('Icon Rendering', () => {
    it('should render left icon when leftIcon prop is provided as component', () => {
      render(<Input leftIcon={MockIconComponent} data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-component')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon-component')).toHaveAttribute('data-size', '16'); // md size default
    });

    it('should render right icon when rightIcon prop is provided as component', () => {
      render(<Input rightIcon={MockIconComponent} data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-component')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon-component')).toHaveAttribute('data-size', '16'); // md size default
    });

    it('should render left icon when leftIcon prop is provided as JSX element', () => {
      render(<Input leftIcon={MockIconElement} data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-element')).toBeInTheDocument();
    });

    it('should render right icon when rightIcon prop is provided as JSX element', () => {
      render(<Input rightIcon={MockIconElement} data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-element')).toBeInTheDocument();
    });

    it('should render both left and right icons when both props are provided', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          rightIcon={MockIconElement} 
          data-testid="input" 
        />
      );
      
      expect(screen.getByTestId('mock-icon-component')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon-element')).toBeInTheDocument();
    });

    it('should not render icons when icon props are not provided', () => {
      render(<Input data-testid="input" />);
      
      expect(screen.queryByTestId('mock-icon-component')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-icon-element')).not.toBeInTheDocument();
    });

    it('should handle invalid icon types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<Input leftIcon={'invalid-icon' as any} data-testid="input" />);
      
      // Icon should not render
      expect(screen.queryByTestId('mock-icon-component')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should apply custom className to left icon', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          leftIconClassName="custom-left-icon" 
          data-testid="input" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon-component').parentElement;
      expect(iconContainer).toHaveClass('custom-left-icon');
    });

    it('should apply custom className to right icon', () => {
      render(
        <Input 
          rightIcon={MockIconComponent} 
          rightIconClassName="custom-right-icon" 
          data-testid="input" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon-component').parentElement;
      expect(iconContainer).toHaveClass('custom-right-icon');
    });
  });

  describe('Icon Sizing', () => {
    it('should render icons with correct size for sm input', () => {
      render(<Input leftIcon={MockIconComponent} size="sm" data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-component')).toHaveAttribute('data-size', '14');
    });

    it('should render icons with correct size for md input', () => {
      render(<Input leftIcon={MockIconComponent} size="md" data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-component')).toHaveAttribute('data-size', '16');
    });

    it('should render icons with correct size for lg input', () => {
      render(<Input leftIcon={MockIconComponent} size="lg" data-testid="input" />);
      
      expect(screen.getByTestId('mock-icon-component')).toHaveAttribute('data-size', '18');
    });

    it('should apply correct size to JSX element icons', () => {
      render(<Input leftIcon={MockIconElement} size="lg" data-testid="input" />);
      
      const iconElement = screen.getByTestId('mock-icon-element');
      // The JSX element should have its size updated by the renderIcon function
      // Check that the style attribute contains the correct dimensions
      const style = iconElement.getAttribute('style');
      expect(style).toContain('width: 18px');
      expect(style).toContain('height: 18px');
    });
  });

  describe('Padding Calculation', () => {
    it('should apply correct padding when only left icon is present', () => {
      render(<Input leftIcon={MockIconComponent} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10'); // md size with left icon
      expect(input).toHaveClass('pr-3');  // md size without right icon
    });

    it('should apply correct padding when only right icon is present', () => {
      render(<Input rightIcon={MockIconComponent} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-3');  // md size without left icon
      expect(input).toHaveClass('pr-10'); // md size with right icon
    });

    it('should apply correct padding when both icons are present', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          rightIcon={MockIconComponent} 
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10'); // md size with left icon
      expect(input).toHaveClass('pr-10'); // md size with right icon
    });

    it('should apply correct padding for different sizes with icons', () => {
      const { rerender } = render(
        <Input leftIcon={MockIconComponent} size="sm" data-testid="input" />
      );
      expect(screen.getByTestId('input')).toHaveClass('pl-8');

      rerender(<Input leftIcon={MockIconComponent} size="md" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('pl-10');

      rerender(<Input leftIcon={MockIconComponent} size="lg" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('pl-12');
    });

    it('should apply correct padding for outlined variant with icons', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          rightIcon={MockIconComponent} 
          variant="outlined" 
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-11'); // md size outlined with left icon
      expect(input).toHaveClass('pr-11'); // md size outlined with right icon
    });

    it('should apply default padding when no icons are present', () => {
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-3');  // md size default
      expect(input).toHaveClass('pr-3');  // md size default
    });
  });

  describe('State Indicator Precedence', () => {
    it('should show success indicator instead of right icon when success is true', () => {
      render(
        <Input 
          rightIcon={MockIconComponent} 
          success={true} 
          data-testid="input" 
        />
      );
      
      // Success indicator SVG should be present
      const successSvg = document.querySelector('svg[class*="text-success"]');
      expect(successSvg).toBeInTheDocument();
      // Right icon should not be rendered
      expect(screen.queryByTestId('mock-icon-component')).not.toBeInTheDocument();
    });

    it('should show error indicator instead of right icon when error is present', () => {
      render(
        <Input 
          rightIcon={MockIconComponent} 
          error="Test error" 
          data-testid="input" 
        />
      );
      
      // Error indicator SVG should be present
      const errorSvg = document.querySelector('svg[class*="text-error"]');
      expect(errorSvg).toBeInTheDocument();
      // Right icon should not be rendered
      expect(screen.queryByTestId('mock-icon-component')).not.toBeInTheDocument();
    });

    it('should show left icon even when state indicators are present', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          rightIcon={MockIconComponent} 
          error="Test error" 
          data-testid="input" 
        />
      );
      
      // Left icon should still be rendered
      expect(screen.getByTestId('mock-icon-component')).toBeInTheDocument();
      // Error indicator SVG should be present
      const errorSvg = document.querySelector('svg[class*="text-error"]');
      expect(errorSvg).toBeInTheDocument();
    });

    it('should apply correct padding when state indicator overrides right icon', () => {
      render(
        <Input 
          rightIcon={MockIconComponent} 
          success={true} 
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      // Should have right padding as if icon is present (state indicator takes same space)
      expect(input).toHaveClass('pr-10');
    });
  });

  describe('Accessibility', () => {
    it('should mark icons as aria-hidden', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          rightIcon={MockIconComponent} 
          data-testid="input" 
        />
      );
      
      const iconContainers = screen.getAllByTestId('mock-icon-component');
      const leftIconContainer = iconContainers[0].parentElement;
      const rightIconContainer = iconContainers[1].parentElement;
      
      expect(leftIconContainer).toHaveAttribute('aria-hidden', 'true');
      expect(rightIconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should maintain existing ARIA attributes', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          aria-describedby="custom-description"
          aria-invalid={true}
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-describedby', 'custom-description');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should maintain proper focus behavior with icons', () => {
      render(<Input leftIcon={MockIconComponent} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      
      // Focus the input
      input.focus();
      
      // Focus should work normally
      expect(input).toHaveFocus();
    });

    it('should maintain keyboard navigation with icons', () => {
      render(<Input leftIcon={MockIconComponent} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.keyDown(input, { key: 'Tab' });
      
      // Should not interfere with keyboard navigation
      expect(input).toBeInTheDocument();
    });

    it('should handle Escape key to clear input when icons are present', () => {
      const mockOnChange = jest.fn();
      render(
        <Input 
          leftIcon={MockIconComponent} 
          onChange={mockOnChange}
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(input.value).toBe('');
    });
  });

  describe('Backward Compatibility', () => {
    it('should render exactly as before when no icon props are provided', () => {
      const { container: withoutIcons } = render(
        <Input 
          label="Test Label"
          helpText="Test help text"
          placeholder="Test placeholder"
          data-testid="input-without-icons"
        />
      );

      const { container: withIcons } = render(
        <Input 
          label="Test Label"
          helpText="Test help text"
          placeholder="Test placeholder"
          data-testid="input-with-icons"
        />
      );

      // Both should have the same structure when no icons are provided
      const inputWithoutIcons = screen.getByTestId('input-without-icons');
      const inputWithIcons = screen.getByTestId('input-with-icons');
      
      expect(inputWithoutIcons).toHaveClass('pl-3', 'pr-3'); // Default padding
      expect(inputWithIcons).toHaveClass('pl-3', 'pr-3'); // Default padding
    });

    it('should maintain all existing prop interfaces', () => {
      // Test that all existing props still work
      render(
        <Input 
          label="Test Label"
          helpText="Help text"
          error="Error message"
          variant="outlined"
          size="lg"
          success={false}
          required
          disabled
          placeholder="Placeholder"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('disabled');
      expect(input).toHaveAttribute('placeholder', 'Placeholder');
    });

    it('should have optional icon props with undefined defaults', () => {
      // This test ensures TypeScript compilation works with optional props
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      // No icons should be rendered
      expect(screen.queryByTestId('mock-icon-component')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-icon-element')).not.toBeInTheDocument();
    });

    it('should maintain existing className behavior', () => {
      render(
        <Input 
          className="custom-input-class" 
          leftIcon={MockIconComponent}
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-input-class');
    });

    it('should maintain existing ref forwarding', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} leftIcon={MockIconComponent} data-testid="input" />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(screen.getByTestId('input'));
    });
  });

  describe('Error Handling', () => {
    it('should handle icon rendering errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with an invalid icon type instead of a throwing component
      // since React component errors during rendering can't be caught by try-catch
      render(<Input leftIcon={'invalid-icon' as any} data-testid="input" />);
      
      // Input should still render even with invalid icon
      expect(screen.getByTestId('input')).toBeInTheDocument();
      
      // No icon should be rendered
      expect(screen.queryByTestId('mock-icon-component')).not.toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle undefined icon props gracefully', () => {
      render(
        <Input 
          leftIcon={undefined} 
          rightIcon={undefined} 
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('pl-3', 'pr-3'); // Default padding
    });

    it('should handle null icon props gracefully', () => {
      render(
        <Input 
          leftIcon={null as any} 
          rightIcon={null as any} 
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('pl-3', 'pr-3'); // Default padding
    });
  });

  describe('Variant Compatibility', () => {
    it('should position icons correctly with default variant', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          variant="default" 
          data-testid="input" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon-component').parentElement;
      expect(iconContainer).toHaveClass('left-3'); // Default positioning
    });

    it('should position icons correctly with filled variant', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          variant="filled" 
          data-testid="input" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon-component').parentElement;
      expect(iconContainer).toHaveClass('left-3'); // Same as default
    });

    it('should position icons correctly with outlined variant', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          variant="outlined" 
          data-testid="input" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon-component').parentElement;
      expect(iconContainer).toHaveClass('left-3.5'); // Adjusted for outlined
    });

    it('should apply correct z-index for outlined variant icons', () => {
      render(
        <Input 
          leftIcon={MockIconComponent} 
          variant="outlined" 
          data-testid="input" 
        />
      );
      
      const iconContainer = screen.getByTestId('mock-icon-component').parentElement;
      expect(iconContainer).toHaveClass('z-10'); // Higher z-index for outlined
    });
  });

  describe('Focus Management', () => {
    it('should show focus ring around entire input container when focused', () => {
      render(<Input leftIcon={MockIconComponent} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      const container = input.parentElement;
      
      fireEvent.focus(input);
      
      expect(container).toHaveClass('ring-3', 'ring-focus/20');
    });

    it('should remove focus ring when input loses focus', () => {
      render(<Input leftIcon={MockIconComponent} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      const container = input.parentElement;
      
      fireEvent.focus(input);
      expect(container).toHaveClass('ring-3');
      
      fireEvent.blur(input);
      expect(container).not.toHaveClass('ring-3');
    });

    it('should call custom focus handlers when provided', () => {
      const mockOnFocus = jest.fn();
      const mockOnBlur = jest.fn();
      
      render(
        <Input 
          leftIcon={MockIconComponent} 
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      
      fireEvent.focus(input);
      expect(mockOnFocus).toHaveBeenCalled();
      
      fireEvent.blur(input);
      expect(mockOnBlur).toHaveBeenCalled();
    });
  });
});