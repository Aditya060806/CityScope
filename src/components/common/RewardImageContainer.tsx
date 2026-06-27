import React from 'react';
import { cn } from '@/lib/utils';

interface RewardImageContainerProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onError?: () => void;
}

export const RewardImageContainer: React.FC<RewardImageContainerProps> = ({
  src,
  alt,
  className = '',
  fallback,
  onError
}) => {
  return (
    <div className={cn(
      'w-full h-full flex items-center justify-center bg-white',
      className
    )}>
      <div className="relative w-full h-full flex items-center justify-center p-1">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain max-w-full max-h-full"
          style={{
            minWidth: '80%',
            minHeight: '80%',
            maxWidth: '95%',
            maxHeight: '95%'
          }}
          loading="lazy"
          onError={(e) => {
            if (fallback) {
              e.currentTarget.src = fallback;
            } else {
              onError?.();
            }
          }}
        />
      </div>
    </div>
  );
};
