// Performance optimization utilities

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

export const memoizeOne = <T extends (...args: any[]) => any>(
  fn: T
): T => {
  let lastArgs: Parameters<T> | undefined;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!lastArgs || !argsEqual(args, lastArgs)) {
      lastArgs = args;
      lastResult = fn(...args);
    }
    return lastResult;
  }) as T;
};

const argsEqual = (a: any[], b: any[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const lazyLoad = (
  callback: () => void,
  delay: number = 100
): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: delay });
  } else {
    setTimeout(callback, delay);
  }
};