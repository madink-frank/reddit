import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// import { config } from '@/config/env';
import { Header, SkipLink } from './Header';
import { Footer } from './Footer';
import { initializeTheme } from '../../hooks/useTheme';
import { 
  AriaManager, 
  ScreenReaderUtils, 
  MotionPreferences,
  AccessibilityTester 
} from '@/utils/accessibility';

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onSearch?: ((query: string) => void) | undefined;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showSearch = true,
  onSearch 
}) => {
  const location = useLocation();

  // Initialize theme and accessibility features on mount
  useEffect(() => {
    initializeTheme();
    
    // Add skip link for keyboard navigation
    ScreenReaderUtils.addSkipLink('main-content', 'Skip to main content');
    
    // Run accessibility checks in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        AccessibilityTester.logIssues();
      }, 1000);
    }

    // Set up motion preferences
    const cleanup = MotionPreferences.onMotionPreferenceChange((prefersReduced) => {
      document.documentElement.classList.toggle('reduce-motion', prefersReduced);
    });

    // Set initial motion preference
    document.documentElement.classList.toggle('reduce-motion', MotionPreferences.prefersReducedMotion());

    return cleanup;
  }, []);

  // Handle route changes for accessibility
  useEffect(() => {
    // Announce route changes to screen readers
    const pageTitle = document.title;
    AriaManager.announce(`Navigated to ${pageTitle}`, 'polite');
    
    // Focus main content after route change
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
      {/* Screen reader announcements */}
      <div 
        id="sr-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
      
      {/* Skip Link for Accessibility */}
      <SkipLink />
      
      {/* Header */}
      <Header 
        showSearch={showSearch}
        onSearch={onSearch || undefined}
        searchPlaceholder="Search articles..."
      />

      {/* Main Content */}
      <main 
        id="main-content" 
        className="flex-1 focus:outline-none" 
        role="main"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;