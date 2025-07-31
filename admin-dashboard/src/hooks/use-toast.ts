import React, { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

let toastState: ToastState = { toasts: [] };
let listeners: Array<(state: ToastState) => void> = [];

const notify = () => {
  listeners.forEach(listener => listener(toastState));
};

export interface UseToastReturn {
  /** Function to create a new toast notification */
  toast: (options: Omit<Toast, 'id'>) => string;
  /** Function to dismiss a toast by ID */
  dismiss: (id: string) => void;
  /** Array of currently active toasts */
  toasts: Toast[];
}

/**
 * Hook for managing toast notifications
 * @returns Object containing toast management functions and current toasts
 */
export const useToast = (): UseToastReturn => {
  const [, forceUpdate] = useState({});

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, title, description, variant, duration };
    
    toastState.toasts.push(newToast);
    notify();

    // Auto remove after duration
    setTimeout(() => {
      toastState.toasts = toastState.toasts.filter(t => t.id !== id);
      notify();
    }, duration);

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    toastState.toasts = toastState.toasts.filter(t => t.id !== id);
    notify();
  }, []);

  // Subscribe to state changes
  React.useEffect(() => {
    const unsubscribe = subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [subscribe]);

  return {
    toast,
    dismiss,
    toasts: toastState.toasts,
  };
};