// Application constants for production deployment

export const APP_CONFIG = {
  name: 'Remote Raw Viewer',
  version: '1.0.0',
  description: 'Secure remote image browsing and processing application',
  author: 'Generated with Claude Code',
  
  // Performance thresholds
  performance: {
    maxImageSize: 5 * 1024 * 1024 * 1024, // 5GB
    thumbnailTimeout: 10000, // 10 seconds
    connectionTimeout: 30000, // 30 seconds
    searchDebounce: 200, // 200ms
    thumbnailLoadDelay: 50, // 50ms between thumbnails
    maxConcurrentThumbnails: 10,
  },
  
  // UI configuration
  ui: {
    maxToasts: 5,
    toastDuration: 3000, // 3 seconds
    errorToastDuration: 5000, // 5 seconds
    animationDuration: 200, // 200ms
    thumbnailSizes: ['small', 'medium', 'large', 'xlarge', 'xxlarge'] as const,
    defaultThumbnailSize: 'medium' as const,
  },
  
  // File types
  supportedImageTypes: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', 
    '.raw', '.tiff', '.bmp', '.ico', '.svg'
  ],
  
  // Security
  security: {
    maxPathLength: 4096,
    maxSearchLength: 1000,
    allowedProtocols: ['https:', 'http:'], // http only for localhost
    csrfTokenName: 'X-CSRF-Token',
  },
  
  // Error handling
  errors: {
    maxErrorLog: 50,
    reportingEnabled: false, // Set to true for production error reporting
  },
  
  // Accessibility
  accessibility: {
    skipLinkText: 'Skip to main content',
    reducedMotionQuery: '(prefers-reduced-motion: reduce)',
    highContrastQuery: '(prefers-contrast: high)',
    minFocusRingSize: '2px',
    minClickTarget: '44px',
  },
  
  // API configuration
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    rateLimitDelay: 100, // 100ms between requests
  },
  
  // Cache settings
  cache: {
    thumbnailCacheSize: 100, // Number of thumbnails to cache
    connectionCacheTime: 5 * 60 * 1000, // 5 minutes
    metadataCacheTime: 10 * 60 * 1000, // 10 minutes
  }
} as const;

export const ROUTES = {
  connections: '/',
  browser: '/browse',
  settings: '/settings',
} as const;

export const STORAGE_KEYS = {
  theme: 'rrv-theme',
  settings: 'rrv-settings',
  connections: 'rrv-connections',
  thumbnailSize: 'rrv-thumbnail-size',
  lastPath: 'rrv-last-path',
} as const;

export const CSS_CLASSES = {
  // Screen reader only
  srOnly: 'sr-only',
  
  // Focus styles
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  
  // Button variants
  buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
  buttonSecondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  buttonDanger: 'bg-red-600 hover:bg-red-700 text-white',
  buttonGhost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
  
  // Loading states
  spinner: 'animate-spin rounded-full border-2 border-gray-200 border-t-blue-600',
  
  // Transitions
  transition: 'transition-all duration-200',
  fadeIn: 'opacity-0 animate-fade-in',
  slideIn: 'transform translate-x-full animate-slide-in',
} as const;

export const ARIA_LABELS = {
  navigation: 'Main navigation',
  connectionList: 'Server connections',
  imageGallery: 'Image gallery',
  directoryTree: 'Directory tree',
  settings: 'Application settings',
  loading: 'Loading content',
  error: 'Error message',
  success: 'Success message',
  warning: 'Warning message',
  info: 'Information message',
} as const;

export const ERROR_MESSAGES = {
  networkError: 'Network connection failed. Please check your internet connection.',
  serverError: 'Server error occurred. Please try again later.',
  validationError: 'Invalid input. Please check your data and try again.',
  authenticationError: 'Authentication failed. Please check your credentials.',
  permissionError: 'Permission denied. You may not have access to this resource.',
  notFoundError: 'Resource not found. The requested item may have been moved or deleted.',
  timeoutError: 'Request timed out. Please try again.',
  unknownError: 'An unexpected error occurred. Please try again.',
} as const;

export default APP_CONFIG;