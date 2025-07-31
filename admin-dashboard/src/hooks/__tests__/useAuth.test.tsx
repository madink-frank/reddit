import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useCurrentUser, useLogin, useLogout, useRefreshToken } from '../useAuth'

// Mock the auth service
vi.mock('@/services/api', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    checkAdminPrivileges: vi.fn(),
    verifyToken: vi.fn(),
    getOAuthUrl: vi.fn(),
  },
}))

// Mock react-query utilities
vi.mock('@/lib/react-query', () => ({
  queryKeys: {
    auth: {
      user: ['auth', 'user'],
      adminCheck: ['auth', 'admin'],
      verify: ['auth', 'verify'],
    },
  },
  queryErrorHandler: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useAuth Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCurrentUser', () => {
    it('fetches current user successfully', async () => {
      const { authService } = require('@/services/api')
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      authService.getCurrentUser.mockResolvedValue(mockUser)

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUser)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles fetch error', async () => {
      const { authService } = require('@/services/api')
      const error = new Error('Unauthorized')
      authService.getCurrentUser.mockRejectedValue(error)

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useLogin', () => {
    it('logs in user successfully', async () => {
      const { authService } = require('@/services/api')
      const mockTokens = { accessToken: 'token123', refreshToken: 'refresh123' }
      authService.login.mockResolvedValue(mockTokens)

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      const loginData = { code: 'auth-code', state: 'auth-state' }
      
      await waitFor(() => {
        result.current.mutate(loginData)
      })

      expect(authService.login).toHaveBeenCalledWith(loginData)
    })

    it('handles login error', async () => {
      const { authService } = require('@/services/api')
      const error = new Error('Invalid credentials')
      authService.login.mockRejectedValue(error)

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      const loginData = { code: 'invalid-code', state: 'invalid-state' }
      
      await waitFor(() => {
        result.current.mutate(loginData)
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })
  })

  describe('useLogout', () => {
    it('logs out user successfully', async () => {
      const { authService } = require('@/services/api')
      authService.logout.mockResolvedValue(undefined)

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        result.current.mutate()
      })

      expect(authService.logout).toHaveBeenCalled()
    })
  })

  describe('useRefreshToken', () => {
    it('refreshes token successfully', async () => {
      const { authService } = require('@/services/api')
      const mockTokens = { accessToken: 'new-token', refreshToken: 'new-refresh' }
      authService.refreshToken.mockResolvedValue(mockTokens)

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(),
      })

      const refreshToken = 'old-refresh-token'
      
      await waitFor(() => {
        result.current.mutate(refreshToken)
      })

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken)
    })
  })
})