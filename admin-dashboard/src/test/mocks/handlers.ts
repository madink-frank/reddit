import { http, HttpResponse } from 'msw'

// Mock API responses
export const handlers = [
  // Auth endpoints
  http.get('/api/v1/auth/user', () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      isAdmin: true
    })
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as any
    if (body.code === 'valid-code') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      })
    }
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Keywords endpoints
  http.get('/api/v1/keywords', () => {
    return HttpResponse.json([
      {
        id: 1,
        keyword: 'react',
        description: 'React framework',
        isActive: true,
        postCount: 10,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        keyword: 'vue',
        description: 'Vue framework',
        isActive: true,
        postCount: 5,
        createdAt: '2024-01-02T00:00:00Z'
      }
    ])
  }),

  http.post('/api/v1/keywords', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: 3,
      keyword: body.keyword,
      description: body.description,
      isActive: true,
      postCount: 0,
      createdAt: new Date().toISOString()
    }, { status: 201 })
  }),

  http.put('/api/v1/keywords/:id', async ({ params, request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: Number(params.id),
      keyword: body.keyword,
      description: body.description,
      isActive: body.isActive,
      postCount: 0,
      createdAt: '2024-01-01T00:00:00Z'
    })
  }),

  http.delete('/api/v1/keywords/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Posts endpoints
  http.get('/api/v1/posts', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20
    
    return HttpResponse.json({
      posts: [
        {
          id: 1,
          title: 'Test Post 1',
          content: 'This is a test post',
          author: 'testuser',
          subreddit: 'test',
          score: 100,
          numComments: 10,
          createdUtc: '2024-01-01T00:00:00Z',
          url: 'https://reddit.com/r/test/1'
        },
        {
          id: 2,
          title: 'Test Post 2',
          content: 'Another test post',
          author: 'testuser2',
          subreddit: 'test',
          score: 50,
          numComments: 5,
          createdUtc: '2024-01-02T00:00:00Z',
          url: 'https://reddit.com/r/test/2'
        }
      ],
      total: 100,
      page,
      limit,
      totalPages: Math.ceil(100 / limit)
    })
  }),

  // Analytics endpoints
  http.get('/api/v1/analytics/dashboard', () => {
    return HttpResponse.json({
      totalPosts: 1000,
      totalKeywords: 25,
      activeCrawls: 3,
      trendingKeywords: ['react', 'vue', 'angular']
    })
  }),

  http.get('/api/v1/analytics/trends', () => {
    return HttpResponse.json({
      trends: [
        { keyword: 'react', count: 100, change: 15.5 },
        { keyword: 'vue', count: 75, change: -5.2 },
        { keyword: 'angular', count: 50, change: 8.1 }
      ]
    })
  }),

  // Content endpoints
  http.get('/api/v1/content', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Generated Blog Post',
        contentType: 'blog',
        content: '# Test Blog Post\n\nThis is generated content.',
        createdAt: '2024-01-01T00:00:00Z',
        metadata: { keywords: ['react'], template: 'blog' }
      }
    ])
  }),

  http.post('/api/v1/content/generate', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: 2,
      title: `Generated ${body.contentType}`,
      contentType: body.contentType,
      content: `# Generated Content\n\nContent for keywords: ${body.keywordIds.join(', ')}`,
      createdAt: new Date().toISOString(),
      metadata: { keywords: body.keywordIds, template: body.templateId }
    }, { status: 201 })
  }),

  // Crawling endpoints
  http.get('/api/v1/crawl/status', () => {
    return HttpResponse.json({
      isRunning: false,
      lastRun: '2024-01-01T00:00:00Z',
      nextRun: '2024-01-01T01:00:00Z',
      progress: 100
    })
  }),

  http.post('/api/v1/crawl', () => {
    return HttpResponse.json({
      jobId: 'job-123',
      status: 'started',
      message: 'Crawling job started successfully'
    })
  })
]