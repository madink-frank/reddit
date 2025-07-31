/**
 * Error Toast Component
 * 
 * Provides quick, non-intrusive error notifications
 */

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorToastProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  type = 'error',
  duration = 5000,
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          text: 'text-red-800 dark:text-red-200'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          text: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          text: 'text-blue-800 dark:text-blue-200'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          text: 'text-green-800 dark:text-green-200'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
          icon: <Info className="w-5 h-5 text-gray-500" />,
          text: 'text-gray-800 dark:text-gray-200'
        };
    }
  };

  if (!isVisible) return null;

  const styles = getTypeStyles();

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-in-out',
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
          styles.container
        )}
      >
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', styles.text)}>
            {message}
          </p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'mt-2 text-xs font-medium underline hover:no-underline',
                styles.text
              )}
            >
              {action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors duration-200'
          )}
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
      </div>
    </div>
  );
};

// Toast container for managing multiple toasts
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index
          }}
        >
          <ErrorToast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>>([]);

  const addToast = (
    message: string,
    type: 'error' | 'warning' | 'info' | 'success' = 'info',
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = {
      id,
      message,
      type,
      duration: options?.duration ?? 5000,
      action: options?.action
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const showError = (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void; } }) =>
    addToast(message, 'error', options);

  const showWarning = (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void; } }) =>
    addToast(message, 'warning', options);

  const showInfo = (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void; } }) =>
    addToast(message, 'info', options);

  const showSuccess = (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void; } }) =>
    addToast(message, 'success', options);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showError,
    showWarning,
    showInfo,
    showSuccess
  };
};