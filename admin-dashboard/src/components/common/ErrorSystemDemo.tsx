/**
 * Error System Demo Component
 * 
 * Demonstrates the improved error message system with various error types
 */

import React from 'react';
import { Button } from '../ui/Button';
import { 
  ErrorHandler, 
  useErrorHandler, 
  createNetworkError, 
  createValidationError, 
  createPermissionError, 
  createSystemError, 
  createUserError 
} from './ErrorHandler';
import { ToastContainer, useToast } from './ErrorToast';

export const ErrorSystemDemo: React.FC = () => {
  const { 
    errors, 
    addError, 
    dismissError, 
    retryError, 
    reportError, 
    clearAllErrors 
  } = useErrorHandler();

  const {
    toasts,
    removeToast,
    showError,
    showWarning,
    showInfo,
    showSuccess
  } = useToast();

  const handleNetworkError = () => {
    addError(createNetworkError('Failed to connect to the server', {
      feature: 'Data Sync',
      action: 'Fetching user data',
      context: { endpoint: '/api/users', method: 'GET' }
    }));
  };

  const handleValidationError = () => {
    addError(createValidationError('Email address format is invalid', 'email', {
      feature: 'User Registration',
      action: 'Form submission',
      context: { field: 'email', value: 'invalid-email' }
    }));
  };

  const handlePermissionError = () => {
    addError(createPermissionError('You need admin privileges to access this feature', {
      feature: 'User Management',
      action: 'Delete user account',
      context: { requiredRole: 'admin', userRole: 'user' }
    }));
  };

  const handleSystemError = () => {
    addError(createSystemError('Database connection timeout', {
      severity: 'critical',
      feature: 'Data Storage',
      action: 'Save user preferences',
      stackTrace: 'Error: Connection timeout\n  at Database.connect (db.js:45)\n  at UserService.save (user.js:123)',
      context: { database: 'postgresql', timeout: 30000 }
    }));
  };

  const handleUserError = () => {
    addError(createUserError('The selected file is too large. Maximum size is 10MB.', {
      feature: 'File Upload',
      action: 'Upload profile picture',
      context: { fileSize: '15MB', maxSize: '10MB', fileName: 'profile.jpg' }
    }));
  };

  const handleToastError = () => {
    showError('This is a quick error notification', {
      action: {
        label: 'Retry',
        onClick: () => showSuccess('Retry successful!')
      }
    });
  };

  const handleToastWarning = () => {
    showWarning('Your session will expire in 5 minutes', {
      duration: 8000,
      action: {
        label: 'Extend Session',
        onClick: () => showSuccess('Session extended!')
      }
    });
  };

  const handleRetry = (errorId: string) => {
    const success = retryError(errorId);
    if (success) {
      showSuccess('Action retried successfully!');
    }
  };

  const handleReport = (errorId: string) => {
    reportError(errorId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Improved Error Message System Demo
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This demo showcases the enhanced error handling system with user-friendly messages, 
          appropriate icons and colors, retry buttons, and help links.
        </p>

        {/* Error Trigger Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handleNetworkError}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <span className="font-medium">Network Error</span>
            <span className="text-xs text-gray-500">Connection issues</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleValidationError}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <span className="font-medium">Validation Error</span>
            <span className="text-xs text-gray-500">Form validation</span>
          </Button>

          <Button
            variant="outline"
            onClick={handlePermissionError}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <span className="font-medium">Permission Error</span>
            <span className="text-xs text-gray-500">Access denied</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleSystemError}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <span className="font-medium">System Error</span>
            <span className="text-xs text-gray-500">Critical system issue</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleUserError}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <span className="font-medium">User Error</span>
            <span className="text-xs text-gray-500">User action required</span>
          </Button>

          <Button
            variant="outline"
            onClick={clearAllErrors}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <span className="font-medium">Clear All</span>
            <span className="text-xs text-gray-500">Remove all errors</span>
          </Button>
        </div>

        {/* Toast Demo Buttons */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Toast Notifications
          </h3>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleToastError}>
              Show Error Toast
            </Button>
            <Button variant="outline" onClick={handleToastWarning}>
              Show Warning Toast
            </Button>
            <Button variant="outline" onClick={() => showInfo('This is an info message')}>
              Show Info Toast
            </Button>
            <Button variant="outline" onClick={() => showSuccess('Operation completed successfully!')}>
              Show Success Toast
            </Button>
          </div>
        </div>

        {/* Error Display */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Active Errors ({errors.length})
          </h3>
          
          {errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No active errors. Try triggering some errors above to see the improved error handling.
            </div>
          ) : (
            <ErrorHandler
              errors={errors}
              onDismiss={dismissError}
              onRetry={handleRetry}
              onReport={handleReport}
              showStackTrace={true}
            />
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
};