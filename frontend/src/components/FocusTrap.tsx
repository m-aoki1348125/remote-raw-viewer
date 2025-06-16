import React, { useRef, useEffect } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  initialFocus?: string;
  onEscape?: () => void;
}

const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  isActive, 
  initialFocus,
  onEscape 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element
    lastActiveElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus initial element or first focusable element
    setTimeout(() => {
      if (initialFocus) {
        const initialElement = container.querySelector(initialFocus) as HTMLElement;
        if (initialElement) {
          initialElement.focus();
          return;
        }
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 100);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
      }
    };
  }, [isActive, initialFocus, onEscape]);

  if (!isActive) return <>{children}</>;

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  );
};

export default FocusTrap;