// Testing utilities and validation helpers

export const validateImageData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = ['name', 'path', 'size', 'lastModified'];
  return requiredFields.every(field => field in data);
};

export const validateConnectionData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = ['id', 'name', 'host', 'port', 'username'];
  return requiredFields.every(field => field in data);
};

export const validateThumbnailData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  return 'success' in data && 
         (data.success === false || 'thumbnail_base64' in data);
};

export const sanitizeFilePath = (path: string): string => {
  return path.replace(/[<>:"|?*]/g, '_').replace(/\.\./g, '');
};

export const validateFileSize = (size: number): boolean => {
  return typeof size === 'number' && size >= 0 && size < Number.MAX_SAFE_INTEGER;
};

export const isValidImageExtension = (extension: string): boolean => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.raw', '.tiff', '.bmp'];
  return validExtensions.includes(extension.toLowerCase());
};

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

export const debounceTest = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

export const throttleTest = (fn: Function, limit: number) => {
  let inThrottle: boolean;
  return (...args: any[]) => {
    if (!inThrottle) {
      fn.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const mockConnectionTest = {
  id: 'test-connection-001',
  name: 'Test Server',
  host: 'localhost',
  port: 22,
  username: 'testuser',
  isConnected: false,
  lastConnected: new Date()
};

export const mockImageTest = {
  name: 'test-image.jpg',
  path: '/test/path/test-image.jpg',
  size: 1024000,
  lastModified: Date.now() / 1000,
  extension: '.jpg',
  isDirectory: false
};