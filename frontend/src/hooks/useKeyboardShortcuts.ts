import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;
    
    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === key.toLowerCase() &&
        !!shortcut.ctrl === ctrlKey &&
        !!shortcut.alt === altKey &&
        !!shortcut.shift === shiftKey &&
        !!shortcut.meta === metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
};

// Common keyboard shortcuts
export const createCommonShortcuts = (actions: {
  refresh?: () => void;
  addConnection?: () => void;
  escape?: () => void;
  help?: () => void;
  search?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.refresh) {
    shortcuts.push({
      key: 'F5',
      description: 'Refresh connections',
      action: actions.refresh
    });
  }

  if (actions.addConnection) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      description: 'Add new connection (Ctrl+N)',
      action: actions.addConnection
    });
  }

  if (actions.escape) {
    shortcuts.push({
      key: 'Escape',
      description: 'Close modal or cancel action',
      action: actions.escape
    });
  }

  if (actions.help) {
    shortcuts.push({
      key: 'F1',
      description: 'Show help',
      action: actions.help
    });
    shortcuts.push({
      key: '?',
      shift: true,
      description: 'Show help (Shift+?)',
      action: actions.help
    });
  }

  if (actions.search) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      description: 'Search connections (Ctrl+F)',
      action: actions.search
    });
  }

  return shortcuts;
};