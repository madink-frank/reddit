/**
 * Service Worker registration and management utilities
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              notifyUserOfUpdate();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  console.log('Service Worker not supported');
  return null;
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const result = await registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Check if the app is running offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupOfflineListener(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('App is online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('App is offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Notify user of service worker update
 */
function notifyUserOfUpdate() {
  // This could be integrated with your notification system
  if (window.confirm('A new version is available. Reload to update?')) {
    window.location.reload();
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaitingAndActivate(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }
}

/**
 * Get cache storage usage
 */
export async function getCacheStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  return { usage: 0, quota: 0, percentage: 0 };
}

/**
 * Background sync registration
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

/**
 * Initialize service worker with all features
 */
export async function initializeServiceWorker(): Promise<void> {
  // Register service worker
  const registration = await registerServiceWorker();
  
  if (registration) {
    // Setup offline listener
    setupOfflineListener(
      () => {
        // Handle online event
        document.body.classList.remove('offline');
      },
      () => {
        // Handle offline event
        document.body.classList.add('offline');
      }
    );

    // Log cache usage in development
    if (process.env.NODE_ENV === 'development') {
      const usage = await getCacheStorageUsage();
      console.log('Cache storage usage:', usage);
    }
  }
}