import { describe, it, expect, vi, beforeEach } from 'vitest'
import { billingService } from '../billingService'
import { apiClient } from '../api'

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('BillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserBalance', () => {
    it('should fetch user balance successfully', async () => {
      const mockBalance = {
        user_id: 1,
        current_points: 1000,
        total_spent: 500,
        total_purchased: 1500,
        daily_limit: 100,
        monthly_limit: 2000,
        low_balance_threshold: 50,
        notifications_enabled: true,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBalance })

      const result = await billingService.getUserBalance()

      expect(apiClient.get).toHaveBeenCalledWith('/billing/balance')
      expect(result).toEqual(mockBalance)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      vi.mocked(apiClient.get).mockRejectedValue(error)

      await expect(billingService.getUserBalance()).rejects.toThrow('API Error')
    })
  })

  describe('addPoints', () => {
    it('should add points successfully', async () => {
      const request = {
        amount: 100,
        description: 'Point purchase',
        reference_id: 'ref123',
      }

      const mockTransaction = {
        id: 1,
        user_billing_id: 1,
        transaction_type: 'purchase',
        amount: 100,
        balance_after: 1100,
        description: 'Point purchase',
        reference_id: 'ref123',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockTransaction })

      const result = await billingService.addPoints(request)

      expect(apiClient.post).toHaveBeenCalledWith('/billing/add-points', request)
      expect(result).toEqual(mockTransaction)
    })

    it('should validate point amount', async () => {
      const request = {
        amount: 0,
        description: 'Invalid amount',
      }

      const error = new Error('Invalid amount')
      vi.mocked(apiClient.post).mockRejectedValue(error)

      await expect(billingService.addPoints(request)).rejects.toThrow('Invalid amount')
    })
  })

  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      const request = {
        operation_type: 'nlp_sentiment',
        amount: 5,
        description: 'Sentiment analysis',
        reference_id: 'analysis123',
      }

      const mockTransaction = {
        id: 2,
        user_billing_id: 1,
        transaction_type: 'deduction',
        operation_type: 'nlp_sentiment',
        amount: 5,
        balance_after: 995,
        description: 'Sentiment analysis',
        reference_id: 'analysis123',
        status: 'completed',
        created_at: '2024-01-01T01:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockTransaction })

      const result = await billingService.deductPoints(request)

      expect(apiClient.post).toHaveBeenCalledWith('/billing/deduct-points', request)
      expect(result).toEqual(mockTransaction)
    })

    it('should handle insufficient balance', async () => {
      const request = {
        operation_type: 'nlp_sentiment',
        amount: 1000,
      }

      const error = new Error('Insufficient balance')
      vi.mocked(apiClient.post).mockRejectedValue(error)

      await expect(billingService.deductPoints(request)).rejects.toThrow('Insufficient balance')
    })
  })

  describe('getTransactionHistory', () => {
    it('should fetch transaction history with default parameters', async () => {
      const mockHistory = {
        transactions: [
          {
            id: 1,
            user_billing_id: 1,
            transaction_type: 'purchase',
            amount: 100,
            balance_after: 1100,
            status: 'completed',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total_count: 1,
        limit: 50,
        offset: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockHistory })

      const result = await billingService.getTransactionHistory()

      expect(apiClient.get).toHaveBeenCalledWith('/billing/transactions?limit=50&offset=0')
      expect(result).toEqual(mockHistory)
    })

    it('should fetch transaction history with custom parameters', async () => {
      const mockHistory = {
        transactions: [],
        total_count: 0,
        limit: 20,
        offset: 10,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockHistory })

      const result = await billingService.getTransactionHistory(20, 10, 'deduction')

      expect(apiClient.get).toHaveBeenCalledWith('/billing/transactions?limit=20&offset=10&transaction_type=deduction')
      expect(result).toEqual(mockHistory)
    })
  })

  describe('getUsageAnalytics', () => {
    it('should fetch usage analytics with default period', async () => {
      const mockAnalytics = {
        period_days: 30,
        total_operations: 100,
        total_points_used: 500,
        avg_daily_operations: 3.33,
        avg_daily_points: 16.67,
        operation_breakdown: {
          nlp_sentiment: { operations: 50, points: 250 },
          image_ocr: { operations: 30, points: 150 },
        },
        daily_usage: [
          { date: '2024-01-01', operations: 5, points: 25 },
          { date: '2024-01-02', operations: 3, points: 15 },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockAnalytics })

      const result = await billingService.getUsageAnalytics()

      expect(apiClient.get).toHaveBeenCalledWith('/billing/usage-analytics?days=30')
      expect(result).toEqual(mockAnalytics)
    })

    it('should fetch usage analytics with custom period', async () => {
      const mockAnalytics = {
        period_days: 7,
        total_operations: 20,
        total_points_used: 100,
        avg_daily_operations: 2.86,
        avg_daily_points: 14.29,
        operation_breakdown: {},
        daily_usage: [],
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockAnalytics })

      const result = await billingService.getUsageAnalytics(7)

      expect(apiClient.get).toHaveBeenCalledWith('/billing/usage-analytics?days=7')
      expect(result).toEqual(mockAnalytics)
    })
  })

  describe('updateSpendingLimits', () => {
    it('should update spending limits successfully', async () => {
      const request = {
        daily_limit: 50,
        monthly_limit: 1000,
      }

      const mockResponse = {
        daily_limit: 50,
        monthly_limit: 1000,
        low_balance_threshold: 25,
        notifications_enabled: true,
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await billingService.updateSpendingLimits(request)

      expect(apiClient.post).toHaveBeenCalledWith('/billing/spending-limits', request)
      expect(result).toEqual(mockResponse)
    })

    it('should handle partial limit updates', async () => {
      const request = {
        daily_limit: 75,
      }

      const mockResponse = {
        daily_limit: 75,
        monthly_limit: 2000,
        low_balance_threshold: 25,
        notifications_enabled: true,
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse })

      const result = await billingService.updateSpendingLimits(request)

      expect(result).toEqual(mockResponse)
    })
  })

  describe('checkSpendingLimits', () => {
    it('should check spending limits and allow operation', async () => {
      const amount = 10
      const mockCheck = {
        can_proceed: true,
        warnings: [],
        limits_exceeded: [],
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockCheck })

      const result = await billingService.checkSpendingLimits(amount)

      expect(apiClient.post).toHaveBeenCalledWith('/billing/check-spending-limits', { amount })
      expect(result).toEqual(mockCheck)
      expect(result.can_proceed).toBe(true)
    })

    it('should check spending limits and block operation', async () => {
      const amount = 200
      const mockCheck = {
        can_proceed: false,
        warnings: [{ type: 'approaching_daily_limit', message: 'Approaching daily limit' }],
        limits_exceeded: [{ type: 'daily_limit', message: 'Daily limit exceeded' }],
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockCheck })

      const result = await billingService.checkSpendingLimits(amount)

      expect(result.can_proceed).toBe(false)
      expect(result.limits_exceeded.length).toBeGreaterThan(0)
    })
  })

  describe('getOperationCosts', () => {
    it('should fetch operation costs', async () => {
      const mockCosts = {
        operation_costs: {
          nlp_sentiment: 5,
          nlp_morphological: 8,
          nlp_keywords: 6,
          image_object_detection: 10,
          image_ocr: 12,
          image_classification: 8,
          export_excel: 15,
          export_csv: 10,
          export_pdf: 20,
        },
        currency: 'USD',
        description: 'Cost per operation in points',
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCosts })

      const result = await billingService.getOperationCosts()

      expect(apiClient.get).toHaveBeenCalledWith('/billing/operation-costs')
      expect(result).toEqual(mockCosts)
    })
  })

  describe('Utility Methods', () => {
    describe('formatPoints', () => {
      it('should format points correctly', () => {
        expect(billingService.formatPoints(1000)).toBe('1,000.00')
        expect(billingService.formatPoints(123.456)).toBe('123.46')
        expect(billingService.formatPoints(0)).toBe('0.00')
      })
    })

    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(billingService.formatCurrency(1000)).toBe('$1,000.00')
        expect(billingService.formatCurrency(123.45)).toBe('$123.45')
        expect(billingService.formatCurrency(0)).toBe('$0.00')
      })
    })

    describe('getTransactionTypeDisplay', () => {
      it('should return correct display names', () => {
        expect(billingService.getTransactionTypeDisplay('purchase')).toBe('Purchase')
        expect(billingService.getTransactionTypeDisplay('deduction')).toBe('Usage')
        expect(billingService.getTransactionTypeDisplay('refund')).toBe('Refund')
        expect(billingService.getTransactionTypeDisplay('bonus')).toBe('Bonus')
        expect(billingService.getTransactionTypeDisplay('unknown')).toBe('unknown')
      })
    })

    describe('getOperationTypeDisplay', () => {
      it('should return correct operation display names', () => {
        expect(billingService.getOperationTypeDisplay('nlp_sentiment')).toBe('Sentiment Analysis')
        expect(billingService.getOperationTypeDisplay('image_ocr')).toBe('OCR Processing')
        expect(billingService.getOperationTypeDisplay('export_excel')).toBe('Excel Export')
        expect(billingService.getOperationTypeDisplay('custom_operation')).toBe('Custom Operation')
        expect(billingService.getOperationTypeDisplay(undefined)).toBe('N/A')
      })
    })

    describe('getStatusColor', () => {
      it('should return correct status colors', () => {
        expect(billingService.getStatusColor('completed')).toBe('text-green-600')
        expect(billingService.getStatusColor('pending')).toBe('text-yellow-600')
        expect(billingService.getStatusColor('failed')).toBe('text-red-600')
        expect(billingService.getStatusColor('cancelled')).toBe('text-gray-600')
        expect(billingService.getStatusColor('unknown')).toBe('text-gray-600')
      })
    })

    describe('isBalanceLow', () => {
      it('should correctly identify low balance', () => {
        expect(billingService.isBalanceLow(25, 50)).toBe(true)
        expect(billingService.isBalanceLow(50, 50)).toBe(true)
        expect(billingService.isBalanceLow(75, 50)).toBe(false)
      })
    })

    describe('getBalanceStatus', () => {
      it('should return correct balance status', () => {
        expect(billingService.getBalanceStatus(25, 50)).toBe('low')
        expect(billingService.getBalanceStatus(50, 50)).toBe('low')
        expect(billingService.getBalanceStatus(75, 50)).toBe('normal')
        expect(billingService.getBalanceStatus(150, 50)).toBe('good')
      })
    })
  })

  describe('Point Calculation Accuracy', () => {
    it('should handle point calculations with precision', async () => {
      const request = {
        operation_type: 'nlp_sentiment',
        amount: 5.25,
        description: 'Fractional points test',
      }

      const mockTransaction = {
        id: 3,
        user_billing_id: 1,
        transaction_type: 'deduction',
        operation_type: 'nlp_sentiment',
        amount: 5.25,
        balance_after: 994.75,
        description: 'Fractional points test',
        status: 'completed',
        created_at: '2024-01-01T02:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockTransaction })

      const result = await billingService.deductPoints(request)

      expect(result.amount).toBe(5.25)
      expect(result.balance_after).toBe(994.75)
    })

    it('should handle large point amounts', async () => {
      const request = {
        amount: 999999.99,
        description: 'Large amount test',
      }

      const mockTransaction = {
        id: 4,
        user_billing_id: 1,
        transaction_type: 'purchase',
        amount: 999999.99,
        balance_after: 1000999.99,
        description: 'Large amount test',
        status: 'completed',
        created_at: '2024-01-01T03:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockTransaction })

      const result = await billingService.addPoints(request)

      expect(result.amount).toBe(999999.99)
      expect(result.balance_after).toBe(1000999.99)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      vi.mocked(apiClient.get).mockRejectedValue(networkError)

      await expect(billingService.getUserBalance()).rejects.toThrow('Network error')
    })

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error')
      vi.mocked(apiClient.post).mockRejectedValue(serverError)

      const request = {
        operation_type: 'nlp_sentiment',
        amount: 5,
      }

      await expect(billingService.deductPoints(request)).rejects.toThrow('Internal server error')
    })

    it('should handle malformed responses', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null })

      const result = await billingService.getUserBalance()
      expect(result).toBeNull()
    })
  })

  describe('Performance', () => {
    it('should handle concurrent balance requests', async () => {
      const mockBalance = {
        user_id: 1,
        current_points: 1000,
        total_spent: 500,
        total_purchased: 1500,
        low_balance_threshold: 50,
        notifications_enabled: true,
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBalance })

      const promises = Array.from({ length: 10 }, () => billingService.getUserBalance())
      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result).toEqual(mockBalance)
      })
      expect(apiClient.get).toHaveBeenCalledTimes(10)
    })

    it('should handle concurrent transaction requests', async () => {
      const mockTransaction = {
        id: 5,
        user_billing_id: 1,
        transaction_type: 'deduction',
        operation_type: 'nlp_sentiment',
        amount: 5,
        balance_after: 995,
        status: 'completed',
        created_at: '2024-01-01T04:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockTransaction })

      const requests = Array.from({ length: 5 }, (_, i) => ({
        operation_type: 'nlp_sentiment',
        amount: 5,
        reference_id: `ref${i}`,
      }))

      const promises = requests.map(req => billingService.deductPoints(req))
      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      expect(apiClient.post).toHaveBeenCalledTimes(5)
    })
  })
})