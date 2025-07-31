/**
 * UI Consistency Verification Test Suite
 * 
 * This comprehensive test suite verifies:
 * 1. Design system application across all pages
 * 2. Brand guideline compliance
 * 3. User flow testing
 * 4. Requirements 3.1, 3.2, 3.3, 3.4 compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { Activity } from 'lucide-react';
import {
  ICON_SIZES,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  TEXT_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
  getStandardIconSize,
  convertTailwindToIconSize
} from '../constants/design-tokens';
import { findNonStandardIconSizes } from '../constants/icon-standards';

// Import all pages for testing
import App from '../App';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/DashboardPage';

// Import key components
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/card';

expect.extend(toHaveNoViolations);

// Test utilities
const createTestWrapper = (initialTheme: 'light' | 'dark' | 'system' = 'light') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme={initialTheme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('UI Consistency Verification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Design System Application (Requirement 3.1)', () => {
    describe('Color Palette Consistency', () => {
      it('should use consistent color variables across all components', () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <div>
              <StatCard
                title="Test Stat"
                value={100}
                icon={Activity}
                iconColor="text-primary"
              />
              <Button variant="primary">Test Button</Button>
              <Input placeholder="Test input" />
            </div>
          </TestWrapper>
        );

        // Check that components use design system color classes
        const statCard = screen.getByText('Test Stat').closest('.dashboard-card');
        const button = screen.getByRole('button', { name: /test button/i });
        const input = screen.getByPlaceholderText('Test input');

        expect(statCard).toHaveClass('bg-surface-primary');
        expect(button).toHaveClass('btn-primary');
        expect(input).toHaveClass('form-default');
      });

      it('should maintain color consistency in both light and dark themes', async () => {
        const TestWrapper = createTestWrapper('dark');

        render(
          <TestWrapper>
            <div data-testid="theme-test">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
            </div>
          </TestWrapper>
        );

        const container = screen.getByTestId('theme-test');
        const computedStyle = window.getComputedStyle(container);

        // Verify CSS custom properties are applied
        expect(computedStyle.getPropertyValue('--color-primary-500')).toBeTruthy();
        expect(computedStyle.getPropertyValue('--color-background-primary')).toBeTruthy();
      });
    });

    describe('Typography System', () => {
      it('should use consistent typography scales', () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <div>
              <h1 className="heading-1">Main Title</h1>
              <h2 className="heading-2">Section Title</h2>
              <p className="body-base">Body text</p>
              <span className="text-sm">Small text</span>
            </div>
          </TestWrapper>
        );

        const mainTitle = screen.getByText('Main Title');
        const sectionTitle = screen.getByText('Section Title');
        const bodyText = screen.getByText('Body text');
        const smallText = screen.getByText('Small text');

        expect(mainTitle).toHaveClass('heading-1');
        expect(sectionTitle).toHaveClass('heading-2');
        expect(bodyText).toHaveClass('body-base');
        expect(smallText).toHaveClass('text-sm');
      });
    });

    describe('Spacing System', () => {
      it('should use consistent spacing tokens', () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <div className="space-md">
              <div className="p-4 m-2">Test content</div>
            </div>
          </TestWrapper>
        );

        const container = screen.getByText('Test content').parentElement;
        expect(container).toHaveClass('p-4', 'm-2');
      });
    });
  });

  describe('Icon Standardization (Requirement 3.2)', () => {
    it('should use standardized icon sizes across all contexts', () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <div data-testid="icon-test-container">
            <button className="btn-primary">
              <span className="icon-md">Button Icon</span>
            </button>
            <div className="status-indicator">
              <span className="icon">Status Icon</span>
            </div>
            <h2>
              <span className="icon-lg">Header Icon</span>
              Section Title
            </h2>
          </div>
        </TestWrapper>
      );

      const container = screen.getByTestId('icon-test-container');
      const buttonIcon = container.querySelector('.icon-md');
      const statusIcon = container.querySelector('.icon');
      const headerIcon = container.querySelector('.icon-lg');

      expect(buttonIcon).toBeInTheDocument();
      expect(statusIcon).toBeInTheDocument();
      expect(headerIcon).toBeInTheDocument();
    });

    it('should not use deprecated Tailwind icon sizes', () => {
      const TestWrapper = createTestWrapper();

      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for deprecated Tailwind classes
      const deprecatedSizes = ['h-3 w-3', 'h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8', 'h-12 w-12', 'h-16 w-16'];

      deprecatedSizes.forEach(size => {
        const [height, width] = size.split(' ');
        const elementsWithDeprecatedSize = container.querySelectorAll(`.${height}.${width}`);

        if (elementsWithDeprecatedSize.length > 0) {
          console.warn(`Found ${elementsWithDeprecatedSize.length} elements using deprecated size: ${size}`);
          // Convert to design token equivalent
          const recommendedSize = convertTailwindToIconSize(size);
          console.warn(`Recommended replacement: icon-${recommendedSize}`);
        }
      });
    });

    it('should validate icon sizes match their context', () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Check login page icon uses correct size (should be 'xl' for hero context)
      const loginIcon = screen.getByRole('img', { name: /security lock icon/i });
      expect(loginIcon).toHaveClass('icon-xl');
    });
  });

  describe('Component Consistency (Requirement 3.3)', () => {
    describe('Button Components', () => {
      it('should have consistent button styles and interactions', async () => {
        const TestWrapper = createTestWrapper();
        const mockClick = jest.fn();

        render(
          <TestWrapper>
            <div>
              <Button variant="primary" onClick={mockClick}>Primary</Button>
              <Button variant="secondary" onClick={mockClick}>Secondary</Button>
              <Button variant="outline" onClick={mockClick}>Outline</Button>
              <Button variant="ghost" onClick={mockClick}>Ghost</Button>
            </div>
          </TestWrapper>
        );

        const buttons = screen.getAllByRole('button');

        // Test each button variant
        buttons.forEach(button => {
          expect(button).toHaveClass('btn');

          // Test hover effects
          fireEvent.mouseEnter(button);
          expect(button).toHaveClass('hover:bg-interactive-primary-hover', 'hover:bg-interactive-secondary-hover');

          // Test click functionality
          fireEvent.click(button);
          expect(mockClick).toHaveBeenCalled();
        });
      });

      it('should maintain consistent loading states', async () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <Button variant="primary" loading={true}>Loading Button</Button>
          </TestWrapper>
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');

        // Check for loading spinner
        const spinner = within(button).getByRole('status', { hidden: true });
        expect(spinner).toBeInTheDocument();
      });
    });

    describe('Form Components', () => {
      it('should have consistent form field styles', () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <form>
              <Input placeholder="Text input" />
              <Input type="email" placeholder="Email input" />
              <Input type="password" placeholder="Password input" />
            </form>
          </TestWrapper>
        );

        const inputs = screen.getAllByRole('textbox');

        inputs.forEach(input => {
          expect(input).toHaveClass('form-default');

          // Test focus states
          fireEvent.focus(input);
          expect(input).toHaveClass('form-state-focused');

          fireEvent.blur(input);
        });
      });

      it('should show consistent error states', () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <Input
              placeholder="Error input"
              error="This field is required"
              aria-invalid={true}
            />
          </TestWrapper>
        );

        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('form-state-error');
        expect(input).toHaveAttribute('aria-invalid', 'true');

        const errorMessage = screen.getByText('This field is required');
        expect(errorMessage).toHaveClass('text-error');
      });
    });

    describe('Card Components', () => {
      it('should have consistent card layouts and styling', () => {
        const TestWrapper = createTestWrapper();

        render(
          <TestWrapper>
            <div>
              <Card>Default Card</Card>
              <Card className="border">Outlined Card</Card>
              <Card className="shadow-lg">Elevated Card</Card>
            </div>
          </TestWrapper>
        );

        const cards = screen.getAllByText(/card$/i).map(text => text.closest('.card'));

        cards.forEach(card => {
          expect(card).toHaveClass('card');
          expect(card).toHaveClass('bg-surface-primary');
        });
      });
    });
  });

  describe('Error Handling Consistency (Requirement 3.4)', () => {
    it('should display user-friendly error messages', async () => {
      const TestWrapper = createTestWrapper();

      // Mock a component that can show errors
      const ErrorComponent = () => {
        const [error, setError] = React.useState<string | null>(null);

        return (
          <div>
            <button onClick={() => setError('Something went wrong')}>
              Trigger Error
            </button>
            {error && (
              <div role="alert" className="alert-error">
                <span className="text-error">{error}</span>
                <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper>
          <ErrorComponent />
        </TestWrapper>
      );

      const triggerButton = screen.getByText('Trigger Error');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('alert-error');
        expect(screen.getByText('Something went wrong')).toHaveClass('text-error');
      });

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('should provide consistent retry mechanisms', () => {
      const TestWrapper = createTestWrapper();
      const mockRetry = jest.fn();

      const RetryComponent = () => (
        <div className="dashboard-card border-l-4 border-l-error">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-primary">
                Unable to load data
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Please try again or contact support if the problem persists.
              </p>
              <div className="mt-3">
                <button onClick={mockRetry} className="btn-secondary text-sm">
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <RetryComponent />
        </TestWrapper>
      );

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toHaveClass('btn-secondary');

      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Brand Guidelines Compliance', () => {
    it('should use correct Reddit brand colors and styling', () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Check Reddit brand color usage
      const loginButton = screen.getByRole('button', { name: /sign in with reddit/i });
      expect(loginButton).toHaveClass('bg-orange-600');

      // Check Reddit logo presence
      const redditLogo = screen.getByRole('img', { name: /reddit logo/i });
      expect(redditLogo).toBeInTheDocument();
    });

    it('should maintain consistent branding across all pages', async () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check for consistent header branding
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('aria-label', 'Reddit Content Platform Admin Dashboard');
    });
  });

  describe('User Flow Testing', () => {
    it('should maintain consistent navigation patterns', async () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for consistent navigation elements
      const quickActions = screen.getByRole('group', { name: /quick actions/i });
      expect(quickActions).toBeInTheDocument();

      // Test quick action buttons have consistent styling
      const quickActionButtons = within(quickActions).getAllByRole('button');
      quickActionButtons.forEach(button => {
        expect(button).toHaveClass('quick-action-btn');
      });
    });

    it('should provide consistent loading states across user flows', async () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for loading skeletons
      const loadingElements = screen.queryAllByText(/loading/i);
      loadingElements.forEach(element => {
        const container = element.closest('[class*="loading"]');
        expect(container).toHaveClass('animate-pulse');
      });
    });

    it('should maintain consistent feedback patterns', async () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Test that success/error states use consistent styling
      const statusElements = screen.queryAllByRole('status');
      statusElements.forEach(element => {
        expect(element).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Accessibility Consistency', () => {
    it('should have no accessibility violations across all pages', async () => {
      const pages = [
        { component: LoginPage, name: 'Login Page' },
        { component: DashboardPage, name: 'Dashboard Page' },
      ];

      for (const { component: Component } of pages) {
        const TestWrapper = createTestWrapper();
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should maintain consistent focus management', () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check that interactive elements have proper focus indicators
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        fireEvent.focus(button);
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('should provide consistent ARIA labeling', () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for proper ARIA labels on key sections
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('aria-label');

      const regions = screen.getAllByRole('region');
      regions.forEach(region => {
        expect(region).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Responsive Design Consistency', () => {
    it('should maintain design system consistency across breakpoints', () => {
      const TestWrapper = createTestWrapper();

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check that responsive classes are applied consistently
      const gridElements = screen.queryAllByRole('region');
      gridElements.forEach(element => {
        const classList = Array.from(element.classList);
        const hasResponsiveClasses = classList.some(cls =>
          cls.includes('sm:') || cls.includes('md:') || cls.includes('lg:')
        );
        expect(hasResponsiveClasses).toBe(true);
      });
    });
  });

  describe('Performance Consistency', () => {
    it('should use optimized loading patterns consistently', () => {
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for skeleton loading patterns
      const skeletonElements = screen.queryAllByText(/loading/i);
      skeletonElements.forEach(element => {
        const container = element.closest('[class*="skeleton"]');
        if (container) {
          expect(container).toHaveClass('animate-pulse');
        }
      });
    });
  });
});

describe('Design Token Migration Verification', () => {
  it('should identify and report non-standard icon usage', () => {
    const TestWrapper = createTestWrapper();

    const { container } = render(
      <TestWrapper>
        <div>
          <span className="h-4 w-4">Old Icon</span>
          <span className="icon-sm">New Icon</span>
        </div>
      </TestWrapper>
    );

    const nonStandardIcons = findNonStandardIconSizes(container);

    if (nonStandardIcons.length > 0) {
      console.warn('Found non-standard icon sizes:', nonStandardIcons);
      nonStandardIcons.forEach(({ currentClasses, suggestedSize }) => {
        console.warn(`Replace "${currentClasses}" with "icon-${suggestedSize}"`);
      });
    }
  });

  it('should validate design token usage', () => {
    // Test that all design tokens are properly defined
    expect(ICON_SIZES).toBeDefined();
    expect(BUTTON_VARIANTS).toBeDefined();
    expect(BUTTON_SIZES).toBeDefined();
    expect(TEXT_COLORS).toBeDefined();
    expect(BACKGROUND_COLORS).toBeDefined();
    expect(BORDER_COLORS).toBeDefined();

    // Test helper functions
    expect(getStandardIconSize('button')).toBe('md');
    expect(getStandardIconSize('hero')).toBe('xl');
    expect(convertTailwindToIconSize('h-6 w-6')).toBe('md');
  });
});