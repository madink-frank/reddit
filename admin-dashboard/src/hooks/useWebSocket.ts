/**
 * WebSocket Hook for Real-time Updates
 * 
 * Provides WebSocket connection management for real-time monitoring features.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

// Simple WebSocket hook for basic usage
export const useWebSocket = (endpoint: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Mock WebSocket connection for development
    setIsConnected(true);
    
    // Simulate periodic updates
    const interval = setInterval(() => {
      if (endpoint === '/ws/crawling-status') {
        setLastMessage({
          activeJobs: Math.floor(Math.random() * 5) + 1,
          completedToday: Math.floor(Math.random() * 100) + 50,
          successRate: Math.floor(Math.random() * 10) + 90,
          avgSpeed: Math.floor(Math.random() * 50) + 20,
          queueSize: Math.floor(Math.random() * 20)
        });
      } else if (endpoint === '/ws/system-health') {
        setLastMessage({
          database: { status: 'healthy', latency: Math.floor(Math.random() * 50) + 20 },
          redis: { status: 'healthy', latency: Math.floor(Math.random() * 20) + 5 },
          celery: { status: Math.random() > 0.7 ? 'warning' : 'healthy', activeWorkers: 2, totalWorkers: 3 },
          api: { status: 'healthy', responseTime: Math.floor(Math.random() * 100) + 50 }
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [endpoint]);

  return { isConnected, lastMessage };
};

export const useWebSocketAdvanced = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    enabled = true
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectCountRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || socket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionState('connecting');
      const ws = new WebSocket(url, protocols);

      ws.onopen = (event) => {
        setConnectionState('connected');
        reconnectCountRef.current = 0;
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setConnectionState('disconnected');
        setSocket(null);
        onClose?.(event);

        // Auto-reconnect if enabled and not manually closed
        if (shouldReconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setConnectionState('error');
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      setSocket(ws);
    } catch (error) {
      setConnectionState('error');
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, protocols, enabled, onOpen, onClose, onError, onMessage, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current !== undefined) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (socket) {
      socket.close();
      setSocket(null);
    }
    
    setConnectionState('disconnected');
  }, [socket]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectCountRef.current = 0;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, [socket]);

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      shouldReconnectRef.current = true;
      connect();
    }

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current !== undefined) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [enabled, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    connectionState,
    isConnected: connectionState === 'connected',
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnect
  };
};

/**
 * Hook for subscribing to specific WebSocket channels
 */
export const useWebSocketChannel = (
  websocket: UseWebSocketReturn,
  channel: string,
  onMessage?: (data: any) => void
) => {
  const [channelData, setChannelData] = useState<any>(null);

  useEffect(() => {
    if (websocket.connectionState === 'connected') {
      // Subscribe to channel
      websocket.sendMessage({
        type: 'subscribe',
        channel: channel
      });

      return () => {
        // Unsubscribe from channel
        websocket.sendMessage({
          type: 'unsubscribe',
          channel: channel
        });
      };
    }
  }, [websocket.connectionState, channel, websocket]);

  useEffect(() => {
    if (websocket.lastMessage?.type === 'channel_message' && 
        websocket.lastMessage?.data?.channel === channel) {
      const data = websocket.lastMessage.data.message;
      setChannelData(data);
      onMessage?.(data);
    }
  }, [websocket.lastMessage, channel, onMessage]);

  return channelData;
};