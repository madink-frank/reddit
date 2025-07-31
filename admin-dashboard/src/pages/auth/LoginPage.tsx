import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { authService } from '../../services/auth';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, error, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authUrl = authService.getRedditAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initiate login');
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <article className="bg-white rounded-xl shadow-lg p-8 space-y-6" role="main" aria-labelledby="login-title">
          {/* Header */}
          <header className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4" role="img" aria-label="Security lock icon">
              <Lock className="icon-xl text-blue-600" aria-hidden="true" />
            </div>
            <h1 id="login-title" className="text-2xl font-bold text-gray-900 mb-2">
              Reddit Content Platform
            </h1>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Admin Dashboard
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              Sign in with your Reddit account to access the admin panel
            </p>
            <p className="text-xs text-gray-500">
              Only authorized administrators can access this dashboard
            </p>
          </header>

          {/* Error Message */}
          {error && (
            <section 
              className="rounded-lg bg-red-50 border border-red-200 p-4" 
              role="alert" 
              aria-labelledby="error-title"
              aria-describedby="error-description"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="icon text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 id="error-title" className="text-sm font-medium text-red-800">
                    Authentication Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p id="error-description">{error}</p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-sm font-medium text-red-800 hover:text-red-600 transition-colors"
                      aria-label="Dismiss error message"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Login Button */}
          <section aria-labelledby="login-section">
            <h3 id="login-section" className="sr-only">Authentication</h3>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              aria-describedby="login-description"
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 icon text-white" aria-hidden="true" />
                  <span>Redirecting to Reddit...</span>
                  <span className="sr-only">Please wait while we redirect you to Reddit for authentication</span>
                </>
              ) : (
                <>
                  <svg
                    className="icon mr-3"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    role="img"
                    aria-label="Reddit logo"
                  >
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                  <span>Sign in with Reddit</span>
                </>
              )}
            </button>
            <p id="login-description" className="sr-only">
              Click this button to authenticate with your Reddit account and access the admin dashboard
            </p>
          </section>

          {/* Footer */}
          <footer className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing in, you agree to our terms of service and privacy policy.
              <br />
              This application requires Reddit API access for content analysis.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default LoginPage;