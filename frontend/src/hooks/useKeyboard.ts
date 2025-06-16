import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
}

export const useKeyboard = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const activeElement = document.activeElement;
    const isInputFocused = activeElement?.tagName === 'INPUT' || 
                          activeElement?.tagName === 'TEXTAREA' || 
                          (activeElement as HTMLElement)?.contentEditable === 'true';

    if (isInputFocused) return;

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === event.ctrlKey;
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.callback();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboard;