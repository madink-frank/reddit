import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
    CrawlingJobStatus,
    SystemMetrics,
    RealTimeNotification,
    LiveDashboardData,
    WebSocketMessage,
    RealTimeSubscription,
    ConnectionStatus,
} from '@/types/advanced-dashboard';

interface RealTimeMonitoringState {
    // Connection status
    connectionStatus: ConnectionStatus;

    // Live data
    liveData: LiveDashboardData | null;
    crawlingJobs: CrawlingJobStatus[];
    systemMetrics: SystemMetrics[];
    notifications: RealTimeNotification[];

    // WebSocket management
    websocket: WebSocket | null;
    subscriptions: Map<string, RealTimeSubscription>;
    messageQueue: WebSocketMessage[];

    // Configuration
    settings: {
        autoReconnect: boolean;
        heartbeatInterval: number; // milliseconds
        maxReconnectAttempts: number;
        notificationRetention: number; // max notifications to keep
        metricsRetention: number; // max metrics points to keep
    };

    // Actions
    connect: () => Promise<void>;
    disconnect: () => void;
    reconnect: () => Promise<void>;

    // Subscription management
    subscribe: (subscription: RealTimeSubscription) => string;
    unsubscribe: (subscriptionId: string) => void;

    // Data management
    updateCrawlingJob: (job: CrawlingJobStatus) => void;
    addSystemMetrics: (metrics: SystemMetrics) => void;
    addNotification: (notification: Omit<RealTimeNotification, 'id'>) => void;
    clearNotifications: () => void;
    markNotificationAsRead: (id: string) => void;

    // Job control
    startCrawlingJob: (jobId: string) => Promise<void>;
    pauseCrawlingJob: (jobId: string) => Promise<void>;
    stopCrawlingJob: (jobId: string) => Promise<void>;
    restartCrawlingJob: (jobId: string) => Promise<void>;

    // Manual triggers
    triggerManualCrawl: (keywords: string[], subreddits: string[]) => Promise<string>;
    triggerSystemHealthCheck: () => Promise<void>;

    // Utility functions
    getJobById: (id: string) => CrawlingJobStatus | null;
    getLatestMetrics: () => SystemMetrics | null;
    getUnreadNotifications: () => RealTimeNotification[];

    // Internal methods
    handleWebSocketMessage: (message: WebSocketMessage) => void;
    sendMessage: (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => void;
    startHeartbeat: () => void;
    stopHeartbeat: () => void;
}

export const useRealTimeMonitoringStore = create<RealTimeMonitoringState>()(
    subscribeWithSelector(
        immer((set, get) => ({
            // Initial state
            connectionStatus: {
                connected: false,
                reconnectAttempts: 0,
                subscriptions: [],
            },

            liveData: null,
            crawlingJobs: [],
            systemMetrics: [],
            notifications: [],

            websocket: null,
            subscriptions: new Map(),
            messageQueue: [],

            settings: {
                autoReconnect: true,
                heartbeatInterval: 30000, // 30 seconds
                maxReconnectAttempts: 5,
                notificationRetention: 100,
                metricsRetention: 1000,
            },

            // Connection management
            connect: async () => {
                const state = get();

                if (state.websocket?.readyState === WebSocket.OPEN) {
                    return;
                }

                try {
                    // Replace with actual WebSocket URL
                    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/monitoring';
                    const ws = new WebSocket(wsUrl);

                    ws.onopen = () => {
                        set((state) => {
                            state.connectionStatus.connected = true;
                            state.connectionStatus.reconnectAttempts = 0;
                            state.connectionStatus.lastHeartbeat = new Date();
                        });

                        // Start heartbeat
                        get().startHeartbeat();

                        // Resubscribe to all channels
                        state.subscriptions.forEach((subscription, id) => {
                            get().sendMessage({
                                type: 'update',
                                channel: subscription.channel,
                                data: { action: 'subscribe', filters: subscription.filters },
                            });
                        });
                    };

                    ws.onmessage = (event) => {
                        try {
                            const message: WebSocketMessage = JSON.parse(event.data);
                            get().handleWebSocketMessage(message);
                        } catch (error) {
                            console.error('Failed to parse WebSocket message:', error);
                        }
                    };

                    ws.onclose = () => {
                        set((state) => {
                            state.connectionStatus.connected = false;
                            state.websocket = null;
                        });

                        get().stopHeartbeat();

                        // Auto-reconnect if enabled
                        if (state.settings.autoReconnect && state.connectionStatus.reconnectAttempts < state.settings.maxReconnectAttempts) {
                            setTimeout(() => {
                                set((state) => {
                                    state.connectionStatus.reconnectAttempts++;
                                });
                                get().reconnect();
                            }, Math.pow(2, state.connectionStatus.reconnectAttempts) * 1000); // Exponential backoff
                        }
                    };

                    ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        get().addNotification({
                            type: 'error',
                            category: 'system',
                            title: 'Connection Error',
                            message: 'Failed to connect to real-time monitoring service',
                            timestamp: new Date(),
                        });
                    };

                    set((state) => {
                        state.websocket = ws;
                    });

                } catch (error) {
                    console.error('Failed to connect to WebSocket:', error);
                    throw error;
                }
            },

            disconnect: () => {
                const state = get();

                get().stopHeartbeat();

                if (state.websocket) {
                    state.websocket.close();
                }

                set((state) => {
                    state.websocket = null;
                    state.connectionStatus.connected = false;
                    state.subscriptions.clear();
                });
            },

            reconnect: async () => {
                get().disconnect();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                await get().connect();
            },

            // Subscription management
            subscribe: (subscription: RealTimeSubscription) => {
                const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

                set((state) => {
                    state.subscriptions.set(subscriptionId, subscription);
                    state.connectionStatus.subscriptions.push(subscription.channel);
                });

                // Send subscription message if connected
                if (get().connectionStatus.connected) {
                    get().sendMessage({
                        type: 'update',
                        channel: subscription.channel,
                        data: { action: 'subscribe', filters: subscription.filters },
                    });
                }

                return subscriptionId;
            },

            unsubscribe: (subscriptionId: string) => {
                const state = get();
                const subscription = state.subscriptions.get(subscriptionId);

                if (subscription) {
                    // Send unsubscribe message if connected
                    if (state.connectionStatus.connected) {
                        get().sendMessage({
                            type: 'update',
                            channel: subscription.channel,
                            data: { action: 'unsubscribe' },
                        });
                    }

                    set((state) => {
                        state.subscriptions.delete(subscriptionId);
                        state.connectionStatus.subscriptions = state.connectionStatus.subscriptions.filter(
                            channel => channel !== subscription.channel
                        );
                    });
                }
            },

            // Data management
            updateCrawlingJob: (job: CrawlingJobStatus) => {
                set((state) => {
                    const index = state.crawlingJobs.findIndex(j => j.id === job.id);
                    if (index !== -1) {
                        state.crawlingJobs[index] = job;
                    } else {
                        state.crawlingJobs.push(job);
                    }
                });
            },

            addSystemMetrics: (metrics: SystemMetrics) => {
                set((state) => {
                    state.systemMetrics.push(metrics);

                    // Keep only the latest metrics within retention limit
                    if (state.systemMetrics.length > state.settings.metricsRetention) {
                        state.systemMetrics = state.systemMetrics.slice(-state.settings.metricsRetention);
                    }
                });
            },

            addNotification: (notification: Omit<RealTimeNotification, 'id'>) => {
                const fullNotification: RealTimeNotification = {
                    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    ...notification,
                };

                set((state) => {
                    state.notifications.unshift(fullNotification);

                    // Keep only the latest notifications within retention limit
                    if (state.notifications.length > state.settings.notificationRetention) {
                        state.notifications = state.notifications.slice(0, state.settings.notificationRetention);
                    }
                });

                // Call notification callback if subscribed
                const subscription = get().subscriptions.get('notifications');
                if (subscription) {
                    subscription.callback(fullNotification);
                }
            },

            clearNotifications: () => {
                set((state) => {
                    state.notifications = [];
                });
            },

            markNotificationAsRead: (id: string) => {
                set((state) => {
                    const notification = state.notifications.find(n => n.id === id);
                    if (notification) {
                        notification.data = { ...notification.data, read: true };
                    }
                });
            },

            // Job control
            startCrawlingJob: async (jobId: string) => {
                get().sendMessage({
                    type: 'update',
                    channel: 'job-control',
                    data: { action: 'start', jobId },
                });
            },

            pauseCrawlingJob: async (jobId: string) => {
                get().sendMessage({
                    type: 'update',
                    channel: 'job-control',
                    data: { action: 'pause', jobId },
                });
            },

            stopCrawlingJob: async (jobId: string) => {
                get().sendMessage({
                    type: 'update',
                    channel: 'job-control',
                    data: { action: 'stop', jobId },
                });
            },

            restartCrawlingJob: async (jobId: string) => {
                get().sendMessage({
                    type: 'update',
                    channel: 'job-control',
                    data: { action: 'restart', jobId },
                });
            },

            // Manual triggers
            triggerManualCrawl: async (keywords: string[], subreddits: string[]) => {
                const jobId = `manual-${Date.now()}`;

                get().sendMessage({
                    type: 'update',
                    channel: 'manual-crawl',
                    data: { jobId, keywords, subreddits },
                });

                return jobId;
            },

            triggerSystemHealthCheck: async () => {
                get().sendMessage({
                    type: 'update',
                    channel: 'health-check',
                    data: { action: 'check' },
                });
            },

            // Utility functions
            getJobById: (id: string) => {
                return get().crawlingJobs.find(job => job.id === id) || null;
            },

            getLatestMetrics: () => {
                const metrics = get().systemMetrics;
                return metrics.length > 0 ? metrics[metrics.length - 1] : null;
            },

            getUnreadNotifications: () => {
                return get().notifications.filter(n => !n.data?.read);
            },

            // Internal methods
            handleWebSocketMessage: (message: WebSocketMessage) => {
                const state = get();

                // Update latency
                set((state) => {
                    state.connectionStatus.latency = Date.now() - new Date(message.timestamp).getTime();
                });

                // Handle different message types
                switch (message.type) {
                    case 'update':
                        if (message.channel === 'crawling-jobs') {
                            const job = message.data as CrawlingJobStatus;
                            get().updateCrawlingJob(job);
                        } else if (message.channel === 'system-metrics') {
                            const metrics = message.data as SystemMetrics;
                            get().addSystemMetrics(metrics);
                        } else if (message.channel === 'live-dashboard') {
                            set((state) => {
                                state.liveData = message.data as LiveDashboardData;
                            });
                        }
                        break;

                    case 'notification':
                        const notification = message.data as RealTimeNotification;
                        get().addNotification(notification);
                        break;

                    case 'heartbeat':
                        set((state) => {
                            state.connectionStatus.lastHeartbeat = new Date();
                        });
                        break;

                    case 'error':
                        console.error('WebSocket error message:', message.data);
                        get().addNotification({
                            type: 'error',
                            category: 'system',
                            title: 'System Error',
                            message: message.data as string,
                            timestamp: new Date(),
                        });
                        break;
                }

                // Call subscription callbacks
                state.subscriptions.forEach((subscription) => {
                    if (subscription.channel === message.channel) {
                        subscription.callback(message.data);
                    }
                });
            },

            sendMessage: (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => {
                const state = get();

                if (!state.websocket || state.websocket.readyState !== WebSocket.OPEN) {
                    // Queue message for later
                    const fullMessage: WebSocketMessage = {
                        ...message,
                        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                        timestamp: new Date(),
                    };

                    set((state) => {
                        state.messageQueue.push(fullMessage);
                    });
                    return;
                }

                const fullMessage: WebSocketMessage = {
                    ...message,
                    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    timestamp: new Date(),
                };

                state.websocket.send(JSON.stringify(fullMessage));
            },

            startHeartbeat: () => {
                const state = get();

                const heartbeatInterval = setInterval(() => {
                    get().sendMessage({
                        type: 'heartbeat',
                        channel: 'system',
                        data: { timestamp: new Date() },
                    });
                }, state.settings.heartbeatInterval);

                // Store interval ID for cleanup
                set((state) => {
                    (state as any).heartbeatInterval = heartbeatInterval;
                });
            },

            stopHeartbeat: () => {
                const state = get() as any;
                if (state.heartbeatInterval) {
                    clearInterval(state.heartbeatInterval);
                    delete state.heartbeatInterval;
                }
            },
        }))
    )
);

// Utility hooks for specific monitoring features
export const useCrawlingMonitoring = () => {
    const crawlingJobs = useRealTimeMonitoringStore((state) => state.crawlingJobs);
    const updateCrawlingJob = useRealTimeMonitoringStore((state) => state.updateCrawlingJob);
    const startCrawlingJob = useRealTimeMonitoringStore((state) => state.startCrawlingJob);
    const pauseCrawlingJob = useRealTimeMonitoringStore((state) => state.pauseCrawlingJob);
    const stopCrawlingJob = useRealTimeMonitoringStore((state) => state.stopCrawlingJob);
    const restartCrawlingJob = useRealTimeMonitoringStore((state) => state.restartCrawlingJob);
    const getJobById = useRealTimeMonitoringStore((state) => state.getJobById);

    return {
        crawlingJobs,
        updateCrawlingJob,
        startCrawlingJob,
        pauseCrawlingJob,
        stopCrawlingJob,
        restartCrawlingJob,
        getJobById,
        activeJobs: crawlingJobs.filter(job => job.status === 'running'),
        completedJobs: crawlingJobs.filter(job => job.status === 'completed'),
        failedJobs: crawlingJobs.filter(job => job.status === 'failed'),
    };
};

export const useSystemMonitoring = () => {
    const systemMetrics = useRealTimeMonitoringStore((state) => state.systemMetrics);
    const addSystemMetrics = useRealTimeMonitoringStore((state) => state.addSystemMetrics);
    const getLatestMetrics = useRealTimeMonitoringStore((state) => state.getLatestMetrics);
    const triggerSystemHealthCheck = useRealTimeMonitoringStore((state) => state.triggerSystemHealthCheck);

    return {
        systemMetrics,
        addSystemMetrics,
        getLatestMetrics,
        triggerSystemHealthCheck,
        latestMetrics: getLatestMetrics(),
    };
};

export const useNotificationCenter = () => {
    const notifications = useRealTimeMonitoringStore((state) => state.notifications);
    const addNotification = useRealTimeMonitoringStore((state) => state.addNotification);
    const clearNotifications = useRealTimeMonitoringStore((state) => state.clearNotifications);
    const markNotificationAsRead = useRealTimeMonitoringStore((state) => state.markNotificationAsRead);
    const getUnreadNotifications = useRealTimeMonitoringStore((state) => state.getUnreadNotifications);

    return {
        notifications,
        addNotification,
        clearNotifications,
        markNotificationAsRead,
        getUnreadNotifications,
        unreadCount: getUnreadNotifications().length,
    };
};

export const useConnectionStatus = () => {
    const connectionStatus = useRealTimeMonitoringStore((state) => state.connectionStatus);
    const connect = useRealTimeMonitoringStore((state) => state.connect);
    const disconnect = useRealTimeMonitoringStore((state) => state.disconnect);
    const reconnect = useRealTimeMonitoringStore((state) => state.reconnect);

    return {
        ...connectionStatus,
        connect,
        disconnect,
        reconnect,
    };
};