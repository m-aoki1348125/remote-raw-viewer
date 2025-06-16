import { useEffect, useCallback } from 'react';

interface AccessibilityOptions {
  announcePageChanges?: boolean;
  manageFocus?: boolean;
  reduceMotion?: boolean;
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const { manageFocus = true, reduceMotion = false } = options;

  // Screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  // Focus management
  const focusElement = useCallback((selector: string) => {
    if (!manageFocus) return;
    
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  }, [manageFocus]);

  // Skip link functionality
  const handleSkipToContent = useCallback(() => {
    const mainContent = document.querySelector('#main-content') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  }, []);

  // Detect reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || reduceMotion;
  }, [reduceMotion]);

  // High contrast detection
  const prefersHighContrast = useCallback(() => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }, []);

  useEffect(() => {
    // Add skip link if it doesn't exist
    const existingSkipLink = document.querySelector('.skip-link');
    if (!existingSkipLink) {
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link absolute -top-10 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded focus:top-4 transition-all duration-200';
      skipLink.textContent = 'Skip to main content';
      skipLink.addEventListener('click', handleSkipToContent);
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }, [handleSkipToContent]);

  return {
    announce,
    focusElement,
    handleSkipToContent,
    prefersReducedMotion,
    prefersHighContrast
  };
};

export default useAccessibility;