import React from 'react';
import Toast, { ToastData } from './Toast';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  onRemoveToast, 
  position = 'bottom-right' 
}) => {
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2'
    };
    return positions[position];
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div 
      className={`fixed z-50 pointer-events-none ${getPositionClasses()}`}
      style={{ maxWidth: '400px', width: '400px' }}
    >
      <div className="flex flex-col space-y-2 p-4 w-full">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onClose={onRemoveToast}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;