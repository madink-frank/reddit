import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService, WebSocketEventType, WebSocketMessage } from '../services/websocketService';

// Real-time data hook configuration
interface RealTimeDataConfig {
  eventTypes: WebSocketEventType[];
  autoConnect?: boolean;
  bufferSize?: number;
  throttleMs?: number;
  enableReconnect?: boolean;
}

// Real-time data hook return type
interface RealTimeDataHook<T = any> {
  data: T[];
  latestData: T | null;
  isConnected: boolean;
  isReconnecting: boolean;
  connectionStats: any;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearData: () => void;
  sendMessage: (type: WebSocketEventType, payload: any) => boolean;
}

// Specialized hooks for different data types
export function useRealTimeData<T = any>(config: RealTimeDataConfig): RealTimeDataHook<T> {
  const [data, setData] = useState<T[]>([]);
  const [latestData, setLatestData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionStats, setConnectionStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const connectionUnsubscribeRef = useRef<(() => void) | null>(null);
  const throttleTimerRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<T[]>([]);

  const { eventTypes, autoConnect = true, bufferSize = 100, throttleMs = 100 } = config;

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    const newData = message.payload as T;
    
    if (throttleMs > 0) {
      // Throttle updates
      pendingUpdatesRef.current.push(newData);
      
      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          const updates = [...pendingUpdatesRef.current];
          pendingUpdatesRef.current = [];
          
          setData(prevData => {
            const newDataArray = [...prevData, ...updates];
            return newDataArray.slice(-bufferSize);
          });
          
          if (updates.length > 0) {
            setLatestData(updates[updates.length - 1]);
          }
          
          throttleTimerRef.current = null;
        }, throttleMs);
      }
    } else {
      // Immediate updates
      setData(prevData => {
        const newDataArray = [...prevData, newData];
        return newDataArray.slice(-bufferSize);
      });
      setLatestData(newData);
    }
  }, [bufferSize, throttleMs]);

  // Handle connection events
  const handleConnectionEvent = useCallback((event: 'connected' | 'disconnected' | 'error' | 'reconnecting') => {
    switch (event) {
      case 'connected':
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        break;
      case 'disconnected':
        setIsConnected(false);
        setIsReconnecting(false);
        break;
      case 'error':
        setError('Connection error occurred');
        break;
      case 'reconnecting':
        setIsReconnecting(true);
        setError(null);
        break;
    }
    
    // Update connection stats
    setConnectionStats(websocketService.getStats());
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await websocketService.connect();
      
      // Subscribe to events
      const unsubscribeFunctions = eventTypes.map(eventType => 
        websocketService.subscribe(eventType, handleMessage)
      );
      unsubscribeRefs.current = unsubscribeFunctions;
      
      // Subscribe to connection events
      connectionUnsubscribeRef.current = websocketService.onConnectionChange(handleConnectionEvent);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [eventTypes, handleMessage, handleConnectionEvent]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Unsubscribe from events
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];
    
    // Unsubscribe from connection events
    if (connectionUnsubscribeRef.current) {
      connectionUnsubscribeRef.current();
      connectionUnsubscribeRef.current = null;
    }
    
    websocketService.disconnect();
  }, []);

  // Clear data buffer
  const clearData = useCallback(() => {
    setData([]);
    setLatestData(null);
  }, []);

  // Send message
  const sendMessage = useCallback((type: WebSocketEventType, payload: any) => {
    return websocketService.send(type, payload);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update connection stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        setConnectionStats(websocketService.getStats());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    data,
    latestData,
    isConnected,
    isReconnecting,
    connectionStats,
    error,
    connect,
    disconnect,
    clearData,
    sendMessage
  };
}

// Specialized hook for crawling status updates
export function useCrawlingStatus() {
  return useRealTimeData<{
    jobId: string;
    status: 'running' | 'completed' | 'failed';
    progress: number;
    itemsCollected: number;
    totalItems: number;
    speed: number;
    elapsedTime: number;
    estimatedTimeRemaining: number;
  }>({
    eventTypes: ['crawling-status'],
    bufferSize: 50,
    throttleMs: 500
  });
}

// Specialized hook for analysis progress updates
export function useAnalysisProgress() {
  return useRealTimeData<{
    analysisId: string;
    type: 'nlp' | 'image';
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    itemsProcessed: number;
    totalItems: number;
    currentItem: string;
    processingTime: number;
  }>({
    eventTypes: ['analysis-progress'],
    bufferSize: 30,
    throttleMs: 200
  });
}

// Specialized hook for cache metrics updates
export function useCacheMetrics() {
  return useRealTimeData<{
    hitRate: number;
    missRate: number;
    totalEntries: number;
    memoryUsage: number;
    averageResponseTime: number;
    timestamp: number;
  }>({
    eventTypes: ['cache-metrics'],
    bufferSize: 100,
    throttleMs: 1000
  });
}

// Specialized hook for system health updates
export function useSystemHealth() {
  return useRealTimeData<{
    cpu: number;
    memory: number;
    disk: number;
    network: {
      inbound: number;
      outbound: number;
    };
    services: {
      name: string;
      status: 'healthy' | 'warning' | 'error';
      responseTime: number;
    }[];
    timestamp: number;
  }>({
    eventTypes: ['system-health'],
    bufferSize: 60,
    throttleMs: 2000
  });
}

// Specialized hook for notifications
export function useRealTimeNotifications() {
  return useRealTimeData<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    actions?: {
      label: string;
      action: string;
    }[];
  }>({
    eventTypes: ['notification'],
    bufferSize: 20,
    throttleMs: 0 // No throttling for notifications
  });
}

// Hook for managing multiple real-time data streams
export function useMultipleRealTimeStreams(configs: { [key: string]: RealTimeDataConfig }) {
  const [streams, setStreams] = useState<{ [key: string]: any }>({});
  const [globalConnectionStatus, setGlobalConnectionStatus] = useState({
    isConnected: false,
    isReconnecting: false,
    error: null as string | null
  });

  useEffect(() => {
    const streamInstances: { [key: string]: any } = {};
    
    Object.entries(configs).forEach(([key, config]) => {
      streamInstances[key] = useRealTimeData(config);
    });
    
    setStreams(streamInstances);

    // Monitor global connection status
    const updateGlobalStatus = () => {
      const isConnected = websocketService.isConnected();
      
      setGlobalConnectionStatus({
        isConnected,
        isReconnecting: false, // This would need to be tracked separately
        error: null
      });
    };

    const unsubscribe = websocketService.onConnectionChange(updateGlobalStatus);
    updateGlobalStatus();

    return () => {
      unsubscribe();
    };
  }, [configs]);

  return {
    streams,
    globalConnectionStatus,
    reconnectAll: () => websocketService.reconnect(),
    disconnectAll: () => websocketService.disconnect()
  };
}

export default useRealTimeData;