import { useState, useCallback } from 'react';
import { ToastData, ToastType } from '../components/ui/Toast';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = `toast-${++toastId}`;
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('success', title, message, options);
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('error', title, message, options);
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('warning', title, message, options);
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('info', title, message, options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};