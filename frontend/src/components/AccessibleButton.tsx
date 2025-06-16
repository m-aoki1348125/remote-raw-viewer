import React, { forwardRef } from 'react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const loadingSpinner = (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const content = (
    <>
      {isLoading && loadingSpinner}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">{icon}</span>
      )}
      <span>{isLoading ? loadingText : children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">{icon}</span>
      )}
    </>
  );

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;