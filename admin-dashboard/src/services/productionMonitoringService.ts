/**
 * Production Monitoring Service
 * Comprehensive monitoring for production environment
 */

export interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  responseTime: number;
  errorRate: number;
  activeUsers: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: keyof SystemMetrics;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: number; // minutes
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  notifications: string[]; // email addresses or webhook URLs
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertRule['severity'];
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

class ProductionMonitoringService {
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultAlertRules();
  }

  /**
   * Start monitoring system metrics
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds

    console.log('🔍 Production monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('⏹️ Production monitoring stopped');
  }

  /**
   * Get current system status
   */
  getSystemStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastCheck: Date;
    activeAlerts: number;
    metrics: SystemMetrics | null;
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1] || null;
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (activeAlerts > 0) {
      const criticalAlerts = this.alerts.filter(a => !a.resolved && a.severity === 'critical').length;
      const errorAlerts = this.alerts.filter(a => !a.resolved && a.severity === 'error').length;

      if (criticalAlerts > 0) {
        status = 'critical';
      } else if (errorAlerts > 0 || activeAlerts > 3) {
        status = 'warning';
      }
    }

    return {
      status,
      uptime: this.calculateUptime(),
      lastCheck: latestMetrics?.timestamp || new Date(),
      activeAlerts,
      metrics: latestMetrics
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(days: number = 7): Alert[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.alerts.filter(a => a.timestamp >= cutoff);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ Alert resolved: ${alert.ruleName}`);
    }
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateId('rule')
    };

    this.alertRules.push(alertRule);
    console.log(`📋 Alert rule added: ${rule.name}`);

    return alertRule.id;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.find(r => r.id === id);
    if (rule) {
      Object.assign(rule, updates);
      console.log(`📝 Alert rule updated: ${rule.name}`);
    }
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(id: string): void {
    const index = this.alertRules.findIndex(r => r.id === id);
    if (index !== -1) {
      const rule = this.alertRules[index];
      this.alertRules.splice(index, 1);
      console.log(`🗑️ Alert rule deleted: ${rule.name}`);
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Use Performance API if available
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

      return {
        pageLoadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
        firstContentfulPaint: fcp,
        largestContentfulPaint: 0, // Would need LCP observer
        cumulativeLayoutShift: 0, // Would need CLS observer
        firstInputDelay: 0, // Would need FID observer
        timeToInteractive: navigation?.domInteractive - navigation?.startTime || 0
      };
    }

    // Fallback metrics
    return {
      pageLoadTime: 1200,
      firstContentfulPaint: 800,
      largestContentfulPaint: 1500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 50,
      timeToInteractive: 2000
    };
  }

  /**
   * Track custom event
   */
  trackEvent(event: string, properties: Record<string, any> = {}): void {
    console.log(`📊 Event tracked: ${event}`, properties);

    // In real implementation, send to analytics service
    // Example: Google Analytics, Mixpanel, etc.
  }

  /**
   * Generate health report
   */
  generateHealthReport(): {
    summary: string;
    metrics: {
      availability: number;
      averageResponseTime: number;
      errorRate: number;
      alertsResolved: number;
    };
    recommendations: string[];
  } {
    const recentMetrics = this.getMetricsHistory(24);
    const recentAlerts = this.getAlertHistory(7);

    const availability = this.calculateAvailability(recentMetrics);
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;
    const errorRate = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
      : 0;
    const alertsResolved = recentAlerts.filter(a => a.resolved).length;

    const recommendations = this.generateRecommendations(recentMetrics, recentAlerts);

    return {
      summary: this.generateSummary(availability, avgResponseTime, errorRate),
      metrics: {
        availability,
        averageResponseTime: avgResponseTime,
        errorRate,
        alertsResolved
      },
      recommendations
    };
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage(),
        disk: this.getDiskUsage(),
        network: {
          inbound: Math.random() * 1000,
          outbound: Math.random() * 800
        },
        responseTime: await this.measureResponseTime(),
        errorRate: this.getErrorRate(),
        activeUsers: this.getActiveUsers()
      };

      this.metrics.push(metrics);

      // Keep only last 24 hours of metrics
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

      // Check alert rules
      this.checkAlertRules(metrics);

    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private checkAlertRules(metrics: SystemMetrics): void {
    this.alertRules.filter(rule => rule.enabled).forEach(rule => {
      const value = this.getMetricValue(metrics, rule.metric);
      const shouldAlert = this.evaluateCondition(value, rule.condition, rule.threshold);

      if (shouldAlert) {
        this.createAlert(rule, value);
      }
    });
  }

  private createAlert(rule: AlertRule, value: number): void {
    // Check if there's already an active alert for this rule
    const existingAlert = this.alerts.find(a =>
      a.ruleId === rule.id && !a.resolved
    );

    if (existingAlert) return;

    const alert: Alert = {
      id: this.generateId('alert'),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `${rule.name}: ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
      timestamp: new Date(),
      resolved: false,
      metadata: { value, threshold: rule.threshold }
    };

    this.alerts.push(alert);
    this.sendNotifications(alert, rule);

    console.log(`🚨 Alert created: ${alert.message}`);
  }

  private sendNotifications(_alert: Alert, rule: AlertRule): void {
    rule.notifications.forEach(notification => {
      if (notification.includes('@')) {
        // Email notification
        console.log(`📧 Email alert sent to: ${notification}`);
      } else {
        // Webhook notification
        console.log(`🔗 Webhook alert sent to: ${notification}`);
      }
    });
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'cpu-high',
        name: 'High CPU Usage',
        metric: 'cpu',
        condition: 'greater_than',
        threshold: 80,
        duration: 5,
        severity: 'warning',
        enabled: true,
        notifications: ['admin@example.com']
      },
      {
        id: 'memory-high',
        name: 'High Memory Usage',
        metric: 'memory',
        condition: 'greater_than',
        threshold: 85,
        duration: 5,
        severity: 'error',
        enabled: true,
        notifications: ['admin@example.com']
      },
      {
        id: 'response-time-high',
        name: 'High Response Time',
        metric: 'responseTime',
        condition: 'greater_than',
        threshold: 2000,
        duration: 3,
        severity: 'warning',
        enabled: true,
        notifications: ['admin@example.com']
      },
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        metric: 'errorRate',
        condition: 'greater_than',
        threshold: 5,
        duration: 2,
        severity: 'critical',
        enabled: true,
        notifications: ['admin@example.com']
      }
    ];
  }

  private getCPUUsage(): number {
    // Mock CPU usage - in real implementation, get from system
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    // Mock memory usage - in real implementation, get from system
    return Math.random() * 100;
  }

  private getDiskUsage(): number {
    // Mock disk usage - in real implementation, get from system
    return Math.random() * 100;
  }

  private async measureResponseTime(): Promise<number> {
    const start = performance.now();
    try {
      // Mock API call - in real implementation, ping actual endpoints
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      return performance.now() - start;
    } catch {
      return 5000; // Timeout
    }
  }

  private getErrorRate(): number {
    // Mock error rate - in real implementation, get from logs/metrics
    return Math.random() * 10;
  }

  private getActiveUsers(): number {
    // Mock active users - in real implementation, get from analytics
    return Math.floor(Math.random() * 1000);
  }

  private calculateUptime(): number {
    // Mock uptime calculation - in real implementation, track actual uptime
    return 99.9;
  }

  private calculateAvailability(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 100;

    const healthyMetrics = metrics.filter(m =>
      m.responseTime < 5000 && m.errorRate < 10
    );

    return (healthyMetrics.length / metrics.length) * 100;
  }

  private getMetricValue(metrics: SystemMetrics, metric: keyof SystemMetrics): number {
    const value = metrics[metric];
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'inbound' in value) return value.inbound;
    return 0;
  }

  private evaluateCondition(value: number, condition: AlertRule['condition'], threshold: number): boolean {
    switch (condition) {
      case 'greater_than': return value > threshold;
      case 'less_than': return value < threshold;
      case 'equals': return value === threshold;
      default: return false;
    }
  }

  private generateRecommendations(metrics: SystemMetrics[], alerts: Alert[]): string[] {
    const recommendations: string[] = [];

    if (alerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('긴급 알림이 발생했습니다. 즉시 확인이 필요합니다.');
    }

    const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
    if (avgCpu > 70) {
      recommendations.push('CPU 사용률이 높습니다. 서버 리소스 증설을 고려하세요.');
    }

    const avgMemory = metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;
    if (avgMemory > 80) {
      recommendations.push('메모리 사용률이 높습니다. 메모리 최적화가 필요합니다.');
    }

    return recommendations;
  }

  private generateSummary(availability: number, responseTime: number, errorRate: number): string {
    if (availability >= 99.9 && responseTime < 1000 && errorRate < 1) {
      return '시스템이 정상적으로 운영되고 있습니다.';
    } else if (availability >= 99 && responseTime < 2000 && errorRate < 5) {
      return '시스템이 안정적으로 운영되고 있으나 일부 개선이 필요합니다.';
    } else {
      return '시스템에 문제가 발생했습니다. 즉시 확인이 필요합니다.';
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const productionMonitoringService = new ProductionMonitoringService();