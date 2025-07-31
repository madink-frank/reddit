import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FocusManager, 
  AriaManager, 
  ScreenReaderUtils, 
  MotionPreferences,
  AccessibilityTester 
} from '@/utils/accessibility';

interface AccessibleLayoutProps {
  children: React.ReactNode;
  skipToMainId?: string;
  announceRouteChanges?: boolean;
  className?: string;
}

const AccessibleLayout: React.FC<AccessibleLayoutProps> = ({
  children,
  skipToMainId = 'main-content',
  announceRouteChanges = true,
  className = ''
}) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousLocationRef = useRef<string>('');

  // Add skip link on component mount
  useEffect(() => {
    ScreenReaderUtils.addSkipLink(skipToMainId, 'Skip to main content');
    
    // Run accessibility checks in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        AccessibilityTester.logIssues();
      }, 1000);
    }
  }, [skipToMainId]);

  // Handle route changes for accessibility
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    if (previousLocationRef.current !== currentPath) {
      // Focus main content area after route change
      if (mainRef.current) {
        mainRef.current.focus();
        mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Announce route change to screen readers
      if (announceRouteChanges && previousLocationRef.current) {
        const pageTitle = document.title;
        AriaManager.announce(`Navigated to ${pageTitle}`, 'polite');
      }

      previousLocationRef.current = currentPath;
    }
  }, [location, announceRouteChanges]);

  // Handle reduced motion preferences
  useEffect(() => {
    const cleanup = MotionPreferences.onMotionPreferenceChange((prefersReduced) => {
      document.documentElement.classList.toggle('reduce-motion', prefersReduced);
    });

    // Set initial state
    document.documentElement.classList.toggle('reduce-motion', MotionPreferences.prefersReducedMotion());

    return cleanup;
  }, []);

  return (
    <div className={`accessible-layout ${className}`}>
      {/* Screen reader announcements */}
      <div 
        id="sr-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
      
      {/* Main content with proper landmarks */}
      <main
        id={skipToMainId}
        ref={mainRef}
        tabIndex={-1}
        role="main"
        aria-label="Main content"
        className="focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
};

export default AccessibleLayout;