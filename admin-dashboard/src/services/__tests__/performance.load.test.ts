import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nlpService } from '../nlpService'
import { imageAnalysisService } from '../imageAnalysisService'
import { cacheService } from '../cacheService'

// Mock the cache service
vi.mock('../cacheService', () => ({
  cacheService: {
    generateContentHash: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    invalidateByType: vi.fn(),
    getStats: vi.fn(),
  },
}))

// Mock the API client for billing
vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('Performance and Load Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cacheService.generateContentHash).mockImplementation(
      (content) => {
        const contentString = typeof content === 'string'
          ? content
          : Buffer.isBuffer(content)
            ? content.toString()
            : JSON.stringify(content);
        return `hash_${contentString.slice(0, 10)}`;
      }
    )
    vi.mocked(cacheService.get).mockResolvedValue(null)
    vi.mocked(cacheService.set).mockResolvedValue(true)
  })

  describe('NLP Service Performance Tests', () => {
    it('should handle high-volume sentiment analysis efficiently', async () => {
      const testTexts = Array.from({ length: 100 }, (_, i) =>
        `Test sentiment analysis text number ${i} with various content lengths and complexity.`
      )

      const startTime = performance.now()

      // Process all texts concurrently
      const results = await Promise.all(
        testTexts.map(text => nlpService.analyzeSentiment(text))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / testTexts.length

      // Performance assertions
      expect(results).toHaveLength(100)
      expect(totalTime).toBeLessThan(30000) // Should complete within 30 seconds
      expect(averageTime).toBeLessThan(300) // Average less than 300ms per analysis

      // Verify all results are valid
      results.forEach(result => {
        expect(result).toMatchObject({
          score: expect.any(Number),
          confidence: expect.any(Number),
          label: expect.stringMatching(/positive|negative|neutral/),
          breakdown: expect.any(Object),
        })
      })

      console.log(`Processed ${testTexts.length} sentiment analyses in ${totalTime.toFixed(2)}ms`)
      console.log(`Average time per analysis: ${averageTime.toFixed(2)}ms`)
    })

    it('should handle concurrent morphological analysis requests', async () => {
      const testTexts = Array.from({ length: 50 }, (_, i) =>
        `Complex morphological analysis text ${i} with various linguistic structures and patterns.`
      )

      const startTime = performance.now()

      const results = await Promise.all(
        testTexts.map(text => nlpService.analyzeMorphology(text))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(results).toHaveLength(50)
      expect(totalTime).toBeLessThan(45000) // Should complete within 45 seconds

      results.forEach(result => {
        expect(result).toMatchObject({
          morphemes: expect.any(Array),
          structure: expect.any(Object),
        })
      })

      console.log(`Processed ${testTexts.length} morphological analyses in ${totalTime.toFixed(2)}ms`)
    })

    it('should handle large-scale keyword extraction efficiently', async () => {
      const longTexts = Array.from({ length: 25 }, (_, i) =>
        `This is a comprehensive text for keyword extraction test number ${i}. `.repeat(50)
      )

      const startTime = performance.now()

      const results = await Promise.all(
        longTexts.map(text => nlpService.extractKeywords(text, { keywordLimit: 20 }))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(results).toHaveLength(25)
      expect(totalTime).toBeLessThan(25000) // Should complete within 25 seconds

      results.forEach(result => {
        expect(result.keywords.length).toBeLessThanOrEqual(20)
        expect(result.wordCloud.length).toBeLessThanOrEqual(20)
      })

      console.log(`Processed ${longTexts.length} keyword extractions in ${totalTime.toFixed(2)}ms`)
    })

    it('should handle batch processing efficiently', async () => {
      const batchTexts = Array.from({ length: 200 }, (_, i) =>
        `Batch processing test text ${i} for performance evaluation.`
      )

      const startTime = performance.now()

      // Process in batches of 50
      const batchSize = 50
      const batches = []
      for (let i = 0; i < batchTexts.length; i += batchSize) {
        batches.push(batchTexts.slice(i, i + batchSize))
      }

      const batchResults = await Promise.all(
        batches.map(batch => nlpService.batchAnalyze(batch, ['sentiment']))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Flatten results
      const allResults = batchResults.flatMap(batch => batch.sentiment || [])

      expect(allResults).toHaveLength(200)
      expect(totalTime).toBeLessThan(60000) // Should complete within 60 seconds

      console.log(`Processed ${batchTexts.length} texts in batches in ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Image Analysis Service Performance Tests', () => {
    it('should handle concurrent object detection requests', async () => {
      const imageUrls = Array.from({ length: 30 }, (_, i) =>
        `https://example.com/performance-test-image-${i}.jpg`
      )

      const startTime = performance.now()

      const results = await Promise.all(
        imageUrls.map(url => imageAnalysisService.detectObjects(url))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / imageUrls.length

      expect(results).toHaveLength(30)
      expect(totalTime).toBeLessThan(90000) // Should complete within 90 seconds
      expect(averageTime).toBeLessThan(3000) // Average less than 3 seconds per analysis

      results.forEach(result => {
        expect(result).toMatchObject({
          objects: expect.any(Array),
          summary: expect.any(Object),
        })
      })

      console.log(`Processed ${imageUrls.length} object detections in ${totalTime.toFixed(2)}ms`)
      console.log(`Average time per detection: ${averageTime.toFixed(2)}ms`)
    })

    it('should handle batch image analysis efficiently', async () => {
      const imageUrls = Array.from({ length: 20 }, (_, i) =>
        `https://example.com/batch-test-image-${i}.jpg`
      )

      const startTime = performance.now()

      const results = await imageAnalysisService.batchAnalyze(
        imageUrls,
        ['objects', 'classification']
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(results.objects).toHaveLength(20)
      expect(results.classification).toHaveLength(20)
      expect(totalTime).toBeLessThan(120000) // Should complete within 2 minutes

      console.log(`Processed ${imageUrls.length} batch image analyses in ${totalTime.toFixed(2)}ms`)
    })

    it('should handle comprehensive image analysis under load', async () => {
      const imageUrls = Array.from({ length: 15 }, (_, i) =>
        `https://example.com/comprehensive-test-${i}.jpg`
      )

      const startTime = performance.now()

      const results = await Promise.all(
        imageUrls.map(url =>
          imageAnalysisService.analyzeImage(url, ['objects', 'ocr', 'classification'])
        )
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(results).toHaveLength(15)
      expect(totalTime).toBeLessThan(180000) // Should complete within 3 minutes

      results.forEach(result => {
        expect(result.objects).toBeDefined()
        expect(result.ocr).toBeDefined()
        expect(result.classification).toBeDefined()
      })

      console.log(`Processed ${imageUrls.length} comprehensive analyses in ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Cache Performance Tests', () => {
    it('should demonstrate cache performance benefits', async () => {
      const testText = 'Performance test text for cache evaluation'

      // First run without cache
      vi.mocked(cacheService.get).mockResolvedValue(null)

      const startTimeNoCache = performance.now()
      await nlpService.analyzeSentiment(testText)
      const endTimeNoCache = performance.now()
      const timeWithoutCache = endTimeNoCache - startTimeNoCache

      // Second run with cache hit
      const cachedResult = {
        score: 0.8,
        confidence: 0.9,
        label: 'positive' as const,
        breakdown: { positive: 0.8, negative: 0.1, neutral: 0.1 },
      }
      vi.mocked(cacheService.get).mockResolvedValue(cachedResult)

      const startTimeWithCache = performance.now()
      await nlpService.analyzeSentiment(testText)
      const endTimeWithCache = performance.now()
      const timeWithCache = endTimeWithCache - startTimeWithCache

      // Cache should be significantly faster
      expect(timeWithCache).toBeLessThan(timeWithoutCache * 0.1) // At least 10x faster

      console.log(`Time without cache: ${timeWithoutCache.toFixed(2)}ms`)
      console.log(`Time with cache: ${timeWithCache.toFixed(2)}ms`)
      console.log(`Cache speedup: ${(timeWithoutCache / timeWithCache).toFixed(2)}x`)
    })

    it('should handle cache under high load', async () => {
      const testTexts = Array.from({ length: 100 }, (_, i) =>
        `Cache load test ${i % 10}` // Only 10 unique texts to test cache hits
      )

      // Mock cache to return results for repeated texts
      vi.mocked(cacheService.get).mockImplementation(async (key) => {
        if (key.contentHash.includes('Cache load test 0')) {
          return {
            score: 0.5,
            confidence: 0.8,
            label: 'neutral' as const,
            breakdown: { positive: 0.3, negative: 0.2, neutral: 0.5 },
          }
        }
        return null // Cache miss for other texts
      })

      const startTime = performance.now()

      const results = await Promise.all(
        testTexts.map(text => nlpService.analyzeSentiment(text))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(results).toHaveLength(100)
      expect(totalTime).toBeLessThan(20000) // Should be fast due to cache hits

      console.log(`Processed ${testTexts.length} requests with cache in ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Memory Usage Tests', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage()

      // Process large amount of data
      const largeTexts = Array.from({ length: 500 }, (_, i) =>
        `Large dataset memory test ${i}. `.repeat(100)
      )

      // Process in chunks to avoid overwhelming the system
      const chunkSize = 50
      for (let i = 0; i < largeTexts.length; i += chunkSize) {
        const chunk = largeTexts.slice(i, i + chunkSize)
        await Promise.all(chunk.map(text => nlpService.analyzeSentiment(text)))

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)

      console.log(`Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    }, 30000) // 30 second timeout
  })

  describe('Concurrent User Simulation', () => {
    it('should handle multiple concurrent users efficiently', async () => {
      const { apiClient } = await import('../api')

      // Mock billing responses
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { current_points: 10000, user_id: 1 }
      })
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { balance_after: 9000, amount: 1000 }
      })

      // Simulate 10 concurrent users each performing multiple operations
      const userCount = 10
      const operationsPerUser = 5

      const userSimulations = Array.from({ length: userCount }, async (_, userId) => {
        const userOperations = []

        for (let i = 0; i < operationsPerUser; i++) {
          // Mix of different operations
          if (i % 3 === 0) {
            userOperations.push(
              nlpService.analyzeSentiment(`User ${userId} sentiment test ${i}`)
            )
          } else if (i % 3 === 1) {
            userOperations.push(
              imageAnalysisService.detectObjects(`https://example.com/user${userId}-image${i}.jpg`)
            )
          } else {
            userOperations.push(
              nlpService.extractKeywords(`User ${userId} keyword test ${i}`)
            )
          }
        }

        return Promise.all(userOperations)
      })

      const startTime = performance.now()

      const allResults = await Promise.all(userSimulations)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Verify all operations completed
      expect(allResults).toHaveLength(userCount)
      allResults.forEach(userResults => {
        expect(userResults).toHaveLength(operationsPerUser)
      })

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(60000) // Within 60 seconds

      console.log(`Simulated ${userCount} concurrent users with ${operationsPerUser} operations each`)
      console.log(`Total time: ${totalTime.toFixed(2)}ms`)
      console.log(`Average time per user: ${(totalTime / userCount).toFixed(2)}ms`)
    })

    it('should maintain performance under sustained load', async () => {
      const sustainedLoadDuration = 10000 // 10 seconds
      const requestInterval = 100 // New request every 100ms

      const requests: Promise<any>[] = []
      const startTime = performance.now()

      // Generate sustained load
      const loadInterval = setInterval(() => {
        if (performance.now() - startTime >= sustainedLoadDuration) {
          clearInterval(loadInterval)
          return
        }

        // Alternate between different types of requests
        const requestType = Math.floor(Math.random() * 3)
        if (requestType === 0) {
          requests.push(nlpService.analyzeSentiment('Sustained load test'))
        } else if (requestType === 1) {
          requests.push(imageAnalysisService.detectObjects('https://example.com/load-test.jpg'))
        } else {
          requests.push(nlpService.extractKeywords('Sustained load keyword test'))
        }
      }, requestInterval)

      // Wait for load test to complete
      await new Promise(resolve => setTimeout(resolve, sustainedLoadDuration + 1000))

      // Wait for all requests to complete
      const results = await Promise.all(requests)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(results.length).toBeGreaterThan(50) // Should have processed many requests
      expect(totalTime).toBeLessThan(sustainedLoadDuration + 5000) // Allow some buffer

      console.log(`Processed ${results.length} requests under sustained load`)
      console.log(`Load test duration: ${totalTime.toFixed(2)}ms`)
      console.log(`Average requests per second: ${(results.length / (totalTime / 1000)).toFixed(2)}`)
    }, 15000) // Increase timeout for this test
  })

  describe('Scalability Tests', () => {
    it('should scale linearly with input size', async () => {
      const testSizes = [10, 50, 100, 200]
      const results: { size: number; time: number; throughput: number }[] = []

      for (const size of testSizes) {
        const testTexts = Array.from({ length: size }, (_, i) =>
          `Scalability test text ${i} for size ${size}`
        )

        const startTime = performance.now()

        await Promise.all(
          testTexts.map(text => nlpService.analyzeSentiment(text))
        )

        const endTime = performance.now()
        const time = endTime - startTime
        const throughput = size / (time / 1000) // requests per second

        results.push({ size, time, throughput })

        console.log(`Size: ${size}, Time: ${time.toFixed(2)}ms, Throughput: ${throughput.toFixed(2)} req/s`)
      }

      // Verify reasonable scaling characteristics
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1]
        const curr = results[i]

        // Time should not increase exponentially
        const timeRatio = curr.time / prev.time
        const sizeRatio = curr.size / prev.size

        expect(timeRatio).toBeLessThan(sizeRatio * 2) // Should scale reasonably
      }
    })

    it('should handle high-volume data processing', async () => {
      const highVolumeTexts = Array.from({ length: 1000 }, (_, i) =>
        `High volume processing test ${i}`
      )

      const batchSize = 100
      const batches = []
      for (let i = 0; i < highVolumeTexts.length; i += batchSize) {
        batches.push(highVolumeTexts.slice(i, i + batchSize))
      }

      const startTime = performance.now()

      // Process batches sequentially to avoid overwhelming the system
      const allResults = []
      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map(text => nlpService.analyzeSentiment(text))
        )
        allResults.push(...batchResults)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(allResults).toHaveLength(1000)
      expect(totalTime).toBeLessThan(300000) // Should complete within 5 minutes

      const throughput = allResults.length / (totalTime / 1000)
      expect(throughput).toBeGreaterThan(3) // At least 3 requests per second

      console.log(`Processed ${allResults.length} high-volume requests in ${totalTime.toFixed(2)}ms`)
      console.log(`Throughput: ${throughput.toFixed(2)} requests/second`)
    }, 60000) // 60 second timeout
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without degrading performance', async () => {
      const mixedRequests = Array.from({ length: 100 }, (_, i) => {
        // Every 10th request will fail
        if (i % 10 === 0) {
          return nlpService.analyzeSentiment('') // This might cause issues
        }
        return nlpService.analyzeSentiment(`Valid request ${i}`)
      })

      const startTime = performance.now()

      const results = await Promise.allSettled(mixedRequests)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      expect(successful).toBeGreaterThan(80) // Most should succeed
      expect(totalTime).toBeLessThan(30000) // Should not be significantly slower

      console.log(`Processed ${results.length} mixed requests: ${successful} successful, ${failed} failed`)
      console.log(`Total time with errors: ${totalTime.toFixed(2)}ms`)
    })
  })
})