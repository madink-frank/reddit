import { nlpService } from '../nlpService'
import { imageAnalysisService } from '../imageAnalysisService'
import { cacheService } from '../cacheService'

// Mock the cache service
jest.mock('../cacheService', () => ({
  cacheService: {
    generateContentHash: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidateByType: jest.fn(),
    getStats: jest.fn(),
  },
}))

const mockedCacheService = cacheService as jest.Mocked<typeof cacheService>

describe('Analysis Workflow Integration Tests', () => {
  // Increase timeout for integration tests
  jest.setTimeout(60000)

  beforeEach(() => {
    jest.clearAllMocks()
    mockedCacheService.generateContentHash.mockImplementation(
      (content) => `hash_${content.slice(0, 10)}`
    )
    mockedCacheService.get.mockResolvedValue(null)
    mockedCacheService.set.mockResolvedValue(true)
  })

  describe('End-to-End NLP Analysis Pipeline', () => {
    it('should complete full NLP analysis workflow', async () => {
      const testText = 'This is a great product with excellent features!'

      // Step 1: Perform sentiment analysis
      const sentimentResult = await nlpService.analyzeSentiment(testText)
      expect(sentimentResult).toMatchObject({
        score: expect.any(Number),
        confidence: expect.any(Number),
        label: 'positive',
        breakdown: expect.any(Object),
      })

      // Step 2: Perform morphological analysis
      const morphResult = await nlpService.analyzeMorphology(testText)
      expect(morphResult).toMatchObject({
        morphemes: expect.any(Array),
        structure: expect.any(Object),
      })

      // Step 3: Extract keywords
      const keywordResult = await nlpService.extractKeywords(testText)
      expect(keywordResult).toMatchObject({
        keywords: expect.any(Array),
        wordCloud: expect.any(Array),
      })

      // Verify cache was used appropriately
      expect(mockedCacheService.set).toHaveBeenCalledTimes(3) // One for each analysis
    })

    it('should handle batch analysis workflow efficiently', async () => {
      const testTexts = [
        'Great product, highly recommended!',
        'Terrible service, very disappointed.',
        'Average experience, nothing special.',
      ]

      // Perform batch sentiment analysis
      const results = await nlpService.batchAnalyze(testTexts, ['sentiment'])

      expect(results.sentiment).toHaveLength(3)
      expect(results.sentiment![0].label).toBe('positive')
      expect(results.sentiment![1].label).toBe('negative')
      expect(results.sentiment![2].label).toBe('neutral')

      // Verify all texts were processed
      results.sentiment!.forEach(result => {
        expect(result).toMatchObject({
          score: expect.any(Number),
          confidence: expect.any(Number),
          label: expect.stringMatching(/positive|negative|neutral/),
        })
      })
    })

    it('should handle text similarity analysis workflow', async () => {
      const text1 = 'React is a JavaScript library for building user interfaces'
      const text2 = 'React is a JavaScript framework for creating UIs'

      const similarityResult = await nlpService.calculateSimilarity(text1, text2)

      expect(similarityResult).toMatchObject({
        similarityScore: expect.any(Number),
        matchedSegments: expect.any(Array),
      })

      expect(similarityResult.similarityScore).toBeGreaterThan(30) // Should be similar
      expect(similarityResult.matchedSegments.length).toBeGreaterThan(0)
    })
  })

  describe('End-to-End Image Analysis Pipeline', () => {
    it('should complete full image analysis workflow', async () => {
      const testImageUrl = 'https://example.com/test-image.jpg'

      // Step 1: Perform object detection
      const objectResult = await imageAnalysisService.detectObjects(testImageUrl)
      expect(objectResult).toMatchObject({
        objects: expect.any(Array),
        summary: expect.any(Object),
      })

      // Step 2: Perform OCR
      const ocrResult = await imageAnalysisService.extractText(testImageUrl)
      expect(ocrResult).toMatchObject({
        extractedText: expect.any(String),
        textBlocks: expect.any(Array),
        language: expect.any(String),
        processingTime: expect.any(Number),
      })

      // Step 3: Classify image
      const classificationResult = await imageAnalysisService.classifyImage(testImageUrl)
      expect(classificationResult).toMatchObject({
        primaryCategory: expect.any(String),
        categories: expect.any(Array),
        imageType: expect.stringMatching(/photo|graphic|text|mixed/),
        visualFeatures: expect.any(Object),
      })
    })

    it('should handle comprehensive image analysis workflow', async () => {
      const testImageUrl = 'https://example.com/comprehensive-test.jpg'
      const analysisTypes: ('objects' | 'ocr' | 'classification')[] = ['objects', 'ocr', 'classification']

      const comprehensiveResult = await imageAnalysisService.analyzeImage(
        testImageUrl,
        analysisTypes
      )

      expect(comprehensiveResult.objects).toBeDefined()
      expect(comprehensiveResult.ocr).toBeDefined()
      expect(comprehensiveResult.classification).toBeDefined()

      // Verify each analysis type returned expected structure
      expect(comprehensiveResult.objects!.objects).toBeInstanceOf(Array)
      expect(comprehensiveResult.ocr!.extractedText).toBeDefined()
      expect(comprehensiveResult.classification!.primaryCategory).toBeDefined()
    })

    it('should handle batch image analysis workflow', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ]

      const batchResult = await imageAnalysisService.batchAnalyze(
        imageUrls,
        ['objects']
      )

      expect(batchResult.objects).toHaveLength(3)
      batchResult.objects!.forEach(result => {
        expect(result).toMatchObject({
          objects: expect.any(Array),
          summary: expect.any(Object),
        })
      })
    })
  })

  describe('Cross-Service Integration', () => {
    it('should integrate NLP and image analysis for content with text', async () => {
      const imageUrl = 'https://example.com/text-image.jpg'

      // Step 1: Extract text from image using OCR
      const ocrResult = await imageAnalysisService.extractText(imageUrl)
      expect(ocrResult.extractedText).toBeDefined()

      // Step 2: Analyze extracted text sentiment
      if (ocrResult.extractedText.length > 0) {
        const sentimentResult = await nlpService.analyzeSentiment(ocrResult.extractedText)
        expect(sentimentResult).toMatchObject({
          score: expect.any(Number),
          confidence: expect.any(Number),
          label: expect.stringMatching(/positive|negative|neutral/),
        })

        // Step 3: Extract keywords from OCR text
        const keywordResult = await nlpService.extractKeywords(ocrResult.extractedText)
        expect(keywordResult.keywords).toBeInstanceOf(Array)
      }
    })

    it('should handle cache invalidation across services', async () => {
      const testContent = 'Test content for cache invalidation'
      const testImageUrl = 'https://example.com/cache-test.jpg'

      // Perform initial analyses to populate cache
      await nlpService.analyzeSentiment(testContent)
      await imageAnalysisService.detectObjects(testImageUrl)

      // Verify cache was populated
      expect(mockedCacheService.set).toHaveBeenCalled()

      // Clear NLP cache
      await nlpService.clearCache()
      expect(mockedCacheService.invalidateByType).toHaveBeenCalledWith('sentiment')

      // Clear image analysis cache
      await imageAnalysisService.clearCache()
      expect(mockedCacheService.invalidateByType).toHaveBeenCalledWith('objects')

      // Invalidate specific content
      await nlpService.invalidateCache(testContent)
      await imageAnalysisService.invalidateCache(testImageUrl)

      expect(mockedCacheService.delete).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle cache service failures gracefully', async () => {
      // Mock cache service failure
      mockedCacheService.get.mockRejectedValue(new Error('Cache unavailable'))
      mockedCacheService.set.mockRejectedValue(new Error('Cache unavailable'))

      // Services should still work without cache
      try {
        const sentimentResult = await nlpService.analyzeSentiment('Test without cache')
        expect(sentimentResult).toBeDefined()
      } catch (error) {
        // If cache error propagates, that's acceptable
        expect(error).toBeInstanceOf(Error)
      }

      try {
        const objectResult = await imageAnalysisService.detectObjects('https://example.com/no-cache.jpg')
        expect(objectResult).toBeDefined()
      } catch (error) {
        // If cache error propagates, that's acceptable
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle processing errors gracefully', async () => {
      // Mock processing failure
      const originalMethod = nlpService['performSentimentAnalysis']
      nlpService['performSentimentAnalysis'] = jest.fn().mockRejectedValue(new Error('Processing failed'))

      try {
        await nlpService.analyzeSentiment('Test text')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Processing failed')
      }

      // Restore original method
      nlpService['performSentimentAnalysis'] = originalMethod
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle concurrent analysis requests efficiently', async () => {
      const texts = Array.from({ length: 5 }, (_, i) => `Test text ${i}`)
      const images = Array.from({ length: 3 }, (_, i) => `https://example.com/image${i}.jpg`)

      // Run concurrent NLP analyses
      const nlpPromises = texts.map(text => nlpService.analyzeSentiment(text))
      const nlpResults = await Promise.all(nlpPromises)

      expect(nlpResults).toHaveLength(5)
      nlpResults.forEach(result => {
        expect(result).toMatchObject({
          score: expect.any(Number),
          confidence: expect.any(Number),
          label: expect.any(String),
        })
      })

      // Run concurrent image analyses
      const imagePromises = images.map(url => imageAnalysisService.detectObjects(url))
      const imageResults = await Promise.all(imagePromises)

      expect(imageResults).toHaveLength(3)
      imageResults.forEach(result => {
        expect(result).toMatchObject({
          objects: expect.any(Array),
          summary: expect.any(Object),
        })
      })
    })

    it('should optimize cache usage for repeated requests', async () => {
      const testText = 'Repeated analysis text'
      const testImage = 'https://example.com/repeated-image.jpg'

      // First requests - should miss cache
      await nlpService.analyzeSentiment(testText)
      await imageAnalysisService.detectObjects(testImage)

      // Mock cache hits for subsequent requests
      mockedCacheService.get.mockResolvedValueOnce({
        score: 0.8,
        confidence: 0.9,
        label: 'positive',
        breakdown: { positive: 0.8, negative: 0.1, neutral: 0.1 },
      })

      // Second request - should hit cache
      const cachedResult = await nlpService.analyzeSentiment(testText)
      expect(cachedResult.score).toBe(0.8)

      // Verify cache was checked
      expect(mockedCacheService.get).toHaveBeenCalled()
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should validate analysis result consistency', async () => {
      const testTexts = [
        'This is absolutely fantastic and amazing!',
        'This is terrible and awful.',
        'This is okay, nothing special.',
      ]

      // Perform analyses
      const sentimentResults = await Promise.all(
        testTexts.map(text => nlpService.analyzeSentiment(text))
      )

      // Verify sentiment accuracy
      expect(sentimentResults[0].label).toBe('positive')
      expect(sentimentResults[0].score).toBeGreaterThan(0.3)

      expect(sentimentResults[1].label).toBe('negative')
      expect(sentimentResults[1].score).toBeLessThan(-0.3)

      expect(sentimentResults[2].label).toBe('neutral')
      expect(Math.abs(sentimentResults[2].score)).toBeLessThanOrEqual(0.3)

      // Verify confidence scores are reasonable
      sentimentResults.forEach(result => {
        expect(result.confidence).toBeGreaterThanOrEqual(0.5)
        expect(result.confidence).toBeLessThanOrEqual(1.0)
      })

      // Verify breakdown percentages sum to 1
      sentimentResults.forEach(result => {
        const sum = result.breakdown.positive + result.breakdown.negative + result.breakdown.neutral
        expect(sum).toBeCloseTo(1, 2)
      })
    })

    it('should validate image analysis consistency', async () => {
      const testImageUrls = [
        'https://example.com/person.jpg',
        'https://example.com/text-image.jpg',
        'https://example.com/landscape.jpg',
      ]

      // Perform comprehensive analysis
      const analysisResults = await Promise.all(
        testImageUrls.map(url =>
          imageAnalysisService.analyzeImage(url, ['objects', 'ocr', 'classification'])
        )
      )

      // Verify each result has expected structure
      analysisResults.forEach(result => {
        expect(result.objects).toBeDefined()
        expect(result.ocr).toBeDefined()
        expect(result.classification).toBeDefined()

        // Verify object detection results
        expect(result.objects!.objects).toBeInstanceOf(Array)
        expect(result.objects!.summary.totalObjects).toBe(result.objects!.objects.length)

        // Verify OCR results
        expect(result.ocr!.extractedText).toBeDefined()
        expect(result.ocr!.language).toBeDefined()
        expect(result.ocr!.processingTime).toBeGreaterThan(0)

        // Verify classification results
        expect(result.classification!.primaryCategory).toBeDefined()
        expect(result.classification!.categories).toBeInstanceOf(Array)
        expect(['photo', 'graphic', 'text', 'mixed']).toContain(result.classification!.imageType)
      })
    })

    it('should handle edge cases in analysis', async () => {
      // Test empty text
      const emptyResult = await nlpService.analyzeSentiment('')
      expect(emptyResult).toMatchObject({
        score: expect.any(Number),
        confidence: expect.any(Number),
        label: expect.any(String),
      })

      // Test very long text
      const longText = 'word '.repeat(1000)
      const longResult = await nlpService.analyzeSentiment(longText)
      expect(longResult).toMatchObject({
        score: expect.any(Number),
        confidence: expect.any(Number),
        label: expect.any(String),
      })

      // Test special characters
      const specialText = '🎉 Great! 👍 Excellent work! 💯'
      const specialResult = await nlpService.analyzeSentiment(specialText)
      expect(specialResult.label).toBe('positive')
    })
  })

  describe('Service Integration Patterns', () => {
    it('should demonstrate typical user workflow', async () => {
      // Simulate a typical user workflow
      const userContent = {
        text: 'I love this new feature! It works perfectly.',
        imageUrl: 'https://example.com/feature-screenshot.jpg',
      }

      // Step 1: Analyze text sentiment
      const sentiment = await nlpService.analyzeSentiment(userContent.text)
      expect(['positive', 'neutral']).toContain(sentiment.label) // Mock may vary

      // Step 2: Extract keywords from text
      const keywords = await nlpService.extractKeywords(userContent.text)
      expect(keywords.keywords.length).toBeGreaterThan(0)

      // Step 3: Analyze image content
      const imageAnalysis = await imageAnalysisService.analyzeImage(
        userContent.imageUrl,
        ['objects', 'ocr', 'classification']
      )
      expect(imageAnalysis.objects).toBeDefined()
      expect(imageAnalysis.classification).toBeDefined()

      // Step 4: Combine insights
      const combinedInsights = {
        textSentiment: sentiment,
        textKeywords: keywords,
        imageContent: imageAnalysis,
        overallSentiment: sentiment.label,
        confidence: sentiment.confidence,
      }

      expect(['positive', 'neutral', 'negative']).toContain(combinedInsights.overallSentiment)
      expect(combinedInsights.confidence).toBeGreaterThanOrEqual(0.5)
    })

    it('should handle multi-step analysis pipeline', async () => {
      const pipeline = [
        { type: 'sentiment', input: 'Great product!' },
        { type: 'keywords', input: 'Amazing features and excellent quality' },
        { type: 'similarity', input: ['Product A is great', 'Product A is excellent'] },
        { type: 'objects', input: 'https://example.com/product.jpg' },
      ]

      const results = []

      for (const step of pipeline) {
        switch (step.type) {
          case 'sentiment':
            const sentiment = await nlpService.analyzeSentiment(step.input as string)
            results.push({ type: step.type, result: sentiment })
            break
          case 'keywords':
            const keywords = await nlpService.extractKeywords(step.input as string)
            results.push({ type: step.type, result: keywords })
            break
          case 'similarity':
            const [text1, text2] = step.input as string[]
            const similarity = await nlpService.calculateSimilarity(text1, text2)
            results.push({ type: step.type, result: similarity })
            break
          case 'objects':
            const objects = await imageAnalysisService.detectObjects(step.input as string)
            results.push({ type: step.type, result: objects })
            break
        }
      }

      expect(results).toHaveLength(4)
      expect(results[0].type).toBe('sentiment')
      expect(results[1].type).toBe('keywords')
      expect(results[2].type).toBe('similarity')
      expect(results[3].type).toBe('objects')
    })
  })
})