import React from 'react';
import { cn } from '@/lib/utils';

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'royal' | 'powder' | 'bone';
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 'md',
  color = 'royal',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    royal: 'bg-royal',
    powder: 'bg-powder',
    bone: 'bg-bone'
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <div 
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};