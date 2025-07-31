import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { config } from '@/config/env';

// Analytics and monitoring
import { initializeAnalytics } from '@/utils/analytics';
import { ErrorBoundary } from '@/utils/errorTracking';
import { initializePerformanceMonitoring } from '@/utils/performance';
import { usePageTracking } from '@/hooks/usePageTracking';

// Layout Components
import { Layout } from '@/components/layout';

// Page Components
import HomePage from '@/pages/HomePage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AboutPage from '@/pages/AboutPage';
import SearchPage from '@/pages/SearchPage';
import CategoryPage from '@/pages/CategoryPage';
import TagPage from '@/pages/TagPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Performance monitoring
import { PerformanceDashboard } from '@/components/ui/PerformanceDashboard';

// Development tools
import AccessibilityPanel from '@/components/dev/AccessibilityPanel';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.cacheDuration,
      gcTime: config.cacheDuration * 2, // Updated from cacheTime to gcTime
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Track page views automatically
  usePageTracking();

  // Initialize analytics and monitoring
  useEffect(() => {
    // Initialize Google Analytics
    initializeAnalytics();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
  }, []);

  // Register service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
              console.log('Notification clicked:', event.data);
              
              // Handle different notification actions
              switch (event.data.action) {
                case 'bookmark':
                  // Show bookmark confirmation
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Bookmarked!', {
                      body: 'Post saved to your bookmarks',
                      tag: 'bookmark-confirmation',
                      requireInteraction: false
                    });
                  }
                  break;
                case 'share':
                  // Trigger share functionality
                  if (navigator.share && event.data.data.url) {
                    navigator.share({
                      title: event.data.data.title || 'Check out this post',
                      url: event.data.data.url
                    }).catch(console.error);
                  }
                  break;
                default:
                  // Default handling is done by service worker
                  break;
              }
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              {/* Home Page */}
              <Route path="/" element={<HomePage />} />
              
              {/* Blog Routes */}
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              
              {/* Category and Tag Routes */}
              <Route path="/category/:categorySlug" element={<CategoryPage />} />
              <Route path="/tag/:tagSlug" element={<TagPage />} />
              
              {/* Search Page */}
              <Route path="/search" element={<SearchPage />} />
              
              {/* About Page */}
              <Route path="/about" element={<AboutPage />} />
              
              {/* Subscription Management */}
              <Route path="/subscription" element={<SubscriptionPage />} />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </Router>
        
        {/* React Query DevTools (only in development) */}
        {config.debugMode && <ReactQueryDevtools initialIsOpen={false} />}
        
        {/* Performance Dashboard (only in development) */}
        <PerformanceDashboard />
        
        {/* Accessibility Panel (only in development) */}
        <AccessibilityPanel />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;