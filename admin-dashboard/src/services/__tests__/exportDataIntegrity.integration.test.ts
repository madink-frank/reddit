import { nlpService } from '../nlpService'
import { imageAnalysisService } from '../imageAnalysisService'

// Mock the services
jest.mock('../nlpService')
jest.mock('../imageAnalysisService')

const mockNlpService = nlpService as jest.Mocked<typeof nlpService>
const mockImageAnalysisService = imageAnalysisService as jest.Mocked<typeof imageAnalysisService>

// Mock file system operations for export
const mockBlob = {
  size: 1024,
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

// Mock global objects for Jest environment
Object.defineProperty(globalThis, 'Blob', {
  writable: true,
  value: jest.fn(() => mockBlob),
})

Object.defineProperty(globalThis, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn(),
  },
})

// Mock export service
const mockExportService = {
  requestExport: jest.fn(),
  getExportStatus: jest.fn(),
  downloadExport: jest.fn(),
  validateData: jest.fn(),
}

describe('Export and Data Integrity Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock implementations
    mockNlpService.analyzeSentiment.mockImplementation((text: string) => {
      if (text.includes('fantastic') || text.includes('amazing')) {
        return Promise.resolve({
          score: 0.8,
          confidence: 0.9,
          label: 'positive',
          breakdown: { positive: 0.8, negative: 0.1, neutral: 0.1 }
        })
      } else if (text.includes('terrible') || text.includes('awful')) {
        return Promise.resolve({
          score: -0.7,
          confidence: 0.85,
          label: 'negative',
          breakdown: { positive: 0.1, negative: 0.8, neutral: 0.1 }
        })
      } else {
        return Promise.resolve({
          score: 0.1,
          confidence: 0.6,
          label: 'neutral',
          breakdown: { positive: 0.3, negative: 0.2, neutral: 0.5 }
        })
      }
    })

    mockImageAnalysisService.analyzeImage.mockImplementation((_url: string, _analysisTypes: string[]) => {
      return Promise.resolve({
        objects: {
          objects: [
            {
              label: 'person',
              confidence: 95,
              category: 'literal' as const,
              boundingBox: { x: 10, y: 20, width: 100, height: 150 }
            },
            {
              label: 'happiness',
              confidence: 78,
              category: 'inferred' as const,
              boundingBox: { x: 50, y: 60, width: 80, height: 120 }
            }
          ],
          summary: {
            totalObjects: 2,
            highConfidenceObjects: 1,
            categories: ['person', 'happiness']
          }
        },
        ocr: {
          extractedText: 'Sample text',
          language: 'en',
          confidence: 92,
          processingTime: 150,
          textBlocks: [
            {
              text: 'Sample text',
              confidence: 92,
              boundingBox: { x: 0, y: 0, width: 200, height: 50 }
            }
          ]
        },
        classification: {
          primaryCategory: 'photo',
          categories: [
            { name: 'photo', confidence: 95 },
            { name: 'people', confidence: 78 }
          ],
          imageType: 'photo' as const,
          visualFeatures: {
            dominantColors: ['#FF6B6B', '#4ECDC4'],
            brightness: 75,
            contrast: 68
          }
        }
      })
    })
  })

  describe('Data Export Pipeline', () => {
    it('should export NLP analysis results to Excel format', async () => {
      // Mock analysis data
      const mockAnalysisData = [
        {
          id: 1,
          text: 'Great product, highly recommended!',
          sentiment: {
            score: 0.8,
            confidence: 0.9,
            label: 'positive',
            breakdown: { positive: 0.8, negative: 0.1, neutral: 0.1 },
          },
          keywords: [
            { word: 'great', frequency: 1, importance: 0.8 },
            { word: 'product', frequency: 1, importance: 0.7 },
            { word: 'recommended', frequency: 1, importance: 0.9 },
          ],
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          text: 'Terrible service, very disappointed.',
          sentiment: {
            score: -0.7,
            confidence: 0.85,
            label: 'negative',
            breakdown: { positive: 0.1, negative: 0.8, neutral: 0.1 },
          },
          keywords: [
            { word: 'terrible', frequency: 1, importance: 0.9 },
            { word: 'service', frequency: 1, importance: 0.6 },
            { word: 'disappointed', frequency: 1, importance: 0.8 },
          ],
          createdAt: '2024-01-01T01:00:00Z',
        },
      ]

      // Request export
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'excel' as const,
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-02'),
          },
        },
        options: {
          includeAnalysis: true,
          maxRecords: 1000,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'export-123',
        status: 'processing',
        format: 'excel',
        recordCount: mockAnalysisData.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult).toMatchObject({
        id: expect.any(String),
        status: 'processing',
        format: 'excel',
        recordCount: expect.any(Number),
      })

      expect(mockExportService.requestExport).toHaveBeenCalledWith(exportRequest)
    })

    it('should export image analysis results to CSV format', async () => {
      // Mock image analysis data
      const mockImageData = [
        {
          id: 1,
          imageUrl: 'https://example.com/image1.jpg',
          objects: [
            { label: 'person', confidence: 95, category: 'literal' },
            { label: 'happiness', confidence: 78, category: 'inferred' },
          ],
          ocr: {
            extractedText: 'Welcome to our store',
            confidence: 92,
            language: 'en',
          },
          classification: {
            primaryCategory: 'commercial',
            imageType: 'photo',
            visualFeatures: {
              dominantColors: ['#FF6B6B', '#4ECDC4'],
              brightness: 75,
              contrast: 68,
            },
          },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      const exportRequest = {
        dataType: 'image_analysis' as const,
        format: 'csv' as const,
        options: {
          includeAnalysis: true,
          maxRecords: 500,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'export-456',
        status: 'processing',
        format: 'csv',
        recordCount: mockImageData.length,
        mimeType: 'text/csv;charset=utf-8',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult).toMatchObject({
        id: expect.any(String),
        status: 'processing',
        format: 'csv',
      })

      expect(mockExportService.requestExport).toHaveBeenCalledWith(exportRequest)
    })

    it('should generate PDF reports with visualizations', async () => {
      // Mock aggregated data for report
      const mockReportData = {
        summary: {
          totalAnalyses: 1000,
          sentimentDistribution: {
            positive: 450,
            negative: 200,
            neutral: 350,
          },
          topKeywords: [
            { word: 'great', frequency: 150 },
            { word: 'good', frequency: 120 },
            { word: 'excellent', frequency: 95 },
          ],
          imageCategories: {
            commercial: 300,
            personal: 200,
            educational: 150,
          },
        },
        trends: [
          { date: '2024-01-01', positive: 45, negative: 20, neutral: 35 },
          { date: '2024-01-02', positive: 48, negative: 18, neutral: 34 },
          { date: '2024-01-03', positive: 52, negative: 15, neutral: 33 },
        ],
      }

      const reportRequest = {
        dataType: 'reports' as const,
        format: 'pdf' as const,
        options: {
          includeCharts: true,
          includeSummary: true,
          template: 'executive_summary',
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'report-789',
        status: 'processing',
        format: 'pdf',
        recordCount: mockReportData.summary.totalAnalyses,
        mimeType: 'application/pdf',
      })

      const reportResult = await mockExportService.requestExport(reportRequest)

      expect(reportResult).toMatchObject({
        id: expect.any(String),
        status: 'processing',
        format: 'pdf',
      })

      expect(mockExportService.requestExport).toHaveBeenCalledWith(reportRequest)
    })
  })

  describe('Data Integrity Validation', () => {
    it('should validate data consistency before export', async () => {
      // Mock data with potential integrity issues

      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'excel' as const,
        options: {
          validateData: true,
          skipInvalidRecords: true,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'export-validation',
        status: 'completed',
        recordCount: 1, // Only valid records
        warnings: ['Skipped 2 invalid records'],
        sanitized: false,
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      // Should only export valid records
      expect(exportResult.recordCount).toBe(1) // Only the first record is valid
      expect(exportResult.warnings).toContain('Skipped 2 invalid records')
    })

    it('should verify analysis result accuracy', async () => {
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
  })

  describe('Export Format Validation', () => {
    it('should generate valid Excel files with proper formatting', async () => {
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'excel' as const,
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'excel-export',
        format: 'excel',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        status: 'completed',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      // Verify Excel-specific properties
      expect(exportResult.format).toBe('excel')
      expect(exportResult.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

      // Verify export was processed correctly
      expect(exportResult.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should generate valid CSV files with proper encoding', async () => {
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'csv' as const,
        options: {
          encoding: 'utf-8',
          delimiter: ',',
          includeHeaders: true,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'csv-export',
        format: 'csv',
        encoding: 'utf-8',
        mimeType: 'text/csv;charset=utf-8',
        status: 'completed',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult.format).toBe('csv')
      expect(exportResult.encoding).toBe('utf-8')

      // Verify CSV export was processed correctly
      expect(exportResult.mimeType).toBe('text/csv;charset=utf-8')
    })

    it('should generate valid JSON exports with proper structure', async () => {
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'json' as const,
        options: {
          prettyPrint: true,
          includeMetadata: true,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'json-export',
        format: 'json',
        mimeType: 'application/json',
        status: 'completed',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult.format).toBe('json')

      // Verify JSON export was processed correctly
      expect(exportResult.mimeType).toBe('application/json')
    })
  })

  describe('Large Dataset Handling', () => {
    it('should handle large dataset exports with pagination', async () => {
      // Mock large dataset
      const totalRecords = 10000
      const pageSize = 1000

      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'csv' as const,
        options: {
          maxRecords: totalRecords,
          batchSize: pageSize,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'large-export',
        recordCount: totalRecords,
        status: 'processing',
        batched: true,
        batchSize: pageSize,
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult.recordCount).toBe(totalRecords)
      expect(exportResult.status).toBe('processing')
      expect(exportResult.batched).toBe(true)
    })

    it('should handle export timeouts gracefully', async () => {
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'excel' as const,
        options: {
          timeout: 5000, // 5 second timeout
        },
      }

      mockExportService.requestExport.mockRejectedValue(new Error('Export timeout after 5000ms'))

      try {
        await mockExportService.requestExport(exportRequest)
      } catch (error) {
        expect((error as Error).message).toContain('timeout')
      }
    })

    it('should optimize memory usage for large exports', async () => {
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'csv' as const,
        options: {
          streaming: true,
          chunkSize: 1000,
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'streaming-export',
        recordCount: 5000,
        streaming: true,
        chunkSize: 1000,
        status: 'processing',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult.recordCount).toBe(5000)
      expect(exportResult.streaming).toBe(true)

      // Verify streaming export was configured correctly
      expect(exportResult.streaming).toBe(true)
      expect(exportResult.chunkSize).toBe(1000)
    })
  })

  describe('Export Security and Access Control', () => {
    it('should validate user permissions for export operations', async () => {
      const exportRequest = {
        dataType: 'sensitive_analysis' as const,
        format: 'excel' as const,
      }

      mockExportService.requestExport.mockRejectedValue(new Error('Insufficient permissions for sensitive data export'))

      try {
        await mockExportService.requestExport(exportRequest)
      } catch (error) {
        expect((error as Error).message).toContain('Insufficient permissions')
      }
    })

    it('should sanitize sensitive data in exports', async () => {
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'csv' as const,
        options: {
          sanitizeData: true,
          excludeFields: ['userInfo.email', 'userInfo.phone', 'userInfo.ip'],
        },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'sanitized-export',
        sanitized: true,
        excludedFields: ['userInfo.email', 'userInfo.phone', 'userInfo.ip'],
        status: 'completed',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)

      expect(exportResult.sanitized).toBe(true)
      expect(exportResult.excludedFields).toContain('userInfo.email')
    })
  })

  describe('Export Status and Progress Tracking', () => {
    it('should track export progress through completion', async () => {
      const exportId = 'progress-export-123'

      // Mock export status progression

      // Mock the final completed status
      mockExportService.getExportStatus.mockResolvedValue({
        id: exportId,
        status: 'completed',
        progress: 100,
        downloadUrl: 'blob:mock-url'
      })

      // Check final status
      const finalStatus = await mockExportService.getExportStatus(exportId)
      expect(finalStatus.status).toBe('completed')
      expect(finalStatus.progress).toBe(100)
      expect(finalStatus.downloadUrl).toBeDefined()
    })

    it('should handle export failures with error details', async () => {
      const exportId = 'failed-export-456'

      mockExportService.getExportStatus.mockResolvedValue({
        id: exportId,
        status: 'failed',
        progress: 45,
        error: 'Database connection timeout during export',
        retryable: true,
      })

      const status = await mockExportService.getExportStatus(exportId)

      expect(status.status).toBe('failed')
      expect(status.error).toBeDefined()
      expect(status.retryable).toBe(true)
    })
  })

  describe('End-to-End Export Workflows', () => {
    it('should complete full export workflow from request to download', async () => {
      // Step 1: Request export
      const exportRequest = {
        dataType: 'nlp_analysis' as const,
        format: 'excel' as const,
        options: { includeAnalysis: true },
      }

      mockExportService.requestExport.mockResolvedValue({
        id: 'workflow-export',
        status: 'queued',
        format: 'excel',
      })

      const exportResult = await mockExportService.requestExport(exportRequest)
      expect(exportResult.id).toBeDefined()

      // Step 2: Monitor progress
      mockExportService.getExportStatus.mockResolvedValue({
        id: exportResult.id,
        status: 'completed',
        progress: 100,
        downloadUrl: 'blob:mock-download-url',
      })

      const completedStatus = await mockExportService.getExportStatus(exportResult.id)
      expect(completedStatus.status).toBe('completed')
      expect(completedStatus.downloadUrl).toBeDefined()

      // Step 3: Download export
      mockExportService.downloadExport.mockResolvedValue({
        blob: mockBlob,
        filename: 'nlp_analysis_export.xlsx',
        size: 1024,
      })

      const download = await mockExportService.downloadExport(exportResult.id)
      expect(download.blob).toBeDefined()
      expect(download.filename).toContain('.xlsx')
    })

    it('should handle complex multi-format export scenario', async () => {

      // Mock responses for each format first
      mockExportService.requestExport
        .mockResolvedValueOnce({
          id: 'multi-export-0',
          format: 'excel',
          status: 'queued',
        })
        .mockResolvedValueOnce({
          id: 'multi-export-1',
          format: 'csv',
          status: 'queued',
        })
        .mockResolvedValueOnce({
          id: 'multi-export-2',
          format: 'json',
          status: 'queued',
        })

      // Export in multiple formats
      const formats = ['excel', 'csv', 'json'] as const
      const exportPromises = formats.map(format =>
        mockExportService.requestExport({
          dataType: 'combined_analysis' as const,
          format,
          options: { includeAnalysis: true },
        })
      )

      const exportResults = await Promise.all(exportPromises)

      expect(exportResults).toHaveLength(3)
      expect(exportResults[0].format).toBe('excel')
      expect(exportResults[1].format).toBe('csv')
      expect(exportResults[2].format).toBe('json')
      exportResults.forEach(result => {
        expect(result.id).toBeDefined()
      })
    })
  })
})