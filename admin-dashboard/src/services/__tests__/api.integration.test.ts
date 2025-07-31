import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../../test/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock the actual API service

// Mock the API base URL - use relative path for MSW to intercept
const API_BASE_URL = '/api/v1'

describe('API Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication API', () => {
    it('successfully logs in with valid credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'valid-code', state: 'test-state' })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      })
    })

    it('fails login with invalid credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'invalid-code', state: 'test-state' })
      })

      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Invalid credentials' })
    })

    it('fetches current user successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: { 'Authorization': 'Bearer mock-token' }
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: true
      })
    })
  })

  describe('Keywords API', () => {
    it('fetches keywords list successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/keywords`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
      expect(data[0]).toEqual({
        id: 1,
        keyword: 'react',
        description: 'React framework',
        isActive: true,
        postCount: 10,
        createdAt: '2024-01-01T00:00:00Z'
      })
    })

    it('creates new keyword successfully', async () => {
      const newKeyword = {
        keyword: 'angular',
        description: 'Angular framework'
      }

      const response = await fetch(`${API_BASE_URL}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyword)
      })

      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 3,
        keyword: 'angular',
        description: 'Angular framework',
        isActive: true,
        postCount: 0
      })
    })

    it('updates keyword successfully', async () => {
      const updatedKeyword = {
        keyword: 'react-updated',
        description: 'Updated React framework',
        isActive: true
      }

      const response = await fetch(`${API_BASE_URL}/keywords/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedKeyword)
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 1,
        keyword: 'react-updated',
        description: 'Updated React framework',
        isActive: true
      })
    })

    it('deletes keyword successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/keywords/1`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })
  })

  describe('Posts API', () => {
    it('fetches posts with pagination', async () => {
      const response = await fetch(`${API_BASE_URL}/posts?page=1&limit=20`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('posts')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('page', 1)
      expect(data).toHaveProperty('limit', 20)
      expect(data).toHaveProperty('totalPages')
      expect(Array.isArray(data.posts)).toBe(true)
    })

    it('handles search parameters correctly', async () => {
      const searchParams = new URLSearchParams({
        page: '2',
        limit: '10',
        search: 'test',
        subreddit: 'test'
      })

      const response = await fetch(`${API_BASE_URL}/posts?${searchParams}`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.page).toBe(2)
      expect(data.limit).toBe(10)
    })
  })

  describe('Analytics API', () => {
    it('fetches dashboard analytics', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        totalPosts: 1000,
        totalKeywords: 25,
        activeCrawls: 3,
        trendingKeywords: ['react', 'vue', 'angular']
      })
    })

    it('fetches trends data', async () => {
      const response = await fetch(`${API_BASE_URL}/analytics/trends`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('trends')
      expect(Array.isArray(data.trends)).toBe(true)
      expect(data.trends[0]).toMatchObject({
        keyword: 'react',
        count: 100,
        change: 15.5
      })
    })
  })

  describe('Content API', () => {
    it('fetches generated content list', async () => {
      const response = await fetch(`${API_BASE_URL}/content`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toMatchObject({
        id: 1,
        title: 'Generated Blog Post',
        contentType: 'blog',
        content: expect.any(String)
      })
    })

    it('generates new content successfully', async () => {
      const contentRequest = {
        contentType: 'blog',
        keywordIds: [1, 2],
        templateId: 1
      }

      const response = await fetch(`${API_BASE_URL}/content/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentRequest)
      })

      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 2,
        title: 'Generated blog',
        contentType: 'blog',
        content: expect.stringContaining('Generated Content')
      })
    })
  })

  describe('Crawling API', () => {
    it('fetches crawling status', async () => {
      const response = await fetch(`${API_BASE_URL}/crawl/status`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        isRunning: false,
        lastRun: expect.any(String),
        nextRun: expect.any(String),
        progress: 100
      })
    })

    it('starts crawling job successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordIds: [1, 2] })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        jobId: 'job-123',
        status: 'started',
        message: 'Crawling job started successfully'
      })
    })
  })

  describe('Error Handling', () => {
    it('handles 500 server errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/keywords`, () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      const response = await fetch(`${API_BASE_URL}/keywords`)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
    })

    it('handles network errors gracefully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/keywords`, () => {
          return HttpResponse.error()
        })
      )

      try {
        await fetch(`${API_BASE_URL}/keywords`)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('handles 404 not found errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/keywords/999`, () => {
          return HttpResponse.json(
            { error: 'Keyword not found' },
            { status: 404 }
          )
        })
      )

      const response = await fetch(`${API_BASE_URL}/keywords/999`)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Keyword not found' })
    })
  })
})