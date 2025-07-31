/**
 * Environment configuration for the public blog
 * Validates and exports environment variables with proper typing
 */

interface BlogConfig {
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;
  
  // Blog Configuration
  blogTitle: string;
  blogDescription: string;
  blogAuthor: string;
  blogUrl: string;
  
  // SEO Configuration
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  
  // Social Media
  twitterHandle: string;
  facebookPage: string;
  linkedinPage: string;
  
  // Analytics
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  
  // Features
  enableComments: boolean;
  enableSearch: boolean;
  enableRss: boolean;
  enableNewsletter: boolean;
  
  // Pagination
  postsPerPage: number;
  searchResultsPerPage: number;
  
  // Cache
  cacheDuration: number;
  
  // Development
  debugMode: boolean;
  mockApi: boolean;
  
  // Push Notifications
  vapidPublicKey?: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getNumberEnvVar = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
};

export const config: BlogConfig = {
  // API Configuration
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api/v1'),
  apiTimeout: getNumberEnvVar('VITE_API_TIMEOUT', 10000),
  
  // Blog Configuration
  blogTitle: getEnvVar('VITE_BLOG_TITLE', 'Reddit Trends Blog'),
  blogDescription: getEnvVar('VITE_BLOG_DESCRIPTION', 'Discover trending topics and insights from Reddit communities'),
  blogAuthor: getEnvVar('VITE_BLOG_AUTHOR', 'Reddit Content Platform'),
  blogUrl: getEnvVar('VITE_BLOG_URL', 'https://blog.reddit-platform.com'),
  
  // SEO Configuration
  siteName: getEnvVar('VITE_SITE_NAME', 'Reddit Trends Blog'),
  siteDescription: getEnvVar('VITE_SITE_DESCRIPTION', 'Stay updated with the latest trends and insights from Reddit communities'),
  siteKeywords: getEnvVar('VITE_SITE_KEYWORDS', 'reddit,trends,blog,social media,content,analysis'),
  
  // Social Media
  twitterHandle: getEnvVar('VITE_TWITTER_HANDLE', '@reddittrends'),
  facebookPage: getEnvVar('VITE_FACEBOOK_PAGE', 'reddittrends'),
  linkedinPage: getEnvVar('VITE_LINKEDIN_PAGE', 'reddit-trends'),
  
  // Analytics
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  googleTagManagerId: import.meta.env.VITE_GOOGLE_TAG_MANAGER_ID,
  
  // Features
  enableComments: getBooleanEnvVar('VITE_ENABLE_COMMENTS', false),
  enableSearch: getBooleanEnvVar('VITE_ENABLE_SEARCH', true),
  enableRss: getBooleanEnvVar('VITE_ENABLE_RSS', true),
  enableNewsletter: getBooleanEnvVar('VITE_ENABLE_NEWSLETTER', true),
  
  // Pagination
  postsPerPage: getNumberEnvVar('VITE_POSTS_PER_PAGE', 12),
  searchResultsPerPage: getNumberEnvVar('VITE_SEARCH_RESULTS_PER_PAGE', 10),
  
  // Cache
  cacheDuration: getNumberEnvVar('VITE_CACHE_DURATION', 300000), // 5 minutes
  
  // Development
  debugMode: getBooleanEnvVar('VITE_DEBUG_MODE', false),
  mockApi: getBooleanEnvVar('VITE_MOCK_API', false),
  
  // Push Notifications
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
};

// Validate required configuration
if (config.debugMode) {
  console.log('Blog Configuration:', config);
}

export default config;