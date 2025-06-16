import React from 'react';

export type StatusType = 'online' | 'offline' | 'connecting' | 'error' | 'idle';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const getStatusConfig = () => {
    const configs = {
      online: {
        color: 'bg-green-500',
        label: label || 'Online',
        icon: '🟢',
        pulse: false
      },
      offline: {
        color: 'bg-gray-500',
        label: label || 'Offline',
        icon: '⚫',
        pulse: false
      },
      connecting: {
        color: 'bg-yellow-500',
        label: label || 'Connecting...',
        icon: '🟡',
        pulse: true
      },
      error: {
        color: 'bg-red-500',
        label: label || 'Error',
        icon: '🔴',
        pulse: false
      },
      idle: {
        color: 'bg-blue-500',
        label: label || 'Idle',
        icon: '🔵',
        pulse: false
      }
    };
    return configs[status];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4'
    };
    return sizes[size];
  };

  const getTextSize = () => {
    const textSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };
    return textSizes[size];
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div 
          className={`
            ${config.color} 
            ${getSizeClasses()} 
            rounded-full
            ${config.pulse ? 'animate-pulse' : ''}
          `}
        />
        {config.pulse && (
          <div 
            className={`
              absolute inset-0 
              ${config.color} 
              ${getSizeClasses()} 
              rounded-full 
              animate-ping 
              opacity-75
            `}
          />
        )}
      </div>
      
      {showLabel && (
        <span className={`${getTextSize()} text-gray-700 font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;