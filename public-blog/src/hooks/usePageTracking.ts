import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

// Hook to automatically track page views
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    trackPageView({
      page_path: location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
};

export default usePageTracking;