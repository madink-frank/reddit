/**
 * New Post Notifier Component
 * Shows notifications for new posts and handles user engagement
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { notificationService } from '@/services/notificationService';
import { useNotifications } from '@/hooks/useNotifications';

interface NewPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  url: string;
  imageUrl?: string;
}

interface NewPostNotifierProps {
  posts: NewPost[];
  onNotificationSent?: (postId: string, notificationsSent: number) => void;
  className?: string;
}

const NewPostNotifier: React.FC<NewPostNotifierProps> = ({
  posts,
  onNotificationSent,
  className = ''
}) => {
  const [notifyingPosts, setNotifyingPosts] = useState<Set<string>>(new Set());
  const [notificationResults, setNotificationResults] = useState<Record<string, { success: boolean; count: number }>>({});
  const [showBanner, setShowBanner] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);

  const { showNotification, isSupported: isPushSupported } = useNotifications();

  // Check for new posts and show banner
  useEffect(() => {
    const lastVisit = localStorage.getItem('lastVisit');
    const now = new Date().toISOString();
    
    if (lastVisit) {
      const newPosts = posts.filter(post => 
        new Date(post.publishedAt) > new Date(lastVisit)
      );
      
      if (newPosts.length > 0) {
        setNewPostsCount(newPosts.length);
        setShowBanner(true);
        
        // Show browser notification for the latest post
        if (isPushSupported && newPosts[0]) {
          showBrowserNotificationForPost(newPosts[0]);
        }
      }
    }
    
    localStorage.setItem('lastVisit', now);
  }, [posts, isPushSupported]);

  const showBrowserNotificationForPost = async (post: NewPost) => {
    try {
      await showNotification(`New Post: ${post.title}`, {
        body: post.excerpt,
        tag: `new-post-${post.id}`,
        requireInteraction: false,
        data: { url: post.url }
      });
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  };

  const handleNotifySubscribers = async (post: NewPost) => {
    setNotifyingPosts(prev => new Set(prev).add(post.id));

    try {
      const result = await notificationService.notifyNewPost({
        postId: post.id,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        publishedAt: post.publishedAt,
        url: post.url,
        ...(post.imageUrl && { imageUrl: post.imageUrl })
      });

      setNotificationResults(prev => ({
        ...prev,
        [post.id]: { success: result.success, count: result.notificationsSent }
      }));

      onNotificationSent?.(post.id, result.notificationsSent);

      if (result.success) {
        // Show success notification
        await showNotification('Notifications Sent!', {
          body: `Notified ${result.notificationsSent} subscribers about "${post.title}"`,
          tag: 'notification-sent',
          requireInteraction: false
        });
      }
    } catch (error) {
      console.error('Failed to notify subscribers:', error);
      setNotificationResults(prev => ({
        ...prev,
        [post.id]: { success: false, count: 0 }
      }));
    } finally {
      setNotifyingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  const handleNotifyTrending = async (post: NewPost) => {
    setNotifyingPosts(prev => new Set(prev).add(post.id));

    try {
      const result = await notificationService.notifyTrendingPost({
        postId: post.id,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        publishedAt: post.publishedAt,
        url: post.url,
        ...(post.imageUrl && { imageUrl: post.imageUrl })
      });

      setNotificationResults(prev => ({
        ...prev,
        [post.id]: { success: result.success, count: result.notificationsSent }
      }));

      if (result.success) {
        await showNotification('Trending Alert Sent!', {
          body: `Notified ${result.notificationsSent} subscribers about trending post`,
          tag: 'trending-sent',
          requireInteraction: false
        });
      }
    } catch (error) {
      console.error('Failed to send trending notification:', error);
    } finally {
      setNotifyingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  const renderNewPostsBanner = () => {
    if (!showBanner || newPostsCount === 0) return null;

    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">
                {newPostsCount} New Post{newPostsCount > 1 ? 's' : ''} Available!
              </h3>
              <p className="text-sm opacity-90">
                Check out the latest insights and trends
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="text-white border-white hover:bg-white hover:text-blue-600"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowBanner(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              View Posts
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPostNotificationControls = (post: NewPost) => {
    const isNotifying = notifyingPosts.has(post.id);
    const result = notificationResults[post.id];

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex items-start gap-4">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {post.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {post.category}
              </span>
              <span>•</span>
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleNotifySubscribers(post)}
                disabled={isNotifying}
              >
                {isNotifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Notifying...
                  </div>
                ) : (
                  'Notify Subscribers'
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNotifyTrending(post)}
                disabled={isNotifying}
              >
                Mark as Trending
              </Button>
              
              {result && (
                <div className={`text-sm px-2 py-1 rounded ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success 
                    ? `✓ Sent to ${result.count} subscribers`
                    : '✗ Failed to send'
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderNewPostsBanner()}
      
      {posts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Controls
          </h3>
          {posts.slice(0, 5).map(post => renderPostNotificationControls(post))}
        </div>
      )}
    </div>
  );
};

export default NewPostNotifier;