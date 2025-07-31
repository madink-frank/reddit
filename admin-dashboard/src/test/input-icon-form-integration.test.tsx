/**
 * Input Icon Enhancement - Form Integration Tests
 * 
 * Tests for icon inputs within form validation scenarios, different themes,
 * responsive layouts, and various form libraries.
 * 
 * Requirements: 3.1, 3.2, 5.4
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../components/ui/Input';

// Mock icons for testing
const MockSearchIcon = () => <svg data-testid="search-icon" width="16" height="16"><path d="M8 8l4 4" /></svg>;
const MockMailIcon = () => <svg data-testid="mail-icon" width="16" height="16"><path d="M4 4h8v8H4z" /></svg>;
const MockLockIcon = () => <svg data-testid="lock-icon" width="16" height="16"><path d="M6 6V4a2 2 0 014 0v2" /></svg>;
const MockUserIcon = () => <svg data-testid="user-icon" width="16" height="16"><circle cx="8" cy="8" r="4" /></svg>;

// Simple form validation component
const SimpleValidationForm: React.FC<{ onSubmit?: (data: any) => void }> = ({ onSubmit = jest.fn() }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({ email, password });
    }
  };

  return (
    <form onSubmit={validateAndSubmit} data-testid="validation-form">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={MockMailIcon}
        error={errors.email}
        success={!!email && !errors.email}
        data-testid="email-input"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={MockLockIcon}
        error={errors.password}
        success={!!password && !errors.password}
        data-testid="password-input"
      />

      <button type="submit" data-testid="submit-btn">Submit</button>
    </form>
  );
};

// Theme wrapper component
const ThemeWrapper: React.FC<{ theme: 'light' | 'dark'; children: React.ReactNode }> = ({ theme, children }) => {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  return <div data-theme={theme} className={theme}>{children}</div>;
};

// Responsive test component
const ResponsiveIconInput: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  return (
    <Input
      label={`${size.toUpperCase()} Input`}
      placeholder="Test input"
      leftIcon={MockUserIcon}
      rightIcon={MockSearchIcon}
      size={size}
      data-testid={`responsive-input-${size}`}
    />
  );
};

// Form library simulation
const FormLibrarySimulation: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', search: '' });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div data-testid="form-library-wrapper">
      <Input
        label="Username"
        value={formData.username}
        onChange={handleChange('username')}
        leftIcon={MockUserIcon}
        data-testid="username-input"
      />

      <Input
        label="Search"
        value={formData.search}
        onChange={handleChange('search')}
        leftIcon={MockSearchIcon}
        data-testid="search-input"
      />
    </div>
  );
};

describe('Input Icon Enhancement - Form Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation Scenarios', () => {
    it('should handle icon inputs within form validation correctly', async () => {
      const mockSubmit = jest.fn();
      render(<SimpleValidationForm onSubmit={mockSubmit} />);

      // Initially no validation errors
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument();

      // Submit empty form to trigger validation
      fireEvent.click(screen.getByTestId('submit-btn'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      // Icons should still be present
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();

      // Inputs should have error styling
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      expect(emailInput).toHaveClass('border-error');
      expect(passwordInput).toHaveClass('border-error');
    });

    it('should show success states with icons when validation passes', async () => {
      const mockSubmit = jest.fn();
      render(<SimpleValidationForm onSubmit={mockSubmit} />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      // Fill in valid data
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      // Icons should still be present
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();

      // Submit form
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('should handle state indicator precedence over right icons', () => {
      render(
        <Input
          label="Test Input"
          leftIcon={MockUserIcon}
          rightIcon={MockSearchIcon}
          error="This field has an error"
          data-testid="precedence-input"
        />
      );

      // Left icon should be present
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();

      // Right icon should not be present when error state is active
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();

      // Error indicator should be present
      expect(screen.getByText('This field has an error')).toBeInTheDocument();
    });
  });

  describe('Theme Integration Tests', () => {
    it('should render icons correctly in light theme', () => {
      render(
        <ThemeWrapper theme="light">
          <Input
            label="Light Theme Input"
            leftIcon={MockUserIcon}
            rightIcon={MockSearchIcon}
            data-testid="light-theme-input"
          />
        </ThemeWrapper>
      );

      const input = screen.getByTestId('light-theme-input');
      expect(input).toBeInTheDocument();

      // Icons should be present
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();

      // Theme should be applied
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('should render icons correctly in dark theme', () => {
      render(
        <ThemeWrapper theme="dark">
          <Input
            label="Dark Theme Input"
            leftIcon={MockUserIcon}
            rightIcon={MockSearchIcon}
            data-testid="dark-theme-input"
          />
        </ThemeWrapper>
      );

      const input = screen.getByTestId('dark-theme-input');
      expect(input).toBeInTheDocument();

      // Icons should be present
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();

      // Theme should be applied
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('should handle theme switching without losing icon functionality', async () => {
      const { rerender } = render(
        <ThemeWrapper theme="light">
          <Input
            label="Theme Switch Input"
            leftIcon={MockUserIcon}
            defaultValue="test value"
            data-testid="theme-switch-input"
          />
        </ThemeWrapper>
      );

      // Initially in light theme
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();

      // Switch to dark theme
      rerender(
        <ThemeWrapper theme="dark">
          <Input
            label="Theme Switch Input"
            leftIcon={MockUserIcon}
            defaultValue="test value"
            data-testid="theme-switch-input"
          />
        </ThemeWrapper>
      );

      // Should now be in dark theme
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('theme-switch-input')).toHaveValue('test value');
    });

    it('should apply design tokens correctly with icons', () => {
      render(
        <div>
          <Input
            label="Small Input"
            leftIcon={MockUserIcon}
            size="sm"
            data-testid="small-input"
          />
          <Input
            label="Medium Input"
            leftIcon={MockUserIcon}
            size="md"
            data-testid="medium-input"
          />
          <Input
            label="Large Input"
            leftIcon={MockUserIcon}
            size="lg"
            data-testid="large-input"
          />
        </div>
      );

      // All inputs should have consistent design system classes
      const smallInput = screen.getByTestId('small-input');
      const mediumInput = screen.getByTestId('medium-input');
      const largeInput = screen.getByTestId('large-input');

      // Check size-specific classes
      expect(smallInput).toHaveClass('h-8');
      expect(mediumInput).toHaveClass('h-10');
      expect(largeInput).toHaveClass('h-12');

      // All should have consistent transition classes
      [smallInput, mediumInput, largeInput].forEach(input => {
        expect(input).toHaveClass('transition-all', 'duration-200');
      });

      // Icons should be present in all sizes
      expect(screen.getAllByTestId('user-icon')).toHaveLength(3);
    });
  });

  describe('Responsive Layout Tests', () => {
    it('should handle different input sizes correctly', () => {
      render(
        <div>
          <ResponsiveIconInput size="sm" />
          <ResponsiveIconInput size="md" />
          <ResponsiveIconInput size="lg" />
        </div>
      );

      // All inputs should be present
      expect(screen.getByTestId('responsive-input-sm')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-input-md')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-input-lg')).toBeInTheDocument();

      // Check size-specific classes
      expect(screen.getByTestId('responsive-input-sm')).toHaveClass('h-8');
      expect(screen.getByTestId('responsive-input-md')).toHaveClass('h-10');
      expect(screen.getByTestId('responsive-input-lg')).toHaveClass('h-12');

      // Icons should be present for all sizes
      expect(screen.getAllByTestId('user-icon')).toHaveLength(3);
      expect(screen.getAllByTestId('search-icon')).toHaveLength(3);
    });

    it('should maintain icon positioning across different sizes', () => {
      render(<ResponsiveIconInput size="md" />);

      const input = screen.getByTestId('responsive-input-md');
      const leftIcon = screen.getByTestId('user-icon');
      const rightIcon = screen.getByTestId('search-icon');

      // Input should have proper size
      expect(input).toHaveClass('h-10');

      // Icons should be present
      expect(leftIcon).toBeInTheDocument();
      expect(rightIcon).toBeInTheDocument();

      // Icons should have proper ARIA attributes
      expect(leftIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
      expect(rightIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Form Library Integration Tests', () => {
    it('should work with controlled form patterns', async () => {
      render(<FormLibrarySimulation />);

      const usernameInput = screen.getByTestId('username-input');
      const searchInput = screen.getByTestId('search-input');

      // Icons should be present
      expect(screen.getAllByTestId('user-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('search-icon')).toHaveLength(1);

      // Type in inputs
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(searchInput, 'search query');

      // Values should be updated
      expect(usernameInput).toHaveValue('testuser');
      expect(searchInput).toHaveValue('search query');

      // Icons should still be present after typing
      expect(screen.getAllByTestId('user-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('search-icon')).toHaveLength(1);
    });

    it('should maintain accessibility with form libraries', () => {
      render(
        <Input
          label="Accessible Input"
          leftIcon={MockUserIcon}
          aria-describedby="help-text"
          aria-invalid={false}
          required
          data-testid="accessible-input"
        />
      );

      const input = screen.getByTestId('accessible-input');

      // Accessibility attributes should be preserved
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('required');

      // Icon should be properly hidden from screen readers
      const icon = screen.getByTestId('user-icon');
      expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('should handle uncontrolled form patterns', () => {
      render(
        <Input
          label="Uncontrolled Input"
          defaultValue="default value"
          leftIcon={MockUserIcon}
          data-testid="uncontrolled-input"
        />
      );

      const input = screen.getByTestId('uncontrolled-input');

      // Should have default value
      expect(input).toHaveValue('default value');

      // Icon should be present
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple icon inputs efficiently', () => {
      const inputs = Array.from({ length: 10 }, (_, i) => (
        <Input
          key={i}
          label={`Input ${i}`}
          leftIcon={MockUserIcon}
          rightIcon={MockSearchIcon}
          data-testid={`multi-input-${i}`}
        />
      ));

      render(<div>{inputs}</div>);

      // All inputs should be rendered
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`multi-input-${i}`)).toBeInTheDocument();
      }

      // All icons should be present
      expect(screen.getAllByTestId('user-icon')).toHaveLength(10);
      expect(screen.getAllByTestId('search-icon')).toHaveLength(10);
    });

    it('should handle form submission with icons present', async () => {
      const mockSubmit = jest.fn();
      render(<SimpleValidationForm onSubmit={mockSubmit} />);

      // Fill out form
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
      await userEvent.type(screen.getByTestId('password-input'), 'password123');

      // Icons should be present
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();

      // Submit form
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('should handle rapid state changes without issues', async () => {
      const TestComponent: React.FC = () => {
        const [hasError, setHasError] = useState(false);
        const [value, setValue] = useState('');

        return (
          <div>
            <Input
              label="Rapid Change Input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              leftIcon={MockUserIcon}
              error={hasError ? 'Error message' : undefined}
              data-testid="rapid-change-input"
            />
            <button
              onClick={() => setHasError(!hasError)}
              data-testid="toggle-error"
            >
              Toggle Error
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      const input = screen.getByTestId('rapid-change-input');
      const toggleButton = screen.getByTestId('toggle-error');

      // Initially no error
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();

      // Toggle error state rapidly
      for (let i = 0; i < 5; i++) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          // Icon should always be present
          expect(screen.getByTestId('user-icon')).toBeInTheDocument();
        });
      }

      // Type while toggling
      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });
});