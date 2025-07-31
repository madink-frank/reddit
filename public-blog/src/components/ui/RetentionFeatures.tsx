/**
 * Retention Features Component
 * Implements features to improve user retention and engagement
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
// import { subscriptionService } from '@/services/subscriptionService';
import { notificationService } from '@/services/notificationService';
import { useNotifications } from '@/hooks/useNotifications';

interface RetentionFeaturesProps {
  userEmail?: string;
  className?: string;
}

interface EngagementData {
  score: number;
  factors: {
    openRate: number;
    clickRate: number;
    timeOnSite: number;
    commentsLeft: number;
    sharesCount: number;
  };
  recommendations: string[];
}

const RetentionFeatures: React.FC<RetentionFeaturesProps> = ({
  userEmail,
  className = ''
}) => {
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reEngagementSent, setReEngagementSent] = useState(false);

  const { showNotification, isSupported: isPushSupported } = useNotifications();

  useEffect(() => {
    if (userEmail) {
      loadEngagementData();
    }
  }, [userEmail]);

  const loadEngagementData = async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const data = await notificationService.getUserEngagementScore(userEmail);
      setEngagementData(data);
      
      // Show personalization options for low-engagement users
      if (data.score < 30) {
        setShowPersonalization(true);
      }
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReEngagement = async () => {
    if (!userEmail || !engagementData) return;

    setLoading(true);
    try {
      // Send personalized re-engagement notification
      if (isPushSupported) {
        await showNotification('We miss you!', {
          body: 'Check out the latest trending topics we think you\'ll love',
          tag: 're-engagement',
          requireInteraction: true
        });
      }

      // Track the re-engagement attempt
      await notificationService.trackNotificationInteraction(
        'retention-' + Date.now(),
        'opened',
        { type: 're-engagement', userScore: engagementData.score }
      );

      setReEngagementSent(true);
      setTimeout(() => setReEngagementSent(false), 5000);
    } catch (error) {
      console.error('Failed to send re-engagement notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEngagementLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 80) {
      return {
        level: 'Highly Engaged',
        color: 'text-green-600',
        description: 'You\'re one of our most active readers!'
      };
    } else if (score >= 50) {
      return {
        level: 'Moderately Engaged',
        color: 'text-blue-600',
        description: 'You regularly engage with our content'
      };
    } else if (score >= 20) {
      return {
        level: 'Lightly Engaged',
        color: 'text-yellow-600',
        description: 'We\'d love to see you more often!'
      };
    } else {
      return {
        level: 'New Reader',
        color: 'text-gray-600',
        description: 'Welcome! Let\'s personalize your experience'
      };
    }
  };

  const renderEngagementScore = () => {
    if (!engagementData) return null;

    const { level, color, description } = getEngagementLevel(engagementData.score);

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Engagement Score
          </h3>
          <div className={`text-2xl font-bold ${color}`}>
            {engagementData.score}/100
          </div>
        </div>

        <div className="mb-4">
          <div className={`text-sm font-medium ${color} mb-1`}>
            {level}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              engagementData.score >= 80 ? 'bg-green-500' :
              engagementData.score >= 50 ? 'bg-blue-500' :
              engagementData.score >= 20 ? 'bg-yellow-500' : 'bg-gray-400'
            }`}
            style={{ width: `${engagementData.score}%` }}
          />
        </div>

        {/* Engagement factors */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email Open Rate:</span>
            <span className="ml-2 font-medium">
              {(engagementData.factors.openRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Click Rate:</span>
            <span className="ml-2 font-medium">
              {(engagementData.factors.clickRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Avg. Time on Site:</span>
            <span className="ml-2 font-medium">
              {Math.floor(engagementData.factors.timeOnSite / 60)}m {engagementData.factors.timeOnSite % 60}s
            </span>
          </div>
          <div>
            <span className="text-gray-500">Comments:</span>
            <span className="ml-2 font-medium">
              {engagementData.factors.commentsLeft}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPersonalizationSuggestions = () => {
    if (!engagementData || !showPersonalization) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              Personalize Your Experience
            </h4>
            <p className="text-blue-800 mb-4">
              Based on your reading patterns, here are some recommendations to get more value from our content:
            </p>
            <ul className="space-y-2 mb-4">
              {engagementData.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {recommendation}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => setShowPersonalization(false)}
              >
                Update Preferences
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPersonalization(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReEngagementPrompt = () => {
    if (!engagementData || engagementData.score > 30) return null;

    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            We Miss You!
          </h4>
          <p className="text-gray-600 mb-4">
            It looks like you haven't been as active lately. Let us know what content you'd like to see more of!
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={handleReEngagement}
              disabled={loading || reEngagementSent}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {reEngagementSent ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sent!
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                'Get Personalized Recommendations'
              )}
            </Button>
            <Button variant="outline">
              Update My Interests
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderReadingStreak = () => {
    if (!engagementData) return null;

    // Mock reading streak data - in real app this would come from the API
    const streak = Math.floor(engagementData.score / 10);
    const nextMilestone = Math.ceil(streak / 5) * 5;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Reading Streak
            </h4>
            <p className="text-sm text-gray-600">
              Keep the momentum going!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-orange-600">
            {streak}
          </div>
          <div className="text-sm text-gray-600">
            days in a row
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to {nextMilestone} days</span>
            <span>{streak}/{nextMilestone}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(streak / nextMilestone) * 100}%` }}
            />
          </div>
        </div>

        {streak >= 7 && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <p className="text-sm text-orange-800">
              🎉 Amazing! You've been reading consistently for {streak} days. 
              {streak >= 30 && " You're a true Reddit trends enthusiast!"}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading && !engagementData) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userEmail || !engagementData) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderPersonalizationSuggestions()}
      {renderReEngagementPrompt()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderEngagementScore()}
        {renderReadingStreak()}
      </div>
    </div>
  );
};

export default RetentionFeatures;