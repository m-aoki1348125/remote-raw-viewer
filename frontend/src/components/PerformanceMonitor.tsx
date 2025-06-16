import React, { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  connectionTime?: number;
  thumbnailLoadTime?: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enabled?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  onMetricsUpdate,
  enabled = false 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0
  });

  const measurePerformance = useCallback(() => {
    if (!enabled) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
    const renderTime = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }

    const newMetrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      memoryUsage
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);
  }, [enabled, onMetricsUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Initial measurement
    setTimeout(measurePerformance, 1000);

    // Periodic measurements
    const interval = setInterval(measurePerformance, 10000);

    return () => clearInterval(interval);
  }, [enabled, measurePerformance]);


  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-40">
      <div className="space-y-1">
        <div>Load: {metrics.loadTime.toFixed(1)}ms</div>
        <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
        {metrics.memoryUsage && (
          <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
        )}
        {metrics.connectionTime && (
          <div>Connection: {metrics.connectionTime.toFixed(1)}ms</div>
        )}
        {metrics.thumbnailLoadTime && (
          <div>Thumbnail: {metrics.thumbnailLoadTime.toFixed(1)}ms</div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;