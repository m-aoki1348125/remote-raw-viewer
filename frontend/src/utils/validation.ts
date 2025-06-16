// Enhanced validation utilities for production readiness

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateConnection = (data: any): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Required field validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    result.errors.push('Connection name is required');
    result.isValid = false;
  }

  if (!data.host || typeof data.host !== 'string' || data.host.trim().length === 0) {
    result.errors.push('Host is required');
    result.isValid = false;
  }

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
    result.errors.push('Username is required');
    result.isValid = false;
  }

  // Port validation
  const port = Number(data.port);
  if (isNaN(port) || port < 1 || port > 65535) {
    result.errors.push('Port must be between 1 and 65535');
    result.isValid = false;
  }

  // Host format validation
  if (data.host) {
    const hostRegex = /^[a-zA-Z0-9.-]+$/;
    if (!hostRegex.test(data.host)) {
      result.warnings.push('Host contains unusual characters');
    }
  }

  // Authentication validation
  if (data.authMethod === 'password' && (!data.password || data.password.length < 1)) {
    result.errors.push('Password is required for password authentication');
    result.isValid = false;
  }

  if (data.authMethod === 'privateKey' && (!data.privateKey || data.privateKey.length < 1)) {
    result.errors.push('Private key is required for key authentication');
    result.isValid = false;
  }

  // Security warnings
  if (data.password && data.password.length < 8) {
    result.warnings.push('Password is shorter than recommended (8+ characters)');
  }

  return result;
};

export const validateSearchQuery = (query: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (typeof query !== 'string') {
    result.errors.push('Search query must be a string');
    result.isValid = false;
    return result;
  }

  if (query.length > 1000) {
    result.errors.push('Search query is too long (max 1000 characters)');
    result.isValid = false;
  }

  // Check for potentially harmful patterns
  const dangerousPatterns = [/[<>]/g, /javascript:/i, /data:/i];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      result.warnings.push('Search query contains potentially unsafe characters');
      break;
    }
  }

  return result;
};

export const validateFilePath = (path: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (typeof path !== 'string') {
    result.errors.push('File path must be a string');
    result.isValid = false;
    return result;
  }

  if (path.length === 0) {
    result.errors.push('File path cannot be empty');
    result.isValid = false;
  }

  if (path.length > 4096) {
    result.errors.push('File path is too long (max 4096 characters)');
    result.isValid = false;
  }

  // Path traversal protection
  if (path.includes('..')) {
    result.errors.push('Path traversal detected');
    result.isValid = false;
  }

  // Invalid characters for most file systems
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(path)) {
    result.warnings.push('Path contains characters that may not be supported on all systems');
  }

  return result;
};

export const validateImageSize = (size: number): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (typeof size !== 'number' || isNaN(size)) {
    result.errors.push('Image size must be a number');
    result.isValid = false;
    return result;
  }

  if (size < 0) {
    result.errors.push('Image size cannot be negative');
    result.isValid = false;
  }

  if (size > 5 * 1024 * 1024 * 1024) { // 5GB
    result.warnings.push('Image size is unusually large (>5GB)');
  }

  return result;
};

export const validateThumbnailData = (data: any): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!data || typeof data !== 'object') {
    result.errors.push('Thumbnail data must be an object');
    result.isValid = false;
    return result;
  }

  if (typeof data.success !== 'boolean') {
    result.errors.push('Thumbnail data must have a success property');
    result.isValid = false;
  }

  if (data.success) {
    if (!data.thumbnail_base64 || typeof data.thumbnail_base64 !== 'string') {
      result.errors.push('Successful thumbnail data must include base64 string');
      result.isValid = false;
    } else {
      // Basic base64 validation
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(data.thumbnail_base64)) {
        result.warnings.push('Thumbnail base64 data may be malformed');
      }
    }
  } else {
    if (!data.error || typeof data.error !== 'string') {
      result.warnings.push('Failed thumbnail should include error message');
    }
  }

  return result;
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();
};

export const isSecureContext = (): boolean => {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
};

export const validateEnvironment = (): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check for required browser features
  if (!window.fetch) {
    result.errors.push('Browser does not support fetch API');
    result.isValid = false;
  }

  if (!window.Promise) {
    result.errors.push('Browser does not support Promises');
    result.isValid = false;
  }

  if (!window.localStorage) {
    result.warnings.push('Browser does not support localStorage');
  }

  if (!isSecureContext()) {
    result.warnings.push('Application not running in secure context (HTTPS)');
  }

  return result;
};