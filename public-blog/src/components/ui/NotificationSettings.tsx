/**
 * Notification Settings Component
 * Allows users to manage their notification preferences for email and browser notifications
 */

import React, { useState } from 'react';
import { Button, Checkbox } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationSettings } from '@/types/subscription';

interface NotificationSettingsProps {
  className?: string;
  onSettingsChange?: (settings: NotificationSettings) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  onSettingsChange
}) => {
  const {
    permission,
    isSupported,
    isSubscribed,
    isSubscribing,
    subscribe,
    unsubscribe,
    settings,
    updateSettings,
    error,
    showNotification
  } = useNotifications();

  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const handleEmailSettingChange = (key: keyof NotificationSettings['email'], value: boolean) => {
    const newSettings = {
      ...settings,
      email: {
        ...settings.email,
        [key]: value
      }
    };
    updateSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleBrowserSettingChange = (key: keyof NotificationSettings['browser'], value: boolean) => {
    const newSettings = {
      ...settings,
      browser: {
        ...settings.browser,
        [key]: value
      }
    };
    updateSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleBrowserNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification('Test Notification', {
        body: 'This is a test notification from Reddit Trends Blog',
        tag: 'test-notification',
        requireInteraction: false
      });
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  if (!isSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-medium text-yellow-800">Browser Notifications Not Supported</h3>
        </div>
        <p className="text-sm text-yellow-700">
          Your browser doesn't support push notifications. You can still receive email notifications.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Email Notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
        </div>
        
        <div className="space-y-3">
          <Checkbox
            id="email-enabled"
            checked={settings.email.enabled}
            onChange={(checked) => handleEmailSettingChange('enabled', checked)}
            label="Enable email notifications"
          />
          
          {settings.email.enabled && (
            <div className="ml-6 space-y-2">
              <Checkbox
                id="email-new-posts"
                checked={settings.email.newPosts}
                onChange={(checked) => handleEmailSettingChange('newPosts', checked)}
                label="New blog posts"
              />
              <Checkbox
                id="email-weekly-digest"
                checked={settings.email.weeklyDigest}
                onChange={(checked) => handleEmailSettingChange('weeklyDigest', checked)}
                label="Weekly digest"
              />
              <Checkbox
                id="email-monthly-digest"
                checked={settings.email.monthlyDigest}
                onChange={(checked) => handleEmailSettingChange('monthlyDigest', checked)}
                label="Monthly digest"
              />
              <Checkbox
                id="email-comment-replies"
                checked={settings.email.commentReplies}
                onChange={(checked) => handleEmailSettingChange('commentReplies', checked)}
                label="Comment replies"
              />
              <Checkbox
                id="email-system-updates"
                checked={settings.email.systemUpdates}
                onChange={(checked) => handleEmailSettingChange('systemUpdates', checked)}
                label="System updates and announcements"
              />
            </div>
          )}
        </div>
      </div>

      {/* Browser Notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A3 3 0 002 8.5V12h1V8.5a2 2 0 01.586-1.414l.707-.707A2 2 0 015.5 6H9V5H5.5a3 3 0 00-2.121.879z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Browser Notifications</h3>
        </div>

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800">
              Browser notifications are blocked. Please enable them in your browser settings to receive push notifications.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable browser notifications
              </label>
              <p className="text-xs text-gray-500">
                Get instant notifications for new content
              </p>
            </div>
            <Button
              onClick={handleBrowserNotificationToggle}
              disabled={isSubscribing || permission === 'denied'}
              variant={isSubscribed ? 'outline' : 'primary'}
              size="sm"
            >
              {isSubscribing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isSubscribed ? 'Disabling...' : 'Enabling...'}
                </div>
              ) : (
                isSubscribed ? 'Disable' : 'Enable'
              )}
            </Button>
          </div>

          {isSubscribed && (
            <div className="ml-0 space-y-2">
              <Checkbox
                id="browser-new-posts"
                checked={settings.browser.newPosts}
                onChange={(checked) => handleBrowserSettingChange('newPosts', checked)}
                label="New blog posts"
              />
              <Checkbox
                id="browser-trending-posts"
                checked={settings.browser.trendingPosts}
                onChange={(checked) => handleBrowserSettingChange('trendingPosts', checked)}
                label="Trending posts"
              />
            </div>
          )}

          {isSubscribed && (
            <div className="pt-2">
              <Button
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
                disabled={testNotificationSent}
              >
                {testNotificationSent ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Test Sent
                  </div>
                ) : (
                  'Send Test Notification'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Notification Status</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Email notifications:</span>
            <span className={settings.email.enabled ? 'text-green-600' : 'text-gray-400'}>
              {settings.email.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Browser notifications:</span>
            <span className={isSubscribed ? 'text-green-600' : 'text-gray-400'}>
              {isSubscribed ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Permission status:</span>
            <span className={`${
              permission === 'granted' ? 'text-green-600' : 
              permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {permission === 'granted' ? 'Granted' : 
               permission === 'denied' ? 'Denied' : 'Not requested'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;