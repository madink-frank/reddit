import { render } from '@testing-library/react'
import App from './App'

// Mock the auth service to avoid API calls in tests
jest.mock('./services/auth', () => ({
  authService: {
    isAuthenticated: () => false,
    getCurrentUser: () => Promise.resolve(null),
  },
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // The app should render the loading spinner initially
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})