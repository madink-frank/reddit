/**
 * Comprehensive Error Handler
 * 
 * Provides consistent error handling and user feedback across all features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  X,
  Info,
  Bug,
  Clock,
  Wifi,
  Shield,
  AlertCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export interface ErrorInfo {
  id: string;
  type: 'network' | 'validation' | 'permission' | 'system' | 'user' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  timestamp: Date;
  feature?: string;
  action?: string;
  retryable: boolean;
  userFriendly: boolean;
  stackTrace?: string;
  context?: Record<string, any>;
  helpUrl?: string;
  suggestedActions?: string[];
}

export interface ErrorAction {
  label: string;
  handler: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

interface ErrorHandlerProps {
  errors: ErrorInfo[];
  onDismiss: (errorId: string) => void;
  onRetry: (errorId: string) => void;
  onReport: (errorId: string) => void;
  maxVisible?: number;
  autoHideDelay?: number;
  showStackTrace?: boolean;
}

interface ErrorNotificationProps {
  error: ErrorInfo;
  onDismiss: () => void;
  onRetry: () => void;
  onReport: () => void;
  onViewDetails: () => void;
  showStackTrace?: boolean;
}

// User-friendly error messages mapping
const ERROR_MESSAGES = {
  network: {
    default: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
    timeout: "The request took too long to complete. Please try again.",
    offline: "You appear to be offline. Please check your internet connection.",
    serverError: "Our servers are experiencing issues. We're working to fix this.",
    rateLimited: "Too many requests. Please wait a moment before trying again."
  },
  validation: {
    default: "Please check your input and try again.",
    required: "This field is required.",
    format: "Please enter a valid format.",
    length: "Input length is invalid.",
    duplicate: "This value already exists."
  },
  permission: {
    default: "You don't have permission to perform this action.",
    login: "Please log in to continue.",
    expired: "Your session has expired. Please log in again.",
    insufficient: "You need additional permissions for this action."
  },
  system: {
    default: "Something went wrong on our end. We're working to fix this.",
    maintenance: "The system is currently under maintenance. Please try again later.",
    overload: "The system is experiencing high load. Please try again in a few minutes.",
    configuration: "There's a configuration issue. Please contact support."
  },
  user: {
    default: "Please review your input and try again.",
    notFound: "The requested item could not be found.",
    conflict: "This action conflicts with existing data.",
    limit: "You've reached the limit for this action."
  },
  unknown: {
    default: "An unexpected error occurred. Please try again or contact support if the issue persists.",
    generic: "Something unexpected happened. We're looking into it.",
    unhandled: "This error type is not recognized. Please contact support."
  }
} as const;

// Help URLs for different error types
const HELP_URLS = {
  network: "/help/connection-issues",
  validation: "/help/form-validation",
  permission: "/help/account-permissions",
  system: "/help/technical-issues",
  user: "/help/user-guide",
  unknown: "/help/general-support"
} as const;

// Suggested actions for different error types
const SUGGESTED_ACTIONS = {
  network: [
    "Check your internet connection",
    "Try refreshing the page",
    "Wait a few minutes and try again"
  ],
  validation: [
    "Review the highlighted fields",
    "Check the format requirements",
    "Ensure all required fields are filled"
  ],
  permission: [
    "Log in to your account",
    "Contact your administrator",
    "Check your account permissions"
  ],
  system: [
    "Try again in a few minutes",
    "Clear your browser cache",
    "Contact support if the issue persists"
  ],
  user: [
    "Review your input",
    "Check the help documentation",
    "Try a different approach"
  ],
  unknown: [
    "Try refreshing the page",
    "Clear your browser cache and try again",
    "Contact support with details about what you were doing"
  ]
} as const;

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  onReport,
  onViewDetails,
  showStackTrace = false
}) => {
  const getSeverityColor = (severity: ErrorInfo['severity']) => {
    switch (severity) {
      case 'low':
        return 'border-l-4 border-l-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'medium':
        return 'border-l-4 border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high':
        return 'border-l-4 border-l-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-l-4 border-l-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getSeverityIcon = (severity: ErrorInfo['severity'], type: ErrorInfo['type']) => {
    const iconClass = "w-5 h-5";

    // Choose icon based on type first, then severity
    switch (type) {
      case 'network':
        return <Wifi className={`${iconClass} text-blue-500`} />;
      case 'permission':
        return <Shield className={`${iconClass} text-orange-500`} />;
      case 'validation':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      case 'system':
        return severity === 'critical'
          ? <XCircle className={`${iconClass} text-red-500`} />
          : <AlertTriangle className={`${iconClass} text-orange-500`} />;
      case 'user':
        return <Info className={`${iconClass} text-blue-500`} />;
      default:
        switch (severity) {
          case 'low':
            return <Info className={`${iconClass} text-blue-500`} />;
          case 'medium':
            return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
          case 'high':
            return <AlertTriangle className={`${iconClass} text-orange-500`} />;
          case 'critical':
            return <XCircle className={`${iconClass} text-red-500`} />;
          default:
            return <AlertTriangle className={`${iconClass} text-gray-500`} />;
        }
    }
  };

  const getTypeLabel = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'network':
        return 'Connection Issue';
      case 'validation':
        return 'Input Error';
      case 'permission':
        return 'Access Denied';
      case 'system':
        return 'System Error';
      case 'user':
        return 'Action Required';
      default:
        return 'Error';
    }
  };

  const getUserFriendlyMessage = (error: ErrorInfo): string => {
    if (error.userFriendly && error.message) {
      return error.message;
    }

    // Try to match specific error patterns
    const originalMessage = error.message.toLowerCase();

    // Handle type-specific error patterns
    if (error.type === 'network') {
      const networkMessages = ERROR_MESSAGES.network;
      if (originalMessage.includes('timeout')) return networkMessages.timeout;
      if (originalMessage.includes('offline')) return networkMessages.offline;
      if (originalMessage.includes('server') || originalMessage.includes('500')) return networkMessages.serverError;
      if (originalMessage.includes('rate') || originalMessage.includes('429')) return networkMessages.rateLimited;
      return networkMessages.default;
    }

    if (error.type === 'validation') {
      const validationMessages = ERROR_MESSAGES.validation;
      if (originalMessage.includes('required')) return validationMessages.required;
      if (originalMessage.includes('format') || originalMessage.includes('invalid')) return validationMessages.format;
      if (originalMessage.includes('length')) return validationMessages.length;
      if (originalMessage.includes('duplicate') || originalMessage.includes('exists')) return validationMessages.duplicate;
      return validationMessages.default;
    }

    if (error.type === 'permission') {
      const permissionMessages = ERROR_MESSAGES.permission;
      if (originalMessage.includes('login') || originalMessage.includes('authenticate')) return permissionMessages.login;
      if (originalMessage.includes('expired') || originalMessage.includes('token')) return permissionMessages.expired;
      if (originalMessage.includes('insufficient') || originalMessage.includes('forbidden')) return permissionMessages.insufficient;
      return permissionMessages.default;
    }

    // Use predefined user-friendly messages for other types
    const typeMessages = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.system;
    return typeMessages.default;
  };

  const getHelpUrl = (error: ErrorInfo): string => {
    return error.helpUrl || HELP_URLS[error.type] || HELP_URLS.system;
  };

  const getSuggestedActions = (error: ErrorInfo): string[] => {
    return error.suggestedActions || [...(SUGGESTED_ACTIONS[error.type] || SUGGESTED_ACTIONS.system)];
  };

  const userFriendlyMessage = getUserFriendlyMessage(error);
  const helpUrl = getHelpUrl(error);
  const suggestedActions = getSuggestedActions(error);

  return (
    <div className={`card ${getSeverityColor(error.severity)} mb-3 p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getSeverityIcon(error.severity, error.type)}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {getTypeLabel(error.type)}
              </h4>

              {error.feature && (
                <Badge variant="outline" className="text-xs">
                  {error.feature}
                </Badge>
              )}

              <Badge
                variant={error.severity === 'critical' ? 'destructive' : 'secondary'}
                className="text-xs capitalize"
              >
                {error.severity}
              </Badge>
            </div>

            <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">
              {userFriendlyMessage}
            </p>

            {error.details && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
                {error.details}
              </p>
            )}

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Try these steps:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {suggestedActions.slice(0, 3).map((action, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{error.timestamp.toLocaleTimeString()}</span>

              {error.action && (
                <>
                  <span>•</span>
                  <span>Action: {error.action}</span>
                </>
              )}
            </div>

            {showStackTrace && error.stackTrace && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                  <Bug className="w-3 h-3" />
                  Show technical details
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32 font-mono">
                  {error.stackTrace}
                </pre>
              </details>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 ml-3">
          {error.retryable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs flex items-center gap-1"
              title="Try this action again"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(helpUrl, '_blank')}
            className="text-xs flex items-center gap-1"
            title="Get help with this issue"
          >
            <HelpCircle className="w-3 h-3" />
            Help
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-xs"
            title="View detailed information"
          >
            Details
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReport}
            className="text-xs flex items-center gap-1"
            title="Report this issue to support"
          >
            <Bug className="w-3 h-3" />
            Report
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-xs"
            title="Dismiss this error"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  errors,
  onDismiss,
  onRetry,
  onReport,
  maxVisible = 5,
  autoHideDelay = 10000,
  showStackTrace = false
}) => {
  const [selectedError, setSelectedError] = useState<ErrorInfo | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Auto-hide low severity errors
  useEffect(() => {
    const lowSeverityErrors = errors.filter(error => error.severity === 'low');

    lowSeverityErrors.forEach(error => {
      const timer = setTimeout(() => {
        onDismiss(error.id);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    });
  }, [errors, autoHideDelay, onDismiss]);

  const handleViewDetails = useCallback((error: ErrorInfo) => {
    setSelectedError(error);
    setIsDetailsModalOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedError(null);
  }, []);

  const visibleErrors = errors
    .sort((a, b) => {
      // Sort by severity (critical first) then by timestamp (newest first)
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    })
    .slice(0, maxVisible);

  if (errors.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {/* Error Summary */}
        {errors.length > maxVisible && (
          <div className="dashboard-card border-l-4 border-l-info bg-info/5">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-info" />
              <div>
                <p className="text-sm font-medium text-primary">
                  {errors.length - maxVisible} more errors
                </p>
                <p className="text-xs text-secondary">
                  Showing {maxVisible} most recent errors. Check the error log for complete history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Notifications */}
        {visibleErrors.map(error => (
          <ErrorNotification
            key={error.id}
            error={error}
            onDismiss={() => onDismiss(error.id)}
            onRetry={() => onRetry(error.id)}
            onReport={() => onReport(error.id)}
            onViewDetails={() => handleViewDetails(error)}
            showStackTrace={showStackTrace}
          />
        ))}
      </div>

      {/* Error Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        title="Error Details"
        size="lg"
      >
        {selectedError && (() => {
          const getSeverityIcon = (severity: ErrorInfo['severity'], type: ErrorInfo['type']) => {
            const iconClass = "w-5 h-5";

            switch (type) {
              case 'network':
                return <Wifi className={`${iconClass} text-blue-500`} />;
              case 'permission':
                return <Shield className={`${iconClass} text-orange-500`} />;
              case 'validation':
                return <AlertCircle className={`${iconClass} text-yellow-500`} />;
              case 'system':
                return severity === 'critical'
                  ? <XCircle className={`${iconClass} text-red-500`} />
                  : <AlertTriangle className={`${iconClass} text-orange-500`} />;
              case 'user':
                return <Info className={`${iconClass} text-blue-500`} />;
              default:
                switch (severity) {
                  case 'low':
                    return <Info className={`${iconClass} text-blue-500`} />;
                  case 'medium':
                    return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
                  case 'high':
                    return <AlertTriangle className={`${iconClass} text-orange-500`} />;
                  case 'critical':
                    return <XCircle className={`${iconClass} text-red-500`} />;
                  default:
                    return <AlertTriangle className={`${iconClass} text-gray-500`} />;
                }
            }
          };

          const getTypeLabel = (type: ErrorInfo['type']) => {
            switch (type) {
              case 'network':
                return 'Connection Issue';
              case 'validation':
                return 'Input Error';
              case 'permission':
                return 'Access Denied';
              case 'system':
                return 'System Error';
              case 'user':
                return 'Action Required';
              default:
                return 'Error';
            }
          };

          const getUserFriendlyMessage = (error: ErrorInfo): string => {
            if (error.userFriendly && error.message) {
              return error.message;
            }
            const typeMessages = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.system;
            return typeMessages.default;
          };

          const getSuggestedActions = (error: ErrorInfo): string[] => {
            return error.suggestedActions || [...(SUGGESTED_ACTIONS[error.type] || SUGGESTED_ACTIONS.system)];
          };

          const getHelpUrl = (error: ErrorInfo): string => {
            return error.helpUrl || HELP_URLS[error.type] || HELP_URLS.system;
          };

          return (
            <div className="space-y-6">
              {/* Error Overview */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getSeverityIcon(selectedError.severity, selectedError.type)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {getTypeLabel(selectedError.type)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getUserFriendlyMessage(selectedError)}
                  </p>
                </div>
                <Badge
                  variant={selectedError.severity === 'critical' ? 'destructive' : 'secondary'}
                  className="capitalize"
                >
                  {selectedError.severity}
                </Badge>
              </div>

              {/* Suggested Actions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Recommended Actions
                </h4>
                <div className="space-y-2">
                  {getSuggestedActions(selectedError).map((action, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">{selectedError.type}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Feature</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedError.feature || 'Unknown'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedError.timestamp.toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Error ID</label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono text-xs">{selectedError.id}</p>
                </div>
              </div>

              {selectedError.details && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Additional Details</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1 text-sm">{selectedError.details}</p>
                </div>
              )}

              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Context Information</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32 font-mono">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}

              {selectedError.stackTrace && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Technical Stack Trace</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40 font-mono">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {selectedError.retryable && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onRetry(selectedError.id);
                        handleCloseDetails();
                      }}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Action
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => window.open(getHelpUrl(selectedError), '_blank')}
                    className="flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Get Help
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      onReport(selectedError.id);
                      handleCloseDetails();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Bug className="w-4 h-4" />
                    Report Issue
                  </Button>
                </div>

                <Button variant="ghost" onClick={handleCloseDetails}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
};

// Error Handler Hook
export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback((error: Omit<ErrorInfo, 'id' | 'timestamp'>) => {
    const newError: ErrorInfo = {
      ...error,
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      // Set default help URL and suggested actions if not provided
      helpUrl: error.helpUrl || HELP_URLS[error.type] || HELP_URLS.system,
      suggestedActions: error.suggestedActions || [...(SUGGESTED_ACTIONS[error.type] || SUGGESTED_ACTIONS.system)]
    };

    setErrors(prev => [newError, ...prev]);

    // Log error for debugging
    console.error('Error added:', newError);

    return newError.id;
  }, []);

  const dismissError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const retryError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (error && error.retryable) {
      // Remove the error and let the calling component handle retry
      dismissError(errorId);
      return true;
    }
    return false;
  }, [errors, dismissError]);

  const reportError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (error) {
      // In a real app, this would send the error to a reporting service
      console.log('Reporting error:', error);

      // Simulate sending to error reporting service
      const reportData = {
        errorId: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: error.timestamp.toISOString(),
        context: error.context,
        stackTrace: error.stackTrace
      };

      // For now, just show a success message
      addError({
        type: 'system',
        severity: 'low',
        message: 'Thank you! Your error report has been submitted to our support team.',
        details: `Report ID: ${error.id.substring(0, 8)}`,
        retryable: false,
        userFriendly: true
      });
    }
  }, [errors, addError]);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    dismissError,
    retryError,
    reportError,
    clearAllErrors
  };
};

// Utility functions for creating better error messages
export const createErrorInfo = (
  type: ErrorInfo['type'],
  severity: ErrorInfo['severity'],
  message: string,
  options: Partial<Pick<ErrorInfo, 'details' | 'feature' | 'action' | 'retryable' | 'userFriendly' | 'helpUrl' | 'suggestedActions' | 'context'>> = {}
): Omit<ErrorInfo, 'id' | 'timestamp'> => {
  return {
    type,
    severity,
    message,
    retryable: options.retryable ?? (type === 'network' || type === 'system'),
    userFriendly: options.userFriendly ?? true,
    details: options.details,
    feature: options.feature,
    action: options.action,
    helpUrl: options.helpUrl,
    suggestedActions: options.suggestedActions,
    context: options.context
  };
};

// Pre-defined error creators for common scenarios
export const createNetworkError = (message?: string, options?: Partial<ErrorInfo>) =>
  createErrorInfo('network', 'medium', message || 'Network connection failed', {
    retryable: true,
    suggestedActions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a few minutes and try again'
    ],
    ...options
  });

export const createValidationError = (message: string, field?: string, options?: Partial<ErrorInfo>) =>
  createErrorInfo('validation', 'low', message, {
    retryable: false,
    details: field ? `Field: ${field}` : undefined,
    suggestedActions: [
      'Review the highlighted fields',
      'Check the format requirements',
      'Ensure all required fields are filled'
    ],
    ...options
  });

export const createPermissionError = (message?: string, options?: Partial<ErrorInfo>) =>
  createErrorInfo('permission', 'medium', message || 'Access denied', {
    retryable: false,
    suggestedActions: [
      'Log in to your account',
      'Contact your administrator',
      'Check your account permissions'
    ],
    ...options
  });

export const createSystemError = (message?: string, options?: Partial<ErrorInfo>) =>
  createErrorInfo('system', 'high', message || 'System error occurred', {
    retryable: true,
    suggestedActions: [
      'Try again in a few minutes',
      'Clear your browser cache',
      'Contact support if the issue persists'
    ],
    ...options
  });

export const createUserError = (message: string, options?: Partial<ErrorInfo>) =>
  createErrorInfo('user', 'low', message, {
    retryable: false,
    suggestedActions: [
      'Review your input',
      'Check the help documentation',
      'Try a different approach'
    ],
    ...options
  });