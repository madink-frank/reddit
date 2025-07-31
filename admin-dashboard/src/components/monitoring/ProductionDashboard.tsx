import React, { useState, useEffect } from 'react';
import { 
  productionMonitoringService, 
  SystemMetrics, 
  Alert 
} from '../../services/productionMonitoringService';

export const ProductionDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [, setMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const status = productionMonitoringService.getSystemStatus();
        const metricsHistory = productionMonitoringService.getMetricsHistory(24);
        const activeAlerts = productionMonitoringService.getActiveAlerts();

        setSystemStatus(status);
        setMetrics(metricsHistory);
        setAlerts(activeAlerts);
      } catch (error) {
        console.error('Failed to load monitoring data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    // Start monitoring
    productionMonitoringService.startMonitoring();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);

    return () => {
      clearInterval(interval);
      productionMonitoringService.stopMonitoring();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <h1 className="text-2xl font-bold text-gray-900">프로덕션 모니터링</h1>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus?.status)}`}>
            {systemStatus?.status === 'healthy' && '정상'}
            {systemStatus?.status === 'warning' && '주의'}
            {systemStatus?.status === 'critical' && '위험'}
          </div>
          <span className="text-sm text-gray-500">
            마지막 확인: {systemStatus?.lastCheck?.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">가동률</p>
              <p className="text-2xl font-semibold text-gray-900">{systemStatus?.uptime?.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">응답 시간</p>
              <p className="text-2xl font-semibold text-gray-900">
                {systemStatus?.metrics?.responseTime?.toFixed(0)}ms
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 알림</p>
              <p className="text-2xl font-semibold text-gray-900">{systemStatus?.activeAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 사용자</p>
              <p className="text-2xl font-semibold text-gray-900">
                {systemStatus?.metrics?.activeUsers?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 메트릭</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">CPU 사용률</h3>
            <div className="h-32 bg-gray-50 rounded flex items-end justify-center">
              <div className="text-sm text-gray-500">차트 영역 (실제 구현시 Chart.js 등 사용)</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">메모리 사용률</h3>
            <div className="h-32 bg-gray-50 rounded flex items-end justify-center">
              <div className="text-sm text-gray-500">차트 영역 (실제 구현시 Chart.js 등 사용)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">활성 알림</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{alert.ruleName}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => productionMonitoringService.resolveAlert(alert.id)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  해결
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Metrics */}
      {systemStatus?.metrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 메트릭</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">CPU</p>
              <p className="text-xl font-semibold text-gray-900">
                {systemStatus.metrics.cpu.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">메모리</p>
              <p className="text-xl font-semibold text-gray-900">
                {systemStatus.metrics.memory.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">디스크</p>
              <p className="text-xl font-semibold text-gray-900">
                {systemStatus.metrics.disk.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">오류율</p>
              <p className="text-xl font-semibold text-gray-900">
                {systemStatus.metrics.errorRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Health Report */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태 보고서</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">요약</h3>
            <p className="text-gray-900">시스템이 정상적으로 운영되고 있습니다.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">권장사항</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>정기적인 시스템 점검을 수행하세요.</li>
              <li>백업 시스템의 상태를 확인하세요.</li>
              <li>보안 업데이트를 적용하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};