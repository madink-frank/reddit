/**
 * Subscription Manager Component
 * Comprehensive subscription management with email and push notifications
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Checkbox } from '@/components/ui';
import { subscriptionService } from '@/services/subscriptionService';
import { useNotifications } from '@/hooks/useNotifications';
import type { 
  NewsletterSubscription
} from '@/types/subscription';

interface SubscriptionManagerProps {
  email?: string;
  token?: string;
  onUpdate?: (subscription: NewsletterSubscription) => void;
  className?: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  email: initialEmail = '',
  token = '',
  onUpdate,
  className = ''
}) => {
  const [subscription, setSubscription] = useState<NewsletterSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'stats'>('preferences');

  // Form states
  const [preferences, setPreferences] = useState({
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    categories: [] as string[],
    tags: [] as string[],
    digestFormat: 'summary' as 'summary' | 'full',
    includeComments: false
  });

  const [emailForLookup, setEmailForLookup] = useState(initialEmail);

  const {
    permission,
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    showNotification
  } = useNotifications();

  // Load subscription data
  useEffect(() => {
    if (initialEmail) {
      loadSubscription(initialEmail);
    }
  }, [initialEmail]);

  const loadSubscription = async (email: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const status = await subscriptionService.getSubscriptionStatus(email);
      if (status.subscribed && status.subscription) {
        setSubscription(status.subscription);
        setPreferences(status.subscription.preferences);
      } else {
        setMessage({
          type: 'error',
          text: 'No active subscription found for this email address.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to load subscription information.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForLookup.trim()) return;
    await loadSubscription(emailForLookup);
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await subscriptionService.updatePreferences({
        email: subscription.email,
        token,
        preferences
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Preferences updated successfully!'
        });
        
        // Update local subscription data
        const updatedSubscription = {
          ...subscription,
          preferences: response.preferences || preferences
        };
        setSubscription(updatedSubscription);
        onUpdate?.(updatedSubscription);
      } else {
        setMessage({
          type: 'error',
          text: response.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update preferences. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;

    const confirmed = window.confirm(
      'Are you sure you want to unsubscribe from all email notifications?'
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await subscriptionService.unsubscribe({
        email: subscription.email,
        token,
        reason: 'User requested unsubscribe'
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Successfully unsubscribed from email notifications.'
        });
        setSubscription(null);
      } else {
        setMessage({
          type: 'error',
          text: response.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to unsubscribe. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePushNotificationToggle = async () => {
    try {
      if (isPushSubscribed) {
        await unsubscribeFromPush();
        setMessage({
          type: 'success',
          text: 'Browser notifications disabled.'
        });
      } else {
        await subscribeToPush();
        await showNotification('Notifications Enabled', {
          body: 'You\'ll now receive browser notifications for new posts',
          tag: 'notification-enabled'
        });
        setMessage({
          type: 'success',
          text: 'Browser notifications enabled!'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update notification settings.'
      });
    }
  };

  const renderSubscriptionLookup = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Manage Your Subscription
        </h2>
        <p className="text-gray-600">
          Enter your email address to view and manage your subscription preferences
        </p>
      </div>

      <form onSubmit={handleLookupSubscription} className="space-y-4">
        <div>
          <label htmlFor="lookup-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="lookup-email"
            type="email"
            value={emailForLookup}
            onChange={(e) => setEmailForLookup(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !emailForLookup.trim()}
          className="w-full"
        >
          {loading ? 'Looking up...' : 'Find My Subscription'}
        </Button>
      </form>
    </div>
  );

  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { id: 'preferences', label: 'Email Preferences', icon: '📧' },
          { id: 'notifications', label: 'Push Notifications', icon: '🔔' },
          { id: 'stats', label: 'Subscription Stats', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderPreferencesTab = () => (
    <form onSubmit={handleUpdatePreferences} className="space-y-6">
      {/* Email Frequency */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Email Frequency
        </h3>
        <div className="space-y-2">
          {[
            { value: 'daily', label: 'Daily - Get the latest posts every day', desc: 'Perfect for staying up-to-date' },
            { value: 'weekly', label: 'Weekly - A curated digest every week', desc: 'Most popular choice' },
            { value: 'monthly', label: 'Monthly - Monthly highlights and trends', desc: 'Just the highlights' }
          ].map((option) => (
            <div key={option.value} className="flex items-start">
              <input
                type="radio"
                name="frequency"
                value={option.value}
                checked={preferences.frequency === option.value}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  frequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                }))}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {option.label}
                </label>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Format */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Content Format
        </h3>
        <div className="space-y-2">
          <label className="flex items-start">
            <input
              type="radio"
              name="digestFormat"
              value="summary"
              checked={preferences.digestFormat === 'summary'}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                digestFormat: e.target.value as 'summary' | 'full' 
              }))}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Summary Format</span>
              <p className="text-xs text-gray-500">Brief excerpts and highlights - easier to scan</p>
            </div>
          </label>
          <label className="flex items-start">
            <input
              type="radio"
              name="digestFormat"
              value="full"
              checked={preferences.digestFormat === 'full'}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                digestFormat: e.target.value as 'summary' | 'full' 
              }))}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Full Content</span>
              <p className="text-xs text-gray-500">Complete articles in email - read without clicking</p>
            </div>
          </label>
        </div>
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Options
        </h3>
        <Checkbox
          id="include-comments"
          checked={preferences.includeComments}
          onChange={(checked) => setPreferences(prev => ({ ...prev, includeComments: checked }))}
          label="Include popular comments and discussions in digest"
          disabled={loading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleUnsubscribe}
          disabled={loading}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Unsubscribe
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* Browser Notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Browser Notifications
            </h3>
            <p className="text-sm text-gray-600">
              Get instant notifications for new posts
            </p>
          </div>
          {isPushSupported && (
            <Button
              onClick={handlePushNotificationToggle}
              variant={isPushSubscribed ? 'outline' : 'primary'}
              disabled={permission === 'denied'}
            >
              {isPushSubscribed ? 'Disable' : 'Enable'}
            </Button>
          )}
        </div>

        {!isPushSupported && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              Browser notifications are not supported in your current browser.
            </p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              Browser notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {isPushSubscribed && (
          <div className="mt-4 space-y-2">
            <Checkbox
              id="push-new-posts"
              checked={notificationSettings.browser.newPosts}
              onChange={(checked) => updateNotificationSettings({
                browser: { ...notificationSettings.browser, newPosts: checked }
              })}
              label="New blog posts"
            />
            <Checkbox
              id="push-trending"
              checked={notificationSettings.browser.trendingPosts}
              onChange={(checked) => updateNotificationSettings({
                browser: { ...notificationSettings.browser, trendingPosts: checked }
              })}
              label="Trending posts"
            />
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-2">
          <Checkbox
            id="email-new-posts"
            checked={notificationSettings.email.newPosts}
            onChange={(checked) => updateNotificationSettings({
              email: { ...notificationSettings.email, newPosts: checked }
            })}
            label="New blog posts"
          />
          <Checkbox
            id="email-weekly-digest"
            checked={notificationSettings.email.weeklyDigest}
            onChange={(checked) => updateNotificationSettings({
              email: { ...notificationSettings.email, weeklyDigest: checked }
            })}
            label="Weekly digest"
          />
          <Checkbox
            id="email-monthly-digest"
            checked={notificationSettings.email.monthlyDigest}
            onChange={(checked) => updateNotificationSettings({
              email: { ...notificationSettings.email, monthlyDigest: checked }
            })}
            label="Monthly digest"
          />
          <Checkbox
            id="email-system-updates"
            checked={notificationSettings.email.systemUpdates}
            onChange={(checked) => updateNotificationSettings({
              email: { ...notificationSettings.email, systemUpdates: checked }
            })}
            label="System updates and announcements"
          />
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {subscription && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Subscription
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{subscription.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className={`capitalize ${
                subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {subscription.status}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Subscribed Since</label>
              <p className="text-gray-900">
                {subscription.subscribedAt ? new Date(subscription.subscribedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Frequency</label>
              <p className="text-gray-900 capitalize">{subscription.preferences.frequency}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notification Status
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Email notifications:</span>
            <span className={`text-sm ${notificationSettings.email.enabled ? 'text-green-600' : 'text-gray-400'}`}>
              {notificationSettings.email.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Browser notifications:</span>
            <span className={`text-sm ${isPushSubscribed ? 'text-green-600' : 'text-gray-400'}`}>
              {isPushSubscribed ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Permission status:</span>
            <span className={`text-sm ${
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

  if (!subscription && !loading) {
    return (
      <div className={className}>
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <p>{message.text}</p>
          </div>
        )}
        {renderSubscriptionLookup()}
      </div>
    );
  }

  return (
    <div className={className}>
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {subscription && !loading && (
        <>
          {renderTabs()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'stats' && renderStatsTab()}
        </>
      )}
    </div>
  );
};

export default SubscriptionManager;