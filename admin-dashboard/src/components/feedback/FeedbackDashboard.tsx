import React, { useState, useEffect } from 'react';
import { userFeedbackService, FeedbackData, FeedbackAnalytics } from '../../services/userFeedbackService';

export const FeedbackDashboard: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [satisfactionMetrics, setSatisfactionMetrics] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<{
    type?: string;
    status?: string;
    priority?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [feedbackData, analyticsData, satisfactionData] = await Promise.all([
        userFeedbackService.getFeedback(selectedFilter),
        userFeedbackService.getFeedbackAnalytics(),
        userFeedbackService.getSatisfactionMetrics()
      ]);

      setFeedback(feedbackData);
      setAnalytics(analyticsData);
      setSatisfactionMetrics(satisfactionData);
    } catch (error) {
      console.error('Failed to load feedback data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: FeedbackData['status']) => {
    await userFeedbackService.updateFeedbackStatus(id, status);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'feature':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
      case 'improvement':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">사용자 피드백 대시보드</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          새로고침
        </button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 피드백</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalFeedback}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 평점</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">해결률</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.resolutionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 응답시간</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.responseTime}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Satisfaction Metrics */}
      {satisfactionMetrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">만족도 지표</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">NPS (Net Promoter Score)</p>
              <p className="text-3xl font-bold text-blue-600">{satisfactionMetrics.nps.toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">CSAT (Customer Satisfaction)</p>
              <p className="text-3xl font-bold text-green-600">{satisfactionMetrics.csat.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">CES (Customer Effort Score)</p>
              <p className="text-3xl font-bold text-purple-600">{satisfactionMetrics.ces.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={selectedFilter.type || ''}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, type: e.target.value || undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">전체</option>
              <option value="bug">버그</option>
              <option value="feature">기능 요청</option>
              <option value="improvement">개선 제안</option>
              <option value="general">일반</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={selectedFilter.status || ''}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, status: e.target.value || undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">전체</option>
              <option value="new">신규</option>
              <option value="in-progress">진행중</option>
              <option value="resolved">해결됨</option>
              <option value="closed">종료</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
            <select
              value={selectedFilter.priority || ''}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, priority: e.target.value || undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">전체</option>
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="critical">긴급</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">피드백 목록</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {feedback.map((item) => (
            <div key={item.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getTypeIcon(item.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>카테고리: {item.category}</span>
                      {item.rating && <span>평점: {item.rating}/10</span>}
                      <span>{item.metadata.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusUpdate(item.id, e.target.value as FeedbackData['status'])}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="new">신규</option>
                    <option value="in-progress">진행중</option>
                    <option value="resolved">해결됨</option>
                    <option value="closed">종료</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {feedback.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              피드백이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};