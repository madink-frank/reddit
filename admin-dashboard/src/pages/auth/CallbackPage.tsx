import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { authService } from '../../services/auth';

export const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setError } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'verifying' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const storedState = localStorage.getItem('reddit_auth_state');

        // Handle OAuth errors
        if (error) {
          throw new Error(`Reddit OAuth error: ${error}`);
        }

        // Validate callback parameters
        if (!code || !state) {
          throw new Error('Missing authentication parameters');
        }

        if (state !== storedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Clean up stored state
        localStorage.removeItem('reddit_auth_state');

        setStatus('verifying');

        // Exchange code for tokens
        const tokens = await authService.login({ code, state });
        
        // Login and verify admin privileges
        await login(tokens);

        // Redirect to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        setErrorMessage(message);
        setError(message);
        setStatus('error');
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/auth/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, setError, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing authentication...</p>
            <p className="mt-2 text-sm text-gray-500">Exchanging authorization code for tokens</p>
          </>
        );
      
      case 'verifying':
        return (
          <>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-gray-600">Verifying admin privileges...</p>
            <p className="mt-2 text-sm text-gray-500">Checking user permissions and setting up session</p>
          </>
        );
      
      case 'error':
        return (
          <>
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
            <p className="mt-4 text-red-600 font-medium">Authentication Failed</p>
            <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
            <p className="mt-4 text-xs text-gray-500">Redirecting to login page...</p>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Reddit Content Platform
            </h2>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};