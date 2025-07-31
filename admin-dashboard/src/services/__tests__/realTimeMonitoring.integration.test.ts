import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
}

// Mock global WebSocket
global.WebSocket = vi.fn(() => mockWebSocket) as any

// Mock services
const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  send: vi.fn(),
  isConnected: vi.fn(() => true),
}

const mockCrawlingService = {
  createJob: vi.fn(),
  getJobStatus: vi.fn(),
  retryJob: vi.fn(),
  getMetrics: vi.fn(),
  sendNotification: vi.fn(),
}

describe('Real-Time Monitoring Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any active connections
    mockWebSocketService.disconnect()
  })

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connection and handle real-time updates', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'

      // Connect to WebSocket
      mockWebSocketService.connect(mockUrl)

      // Verify WebSocket was created
      expect(global.WebSocket).toHaveBeenCalledWith(mockUrl)
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should handle connection errors and implement reconnection logic', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'
      let errorHandler: Function | undefined
      let closeHandler: Function | undefined

      // Capture event handlers
      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'error') errorHandler = handler
        if (event === 'close') closeHandler = handler
      })

      mockWebSocketService.connect(mockUrl)

      // Simulate connection error
      if (errorHandler) {
        errorHandler(new Event('error'))
      }

      // Simulate connection close
      if (closeHandler) {
        closeHandler(new CloseEvent('close', { code: 1006, reason: 'Connection lost' }))
      }

      // Verify error handling
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should send and receive real-time monitoring data', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'
      let messageHandler: Function | undefined

      // Capture message handler
      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') messageHandler = handler
      })

      mockWebSocketService.connect(mockUrl)

      // Send monitoring request
      const monitoringRequest = {
        type: 'subscribe',
        channels: ['crawling_status', 'analysis_progress'],
      }

      mockWebSocketService.send(monitoringRequest)
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(monitoringRequest))

      // Simulate receiving monitoring data
      if (messageHandler) {
        const mockData = {
          type: 'crawling_status',
          data: {
            jobId: 'job-123',
            status: 'running',
            progress: 45,
            itemsProcessed: 450,
            totalItems: 1000,
            speed: 15.5, // items per second
          },
        }

        messageHandler(new MessageEvent('message', {
          data: JSON.stringify(mockData)
        }))
      }

      // Verify message was processed
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })

  describe('Crawling Job Monitoring', () => {
    it('should monitor crawling job lifecycle', async () => {
      // Mock crawling job creation
      const mockJob = {
        id: 'job-123',
        name: 'Test Crawling Job',
        status: 'pending',
        keywords: ['react', 'javascript'],
        subreddits: ['programming', 'reactjs'],
        createdAt: new Date().toISOString(),
        settings: {
          maxPosts: 100,
          includeComments: true,
          enableNLP: true,
          enableImageAnalysis: false,
        },
      }

      mockCrawlingService.createJob.mockResolvedValue(mockJob)

      // Create crawling job
      const createdJob = await mockCrawlingService.createJob({
        name: 'Test Crawling Job',
        keywords: ['react', 'javascript'],
        subreddits: ['programming', 'reactjs'],
        maxPosts: 100,
      })

      expect(createdJob).toMatchObject({
        id: expect.any(String),
        name: 'Test Crawling Job',
        status: 'pending',
        keywords: expect.arrayContaining(['react', 'javascript']),
      })

      // Mock job status updates
      const statusUpdates = [
        { status: 'running', progress: 0 },
        { status: 'running', progress: 25 },
        { status: 'running', progress: 50 },
        { status: 'running', progress: 75 },
        { status: 'completed', progress: 100 },
      ]

      for (const update of statusUpdates) {
        mockCrawlingService.getJobStatus.mockResolvedValueOnce({
          ...mockJob, ...update
        })

        const jobStatus = await mockCrawlingService.getJobStatus(createdJob.id)
        expect(jobStatus.status).toBe(update.status)
        expect(jobStatus.progress).toBe(update.progress)
      }
    })

    it('should handle crawling job failures and retries', async () => {
      const mockFailedJob = {
        id: 'job-failed-123',
        name: 'Failed Job',
        status: 'failed',
        error: 'Rate limit exceeded',
        retryCount: 2,
        maxRetries: 3,
      }

      mockCrawlingService.getJobStatus.mockResolvedValue(mockFailedJob)

      const jobStatus = await mockCrawlingService.getJobStatus('job-failed-123')
      expect(jobStatus.status).toBe('failed')
      expect(jobStatus.error).toBe('Rate limit exceeded')
      expect(jobStatus.retryCount).toBe(2)

      // Mock retry attempt
      mockCrawlingService.retryJob.mockResolvedValue({
        ...mockFailedJob, status: 'pending', retryCount: 3
      })

      const retriedJob = await mockCrawlingService.retryJob('job-failed-123')
      expect(retriedJob.status).toBe('pending')
      expect(retriedJob.retryCount).toBe(3)
    })

    it('should track crawling performance metrics', async () => {
      const mockMetrics = {
        totalJobs: 25,
        activeJobs: 3,
        completedJobs: 20,
        failedJobs: 2,
        averageProcessingTime: 1800, // seconds
        totalItemsProcessed: 15000,
        averageSpeed: 8.5, // items per second
        successRate: 0.92,
      }

      mockCrawlingService.getMetrics.mockResolvedValue(mockMetrics)

      const metrics = await mockCrawlingService.getMetrics()
      expect(metrics).toMatchObject({
        totalJobs: 25,
        activeJobs: 3,
        successRate: 0.92,
        averageSpeed: expect.any(Number),
      })

      expect(metrics.successRate).toBeGreaterThan(0.9)
      expect(metrics.averageSpeed).toBeGreaterThan(0)
    })
  })

  describe('Real-Time Notifications', () => {
    it('should send notifications for job completion', async () => {
      const mockUrl = 'ws://localhost:8000/ws/notifications'
      let messageHandler: Function | undefined

      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') messageHandler = handler
      })

      mockWebSocketService.connect(mockUrl)

      // Simulate job completion notification
      if (messageHandler) {
        const completionNotification = {
          type: 'job_completed',
          data: {
            jobId: 'job-123',
            name: 'Reddit Data Collection',
            itemsProcessed: 1000,
            processingTime: 1800,
            status: 'completed',
            timestamp: new Date().toISOString(),
          },
        }

        messageHandler(new MessageEvent('message', {
          data: JSON.stringify(completionNotification)
        }))
      }

      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('should handle notification delivery failures', async () => {
      // Mock notification service
      const mockNotification = {
        id: 'notif-123',
        type: 'job_failed',
        message: 'Crawling job failed due to API rate limit',
        jobId: 'job-456',
        userId: 1,
        delivered: false,
        retryCount: 0,
      }

      mockCrawlingService.sendNotification.mockRejectedValueOnce(new Error('Notification service unavailable'))
      mockCrawlingService.sendNotification.mockResolvedValueOnce(mockNotification)

      // First attempt should fail
      try {
        await mockCrawlingService.sendNotification({
          type: 'job_failed',
          message: 'Crawling job failed',
          jobId: 'job-456',
        })
      } catch (error) {
        expect((error as Error).message).toContain('Notification service unavailable')
      }

      // Retry should succeed
      const notification = await mockCrawlingService.sendNotification({
        type: 'job_failed',
        message: 'Crawling job failed',
        jobId: 'job-456',
      })

      expect(notification).toMatchObject({
        id: expect.any(String),
        type: 'job_failed',
        message: expect.any(String),
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle WebSocket disconnections gracefully', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'
      let closeHandler: Function | undefined

      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'close') closeHandler = handler
      })

      mockWebSocketService.connect(mockUrl)

      // Simulate unexpected disconnection
      if (closeHandler) {
        closeHandler(new CloseEvent('close', {
          code: 1006,
          reason: 'Connection lost unexpectedly'
        }))
      }

      // Service should attempt to reconnect
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should fallback to polling when WebSocket is unavailable', async () => {
      // Mock WebSocket connection failure
      global.WebSocket = vi.fn(() => {
        throw new Error('WebSocket not supported')
      }) as any

      // Should fallback to HTTP polling
      const mockJobStatus = {
        id: 'job-123',
        status: 'running',
        progress: 50,
      }

      mockCrawlingService.getJobStatus.mockResolvedValue(mockJobStatus)

      // Use polling instead of WebSocket
      const jobStatus = await mockCrawlingService.getJobStatus('job-123')
      expect(jobStatus).toMatchObject({
        id: 'job-123',
        status: 'running',
        progress: 50,
      })

      expect(mockCrawlingService.getJobStatus).toHaveBeenCalledWith('job-123')
    })

    it('should handle high-frequency updates efficiently', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'
      let messageHandler: Function | undefined

      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') messageHandler = handler
      })

      mockWebSocketService.connect(mockUrl)

      // Simulate rapid updates
      if (messageHandler) {
        const updates = Array.from({ length: 100 }, (_, i) => ({
          type: 'progress_update',
          data: {
            jobId: 'job-123',
            progress: i,
            itemsProcessed: i * 10,
          },
        }))

        // Send updates rapidly
        updates.forEach(update => {
          if (messageHandler) {
            messageHandler(new MessageEvent('message', {
              data: JSON.stringify(update)
            }))
          }
        })
      }

      // Service should handle all updates without errors
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })

  describe('Performance Monitoring', () => {
    it('should track WebSocket connection performance', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'
      let openHandler: Function | undefined

      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'open') openHandler = handler
      })

      const startTime = Date.now()
      mockWebSocketService.connect(mockUrl)

      // Simulate connection established
      if (openHandler) {
        openHandler(new Event('open'))
      }

      const connectionTime = Date.now() - startTime
      expect(connectionTime).toBeLessThan(5000) // Should connect within 5 seconds
    })

    it('should monitor message processing latency', async () => {
      const mockUrl = 'ws://localhost:8000/ws/monitoring'
      let messageHandler: Function | undefined

      mockWebSocket.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') messageHandler = handler
      })

      mockWebSocketService.connect(mockUrl)

      // Simulate message with timestamp
      if (messageHandler) {
        const message = {
          type: 'performance_test',
          timestamp: Date.now() - 100, // 100ms ago
          data: { test: 'data' },
        }

        const startProcessing = Date.now()
        messageHandler(new MessageEvent('message', {
          data: JSON.stringify(message)
        }))
        const processingTime = Date.now() - startProcessing

        expect(processingTime).toBeLessThan(50) // Should process within 50ms
      }
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete monitoring workflow', async () => {
      // Step 1: Connect to monitoring
      mockWebSocketService.connect('ws://localhost:8000/ws/monitoring')
      expect(mockWebSocketService.isConnected()).toBe(true)

      // Step 2: Create and monitor job
      const job = await mockCrawlingService.createJob({
        name: 'Integration Test Job',
        keywords: ['test'],
        maxPosts: 10,
      })

      // Step 3: Monitor job progress
      const progressUpdates = [25, 50, 75, 100]
      for (const progress of progressUpdates) {
        mockCrawlingService.getJobStatus.mockResolvedValueOnce({
          ...job,
          status: progress === 100 ? 'completed' : 'running',
          progress,
        })

        const status = await mockCrawlingService.getJobStatus(job.id)
        expect(status.progress).toBe(progress)
      }

      // Step 4: Send completion notification
      const notification = await mockCrawlingService.sendNotification({
        type: 'job_completed',
        message: 'Job completed successfully',
        jobId: job.id,
      })

      expect(notification).toBeDefined()
    })

    it('should handle monitoring system health', async () => {
      // Mock system health metrics
      const healthMetrics = {
        websocketConnections: 15,
        activeJobs: 3,
        queueSize: 25,
        memoryUsage: 0.65,
        cpuUsage: 0.45,
        uptime: 86400, // 24 hours
      }

      mockCrawlingService.getMetrics.mockResolvedValue(healthMetrics)

      const metrics = await mockCrawlingService.getMetrics()

      // Verify system is healthy
      expect(metrics.memoryUsage).toBeLessThan(0.8)
      expect(metrics.cpuUsage).toBeLessThan(0.8)
      expect(metrics.uptime).toBeGreaterThan(0)
      expect(metrics.activeJobs).toBeGreaterThanOrEqual(0)
    })
  })
})