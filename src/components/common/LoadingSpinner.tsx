import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <div className={cn(
          "border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin",
          sizeClasses[size]
        )} />
        <div className={cn(
          "absolute inset-0 border-4 border-transparent border-r-purple-600 rounded-full animate-spin",
          sizeClasses[size]
        )} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};