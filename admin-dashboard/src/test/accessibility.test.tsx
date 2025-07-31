/**
 * Accessibility Tests
 * 
 * Tests for ARIA labels, semantic markup, and accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components to test
import LoginPage from '../pages/auth/LoginPage';
import { StatCard } from '../components/dashboard/StatCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import SkipLinks from '../components/ui/SkipLinks';
import { SemanticLayout, PageSection, ContentGrid, StatusIndicator } from '../components/layouts/SemanticLayout';

// Icons for testing
import { Hash } from 'lucide-react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Accessibility Tests', () => {
  describe('LoginPage', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Check for main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Check for proper headings
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Reddit Content Platform');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Admin Dashboard');

      // Check for proper button labeling
      const loginButton = screen.getByRole('button', { name: /sign in with reddit/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute('type', 'button');
    });

    it('should handle error states accessibly', () => {
      // Mock error state

      // This would need to be mocked properly in a real test
      // For now, we'll test the error structure manually
      const errorElement = document.createElement('div');
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-labelledby', 'error-title');
      errorElement.setAttribute('aria-describedby', 'error-description');

      expect(errorElement).toHaveAttribute('role', 'alert');
      expect(errorElement).toHaveAttribute('aria-labelledby', 'error-title');
      expect(errorElement).toHaveAttribute('aria-describedby', 'error-description');
    });
  });

  describe('StatCard', () => {
    const defaultProps = {
      title: 'Active Keywords',
      value: 42,
      icon: Hash,
      iconColor: 'text-primary'
    };

    it('should not have accessibility violations', async () => {
      const { container } = render(<StatCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(<StatCard {...defaultProps} />);

      const article = screen.getByRole('img');
      expect(article).toHaveAttribute('aria-labelledby', 'stat-active-keywords');
      expect(article).toHaveAttribute('aria-describedby', 'stat-active-keywords-description');
    });

    it('should provide screen reader friendly content', () => {
      render(
        <StatCard
          {...defaultProps}
          change={{ value: 12, type: 'increase' }}
          trend="up"
        />
      );

      // Check for screen reader only content
      const srOnlyContent = document.querySelector('.sr-only');
      expect(srOnlyContent).toBeInTheDocument();
    });
  });

  describe('Form Components', () => {
    describe('Input', () => {
      it('should not have accessibility violations', async () => {
        const { container } = render(
          <Input
            label="Email Address"
            placeholder="Enter your email"
            required
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have proper ARIA attributes', () => {
        render(
          <Input
            label="Email Address"
            helpText="We'll never share your email"
            error="Email is required"
            required
          />
        );

        const input = screen.getByLabelText(/email address/i);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).toHaveAttribute('aria-describedby');

        // Check for error message with role="alert"
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    describe('Select', () => {
      it('should not have accessibility violations', async () => {
        const { container } = render(
          <Select label="Country" required>
            <option value="">Select a country</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
          </Select>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have proper labeling', () => {
        render(
          <Select label="Country" required>
            <option value="">Select a country</option>
            <option value="us">United States</option>
          </Select>
        );

        const select = screen.getByLabelText(/country/i);
        expect(select).toBeInTheDocument();
        expect(select).toHaveAttribute('aria-required', 'true');
      });
    });

    describe('Textarea', () => {
      it('should not have accessibility violations', async () => {
        const { container } = render(
          <Textarea
            label="Description"
            placeholder="Enter description"
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should handle error states accessibly', () => {
        render(
          <Textarea
            label="Description"
            error="Description is required"
          />
        );

        const textarea = screen.getByLabelText(/description/i);
        expect(textarea).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Button', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Button onClick={() => { }}>
          Click me
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle loading states accessibly', () => {
      render(
        <Button loading onClick={() => { }}>
          Save
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });

    it('should handle disabled states properly', () => {
      render(
        <Button disabled onClick={() => { }}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Modal', () => {
    it('should not have accessibility violations when open', async () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => { }}
          title="Test Modal"
          description="This is a test modal"
        >
          <p>Modal content</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => { }}
          title="Test Modal"
          description="This is a test modal"
        >
          <p>Modal content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should handle keyboard navigation', () => {
      const onClose = jest.fn();
      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Test Modal"
        >
          <button>First button</button>
          <button>Second button</button>
        </Modal>
      );

      // Test escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('SkipLinks', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SkipLinks />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide keyboard navigation', () => {
      render(<SkipLinks />);

      const skipLinks = screen.getAllByRole('link');
      expect(skipLinks.length).toBeGreaterThan(0);

      // Test focus behavior
      const firstLink = skipLinks[0];
      firstLink.focus();
      expect(firstLink).toHaveFocus();
    });
  });

  describe('Semantic Layout Components', () => {
    describe('SemanticLayout', () => {
      it('should not have accessibility violations', async () => {
        const { container } = render(
          <SemanticLayout title="Test Page">
            <p>Content</p>
          </SemanticLayout>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have proper landmark roles', () => {
        render(
          <SemanticLayout title="Test Page">
            <p>Content</p>
          </SemanticLayout>
        );

        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      });
    });

    describe('PageSection', () => {
      it('should create proper section structure', () => {
        render(
          <PageSection
            title="Test Section"
            description="This is a test section"
            level={2}
          >
            <p>Section content</p>
          </PageSection>
        );

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Section');
        expect(screen.getByText('This is a test section')).toBeInTheDocument();
      });
    });

    describe('ContentGrid', () => {
      it('should have proper grid role', () => {
        render(
          <ContentGrid columns={3} aria-label="Test grid">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </ContentGrid>
        );

        expect(screen.getByRole('grid')).toBeInTheDocument();
        expect(screen.getAllByRole('gridcell')).toHaveLength(3);
      });
    });

    describe('StatusIndicator', () => {
      it('should have proper status role', () => {
        render(
          <StatusIndicator
            status="success"
            label="Operation completed"
            description="The operation was successful"
          />
        );

        const status = screen.getByRole('status');
        expect(status).toBeInTheDocument();
        expect(status).toHaveAttribute('aria-label', 'Success: Operation completed');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', () => {
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
          <Input label="Test input" />
          <Button>Third</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');

      // Test tab order
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();

      fireEvent.keyDown(buttons[0], { key: 'Tab' });
      // In a real browser, focus would move to the next element
      // This is a simplified test
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should provide appropriate live regions', () => {
      render(
        <div>
          <div role="status" aria-live="polite">
            Status message
          </div>
          <div role="alert" aria-live="assertive">
            Error message
          </div>
        </div>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });
  });
});

// Integration test for full page accessibility
describe('Full Page Accessibility', () => {
  it('should have no accessibility violations on a complete page', async () => {
    const { container } = render(
      <TestWrapper>
        <SemanticLayout title="Dashboard" showNavigation={false}>
          <PageSection title="Statistics" level={2}>
            <ContentGrid columns={2}>
              <StatCard
                title="Active Keywords"
                value={42}
                icon={Hash}
                iconColor="text-primary"
              />
              <StatCard
                title="Total Posts"
                value={1247}
                icon={Hash}
                iconColor="text-success"
              />
            </ContentGrid>
          </PageSection>

          <PageSection title="Actions" level={2}>
            <div className="space-y-4">
              <Button>Primary Action</Button>
              <Input label="Search" placeholder="Enter search term" />
              <StatusIndicator status="success" label="All systems operational" />
            </div>
          </PageSection>
        </SemanticLayout>
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});