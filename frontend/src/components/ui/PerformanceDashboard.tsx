import React from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import ProgressBar from './ProgressBar';
import StatusIndicator from './StatusIndicator';

interface PerformanceDashboardProps {
  className?: string;
  compact?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { 
    metrics, 
    alerts, 
    performanceScore, 
    clearAlerts,
    isMonitoring 
  } = usePerformanceMonitor();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'online';
    if (score >= 60) return 'connecting';
    return 'error';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <StatusIndicator
          status={isMonitoring ? getScoreStatus(performanceScore) : 'offline'}
          label={`Performance: ${performanceScore}%`}
          size="sm"
        />
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            className="text-xs text-red-600 hover:text-red-800"
          >
            {alerts.length} alert{alerts.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          Performance Monitor
        </h3>
        <StatusIndicator
          status={isMonitoring ? 'online' : 'offline'}
          label={isMonitoring ? 'Monitoring' : 'Stopped'}
          size="sm"
        />
      </div>

      {/* Performance Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Score</span>
          <span className="text-lg font-bold text-gray-900">{performanceScore}%</span>
        </div>
        <ProgressBar
          value={performanceScore}
          max={100}
          color={getScoreColor(performanceScore)}
          size="lg"
          showPercentage={false}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500">Render Time</div>
            <div className="text-sm font-medium">
              {metrics.renderTime.toFixed(2)}ms
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Memory Usage</div>
            <div className="text-sm font-medium">
              {metrics.memoryUsage.toFixed(1)}MB
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500">Connections</div>
            <div className="text-sm font-medium">
              {metrics.connectionCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">API Avg Response</div>
            <div className="text-sm font-medium">
              {metrics.apiResponseTimes.length > 0 
                ? `${(metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.apiResponseTimes.length).toFixed(0)}ms`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-red-700">
              Performance Alerts ({alerts.length})
            </span>
            <button
              onClick={clearAlerts}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {alerts.slice(-5).map((alert, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="mt-4 text-xs text-gray-400 border-t border-gray-200 pt-2">
        Last updated: {metrics.lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PerformanceDashboard;