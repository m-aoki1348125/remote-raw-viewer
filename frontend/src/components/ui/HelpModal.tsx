import React from 'react';
import { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, shortcuts }) => {
  if (!isOpen) return null;

  const formatShortcutKey = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('Cmd');
    
    parts.push(shortcut.key);
    
    return parts.join(' + ');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              ⌨️ Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close help"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Use these keyboard shortcuts to navigate and interact with the application more efficiently.
          </p>

          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">
                  {shortcut.description}
                </span>
                <div className="flex items-center space-x-1">
                  {formatShortcutKey(shortcut).split(' + ').map((key, keyIndex, array) => (
                    <React.Fragment key={keyIndex}>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                        {key}
                      </kbd>
                      {keyIndex < array.length - 1 && (
                        <span className="text-gray-400 text-xs">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Press <kbd className="px-1 text-xs bg-blue-100 border border-blue-300 rounded">Tab</kbd> to navigate between focusable elements</li>
              <li>• Use <kbd className="px-1 text-xs bg-blue-100 border border-blue-300 rounded">Enter</kbd> to activate buttons and links</li>
              <li>• Press <kbd className="px-1 text-xs bg-blue-100 border border-blue-300 rounded">Space</kbd> to activate buttons</li>
              <li>• Most forms can be submitted with <kbd className="px-1 text-xs bg-blue-100 border border-blue-300 rounded">Enter</kbd></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;