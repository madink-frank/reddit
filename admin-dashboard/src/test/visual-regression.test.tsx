import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatCard } from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import LoadingSystem from '@/components/ui/LoadingSystem'
import { SystemStatusIndicator } from '@/components/ui/SystemStatusIndicator'
import { OptimizedIcon } from '@/components/ui/OptimizedIcon'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal'
import { AccessibilityPanel } from '@/components/ui/AccessibilityPanel'
import { TrendingUp, Users, MessageSquare, Activity } from 'lucide-react'

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

describe('Visual Regression Tests - Component Snapshots', () => {
  describe('StatCard Component', () => {
    it('should render basic stat card consistently', () => {
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
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render loading state consistently', () => {
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
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render decrease trend consistently', () => {
      const { container } = render(
        <TestWrapper>
          <StatCard
            title="Active Users"
            value={856}
            change={{ value: -5.2, type: 'decrease' }}
            icon={Users}
            iconColor="text-red-600"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Button Component', () => {
    it('should render primary button consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md">
            Primary Button
          </Button>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render secondary button consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="secondary" size="md">
            Secondary Button
          </Button>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render loading button consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md" loading={true}>
            Loading Button
          </Button>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render disabled button consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md" disabled={true}>
            Disabled Button
          </Button>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render button with icon consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md" icon={MessageSquare}>
            Button with Icon
          </Button>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Form Components', () => {
    it('should render input field consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            type="email"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render input with error consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Input
            label="Password"
            placeholder="Enter password"
            type="password"
            error="Password is required"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render select field consistently', () => {
      const { container } = render(
        <TestWrapper>
          <Select
            label="Category"
            placeholder="Select a category"
          >
            <option value="tech">Technology</option>
            <option value="business">Business</option>
            <option value="science">Science</option>
          </Select>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Loading Components', () => {
    it('should render skeleton loader consistently', () => {
      const { container } = render(
        <TestWrapper>
          <LoadingSystem.EnhancedSkeleton className="h-20 w-full" />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render spinner consistently', () => {
      const { container } = render(
        <TestWrapper>
          <LoadingSystem.LoadingSpinner size="md" />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render progress bar consistently', () => {
      const { container } = render(
        <TestWrapper>
          <LoadingSystem.ProgressBar value={65} />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Status Components', () => {
    it('should render system status indicator - healthy', () => {
      const { container } = render(
        <TestWrapper>
          <SystemStatusIndicator
            status="healthy"
            name="API Status"
            lastChecked="2024-01-15T10:30:00Z"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render system status indicator - warning', () => {
      const { container } = render(
        <TestWrapper>
          <SystemStatusIndicator
            status="warning"
            name="Database Status"
            lastChecked="2024-01-15T10:30:00Z"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render system status indicator - error', () => {
      const { container } = render(
        <TestWrapper>
          <SystemStatusIndicator
            status="critical"
            name="Redis Status"
            lastChecked="2024-01-15T10:30:00Z"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Icon Components', () => {
    it('should render optimized icon consistently', () => {
      const { container } = render(
        <TestWrapper>
          <OptimizedIcon
            icon={TrendingUp}
            size="md"
            className="text-blue-600"
          />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should render optimized icon with different sizes', () => {
      const { container } = render(
        <TestWrapper>
          <div className="flex gap-4 items-center">
            <OptimizedIcon icon={Users} size="sm" />
            <OptimizedIcon icon={Users} size="md" />
            <OptimizedIcon icon={Users} size="lg" />
            <OptimizedIcon icon={Users} size="xl" />
          </div>
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Theme Components', () => {
    it('should render theme switch consistently', () => {
      const { container } = render(
        <TestWrapper>
          <ThemeSwitch />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Modal Components', () => {
    it('should render keyboard shortcuts modal consistently', () => {
      const { container } = render(
        <TestWrapper>
          <KeyboardShortcutsModal isOpen={true} onClose={() => { }} />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Accessibility Components', () => {
    it('should render accessibility panel consistently', () => {
      const { container } = render(
        <TestWrapper>
          <AccessibilityPanel isOpen={false} onClose={function (): void {
            throw new Error('Function not implemented.')
          } } />
        </TestWrapper>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})