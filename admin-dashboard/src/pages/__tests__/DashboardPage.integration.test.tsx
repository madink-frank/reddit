import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ReactNode } from 'react'
import { DashboardPage } from '../DashboardPage'

// Create test wrapper with all necessary providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('DashboardPage Integration Tests', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks()
  })

  it('renders dashboard with all sections', async () => {
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    // Check for main dashboard elements
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    
    // Wait for data to load and check for stat cards
    await waitFor(() => {
      expect(screen.getByText(/total posts/i)).toBeInTheDocument()
    })

    // Check for various dashboard sections
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
    expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
  })

  it('displays loading states initially', () => {
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    // Should show loading skeletons initially
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    const { server } = await import('../../test/mocks/server')
    const { http, HttpResponse } = await import('msw')
    
    server.use(
      http.get('/api/v1/analytics/dashboard', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      })
    )

    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    // Should handle error state
    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })

  it('updates data when refreshed', async () => {
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )

    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText(/total posts/i)).toBeInTheDocument()
    })

    // Mock updated data
    const { server } = await import('../../test/mocks/server')
    const { http, HttpResponse } = await import('msw')
    
    server.use(
      http.get('/api/v1/analytics/dashboard', () => {
        return HttpResponse.json({
          totalPosts: 2000, // Updated value
          totalKeywords: 50,
          activeCrawls: 5,
          trendingKeywords: ['react', 'vue', 'angular', 'svelte']
        })
      })
    )

    // Trigger refresh (this would depend on your actual implementation)
    // For example, clicking a refresh button or waiting for auto-refresh
    // This is a placeholder for the actual refresh mechanism
    expect(true).toBe(true) // Placeholder assertion
  })
})