/**
 * Preload utilities for critical components and routes
 */

// Preload functions for critical pages
export const preloadDashboard = () => import('../pages/DashboardPage');
export const preloadKeywords = () => import('../pages/KeywordsPage');
export const preloadPosts = () => import('../pages/PostsPage');
export const preloadAnalytics = () => import('../pages/AnalyticsPage');
export const preloadContent = () => import('../pages/ContentPage');

// Preload functions for critical components
export const preloadCharts = () => Promise.all([
  import('../components/charts/TrendLineChart'),
  import('../components/charts/KeywordFrequencyChart'),
  import('../components/charts/SubredditDistributionChart')
]);

export const preloadForms = () => Promise.all([
  import('../components/forms/AddKeywordForm'),
  import('../components/forms/ContentGenerationForm')
]);

/**
 * Preload critical resources on app initialization
 */
export const preloadCriticalResources = () => {
  // Preload dashboard immediately as it's the landing page
  preloadDashboard();
  
  // Preload other critical pages with a slight delay
  setTimeout(() => {
    preloadKeywords();
    preloadPosts();
  }, 1000);
  
  // Preload analytics and content pages after user interaction
  setTimeout(() => {
    preloadAnalytics();
    preloadContent();
  }, 3000);
};

/**
 * Preload resources on user interaction (hover, focus)
 */
export const createPreloadHandler = (preloadFn: () => Promise<any>) => {
  let preloaded = false;
  
  return () => {
    if (!preloaded) {
      preloaded = true;
      preloadFn().catch(console.error);
    }
  };
};