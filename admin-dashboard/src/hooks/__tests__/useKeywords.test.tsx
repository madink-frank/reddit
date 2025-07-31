import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useKeywords } from '../useKeywords'

// Mock the keyword service
vi.mock('../services/keywordService', () => ({
  keywordService: {
    getKeywords: vi.fn(),
    createKeyword: vi.fn(),
    updateKeyword: vi.fn(),
    deleteKeyword: vi.fn(),
  },
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

describe('useKeywords Hook', () => {
  const mockKeywords = [
    { id: 1, keyword: 'react', description: 'React framework', isActive: true, postCount: 10 },
    { id: 2, keyword: 'vue', description: 'Vue framework', isActive: true, postCount: 5 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches keywords successfully', async () => {
    const { keywordService } = require('../services/keywordService')
    keywordService.getKeywords.mockResolvedValue(mockKeywords)

    const { result } = renderHook(() => useKeywords(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockKeywords)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('handles fetch error', async () => {
    const { keywordService } = require('../services/keywordService')
    const error = new Error('Failed to fetch keywords')
    keywordService.getKeywords.mockRejectedValue(error)

    const { result } = renderHook(() => useKeywords(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('creates keyword successfully', async () => {
    const { keywordService } = require('../services/keywordService')
    const newKeyword = { keyword: 'angular', description: 'Angular framework' }
    const createdKeyword = { id: 3, ...newKeyword, isActive: true, postCount: 0 }
    
    keywordService.getKeywords.mockResolvedValue(mockKeywords)
    keywordService.createKeyword.mockResolvedValue(createdKeyword)

    const { result } = renderHook(() => useKeywords(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockKeywords)
    })

    // Test create mutation
    await waitFor(() => {
      result.current.createMutation.mutate(newKeyword)
    })

    expect(keywordService.createKeyword).toHaveBeenCalledWith(newKeyword)
  })

  it('updates keyword successfully', async () => {
    const { keywordService } = require('../services/keywordService')
    const updatedKeyword = { id: 1, keyword: 'react-updated', description: 'Updated React' }
    
    keywordService.getKeywords.mockResolvedValue(mockKeywords)
    keywordService.updateKeyword.mockResolvedValue(updatedKeyword)

    const { result } = renderHook(() => useKeywords(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockKeywords)
    })

    // Test update mutation
    await waitFor(() => {
      result.current.updateMutation.mutate(updatedKeyword)
    })

    expect(keywordService.updateKeyword).toHaveBeenCalledWith(1, updatedKeyword)
  })

  it('deletes keyword successfully', async () => {
    const { keywordService } = require('../services/keywordService')
    
    keywordService.getKeywords.mockResolvedValue(mockKeywords)
    keywordService.deleteKeyword.mockResolvedValue(undefined)

    const { result } = renderHook(() => useKeywords(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockKeywords)
    })

    // Test delete mutation
    await waitFor(() => {
      result.current.deleteMutation.mutate(1)
    })

    expect(keywordService.deleteKeyword).toHaveBeenCalledWith(1)
  })
})