import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe, toHaveNoViolations } from 'jest-axe'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatCard } from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner, ProgressBar, EnhancedSkeleton } from '@/components/ui/LoadingSystem'
import { SystemStatusIndicator } from '@/components/ui/SystemStatusIndicator'
import { OptimizedIcon } from '@/components/ui/OptimizedIcon'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal'
import { AccessibilityPanel } from '@/components/ui/AccessibilityPanel'
import { SemanticLayout } from '@/components/layouts/SemanticLayout'
import SkipLinks from '@/components/ui/SkipLinks'
import { TrendingUp, MessageSquare, Activity, Users } from 'lucide-react'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Accessibility Regression Tests', () => {
  describe('Dashboard Components', () => {
    it('should have no accessibility violations in StatCard', async () => {
      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Total Posts"
            value={1234}
            change={{ value: 12.5, type: 'increase' }}
            icon={TrendingUp}
            iconColor="text-blue-600"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in loading StatCard', async () => {
      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Loading Data"
            value="--"
            icon={Activity}
            iconColor="text-gray-400"
            loading={true}
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Button Components', () => {
    it('should have no accessibility violations in primary button', async () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md">
            Primary Button
          </Button>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in disabled button', async () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md" disabled={true}>
            Disabled Button
          </Button>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in loading button', async () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md" loading={true}>
            Loading Button
          </Button>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in button with icon', async () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md" icon={MessageSquare}>
            Button with Icon
          </Button>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Components', () => {
    it('should have no accessibility violations in input field', async () => {
      const { container } = render(
        <TestWrapper>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            type="email"
            id="email-input"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in input with error', async () => {
      const { container } = render(
        <TestWrapper>
          <Input
            label="Password"
            placeholder="Enter password"
            type="password"
            error="Password is required"
            id="password-input"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in select field', async () => {
      const { container } = render(
        <TestWrapper>
          <Select
            label="Category"
            placeholder="Select a category"
            id="category-select"
          >
            <option value="tech">Technology</option>
            <option value="business">Business</option>
            <option value="science">Science</option>
          </Select>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in required input', async () => {
      const { container } = render(
        <TestWrapper>
          <Input
            label="Required Field"
            placeholder="This field is required"
            required={true}
            id="required-input"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Loading Components', () => {
    it('should have no accessibility violations in skeleton loader', async () => {
      const { container } = render(
        <TestWrapper>
          <EnhancedSkeleton className="h-20 w-full" />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in spinner', async () => {
      const { container } = render(
        <TestWrapper>
          <LoadingSpinner size="md" />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in progress bar', async () => {
      const { container } = render(
        <TestWrapper>
          <ProgressBar value={65} />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Status Components', () => {
    it('should have no accessibility violations in healthy status', async () => {
      const { container } = render(
        <TestWrapper>
          <SystemStatusIndicator
            status="healthy"
            name="API Status"
            lastChecked="2024-01-15T10:30:00Z"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in warning status', async () => {
      const { container } = render(
        <TestWrapper>
          <SystemStatusIndicator
            status="warning"
            name="Database Status"
            lastChecked="2024-01-15T10:30:00Z"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in error status', async () => {
      const { container } = render(
        <TestWrapper>
          <SystemStatusIndicator
            status="critical"
            name="Redis Status"
            lastChecked="2024-01-15T10:30:00Z"
          />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Navigation Components', () => {
    it('should have no accessibility violations in skip links', async () => {
      const { container } = render(
        <TestWrapper>
          <SkipLinks />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in semantic layout', async () => {
      const { container } = render(
        <TestWrapper>
          <SemanticLayout>
            <main>
              <h1>Main Content</h1>
              <p>This is the main content area.</p>
            </main>
          </SemanticLayout>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Theme Components', () => {
    it('should have no accessibility violations in theme switch', async () => {
      const { container } = render(
        <TestWrapper>
          <ThemeSwitch />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Modal Components', () => {
    it('should have no accessibility violations in keyboard shortcuts modal', async () => {
      const { container } = render(
        <TestWrapper>
          <KeyboardShortcutsModal isOpen={true} onClose={() => { }} />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Accessibility Panel', () => {
    it('should have no accessibility violations in accessibility panel', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessibilityPanel isOpen={false} onClose={function (): void {
            throw new Error('Function not implemented.')
          }} />
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Icon Components', () => {
    it('should have no accessibility violations in optimized icons', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <OptimizedIcon
              icon={TrendingUp}
              size="md"
              className="text-blue-600"
              aria-label="Trending up indicator"
            />
            <OptimizedIcon
              icon={Users}
              size="md"
              className="text-green-600"
              aria-label="Users count"
            />
          </div>
        </TestWrapper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast Tests', () => {
    it('should have sufficient color contrast in primary buttons', async () => {
      const { container } = render(
        <TestWrapper>
          <div className="space-y-4">
            <Button variant="primary" size="md">Primary Button</Button>
            <Button variant="secondary" size="md">Secondary Button</Button>
            <Button variant="outline" size="md">Outline Button</Button>
            <Button variant="ghost" size="md">Ghost Button</Button>
          </div>
        </TestWrapper>
      )
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })

    it('should have sufficient color contrast in status indicators', async () => {
      const { container } = render(
        <TestWrapper>
          <div className="space-y-4">
            <SystemStatusIndicator
              status="healthy"
              name="Healthy Status"
              lastChecked={new Date().toISOString()}
            />
            <SystemStatusIndicator
              status="warning"
              name="Warning Status"
              lastChecked={new Date().toISOString()}
            />
            <SystemStatusIndicator
              status="critical"
              name="Critical Status"
              lastChecked={new Date().toISOString()}
            />
          </div>
        </TestWrapper>
      )
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation Tests', () => {
    it('should have proper focus management in interactive elements', async () => {
      const { container } = render(
        <TestWrapper>
          <div className="space-y-4">
            <Button variant="primary" size="md">Button 1</Button>
            <Input label="Input Field" id="input-1" />
            <Select
              label="Select Field"
              id="select-1"
            >
              <option value="option1">Option 1</option>
            </Select>
            <Button variant="secondary" size="md">Button 2</Button>
          </div>
        </TestWrapper>
      )
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
          'focusable-content': { enabled: true },
          'tabindex': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('ARIA Labels and Roles Tests', () => {
    it('should have proper ARIA labels and roles', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <StatCard
              title="Total Posts"
              value={1234}
              change={{ value: 12.5, type: 'increase' }}
              icon={TrendingUp}
              iconColor="text-blue-600"
            />
            <ProgressBar value={65} />
            <SystemStatusIndicator
              status="healthy"
              name="System Status"
              lastChecked={new Date().toISOString()}
            />
          </div>
        </TestWrapper>
      )
      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'role-img-alt': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })
})