import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProductionDashboard } from '../components/monitoring/ProductionDashboard';
import { FeedbackDashboard } from '../components/feedback/FeedbackDashboard';
import { FeedbackWidget } from '../components/feedback/FeedbackWidget';
import { productionMonitoringService } from '../services/productionMonitoringService';
import { userFeedbackService } from '../services/userFeedbackService';

// Mock services
jest.mock('../services/productionMonitoringService');
jest.mock('../services/userFeedbackService');

const mockProductionMonitoringService = productionMonitoringService as jest.Mocked<typeof productionMonitoringService>;
const mockUserFeedbackService = userFeedbackService as jest.Mocked<typeof userFeedbackService>;

describe('Deployment and Monitoring Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock production monitoring service
    mockProductionMonitoringService.getSystemStatus.mockReturnValue({
      status: 'healthy',
      uptime: 99.9,
      lastCheck: new Date(),
      activeAlerts: 0,
      metrics: {
        timestamp: new Date(),
        cpu: 45.2,
        memory: 62.1,
        disk: 78.5,
        network: { inbound: 150, outbound: 120 },
        responseTime: 250,
        errorRate: 0.1,
        activeUsers: 1250
      }
    });
    
    mockProductionMonitoringService.getMetricsHistory.mockReturnValue([]);
    mockProductionMonitoringService.getActiveAlerts.mockReturnValue([]);
    
    // Mock user feedback service
    mockUserFeedbackService.getFeedback.mockResolvedValue([]);
    mockUserFeedbackService.getFeedbackAnalytics.mockResolvedValue({
      totalFeedback: 150,
      byType: { bug: 25, feature: 45, improvement: 30, general: 50 },
      byCategory: { ui: 40, performance: 25, feature: 35, other: 50 },
      averageRating: 7.8,
      responseTime: 18,
      resolutionRate: 85.5,
      trends: []
    });
    mockUserFeedbackService.getSatisfactionMetrics.mockResolvedValue({
      nps: 65,
      csat: 82,
      ces: 78,
      trends: []
    });
  });

  describe('ProductionDashboard', () => {
    it('renders system status correctly', async () => {
      render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('프로덕션 모니터링')).toBeInTheDocument();
        expect(screen.getByText('정상')).toBeInTheDocument();
        expect(screen.getByText('99.90%')).toBeInTheDocument();
        expect(screen.getByText('250ms')).toBeInTheDocument();
        expect(screen.getByText('1,250')).toBeInTheDocument();
      });
    });

    it('displays system metrics', async () => {
      render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('45.1%')).toBeInTheDocument(); // CPU
        expect(screen.getByText('62.1%')).toBeInTheDocument(); // Memory
        expect(screen.getByText('78.5%')).toBeInTheDocument(); // Disk
        expect(screen.getByText('0.10%')).toBeInTheDocument(); // Error rate
      });
    });

    it('shows health report', async () => {
      render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('시스템 상태 보고서')).toBeInTheDocument();
        expect(screen.getByText('시스템이 정상적으로 운영되고 있습니다.')).toBeInTheDocument();
      });
    });

    it('handles monitoring service initialization', async () => {
      render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(mockProductionMonitoringService.startMonitoring).toHaveBeenCalled();
      });
    });
  });

  describe('FeedbackDashboard', () => {
    it('renders feedback analytics', async () => {
      render(<FeedbackDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('사용자 피드백 대시보드')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument(); // Total feedback
        expect(screen.getByText('7.8')).toBeInTheDocument(); // Average rating
        expect(screen.getByText('85.5%')).toBeInTheDocument(); // Resolution rate
        expect(screen.getByText('18h')).toBeInTheDocument(); // Response time
      });
    });

    it('displays satisfaction metrics', async () => {
      render(<FeedbackDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('65')).toBeInTheDocument(); // NPS
        expect(screen.getByText('82%')).toBeInTheDocument(); // CSAT
        expect(screen.getByText('78%')).toBeInTheDocument(); // CES
      });
    });

    it('handles filter changes', async () => {
      render(<FeedbackDashboard />);
      
      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('전체');
        fireEvent.change(typeFilter, { target: { value: 'bug' } });
      });
      
      expect(mockUserFeedbackService.getFeedback).toHaveBeenCalledWith({ type: 'bug' });
    });

    it('refreshes data when refresh button is clicked', async () => {
      render(<FeedbackDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('새로고침');
        fireEvent.click(refreshButton);
      });
      
      expect(mockUserFeedbackService.getFeedback).toHaveBeenCalledTimes(2);
    });
  });

  describe('FeedbackWidget', () => {
    it('renders feedback button', () => {
      render(<FeedbackWidget />);
      
      const feedbackButton = screen.getByLabelText('피드백 보내기');
      expect(feedbackButton).toBeInTheDocument();
    });

    it('opens feedback form when clicked', () => {
      render(<FeedbackWidget />);
      
      const feedbackButton = screen.getByLabelText('피드백 보내기');
      fireEvent.click(feedbackButton);
      
      expect(screen.getByText('피드백 보내기')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('간단한 제목을 입력하세요')).toBeInTheDocument();
    });

    it('submits feedback form', async () => {
      mockUserFeedbackService.submitFeedback.mockResolvedValue('feedback_123');
      
      render(<FeedbackWidget />);
      
      // Open form
      const feedbackButton = screen.getByLabelText('피드백 보내기');
      fireEvent.click(feedbackButton);
      
      // Fill form
      fireEvent.change(screen.getByPlaceholderText('간단한 제목을 입력하세요'), {
        target: { value: 'Test feedback' }
      });
      fireEvent.change(screen.getByPlaceholderText('자세한 내용을 입력하세요'), {
        target: { value: 'This is a test feedback' }
      });
      
      // Submit form
      const submitButton = screen.getByText('전송');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUserFeedbackService.submitFeedback).toHaveBeenCalledWith({
          type: 'general',
          category: '',
          title: 'Test feedback',
          description: 'This is a test feedback',
          rating: 0,
          priority: 'medium'
        });
      });
    });

    it('shows success message after submission', async () => {
      mockUserFeedbackService.submitFeedback.mockResolvedValue('feedback_123');
      
      render(<FeedbackWidget />);
      
      // Open and submit form
      const feedbackButton = screen.getByLabelText('피드백 보내기');
      fireEvent.click(feedbackButton);
      
      fireEvent.change(screen.getByPlaceholderText('간단한 제목을 입력하세요'), {
        target: { value: 'Test' }
      });
      fireEvent.change(screen.getByPlaceholderText('자세한 내용을 입력하세요'), {
        target: { value: 'Test description' }
      });
      
      const submitButton = screen.getByText('전송');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('피드백이 전송되었습니다!')).toBeInTheDocument();
      });
    });

    it('supports different themes', () => {
      const { rerender } = render(<FeedbackWidget theme="light" />);
      
      let feedbackButton = screen.getByLabelText('피드백 보내기');
      fireEvent.click(feedbackButton);
      
      expect(screen.getByText('피드백 보내기')).toBeInTheDocument();
      
      // Close and rerender with dark theme
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      rerender(<FeedbackWidget theme="dark" />);
      
      feedbackButton = screen.getByLabelText('피드백 보내기');
      fireEvent.click(feedbackButton);
      
      expect(screen.getByText('피드백 보내기')).toBeInTheDocument();
    });

    it('supports different positions', () => {
      const { rerender } = render(<FeedbackWidget position="bottom-right" />);
      expect(screen.getByLabelText('피드백 보내기')).toBeInTheDocument();
      
      rerender(<FeedbackWidget position="top-left" />);
      expect(screen.getByLabelText('피드백 보내기')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('production dashboard starts monitoring on mount', async () => {
      render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(mockProductionMonitoringService.startMonitoring).toHaveBeenCalled();
      });
    });

    it('production dashboard stops monitoring on unmount', async () => {
      const { unmount } = render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(mockProductionMonitoringService.startMonitoring).toHaveBeenCalled();
      });
      
      unmount();
      
      expect(mockProductionMonitoringService.stopMonitoring).toHaveBeenCalled();
    });

    it('feedback dashboard loads all required data', async () => {
      render(<FeedbackDashboard />);
      
      await waitFor(() => {
        expect(mockUserFeedbackService.getFeedback).toHaveBeenCalled();
        expect(mockUserFeedbackService.getFeedbackAnalytics).toHaveBeenCalled();
        expect(mockUserFeedbackService.getSatisfactionMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles production monitoring service errors', async () => {
      mockProductionMonitoringService.getSystemStatus.mockImplementation(() => {
        throw new Error('Service unavailable');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<ProductionDashboard />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load monitoring data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles feedback service errors', async () => {
      mockUserFeedbackService.getFeedback.mockRejectedValue(new Error('Service unavailable'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<FeedbackDashboard />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load feedback data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles feedback submission errors', async () => {
      mockUserFeedbackService.submitFeedback.mockRejectedValue(new Error('Submission failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<FeedbackWidget />);
      
      // Open and submit form
      const feedbackButton = screen.getByLabelText('피드백 보내기');
      fireEvent.click(feedbackButton);
      
      fireEvent.change(screen.getByPlaceholderText('간단한 제목을 입력하세요'), {
        target: { value: 'Test' }
      });
      fireEvent.change(screen.getByPlaceholderText('자세한 내용을 입력하세요'), {
        target: { value: 'Test description' }
      });
      
      const submitButton = screen.getByText('전송');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to submit feedback:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
});