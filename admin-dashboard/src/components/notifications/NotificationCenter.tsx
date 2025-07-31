/**
 * Notification Center Component
 * 
 * In-dashboard notification center with real-time updates for crawling events.
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  Settings,
  Trash2,
  MarkAsRead
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Notification {
  id: string;
  job_id: number;
  type: 'job_started' | 'job_completed' | 'job_failed' | 'job_progress';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  read_at?: string;
}

interface NotificationCenterProps {
  userId: number;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete
}) => {
  const getIcon = (type: string, severity: string) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0" };
    
    switch (severity) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle {...iconProps} className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info {...iconProps} className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`p-3 border rounded-lg transition-all duration-200 ${
      notification.read 
        ? 'border-gray-700 bg-gray-800/30' 
        : `${getSeverityClasses(notification.severity)} border-l-4`
    }`}>
      <div className="flex items-start space-x-3">
        {getIcon(notification.type, notification.severity)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm font-medium ${
              notification.read ? 'text-gray-300' : 'text-white'
            }`}>
              {notification.title}
            </h4>
            
            <div className="flex items-center space-x-1">
              {!notification.read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                </button>
              )}
              
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete notification"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <p className={`text-sm ${
            notification.read ? 'text-gray-400' : 'text-gray-300'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              Job #{notification.job_id}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // WebSocket connection for real-time notifications
  const { isConnected, sendMessage } = useWebSocket({
    url: `ws://localhost:8000/ws/notifications/${userId}`,
    onMessage: (message) => {
      if (message.type === 'new_notification') {
        const newNotification = message.data;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          });
        }
      }
    }
  });

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notifications/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
              {isConnected && (
                <div className="w-2 h-2 bg-green-400 rounded-full" title="Live updates enabled" />
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Notification settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                <MarkAsRead className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
              
              <button
                onClick={clearAll}
                className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No notifications yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  You'll see crawling job updates here
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="border-t border-gray-700 p-4">
              <NotificationSettings userId={userId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Notification Settings Component
const NotificationSettings: React.FC<{ userId: number }> = ({ userId }) => {
  const [settings, setSettings] = useState({
    job_started: true,
    job_completed: true,
    job_failed: true,
    job_progress: false,
    email_enabled: false,
    sms_enabled: false,
    phone_number: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notification-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/crawling-jobs/notification-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        // Show success feedback
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-white">Notification Preferences</h4>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.job_started}
            onChange={(e) => setSettings(prev => ({ ...prev, job_started: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Job started</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.job_completed}
            onChange={(e) => setSettings(prev => ({ ...prev, job_completed: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Job completed</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.job_failed}
            onChange={(e) => setSettings(prev => ({ ...prev, job_failed: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Job failed</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.job_progress}
            onChange={(e) => setSettings(prev => ({ ...prev, job_progress: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Progress milestones</span>
        </label>
      </div>
      
      <div className="border-t border-gray-700 pt-3">
        <label className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            checked={settings.email_enabled}
            onChange={(e) => setSettings(prev => ({ ...prev, email_enabled: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Email notifications</span>
        </label>
        
        <label className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            checked={settings.sms_enabled}
            onChange={(e) => setSettings(prev => ({ ...prev, sms_enabled: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">SMS notifications</span>
        </label>
        
        {settings.sms_enabled && (
          <input
            type="tel"
            placeholder="Phone number"
            value={settings.phone_number}
            onChange={(e) => setSettings(prev => ({ ...prev, phone_number: e.target.value }))}
            className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        )}
      </div>
      
      <button
        onClick={saveSettings}
        disabled={isSaving}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};