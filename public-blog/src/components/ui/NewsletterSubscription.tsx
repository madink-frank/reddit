import React, { useState } from 'react';
import { Button, Input, Checkbox } from '@/components/ui';
import { subscriptionService } from '@/services/subscriptionService';
import { useNotifications } from '@/hooks/useNotifications';
import type { SubscriptionFormData, SubscriptionResponse } from '@/types/subscription';

interface NewsletterSubscriptionProps {
  variant?: 'inline' | 'modal' | 'sidebar';
  showPreferences?: boolean;
  showPushNotifications?: boolean;
  availableCategories?: Array<{ name: string; slug: string }>;
  availableTags?: Array<{ name: string; slug: string }>;
  onSubscribe?: (response: SubscriptionResponse) => void;
  className?: string;
}

const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({
  variant = 'inline',
  showPreferences = false,
  showPushNotifications = false,
  availableCategories = [],
  availableTags = [],
  onSubscribe,
  className = ''
}) => {
  const [formData, setFormData] = useState<SubscriptionFormData>({
    email: '',
    frequency: 'weekly',
    categories: [],
    tags: [],
    agreeToTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<SubscriptionResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enablePushNotifications, setEnablePushNotifications] = useState(false);
  
  const {
    permission,
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    subscribe: subscribeToPush,
    showNotification
  } = useNotifications();

  const handleInputChange = (field: keyof SubscriptionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...(prev.categories || []), category]
        : (prev.categories || []).filter(c => c !== category)
    }));
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked
        ? [...(prev.tags || []), tag]
        : (prev.tags || []).filter(t => t !== tag)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setResponse(null);

    try {
      const result = await subscriptionService.subscribe(formData);
      setResponse(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          email: '',
          frequency: 'weekly',
          categories: [],
          tags: [],
          agreeToTerms: false
        });

        // Subscribe to push notifications if enabled
        if (enablePushNotifications && isPushSupported && !isPushSubscribed) {
          try {
            await subscribeToPush();
            await showNotification('Welcome!', {
              body: 'You\'ll now receive notifications for new posts',
              tag: 'welcome-notification'
            });
          } catch (error) {
            console.error('Failed to enable push notifications:', error);
          }
        }
      }

      onSubscribe?.(result);
    } catch (error) {
      setResponse({
        success: false,
        message: 'Failed to subscribe. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'modal':
        return 'bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto';
      case 'sidebar':
        return 'bg-gray-50 p-4 rounded-lg';
      default:
        return 'bg-blue-50 p-6 rounded-lg border border-blue-200';
    }
  };

  if (response?.success) {
    return (
      <div className={`${getVariantClasses()} ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Successfully Subscribed!
          </h3>
          <p className="text-gray-600 mb-4">
            {response.message}
          </p>
          {response.requiresConfirmation && (
            <p className="text-sm text-blue-600">
              Please check your email and click the confirmation link to activate your subscription.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Stay Updated
        </h3>
        <p className="text-gray-600">
          Get the latest insights and trends delivered to your inbox
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="newsletter-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
            className={errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Frequency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How often would you like to receive updates?
          </label>
          <div className="space-y-2">
            {[
              { value: 'daily', label: 'Daily - Get the latest posts every day' },
              { value: 'weekly', label: 'Weekly - A curated digest every week' },
              { value: 'monthly', label: 'Monthly - Monthly highlights and trends' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={formData.frequency === option.value}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Preferences */}
        {showPreferences && availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories of Interest (optional)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableCategories.map((category) => (
                <Checkbox
                  key={category.slug}
                  id={`category-${category.slug}`}
                  checked={(formData.categories || []).includes(category.slug)}
                  onChange={(checked) => handleCategoryChange(category.slug, checked)}
                  label={category.name}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tag Preferences */}
        {showPreferences && availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics of Interest (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 10).map((tag) => (
                <label
                  key={tag.slug}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    (formData.tags || []).includes(tag.slug)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(formData.tags || []).includes(tag.slug)}
                    onChange={(e) => handleTagChange(tag.slug, e.target.checked)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Push Notifications */}
        {showPushNotifications && isPushSupported && (
          <div>
            <Checkbox
              id="enable-push"
              checked={enablePushNotifications}
              onChange={setEnablePushNotifications}
              label={
                <span className="text-sm text-gray-700">
                  Enable browser notifications for new posts
                  {permission === 'denied' && (
                    <span className="text-red-600 ml-1">(Permission denied)</span>
                  )}
                </span>
              }
              disabled={isSubmitting || permission === 'denied'}
            />
            {enablePushNotifications && permission === 'default' && (
              <p className="mt-1 text-xs text-blue-600">
                You'll be asked for permission when you subscribe
              </p>
            )}
          </div>
        )}

        {/* Terms Agreement */}
        <div>
          <Checkbox
            id="agree-terms"
            checked={formData.agreeToTerms}
            onChange={(checked) => handleInputChange('agreeToTerms', checked)}
            label={
              <span className="text-sm text-gray-600">
                I agree to receive email updates and accept the{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </span>
            }
            disabled={isSubmitting}
          />
          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
          )}
        </div>

        {/* Error Message */}
        {response && !response.success && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{response.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || !formData.email || !formData.agreeToTerms}
          className="w-full"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Subscribing...
            </div>
          ) : (
            'Subscribe to Newsletter'
          )}
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
};

export default NewsletterSubscription;