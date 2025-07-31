import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { KeywordsPage } from '../KeywordsPage'

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

describe('KeywordsPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays keywords list', async () => {
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Wait for keywords to load
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('vue')).toBeInTheDocument()
    })

    // Check for keyword details
    expect(screen.getByText('React framework')).toBeInTheDocument()
    expect(screen.getByText('Vue framework')).toBeInTheDocument()
  })

  it('allows creating new keywords', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
    })

    // Find and click add keyword button
    const addButton = screen.getByRole('button', { name: /add keyword/i })
    await user.click(addButton)

    // Fill out the form
    const keywordInput = screen.getByLabelText(/keyword/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    
    await user.type(keywordInput, 'angular')
    await user.type(descriptionInput, 'Angular framework')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)

    // Wait for the new keyword to appear
    await waitFor(() => {
      expect(screen.getByText('angular')).toBeInTheDocument()
      expect(screen.getByText('Angular framework')).toBeInTheDocument()
    })
  })

  it('allows editing existing keywords', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Wait for keywords to load
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
    })

    // Find and click edit button for react keyword
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])

    // Update the description
    const descriptionInput = screen.getByDisplayValue('React framework')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Updated React framework description')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)

    // Wait for the updated description to appear
    await waitFor(() => {
      expect(screen.getByText('Updated React framework description')).toBeInTheDocument()
    })
  })

  it('allows deleting keywords with confirmation', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Wait for keywords to load
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    // Confirm deletion in modal
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Wait for keyword to be removed
    await waitFor(() => {
      expect(screen.queryByText('react')).not.toBeInTheDocument()
    })
  })

  it('handles search and filtering', async () => {
    const user = userEvent.setup()
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Wait for keywords to load
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('vue')).toBeInTheDocument()
    })

    // Search for specific keyword
    const searchInput = screen.getByPlaceholderText(/search keywords/i)
    await user.type(searchInput, 'react')

    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.queryByText('vue')).not.toBeInTheDocument()
    })

    // Clear search
    await user.clear(searchInput)

    // Both keywords should be visible again
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('vue')).toBeInTheDocument()
    })
  })

  it('displays keyword statistics', async () => {
    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Wait for keywords to load
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument()
    })

    // Check for post count statistics
    expect(screen.getByText('10 posts')).toBeInTheDocument()
    expect(screen.getByText('5 posts')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    const { server } = await import('../../test/mocks/server')
    const { http, HttpResponse } = await import('msw')
    
    server.use(
      http.get('/api/v1/keywords', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch keywords' },
          { status: 500 }
        )
      })
    )

    const TestWrapper = createTestWrapper()
    
    render(
      <TestWrapper>
        <KeywordsPage />
      </TestWrapper>
    )

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })
})