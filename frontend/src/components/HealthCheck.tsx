import React, { useEffect, useState } from 'react';
import { validateEnvironment, isSecureContext } from '../utils/validation';
import { useToast } from '../hooks/useToast';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}

const HealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'healthy',
    issues: [],
    recommendations: []
  });
  const { showWarning, showError } = useToast();

  useEffect(() => {
    const performHealthCheck = () => {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let status: 'healthy' | 'warning' | 'error' = 'healthy';

      // Browser environment validation
      const envValidation = validateEnvironment();
      if (!envValidation.isValid) {
        status = 'error';
        issues.push(...envValidation.errors);
      }
      if (envValidation.warnings.length > 0) {
        if (status === 'healthy') status = 'warning';
        issues.push(...envValidation.warnings);
      }

      // Security context check
      if (!isSecureContext()) {
        status = 'warning';
        issues.push('Application not running in secure context');
        recommendations.push('Use HTTPS for production deployment');
      }

      // Performance checks
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType && 
            ['slow-2g', '2g'].includes(connection.effectiveType)) {
          status = 'warning';
          issues.push('Slow network connection detected');
          recommendations.push('Consider reducing image quality for better performance');
        }
      }

      // Memory usage check
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
        
        if (usedMB > limitMB * 0.8) {
          status = 'warning';
          issues.push('High memory usage detected');
          recommendations.push('Consider refreshing the page or reducing image cache');
        }
      }

      // Local storage availability
      try {
        localStorage.setItem('health-check-test', 'test');
        localStorage.removeItem('health-check-test');
      } catch (error) {
        status = 'warning';
        issues.push('Local storage unavailable');
        recommendations.push('Settings and preferences may not persist');
      }

      setHealthStatus({ status, issues, recommendations });

      // Show notifications for critical issues
      if (status === 'error') {
        showError('System Issues Detected', 'Critical compatibility issues found');
      } else if (status === 'warning' && issues.length > 0) {
        showWarning('Performance Warning', 'Some optimizations recommended');
      }
    };

    performHealthCheck();

    // Periodic health checks
    const interval = setInterval(performHealthCheck, 60000); // Every minute

    return () => clearInterval(interval);
  }, [showWarning, showError]);

  if (healthStatus.status === 'healthy') {
    return null; // Don't show anything when everything is fine
  }

  return (
    <div 
      className={`fixed top-16 right-4 z-40 max-w-sm p-4 rounded-lg shadow-lg ${
        healthStatus.status === 'error' 
          ? 'bg-red-50 border border-red-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {healthStatus.status === 'error' ? (
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            healthStatus.status === 'error' ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {healthStatus.status === 'error' ? 'System Issues' : 'Performance Warning'}
          </h3>
          
          {healthStatus.issues.length > 0 && (
            <div className="mt-2">
              <ul className={`text-xs space-y-1 ${
                healthStatus.status === 'error' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {healthStatus.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {healthStatus.recommendations.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-medium ${
                healthStatus.status === 'error' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                Recommendations:
              </p>
              <ul className={`text-xs space-y-1 mt-1 ${
                healthStatus.status === 'error' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {healthStatus.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;