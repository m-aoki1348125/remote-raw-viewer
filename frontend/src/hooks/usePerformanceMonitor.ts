import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  connectionCount: number;
  apiResponseTimes: number[];
  errorCount: number;
  lastUpdate: Date;
}

interface PerformanceThresholds {
  maxRenderTime: number;
  maxMemoryUsage: number;
  maxApiResponseTime: number;
  maxErrorRate: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16, // 60fps = 16ms per frame
  maxMemoryUsage: 100, // MB
  maxApiResponseTime: 1000, // 1 second
  maxErrorRate: 0.1 // 10%
};

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    connectionCount: 0,
    apiResponseTimes: [],
    errorCount: 0,
    lastUpdate: new Date()
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Measure render performance
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    
    // Use requestAnimationFrame to measure actual render time
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        lastUpdate: new Date()
      }));

      // Check for performance issues
      if (renderTime > DEFAULT_THRESHOLDS.maxRenderTime) {
        setAlerts(prev => [...prev, `Slow render detected: ${renderTime.toFixed(2)}ms`]);
      }
    });
  }, []);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        lastUpdate: new Date()
      }));

      if (memoryUsage > DEFAULT_THRESHOLDS.maxMemoryUsage) {
        setAlerts(prev => [...prev, `High memory usage: ${memoryUsage.toFixed(2)}MB`]);
      }
    }
  }, []);

  // Track API response times
  const trackApiCall = useCallback((responseTime: number) => {
    setMetrics(prev => ({
      ...prev,
      apiResponseTimes: [...prev.apiResponseTimes.slice(-9), responseTime], // Keep last 10
      lastUpdate: new Date()
    }));

    if (responseTime > DEFAULT_THRESHOLDS.maxApiResponseTime) {
      setAlerts(prev => [...prev, `Slow API response: ${responseTime}ms`]);
    }
  }, []);

  // Track errors
  const trackError = useCallback((error: string) => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastUpdate: new Date()
    }));

    setAlerts(prev => [...prev, `Error: ${error}`]);
  }, []);

  // Update connection count
  const updateConnectionCount = useCallback((count: number) => {
    setMetrics(prev => ({
      ...prev,
      connectionCount: count,
      lastUpdate: new Date()
    }));
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    const interval = setInterval(() => {
      measureRenderTime();
      measureMemoryUsage();
    }, 1000); // Check every second

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [measureRenderTime, measureMemoryUsage]);

  // Performance score calculation
  const getPerformanceScore = useCallback(() => {
    const renderScore = Math.max(0, 100 - (metrics.renderTime / DEFAULT_THRESHOLDS.maxRenderTime) * 100);
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / DEFAULT_THRESHOLDS.maxMemoryUsage) * 100);
    
    const avgResponseTime = metrics.apiResponseTimes.length > 0 
      ? metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.apiResponseTimes.length 
      : 0;
    const apiScore = Math.max(0, 100 - (avgResponseTime / DEFAULT_THRESHOLDS.maxApiResponseTime) * 100);
    
    return Math.round((renderScore + memoryScore + apiScore) / 3);
  }, [metrics]);

  // Auto-start monitoring
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    performanceScore: getPerformanceScore(),
    trackApiCall,
    trackError,
    updateConnectionCount,
    clearAlerts,
    startMonitoring
  };
};