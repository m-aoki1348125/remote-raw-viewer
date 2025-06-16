import React, { useEffect } from 'react';
import { useToast } from '../hooks/useToast';

interface ErrorInfo {
  error: Error;
  errorInfo: React.ErrorInfo;
  timestamp: Date;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: ErrorInfo[] = [];
  private maxErrors = 50;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: Error, errorInfo?: React.ErrorInfo) {
    const errorEntry: ErrorInfo = {
      error,
      errorInfo: errorInfo || { componentStack: '' },
      timestamp: new Date()
    };

    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', error);
      if (errorInfo) {
        console.error('Component Stack:', errorInfo.componentStack);
      }
    }

    // In production, you might want to send errors to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorEntry);
    }
  }

  private reportError(errorInfo: ErrorInfo) {
    // Placeholder for error reporting service integration
    // Example: Sentry, LogRocket, Bugsnag, etc.
    console.warn('Error reported:', errorInfo.error.message);
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const now = new Date();
    const last24Hours = this.errors.filter(
      error => now.getTime() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      total: this.errors.length,
      last24Hours: last24Hours.length,
      mostRecent: this.errors[0]?.timestamp
    };
  }
}

interface ErrorLoggerProviderProps {
  children: React.ReactNode;
}

const ErrorLoggerProvider: React.FC<ErrorLoggerProviderProps> = ({ children }) => {
  const { showError } = useToast();

  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;
      ErrorLogger.getInstance().logError(error);
      showError('Application Error', 'An unexpected error occurred');
    };

    const handleUnhandledPromiseRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      ErrorLogger.getInstance().logError(error);
      showError('Promise Rejection', 'An asynchronous operation failed');
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledPromiseRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledPromiseRejection);
    };
  }, [showError]);

  return <>{children}</>;
};

export { ErrorLogger, ErrorLoggerProvider };
export default ErrorLoggerProvider;