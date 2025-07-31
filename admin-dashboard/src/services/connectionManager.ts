import { websocketService } from './websocketService';

// Connection quality metrics
export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  latency: number;
  stability: number; // 0-100, based on connection drops
  throughput: number; // messages per second
  score: number; // Overall quality score 0-100
}

// Connection manager configuration
export interface ConnectionManagerConfig {
  qualityCheckInterval: number;
  latencyThreshold: {
    excellent: number;
    good: number;
    fair: number;
  };
  stabilityWindow: number; // Time window for stability calculation (ms)
  throughputWindow: number; // Time window for throughput calculation (ms)
  autoOptimize: boolean;
  adaptiveReconnect: boolean;
}

// Connection event for monitoring
export interface ConnectionEvent {
  type: 'connect' | 'disconnect' | 'reconnect' | 'quality-change' | 'optimization';
  timestamp: number;
  data?: any;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private config: ConnectionManagerConfig;
  private qualityHistory: ConnectionQuality[] = [];
  private eventHistory: ConnectionEvent[] = [];
  private qualityTimer: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;
  private lastConnectionTime: number = 0;
  private messageTimestamps: number[] = [];
  private disconnectionCount: number = 0;
  private totalConnectionTime: number = 0;

  private constructor() {
    this.config = {
      qualityCheckInterval: 5000, // 5 seconds
      latencyThreshold: {
        excellent: 50,   // < 50ms
        good: 150,       // < 150ms
        fair: 500        // < 500ms
      },
      stabilityWindow: 300000,    // 5 minutes
      throughputWindow: 60000,    // 1 minute
      autoOptimize: true,
      adaptiveReconnect: true
    };

    this.initializeMonitoring();
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Configure connection manager
   */
  configure(config: Partial<ConnectionManagerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.qualityTimer) {
      clearInterval(this.qualityTimer);
      this.startQualityMonitoring();
    }
  }

  /**
   * Initialize connection monitoring
   */
  private initializeMonitoring(): void {
    // Monitor connection events
    websocketService.onConnectionChange((event) => {
      this.handleConnectionEvent(event);
    });

    // Start quality monitoring
    this.startQualityMonitoring();
  }

  /**
   * Start quality monitoring
   */
  private startQualityMonitoring(): void {
    this.qualityTimer = setInterval(() => {
      this.assessConnectionQuality();
    }, this.config.qualityCheckInterval);
  }

  /**
   * Handle connection events
   */
  private handleConnectionEvent(event: 'connected' | 'disconnected' | 'error' | 'reconnecting'): void {
    const now = Date.now();
    
    switch (event) {
      case 'connected':
        if (this.lastConnectionTime > 0) {
          this.totalConnectionTime += now - this.lastConnectionTime;
        }
        this.lastConnectionTime = now;
        this.connectionAttempts = 0;
        this.addEvent('connect', { timestamp: now });
        break;
        
      case 'disconnected':
        if (this.lastConnectionTime > 0) {
          this.totalConnectionTime += now - this.lastConnectionTime;
        }
        this.disconnectionCount++;
        this.addEvent('disconnect', { timestamp: now });
        break;
        
      case 'reconnecting':
        this.connectionAttempts++;
        this.addEvent('reconnect', { 
          timestamp: now, 
          attempt: this.connectionAttempts 
        });
        
        if (this.config.adaptiveReconnect) {
          this.optimizeReconnection();
        }
        break;
        
      case 'error':
        this.addEvent('disconnect', { 
          timestamp: now, 
          reason: 'error' 
        });
        break;
    }
  }

  /**
   * Assess current connection quality
   */
  private assessConnectionQuality(): void {
    if (!websocketService.isConnected()) {
      const quality: ConnectionQuality = {
        level: 'disconnected',
        latency: -1,
        stability: 0,
        throughput: 0,
        score: 0
      };
      
      this.addQualityMeasurement(quality);
      return;
    }

    const stats = websocketService.getStats();
    const now = Date.now();
    
    // Calculate latency
    const latency = stats.latency || 0;
    
    // Calculate stability (based on disconnection frequency)
    const stabilityWindow = this.config.stabilityWindow;
    const recentDisconnections = this.eventHistory
      .filter(e => e.type === 'disconnect' && (now - e.timestamp) < stabilityWindow)
      .length;
    const stability = Math.max(0, 100 - (recentDisconnections * 20));
    
    // Calculate throughput
    const throughputWindow = this.config.throughputWindow;
    this.messageTimestamps = this.messageTimestamps.filter(t => (now - t) < throughputWindow);
    this.messageTimestamps.push(now);
    const throughput = this.messageTimestamps.length / (throughputWindow / 1000);
    
    // Determine quality level
    let level: ConnectionQuality['level'];
    if (latency < this.config.latencyThreshold.excellent && stability > 90) {
      level = 'excellent';
    } else if (latency < this.config.latencyThreshold.good && stability > 70) {
      level = 'good';
    } else if (latency < this.config.latencyThreshold.fair && stability > 50) {
      level = 'fair';
    } else {
      level = 'poor';
    }
    
    // Calculate overall score
    const latencyScore = Math.max(0, 100 - (latency / 10));
    const throughputScore = Math.min(100, throughput * 10);
    const score = (latencyScore * 0.4 + stability * 0.4 + throughputScore * 0.2);
    
    const quality: ConnectionQuality = {
      level,
      latency,
      stability,
      throughput,
      score: Math.round(score)
    };
    
    this.addQualityMeasurement(quality);
    
    // Auto-optimize if enabled
    if (this.config.autoOptimize && quality.score < 60) {
      this.optimizeConnection();
    }
  }

  /**
   * Add quality measurement to history
   */
  private addQualityMeasurement(quality: ConnectionQuality): void {
    this.qualityHistory.push(quality);
    
    // Keep only last 100 measurements
    if (this.qualityHistory.length > 100) {
      this.qualityHistory = this.qualityHistory.slice(-100);
    }
    
    // Check for quality changes
    if (this.qualityHistory.length > 1) {
      const previous = this.qualityHistory[this.qualityHistory.length - 2];
      if (previous.level !== quality.level) {
        this.addEvent('quality-change', {
          from: previous.level,
          to: quality.level,
          score: quality.score
        });
      }
    }
  }

  /**
   * Add event to history
   */
  private addEvent(type: ConnectionEvent['type'], data?: any): void {
    this.eventHistory.push({
      type,
      timestamp: Date.now(),
      data
    });
    
    // Keep only last 500 events
    if (this.eventHistory.length > 500) {
      this.eventHistory = this.eventHistory.slice(-500);
    }
  }

  /**
   * Optimize connection based on current conditions
   */
  private optimizeConnection(): void {
    const currentQuality = this.getCurrentQuality();
    
    if (!currentQuality || currentQuality.level === 'disconnected') {
      return;
    }
    
    // Optimization strategies based on quality issues
    if (currentQuality.latency > this.config.latencyThreshold.fair) {
      // High latency - try to reconnect
      this.addEvent('optimization', { 
        strategy: 'reconnect-high-latency',
        latency: currentQuality.latency 
      });
      websocketService.reconnect();
    } else if (currentQuality.stability < 50) {
      // Poor stability - implement backoff strategy
      this.addEvent('optimization', { 
        strategy: 'stability-backoff',
        stability: currentQuality.stability 
      });
      this.implementBackoffStrategy();
    } else if (currentQuality.throughput < 1) {
      // Low throughput - check for congestion
      this.addEvent('optimization', { 
        strategy: 'throughput-optimization',
        throughput: currentQuality.throughput 
      });
      this.optimizeThroughput();
    }
  }

  /**
   * Optimize reconnection strategy
   */
  private optimizeReconnection(): void {
    const baseInterval = 5000; // 5 seconds
    const maxInterval = 60000; // 1 minute
    
    // Exponential backoff with jitter
    const backoffMultiplier = Math.min(8, Math.pow(2, this.connectionAttempts - 1));
    const jitter = Math.random() * 1000; // 0-1 second jitter
    const interval = Math.min(maxInterval, baseInterval * backoffMultiplier + jitter);
    
    // Configure WebSocket service with new interval
    websocketService.configure({
      reconnectInterval: interval
    });
    
    this.addEvent('optimization', {
      strategy: 'adaptive-reconnect',
      interval,
      attempt: this.connectionAttempts
    });
  }

  /**
   * Implement backoff strategy for unstable connections
   */
  private implementBackoffStrategy(): void {
    // Reduce message frequency temporarily
    const currentQuality = this.getCurrentQuality();
    if (currentQuality && currentQuality.stability < 30) {
      // Very unstable - implement aggressive backoff
      setTimeout(() => {
        websocketService.reconnect();
      }, 30000); // Wait 30 seconds before reconnecting
    }
  }

  /**
   * Optimize throughput
   */
  private optimizeThroughput(): void {
    // Enable compression if not already enabled
    websocketService.configure({
      enableCompression: true
    });
    
    // Reduce message queue size to prevent buildup
    websocketService.configure({
      messageQueueSize: 50
    });
  }

  /**
   * Get current connection quality
   */
  getCurrentQuality(): ConnectionQuality | null {
    return this.qualityHistory.length > 0 
      ? this.qualityHistory[this.qualityHistory.length - 1] 
      : null;
  }

  /**
   * Get quality history
   */
  getQualityHistory(limit: number = 50): ConnectionQuality[] {
    return this.qualityHistory.slice(-limit);
  }

  /**
   * Get connection events
   */
  getConnectionEvents(limit: number = 100): ConnectionEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnectionTime: number;
    disconnectionCount: number;
    averageQuality: number;
    currentQuality: ConnectionQuality | null;
    uptime: number;
  } {
    const now = Date.now();
    const uptime = websocketService.isConnected() && this.lastConnectionTime > 0
      ? now - this.lastConnectionTime
      : 0;
    
    const averageQuality = this.qualityHistory.length > 0
      ? this.qualityHistory.reduce((sum, q) => sum + q.score, 0) / this.qualityHistory.length
      : 0;
    
    return {
      totalConnectionTime: this.totalConnectionTime + uptime,
      disconnectionCount: this.disconnectionCount,
      averageQuality: Math.round(averageQuality),
      currentQuality: this.getCurrentQuality(),
      uptime
    };
  }

  /**
   * Force connection optimization
   */
  forceOptimization(): void {
    this.optimizeConnection();
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.qualityHistory = [];
    this.eventHistory = [];
    this.connectionAttempts = 0;
    this.disconnectionCount = 0;
    this.totalConnectionTime = 0;
    this.messageTimestamps = [];
  }

  /**
   * Destroy connection manager
   */
  destroy(): void {
    if (this.qualityTimer) {
      clearInterval(this.qualityTimer);
      this.qualityTimer = null;
    }
    
    this.resetStats();
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();
export default connectionManager;