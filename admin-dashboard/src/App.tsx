import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { useAdvancedDashboard, useDashboardShortcuts } from './hooks/useAdvancedDashboard';
import { ThemeTransitionStyles } from './components/ui/ThemeSwitch';
import { initializeCSSOptimization } from './utils/cssLoader';
import SkipLinks from './components/ui/SkipLinks';
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';
import './App.css';

// Advanced loading component with theme support
const LoadingFallback = () => (
  <div className="min-h-screen bg-background-primary flex items-center justify-center">
    <div className="text-center">
      <div className="loading-spinner mx-auto mb-4"></div>
      <p className="text-secondary">Loading advanced dashboard...</p>
    </div>
  </div>
);

// Dashboard initialization component
const DashboardInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInitialized, isLoading, error } = useAdvancedDashboard();
  useDashboardShortcuts(); // Enable keyboard shortcuts
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Listen for keyboard shortcuts modal event
  useEffect(() => {
    const handleShowShortcuts = () => setShowShortcutsModal(true);
    document.addEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    return () => document.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-secondary">Initializing advanced dashboard...</p>
          <p className="text-tertiary text-sm mt-2">Setting up real-time monitoring and analysis tools</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="dashboard-card max-w-md">
          <h2 className="text-lg font-semibold text-error mb-4">Dashboard Initialization Failed</h2>
          <p className="text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="dashboard-card max-w-md">
          <h2 className="text-lg font-semibold text-warning mb-4">Dashboard Not Ready</h2>
          <p className="text-secondary mb-4">The advanced dashboard is not properly initialized.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
    </>
  );
};

// Simple error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
            <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error?.stack && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show error details
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
              <a
                href="/test"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Go to Test Page
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load pages with proper error handling
const LoginPage = React.lazy(() =>
  import('./pages/auth/LoginPage').catch(() => ({
    default: () => <div className="p-8 text-center">Login page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage').catch(() => ({
    default: () => <div className="p-8 text-center">Dashboard page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const KeywordsPage = React.lazy(() =>
  import('./pages/KeywordsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Keywords page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const PostsPage = React.lazy(() =>
  import('./pages/PostsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Posts page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const AnalyticsPage = React.lazy(() =>
  import('./pages/AnalyticsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Analytics page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const ContentPage = React.lazy(() =>
  import('./pages/ContentPage').catch(() => ({
    default: () => <div className="p-8 text-center">Content page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const MonitoringPage = React.lazy(() =>
  import('./pages/MonitoringPage').catch(() => ({
    default: () => <div className="p-8 text-center">Monitoring page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const BillingPage = React.lazy(() =>
  import('./pages/BillingPage').catch(() => ({
    default: () => <div className="p-8 text-center">Billing page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const TestPage = React.lazy(() =>
  import('./pages/TestPage').catch(() => ({
    default: () => <div className="p-8 text-center">Test page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const ImageAnalysisPage = React.lazy(() =>
  import('./pages/ImageAnalysisPage').catch(() => ({
    default: () => <div className="p-8 text-center">Image Analysis page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const AdvancedAnalyticsPage = React.lazy(() =>
  import('./pages/AdvancedAnalyticsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Advanced Analytics page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const BusinessIntelligencePage = React.lazy(() =>
  import('./pages/BusinessIntelligencePage').catch(() => ({
    default: () => <div className="p-8 text-center">Business Intelligence page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const ForecastingPage = React.lazy(() =>
  import('./pages/ForecastingPage').catch(() => ({
    default: () => <div className="p-8 text-center">Forecasting page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const RealTimeMonitoringPage = React.lazy(() =>
  import('./pages/RealTimeMonitoringPage').catch(() => ({
    default: () => <div className="p-8 text-center">Real-time Monitoring page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const ReportsPage = React.lazy(() =>
  import('./pages/ReportsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Reports page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const ExportPage = React.lazy(() =>
  import('./pages/ExportPage').catch(() => ({
    default: () => <div className="p-8 text-center">Export page not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const ProductionDashboard = React.lazy(() =>
  import('./components/monitoring/ProductionDashboard').catch(() => ({
    default: () => <div className="p-8 text-center">Production Dashboard not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

const FeedbackDashboard = React.lazy(() =>
  import('./components/feedback/FeedbackDashboard').catch(() => ({
    default: () => <div className="p-8 text-center">Feedback Dashboard not found</div>
  })) as Promise<{ default: React.ComponentType<any> }>
);

function App() {
  console.log('App component rendering...');
  console.log('Environment:', import.meta.env.VITE_NODE_ENV);
  console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

  // Initialize CSS optimization on app start
  useEffect(() => {
    initializeCSSOptimization();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <ThemeTransitionStyles />
        <QueryProvider>
          <DashboardInitializer>
            <SkipLinks />
            <Router>
              <Suspense fallback={<LoadingFallback />}>
                <div className="app-container">
                  {/* Main application landmark */}
                  <main id="main-content" role="main" tabIndex={-1} aria-label="Reddit Content Platform Admin Dashboard">
                    <Routes>
                  {/* Public routes */}
                  <Route path="/auth/login" element={<LoginPage />} />

                  {/* Admin routes */}
                  <Route path="/admin/dashboard" element={<DashboardPage />} />
                  <Route path="/admin/keywords" element={<KeywordsPage />} />
                  <Route path="/admin/posts" element={<PostsPage />} />
                  <Route path="/admin/analytics" element={<AnalyticsPage />} />
                  <Route path="/admin/content" element={<ContentPage />} />
                  <Route path="/admin/monitoring" element={<MonitoringPage />} />
                  <Route path="/admin/billing" element={<BillingPage />} />
                  <Route path="/admin/image-analysis" element={<ImageAnalysisPage />} />
                  <Route path="/admin/advanced-analytics" element={<AdvancedAnalyticsPage />} />
                  <Route path="/admin/business-intelligence" element={<BusinessIntelligencePage />} />
                  <Route path="/admin/forecasting" element={<ForecastingPage />} />
                  <Route path="/admin/real-time-monitoring" element={<RealTimeMonitoringPage />} />
                  <Route path="/admin/reports" element={<ReportsPage />} />
                  <Route path="/admin/export" element={<ExportPage />} />
                  <Route path="/admin/production-monitoring" element={<ProductionDashboard />} />
                  <Route path="/admin/feedback" element={<FeedbackDashboard />} />
                  <Route path="/test" element={<TestPage />} />

                  {/* Default redirects */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/" element={<Navigate to="/admin" replace />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                  </main>
                </div>
              </Suspense>
            </Router>
            
            {/* Global Feedback Widget */}
            <FeedbackWidget position="bottom-right" theme="light" />
          </DashboardInitializer>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;