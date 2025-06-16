import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      red: 'bg-red-600',
      yellow: 'bg-yellow-600',
      purple: 'bg-purple-600'
    };
    return colors[color];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    };
    return sizes[size];
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`
        w-full 
        bg-gray-200 
        rounded-full 
        ${getSizeClasses()}
        overflow-hidden
      `}>
        <div
          className={`
            ${getColorClasses()}
            ${getSizeClasses()}
            rounded-full
            transition-all
            duration-300
            ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      
      {(value !== undefined && max !== undefined) && (
        <div className="mt-1 text-xs text-gray-500">
          {value} / {max}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;