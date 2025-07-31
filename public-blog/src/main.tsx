import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.tsx';

// Import optimization utilities
import { 
  preloadCriticalResources, 
  prefetchDNS, 
  preconnectDomains,
  registerServiceWorker 
} from '@utils/resourcePreloader';
import { initializePerformanceMonitoring } from '@utils/performance';

// Initialize performance monitoring
initializePerformanceMonitoring();

// Preload critical resources
preloadCriticalResources();

// DNS prefetch for external domains
prefetchDNS([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'api.reddit.com'
]);

// Preconnect to critical domains
preconnectDomains([
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

// Register service worker for caching
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
