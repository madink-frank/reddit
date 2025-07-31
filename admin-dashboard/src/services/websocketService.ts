// WebSocket connection management service
export type WebSocketEventType = 
  | 'crawling-status'
  | 'analysis-progress'
  | 'cache-metrics'
  | 'system-health'
  | 'notification'
  | 'user-activity';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: number;
  id: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  enableCompression: boolean;
}

export interface ConnectionStats {
  isConnected: boolean;
  connectionTime: number;
  reconnectAttempts: number;
  messagesSent: number;
  messagesReceived: number;
  lastHeartbeat: number;
  latency: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type ConnectionEventHandler = (event: 'connected' | 'disconnected' | 'error' | 'reconnecting') => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<WebSocketEventType, Set<WebSocketEventHandler>> = new Map();
  private connectionHandlers: Set<ConnectionEventHandler> = new Set();
  private messageQueue: WebSocketMessage[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private stats: ConnectionStats;
  private isReconnecting = false;

  private constructor() {
    this.config = {
      url: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageQueueSize: 100,
      enableCompression: true
    };

    this.stats = {
      isConnected: false,
      connectionTime: 0,
      reconnectAttempts: 0,
      messagesSent: 0,
      messagesReceived: 0,
      lastHeartbeat: 0,
      latency: 0
    };
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Configure WebSocket service
   */
  configure(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.stats.isConnected = true;
          this.stats.connectionTime = Date.now();
          this.stats.reconnectAttempts = 0;
          this.isReconnecting = false;
          
          this.startHeartbeat();
          this.processMessageQueue();
          this.notifyConnectionHandlers('connected');
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection(event);
        };

        this.ws.onerror = (error) => {
          this.handleError(error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isReconnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.stats.isConnected = false;
    this.notifyConnectionHandlers('disconnected');
  }

  /**
   * Send message to server
   */
  send(type: WebSocketEventType, payload: any): boolean {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.stats.messagesSent++;
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Subscribe to specific event type
   */
  subscribe(type: WebSocketEventType, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    
    this.eventHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(type);
        }
      }
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnectionChange(handler: ConnectionEventHandler): () => void {
    this.connectionHandlers.add(handler);
    
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect();
    setTimeout(() => {
      this.connect().catch(console.error);
    }, 1000);
  }

  // Private methods

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.stats.messagesReceived++;

      // Handle heartbeat response
      if (message.type === 'heartbeat' as WebSocketEventType) {
        this.stats.lastHeartbeat = Date.now();
        this.stats.latency = Date.now() - message.timestamp;
        return;
      }

      // Notify event handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in WebSocket event handler:', error);
          }
        });
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleDisconnection(event: CloseEvent): void {
    this.stats.isConnected = false;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.notifyConnectionHandlers('disconnected');

    // Attempt reconnection if not intentional disconnect
    if (event.code !== 1000 && !this.isReconnecting) {
      this.attemptReconnection();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.notifyConnectionHandlers('error');
  }

  private attemptReconnection(): void {
    if (this.isReconnecting || this.stats.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    this.stats.reconnectAttempts++;
    this.notifyConnectionHandlers('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // If reconnection fails, try again
        if (this.stats.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.attemptReconnection();
        } else {
          this.isReconnecting = false;
          console.error('Max reconnection attempts reached');
        }
      });
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('heartbeat' as WebSocketEventType, { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws!.send(JSON.stringify(message));
        this.stats.messagesSent++;
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.queueMessage(message); // Re-queue if failed
        break;
      }
    }
  }

  private notifyConnectionHandlers(event: 'connected' | 'disconnected' | 'error' | 'reconnecting'): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in connection event handler:', error);
      }
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();
export default websocketService;