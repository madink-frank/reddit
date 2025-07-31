import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../components/ui/Input';

// Mock Lucide icons for testing
const MockSearchIcon = (props: any) => <svg data-testid="search-icon" {...props}><path d="search" /></svg>;
const MockUserIcon = (props: any) => <svg data-testid="user-icon" {...props}><path d="user" /></svg>;
const MockEyeIcon = (props: any) => <svg data-testid="eye-icon" {...props}><path d="eye" /></svg>;

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Input Accessibility Features', () => {
  describe('Icon ARIA attributes', () => {
    it('should add aria-hidden="true" to decorative left icons', () => {
      render(<Input leftIcon={MockSearchIcon} placeholder="Search..." />);
      
      const iconContainer = document.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should add aria-hidden="true" to decorative right icons', () => {
      render(<Input rightIcon={MockUserIcon} placeholder="Username..." />);
      
      const iconContainer = document.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should add aria-hidden="true" to both left and right icons', () => {
      render(<Input leftIcon={MockSearchIcon} rightIcon={MockUserIcon} placeholder="Search users..." />);
      
      const iconContainers = document.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers).toHaveLength(2);
      iconContainers.forEach(container => {
        expect(container).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should add aria-hidden="true" to JSX element icons', () => {
      const customIcon = <MockEyeIcon data-testid="custom-eye-icon" />;
      render(<Input leftIcon={customIcon} placeholder="Password..." />);
      
      const iconContainer = document.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('custom-eye-icon')).toBeInTheDocument();
    });
  });

  describe('State indicator accessibility', () => {
    it('should add aria-hidden="true" to success indicators', () => {
      render(<Input success placeholder="Valid input" />);
      
      const successIcon = document.querySelector('svg[aria-hidden="true"]');
      expect(successIcon).toBeInTheDocument();
      expect(successIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should add aria-hidden="true" to error indicators', () => {
      render(<Input error="Invalid input" placeholder="Invalid input" />);
      
      const errorIcons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(errorIcons.length).toBeGreaterThan(0);
      errorIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should prioritize state indicators over right icons', () => {
      render(<Input rightIcon={MockUserIcon} error="Error message" placeholder="Input with error" />);
      
      // Should have error indicator, not the right icon
      const errorIcon = document.querySelector('svg[aria-hidden="true"]');
      expect(errorIcon).toBeInTheDocument();
      
      // Right icon should not be rendered when error is present
      const userIcon = screen.queryByTestId('user-icon');
      expect(userIcon).not.toBeInTheDocument();
    });
  });

  describe('Focus behavior', () => {
    it('should encompass entire input container with focus ring', async () => {
      render(<Input leftIcon={MockSearchIcon} rightIcon={MockUserIcon} placeholder="Focus test" />);
      
      const input = screen.getByPlaceholderText('Focus test');
      const container = input.closest('.relative');
      
      // Focus the input
      fireEvent.focus(input);
      
      // Container should have focus ring classes
      expect(container).toHaveClass('ring-3', 'ring-focus/20', 'ring-offset-0', 'rounded-md');
    });

    it('should remove focus ring when input loses focus', async () => {
      render(
        <div>
          <Input leftIcon={MockSearchIcon} placeholder="Focus test" />
          <button>Other element</button>
        </div>
      );
      
      const input = screen.getByPlaceholderText('Focus test');
      const container = input.closest('.relative');
      const button = screen.getByRole('button');
      
      // Focus the input
      fireEvent.focus(input);
      expect(container).toHaveClass('ring-3');
      
      // Focus another element
      fireEvent.blur(input);
      expect(container).not.toHaveClass('ring-3');
    });

    it('should maintain focus behavior with icons present', async () => {
      render(<Input leftIcon={MockSearchIcon} rightIcon={MockUserIcon} placeholder="Focus with icons" />);
      
      const input = screen.getByPlaceholderText('Focus with icons');
      
      // Should be able to focus normally
      input.focus();
      expect(document.activeElement).toBe(input);
      
      // Should be able to type
      fireEvent.change(input, { target: { value: 'test' } });
      expect(input).toHaveValue('test');
    });
  });

  describe('Keyboard navigation', () => {
    it('should handle Escape key to clear input', async () => {
      const onChange = jest.fn();
      
      render(
        <Input 
          leftIcon={MockSearchIcon} 
          placeholder="Keyboard test" 
          onChange={onChange}
          defaultValue="initial value"
        />
      );
      
      const input = screen.getByPlaceholderText('Keyboard test');
      fireEvent.focus(input);
      
      // Press Escape
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      
      expect(input).toHaveValue('');
      expect(onChange).toHaveBeenCalled();
    });

    it('should not clear required inputs with Escape key', async () => {
      render(
        <Input 
          leftIcon={MockSearchIcon} 
          placeholder="Required test" 
          required
          defaultValue="required value"
        />
      );
      
      const input = screen.getByPlaceholderText('Required test');
      fireEvent.focus(input);
      
      // Press Escape
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      
      // Value should remain unchanged for required inputs
      expect(input).toHaveValue('required value');
    });

    it('should handle Tab navigation properly with icons', async () => {
      render(
        <div>
          <Input leftIcon={MockSearchIcon} placeholder="First input" />
          <Input rightIcon={MockUserIcon} placeholder="Second input" />
          <button>Next element</button>
        </div>
      );
      
      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      const button = screen.getByRole('button');
      
      // Start from first input
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);
      
      // Tab to second input
      fireEvent.keyDown(firstInput, { key: 'Tab', code: 'Tab' });
      secondInput.focus();
      expect(document.activeElement).toBe(secondInput);
      
      // Tab to button
      fireEvent.keyDown(secondInput, { key: 'Tab', code: 'Tab' });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should call custom onKeyDown handlers', async () => {
      const onKeyDown = jest.fn();
      
      render(
        <Input 
          leftIcon={MockSearchIcon} 
          placeholder="Custom handler test" 
          onKeyDown={onKeyDown}
        />
      );
      
      const input = screen.getByPlaceholderText('Custom handler test');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'a', code: 'KeyA' });
      
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('ARIA attributes maintenance', () => {
    it('should maintain existing aria-describedby attributes', () => {
      render(
        <Input 
          leftIcon={MockSearchIcon}
          label="Search field"
          helpText="Enter search terms"
          placeholder="Search..."
          aria-describedby="custom-description"
        />
      );
      
      const input = screen.getByPlaceholderText('Search...');
      const describedBy = input.getAttribute('aria-describedby');
      
      expect(describedBy).toContain('custom-description');
      expect(describedBy).toContain('help');
    });

    it('should set aria-invalid correctly with errors', () => {
      render(
        <Input 
          leftIcon={MockSearchIcon}
          error="Invalid search term"
          placeholder="Search..."
        />
      );
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should maintain aria-invalid when explicitly set', () => {
      render(
        <Input 
          leftIcon={MockSearchIcon}
          aria-invalid={false}
          placeholder="Search..."
        />
      );
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate error messages with role="alert"', () => {
      render(
        <Input 
          leftIcon={MockSearchIcon}
          error="Search failed"
          placeholder="Search..."
        />
      );
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Search failed');
    });
  });

  describe('Screen reader compatibility', () => {
    it('should not interfere with screen reader navigation', () => {
      render(
        <Input 
          leftIcon={MockSearchIcon}
          rightIcon={MockUserIcon}
          label="Search users"
          helpText="Type to search for users"
          placeholder="Search..."
        />
      );
      
      const input = screen.getByLabelText('Search users');
      expect(input).toBeInTheDocument();
      
      // Icons should be hidden from screen readers
      const iconContainers = document.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers.length).toBeGreaterThan(0);
      
      // Help text should be accessible
      const helpText = screen.getByText('Type to search for users');
      expect(helpText).toBeInTheDocument();
    });

    it('should maintain proper label association with icons present', () => {
      render(
        <Input 
          leftIcon={MockSearchIcon}
          rightIcon={MockUserIcon}
          label="Username"
          placeholder="Enter username"
        />
      );
      
      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter username');
    });
  });

  describe('Accessibility compliance', () => {
    it('should pass axe accessibility tests with icons', async () => {
      const { container } = render(
        <Input 
          leftIcon={MockSearchIcon}
          rightIcon={MockUserIcon}
          label="Accessible input"
          helpText="This input has icons"
          placeholder="Type here..."
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility tests with error state', async () => {
      const { container } = render(
        <Input 
          leftIcon={MockSearchIcon}
          error="This field is required"
          label="Required field"
          placeholder="Required input..."
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility tests with success state', async () => {
      const { container } = render(
        <Input 
          leftIcon={MockSearchIcon}
          success
          label="Valid field"
          placeholder="Valid input..."
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility tests with all features combined', async () => {
      const { container } = render(
        <div>
          <Input 
            leftIcon={MockSearchIcon}
            rightIcon={MockUserIcon}
            label="Complex input"
            helpText="This input demonstrates all features"
            placeholder="Complex example..."
            required
          />
          <Input 
            leftIcon={MockEyeIcon}
            error="Validation failed"
            label="Error input"
            placeholder="Error example..."
          />
          <Input 
            rightIcon={MockUserIcon}
            success
            label="Success input"
            placeholder="Success example..."
          />
        </div>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});