/**
 * Custom hook for managing push notifications
 * Handles permission requests, subscription management, and notification display
 */

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import type { PushSubscription, NotificationSettings } from '@/types/subscription';

interface UseNotificationsReturn {
  // Permission state
  permission: NotificationPermission;
  isSupported: boolean;
  
  // Subscription state
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  
  // Loading states
  isLoading: boolean;
  isSubscribing: boolean;
  
  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  
  // Settings
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  
  // Error state
  error: string | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email: {
    enabled: true,
    newPosts: true,
    weeklyDigest: true,
    monthlyDigest: false,
    commentReplies: false,
    systemUpdates: true
  },
  browser: {
    enabled: false,
    newPosts: false,
    trendingPosts: false
  }
};

export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  // Check if notifications are supported
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  // Initialize notification state
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isSupported) {
        setIsLoading(false);
        return;
      }

      try {
        // Get current permission
        setPermission(Notification.permission);

        // Load settings from localStorage
        const savedSettings = localStorage.getItem('notification-settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        // Check if already subscribed to push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          
          if (existingSubscription) {
            setIsSubscribed(true);
            setSubscription(existingSubscription.toJSON() as PushSubscription);
          }
        }
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
        setError('Failed to initialize notifications');
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      const result = await subscriptionService.requestNotificationPermission();
      setPermission(result);
      setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setIsSubscribing(true);
    setError(null);

    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Subscribe to push notifications
      const pushSubscription = await subscriptionService.subscribeToPushNotifications();
      
      if (pushSubscription) {
        setIsSubscribed(true);
        setSubscription(pushSubscription);
        
        // Update settings to enable browser notifications
        const newSettings = {
          ...settings,
          browser: {
            ...settings.browser,
            enabled: true
          }
        };
        setSettings(newSettings);
        localStorage.setItem('notification-settings', JSON.stringify(newSettings));
        
        return true;
      } else {
        throw new Error('Failed to create push subscription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to notifications';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, permission, requestPermission, settings]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const success = await subscriptionService.unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
        setSubscription(null);
        
        // Update settings to disable browser notifications
        const newSettings = {
          ...settings,
          browser: {
            ...settings.browser,
            enabled: false,
            newPosts: false,
            trendingPosts: false
          }
        };
        setSettings(newSettings);
        localStorage.setItem('notification-settings', JSON.stringify(newSettings));
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from notifications';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, settings]);

  // Show a local notification
  const showNotification = useCallback(async (title: string, options?: NotificationOptions): Promise<void> => {
    if (!isSupported) {
      throw new Error('Notifications are not supported');
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'local-notification',
        requireInteraction: false,
        ...options
      });

      // Auto-close after 5 seconds if not requiring interaction
      if (!options?.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to show notification:', err);
      throw err;
    }
  }, [isSupported, permission]);

  // Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>): void => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      email: {
        ...settings.email,
        ...newSettings.email
      },
      browser: {
        ...settings.browser,
        ...newSettings.browser
      }
    };
    
    setSettings(updatedSettings);
    localStorage.setItem('notification-settings', JSON.stringify(updatedSettings));
    setError(null);
  }, [settings]);

  return {
    // Permission state
    permission,
    isSupported,
    
    // Subscription state
    isSubscribed,
    subscription,
    
    // Loading states
    isLoading,
    isSubscribing,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    
    // Settings
    settings,
    updateSettings,
    
    // Error state
    error
  };
};

export default useNotifications;