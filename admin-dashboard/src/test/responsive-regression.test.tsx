import { render } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

// Viewport configurations for testing
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1440, height: 900 },
  ultraWide: { width: 1920, height: 1080 },
}

// Helper function to set viewport
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })

  // Update matchMedia mock for responsive queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => {
      const matches = (() => {
        if (query.includes('max-width: 640px')) return width <= 640
        if (query.includes('max-width: 768px')) return width <= 768
        if (query.includes('max-width: 1024px')) return width <= 1024
        if (query.includes('min-width: 641px')) return width >= 641
        if (query.includes('min-width: 769px')) return width >= 769
        if (query.includes('min-width: 1025px')) return width >= 1025
        return false
      })()

      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
      }
    },
  })

  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

describe('Responsive Design Regression Tests', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  describe('StatCard Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render StatCard correctly on ${viewportName} (${width}x${height})`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              <StatCard
                title="Total Posts"
                value={1234}
                change={{ value: 12.5, type: 'increase' }}
                icon={TrendingUp}
                iconColor="text-blue-600"
              />
              <StatCard
                title="Active Users"
                value={856}
                change={{ value: -5.2, type: 'decrease' }}
                icon={Users}
                iconColor="text-green-600"
              />
              <StatCard
                title="Comments"
                value={2341}
                change={{ value: 8.7, type: 'increase' }}
                icon={MessageSquare}
                iconColor="text-purple-600"
              />
              <StatCard
                title="System Load"
                value="78%"
                icon={Activity}
                iconColor="text-orange-600"
              />
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`statcard-grid-${viewportName}`)
      })
    })

    it('should handle loading state responsively across viewports', () => {
      Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
        setViewport(width, height)

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

        expect(container.firstChild).toMatchSnapshot(`statcard-loading-${viewportName}`)
      })
    })
  })

  describe('Button Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render buttons correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="space-y-4 p-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" size="md">
                  Primary Action
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Action
                </Button>
                <Button variant="outline" size="md">
                  Outline Action
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" size="md" icon={MessageSquare}>
                  With Icon
                </Button>
                <Button variant="primary" size="md" loading={true}>
                  Loading
                </Button>
                <Button variant="primary" size="md" disabled={true}>
                  Disabled
                </Button>
              </div>
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`buttons-${viewportName}`)
      })
    })
  })

  describe('Form Components Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render form components correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="max-w-md mx-auto p-4 space-y-4">
              <Input
                label="Email Address"
                placeholder="Enter your email"
                type="email"
                id="email-responsive"
              />
              <Input
                label="Password"
                placeholder="Enter password"
                type="password"
                error="Password is required"
                id="password-responsive"
              />
              <Select
                label="Category"
                placeholder="Select a category"
                id="category-responsive"
              >
                <option value="tech">Technology</option>
                <option value="business">Business</option>
                <option value="science">Science</option>
              </Select>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" size="md" className="flex-1">
                  Submit
                </Button>
                <Button variant="outline" size="md" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`form-components-${viewportName}`)
      })
    })
  })

  describe('Loading Components Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render loading components correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <LoadingSystem.EnhancedSkeleton className="h-20 w-full" />
                <LoadingSystem.EnhancedSkeleton className="h-20 w-full" />
                <LoadingSystem.EnhancedSkeleton className="h-20 w-full" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <LoadingSystem.LoadingSpinner size="sm" />
                <LoadingSystem.LoadingSpinner size="md" />
                <LoadingSystem.LoadingSpinner size="lg" />
              </div>
              <LoadingSystem.ProgressBar value={65} />
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`loading-components-${viewportName}`)
      })
    })
  })

  describe('Status Components Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render status indicators correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SystemStatusIndicator
                  status="healthy"
                  name="API Status"
                  lastChecked={new Date('2024-01-15T10:30:00Z').toISOString()}
                />
                <SystemStatusIndicator
                  status="warning"
                  name="Database Status"
                  lastChecked={new Date('2024-01-15T10:30:00Z').toISOString()}
                />
                <SystemStatusIndicator
                  status="critical"
                  name="Redis Status"
                  lastChecked={new Date('2024-01-15T10:30:00Z').toISOString()}
                />
              </div>
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`status-indicators-${viewportName}`)
      })
    })
  })

  describe('Icon Components Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render icons with appropriate sizes on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <OptimizedIcon
                  icon={TrendingUp}
                  size="sm"
                  className="text-blue-600 sm:hidden"
                />
                <OptimizedIcon
                  icon={TrendingUp}
                  size="md"
                  className="text-blue-600 hidden sm:block lg:hidden"
                />
                <OptimizedIcon
                  icon={TrendingUp}
                  size="lg"
                  className="text-blue-600 hidden lg:block"
                />
              </div>
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`responsive-icons-${viewportName}`)
      })
    })
  })

  describe('Theme Components Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render theme switch correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="p-4 flex justify-center">
              <ThemeSwitch />
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`theme-switch-${viewportName}`)
      })
    })
  })

  describe('Accessibility Panel Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render accessibility panel correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="p-4">
              <AccessibilityPanel isOpen={false} onClose={function (): void {
                throw new Error('Function not implemented.')
              } } />
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`accessibility-panel-${viewportName}`)
      })
    })
  })

  describe('Complex Layout Responsive Behavior', () => {
    Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
      it(`should render complex dashboard layout correctly on ${viewportName}`, () => {
        setViewport(width, height)

        const { container } = render(
          <TestWrapper>
            <div className="min-h-screen bg-gray-50 p-4">
              {/* Header */}
              <header className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <ThemeSwitch />
                    <Button variant="primary" size="md">
                      New Post
                    </Button>
                  </div>
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Posts"
                  value={1234}
                  change={{ value: 12.5, type: 'increase' }}
                  icon={TrendingUp}
                  iconColor="text-blue-600"
                />
                <StatCard
                  title="Active Users"
                  value={856}
                  change={{ value: -5.2, type: 'decrease' }}
                  icon={Users}
                  iconColor="text-green-600"
                />
                <StatCard
                  title="Comments"
                  value={2341}
                  change={{ value: 8.7, type: 'increase' }}
                  icon={MessageSquare}
                  iconColor="text-purple-600"
                />
                <StatCard
                  title="System Load"
                  value="78%"
                  icon={Activity}
                  iconColor="text-orange-600"
                />
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                      <LoadingSystem.EnhancedSkeleton className="h-4 w-full" />
                      <LoadingSystem.EnhancedSkeleton className="h-4 w-3/4" />
                      <LoadingSystem.EnhancedSkeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-md font-semibold mb-4">System Status</h3>
                    <div className="space-y-3">
                      <SystemStatusIndicator
                        status="healthy"
                        name="API"
                        lastChecked={new Date().toISOString()}
                      />
                      <SystemStatusIndicator
                        status="warning"
                        name="Database"
                        lastChecked={new Date().toISOString()}
                      />
                      <SystemStatusIndicator
                        status="critical"
                        name="Redis"
                        lastChecked={new Date().toISOString()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TestWrapper>
        )

        expect(container.firstChild).toMatchSnapshot(`complex-layout-${viewportName}`)
      })
    })
  })

  describe('Touch-Friendly Interface Tests', () => {
    it('should render touch-friendly elements on mobile', () => {
      setViewport(viewports.mobile.width, viewports.mobile.height)

      const { container } = render(
        <TestWrapper>
          <div className="p-4 space-y-4">
            {/* Touch-friendly buttons */}
            <div className="grid grid-cols-1 gap-3">
              <Button variant="primary" size="lg" className="min-h-[44px]">
                Touch-Friendly Button
              </Button>
              <Button variant="secondary" size="lg" className="min-h-[44px]">
                Another Button
              </Button>
            </div>

            {/* Touch-friendly form elements */}
            <div className="space-y-4">
              <Input
                label="Touch Input"
                placeholder="Tap to enter text"
                className="min-h-[44px]"
                id="touch-input"
              />
              <Select
                label="Touch Select"
                className="min-h-[44px]"
                id="touch-select"
              >
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
              </Select>
            </div>
          </div>
        </TestWrapper>
      )

      expect(container.firstChild).toMatchSnapshot('touch-friendly-mobile')
    })
  })
})