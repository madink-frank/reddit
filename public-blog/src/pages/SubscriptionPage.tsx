import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import SEO from '@/components/SEO';
import SubscriptionManager from '@/components/ui/SubscriptionManager';
import RetentionFeatures from '@/components/ui/RetentionFeatures';
import NewsletterSubscription from '@/components/ui/NewsletterSubscription';
import { subscriptionService } from '@/services/subscriptionService';
import type { 
  NewsletterSubscription as NewsletterSubscriptionType, 
  UnsubscribeRequest, 
  SubscriptionStats 
} from '@/types/subscription';

const SubscriptionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action'); // 'unsubscribe', 'preferences', 'confirm'
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subscription, setSubscription] = useState<NewsletterSubscriptionType | null>(null);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);

  // Unsubscribe form
  const [unsubscribeData, setUnsubscribeData] = useState<UnsubscribeRequest>({
    email: email,
    token: token,
    reason: ''
  });

  // Removed preferences state - now handled by SubscriptionManager component

  // Load subscription stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await subscriptionService.getSubscriptionStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load subscription stats:', error);
      }
    };

    loadStats();
  }, []);

  // Handle different actions based on URL parameters
  useEffect(() => {
    if (action === 'confirm' && token) {
      handleConfirmSubscription();
    } else if (action === 'preferences' && email && token) {
      loadSubscriptionPreferences();
    }
  }, [action, token, email]);

  const handleConfirmSubscription = async () => {
    setLoading(true);
    try {
      const response = await subscriptionService.confirmSubscription(token);
      setMessage({
        type: response.success ? 'success' : 'error',
        text: response.message
      });
      if (response.subscription) {
        setSubscription(response.subscription);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to confirm subscription. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionPreferences = async () => {
    setLoading(true);
    try {
      const status = await subscriptionService.getSubscriptionStatus(email);
      if (status.subscribed && status.subscription) {
        setSubscription(status.subscription);
      } else {
        setMessage({
          type: 'error',
          text: 'Subscription not found or invalid token.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to load subscription preferences.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await subscriptionService.unsubscribe(unsubscribeData);
      setMessage({
        type: response.success ? 'success' : 'error',
        text: response.message
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to unsubscribe. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed handleUpdatePreferences - now handled by SubscriptionManager component

  const renderConfirmationPage = () => (
    <div className="text-center">
      {loading ? (
        <div className="flex items-center justify-center mb-6">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : message ? (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p>{message.text}</p>
        </div>
      ) : null}

      {subscription && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Subscription Confirmed!
          </h2>
          <p className="text-gray-600 mb-4">
            You'll receive {subscription.preferences.frequency} updates at {subscription.email}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/blog">
              <Button>Browse Articles</Button>
            </Link>
            <Link to={`/subscription?action=preferences&email=${subscription.email}&token=${token}`}>
              <Button variant="outline">Manage Preferences</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const renderUnsubscribePage = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Unsubscribe from Newsletter
        </h2>
        <p className="text-gray-600">
          We're sorry to see you go. You can unsubscribe below.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {!message?.type || message.type === 'error' ? (
        <form onSubmit={handleUnsubscribe} className="space-y-4">
          <div>
            <label htmlFor="unsubscribe-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="unsubscribe-email"
              type="email"
              value={unsubscribeData.email}
              onChange={(e) => setUnsubscribeData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="unsubscribe-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for unsubscribing (optional)
            </label>
            <textarea
              id="unsubscribe-reason"
              value={unsubscribeData.reason}
              onChange={(e) => setUnsubscribeData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Help us improve by telling us why you're unsubscribing..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !unsubscribeData.email}
            className="w-full"
          >
            {loading ? 'Unsubscribing...' : 'Unsubscribe'}
          </Button>
        </form>
      ) : (
        <div className="text-center">
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      )}
    </div>
  );

  const renderPreferencesPage = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Management
        </h2>
        <p className="text-gray-600">
          Customize your experience and manage all your notification preferences
        </p>
      </div>

      {/* Retention Features */}
      <div className="mb-8">
        <RetentionFeatures userEmail={email} />
      </div>

      {/* Subscription Manager */}
      <SubscriptionManager
        email={email}
        token={token}
        onUpdate={(updatedSubscription) => {
          setSubscription(updatedSubscription);
          setMessage({
            type: 'success',
            text: 'Subscription updated successfully!'
          });
        }}
      />
    </div>
  );

  const renderDefaultPage = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Newsletter Subscription
        </h1>
        <p className="text-lg text-gray-600">
          Stay updated with the latest insights and trends from Reddit
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.activeSubscribers.toLocaleString()}
            </div>
            <div className="text-gray-600">Active Subscribers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              +{stats.growthRate}%
            </div>
            <div className="text-gray-600">Monthly Growth</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.popularCategories.length}
            </div>
            <div className="text-gray-600">Content Categories</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            What You'll Get
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Trending Topics</h3>
                <p className="text-gray-600">Discover what's trending across Reddit communities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Curated Content</h3>
                <p className="text-gray-600">Hand-picked articles and insights from our analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Early Access</h3>
                <p className="text-gray-600">Be the first to know about emerging trends and insights</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Enhanced Newsletter Subscription */}
          <NewsletterSubscription
            variant="inline"
            showPreferences={true}
            showPushNotifications={true}
            availableCategories={[
              { name: 'Technology', slug: 'technology' },
              { name: 'Gaming', slug: 'gaming' },
              { name: 'Science', slug: 'science' },
              { name: 'Entertainment', slug: 'entertainment' }
            ]}
            availableTags={[
              { name: 'AI', slug: 'ai' },
              { name: 'Reddit', slug: 'reddit' },
              { name: 'Trends', slug: 'trends' },
              { name: 'Social Media', slug: 'social-media' }
            ]}
            onSubscribe={(response) => {
              if (response.success) {
                setMessage({
                  type: 'success',
                  text: response.message
                });
              }
            }}
            className="mb-6"
          />
          
          <div className="text-center">
            <Link to="/blog">
              <Button className="mb-4">
                Browse Latest Articles
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mb-4">
              Or manage your existing subscription:
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/subscription?action=unsubscribe">
                <Button variant="outline" size="sm">
                  Unsubscribe
                </Button>
              </Link>
              <Link to="/subscription?action=preferences">
                <Button variant="outline" size="sm">
                  Manage Preferences
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SEO
        title="Newsletter Subscription"
        description="Stay updated with the latest insights and trends from Reddit communities"
        url="/subscription"
      />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {action === 'confirm' && renderConfirmationPage()}
          {action === 'unsubscribe' && renderUnsubscribePage()}
          {action === 'preferences' && renderPreferencesPage()}
          {!action && renderDefaultPage()}
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;