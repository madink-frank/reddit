import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAuthContext } from '../stores/auth';
import { useAdminPrivileges } from '../hooks/useAdminPrivileges';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = true,
  fallbackPath = '/auth/login'
}) => {
  const { initialized } = useAuthContext();
  const { 
    isAuthenticated, 
    isLoading, 
    error,
    isTokenExpired,
    isTokenExpiringSoon,
    refreshTokens,
    logout
  } = useAuthStore();
  const location = useLocation();
  const { 
    isAdmin, 
    isLoading: isCheckingAdmin, 
    error: adminError 
  } = useAdminPrivileges();

  // Check token expiration and refresh if needed
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (!isAuthenticated) return;

      try {
        if (isTokenExpired()) {
          console.log('Token expired, attempting refresh...');
          await refreshTokens();
        } else if (isTokenExpiringSoon()) {
          console.log('Token expiring soon, refreshing...');
          await refreshTokens();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    };

    checkAndRefreshToken();
  }, [isAuthenticated, isTokenExpired, isTokenExpiringSoon, refreshTokens, logout]);

  // Show loading while initializing auth
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking admin permissions
  if (requireAdmin && isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-red-200 rounded-full mx-auto flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-gray-600">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Show permission error if admin privileges are required but not granted
  if (requireAdmin && !isAdmin && !isCheckingAdmin) {
    const errorMessage = adminError || 'Access denied. Administrator privileges required.';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Access Denied</h2>
              <p className="mt-2 text-gray-600">{errorMessage}</p>
              <p className="mt-2 text-sm text-gray-500">
                Contact your system administrator if you believe this is an error.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => logout()}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show general auth error if present
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Authentication Error</h2>
              <p className="mt-2 text-gray-600">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/auth/login';
                  }}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Return to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
};