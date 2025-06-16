import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  label?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  label,
  className = ''
}) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12'
    };
    return sizes[size];
  };

  const getColorClasses = () => {
    const colors = {
      blue: 'border-blue-600',
      green: 'border-green-600',
      red: 'border-red-600',
      yellow: 'border-yellow-600',
      gray: 'border-gray-600'
    };
    return colors[color];
  };

  const getBorderWidth = () => {
    const borderWidths = {
      sm: 'border-2',
      md: 'border-2',
      lg: 'border-3',
      xl: 'border-4'
    };
    return borderWidths[size];
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          animate-spin 
          rounded-full 
          ${getSizeClasses()} 
          ${getBorderWidth()}
          ${getColorClasses()}
          border-t-transparent
        `}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <p className="mt-2 text-sm text-gray-600">
          {label}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;