import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

describe('Visual Regression Tests - Simple', () => {
  it('should render test wrapper correctly', () => {
    const { container } = render(
      <TestWrapper>
        <div data-testid="test-content">Test Content</div>
      </TestWrapper>
    )
    
    expect(container.querySelector('[data-testid="test-content"]')).toBeInTheDocument()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render basic HTML elements consistently', () => {
    const { container } = render(
      <TestWrapper>
        <div className="p-4 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900">Test Title</h1>
          <p className="text-gray-600 mt-2">Test description text</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Test Button
          </button>
        </div>
      </TestWrapper>
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render form elements consistently', () => {
    const { container } = render(
      <TestWrapper>
        <form className="space-y-4 p-6 bg-white rounded-lg">
          <div>
            <label htmlFor="test-input" className="block text-sm font-medium text-gray-700">
              Test Input
            </label>
            <input
              id="test-input"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter text"
            />
          </div>
          <div>
            <label htmlFor="test-select" className="block text-sm font-medium text-gray-700">
              Test Select
            </label>
            <select
              id="test-select"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select option</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
          </div>
        </form>
      </TestWrapper>
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render grid layouts consistently', () => {
    const { container } = render(
      <TestWrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold">Card {i + 1}</h3>
              <p className="text-gray-600 mt-2">Card content</p>
            </div>
          ))}
        </div>
      </TestWrapper>
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })
})