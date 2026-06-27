import React from 'react';
import { OptimizedImage } from './OptimizedImage';
import { cn } from '@/lib/utils';

interface PartnerImageContainerProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  priority?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const PartnerImageContainer: React.FC<PartnerImageContainerProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  width = 300,
  height = 200,
  lazy = true,
  priority = false,
  fallback = '/placeholder.svg',
  onLoad,
  onError
}) => {
  return (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center overflow-hidden',
        containerClassName
      )}
    >
      <div className="w-full h-full flex items-center justify-center bg-white p-1">
        <OptimizedImage
          src={src}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            className
          )}
          width={width}
          height={height}
          lazy={lazy}
          priority={priority}
          fallback={fallback}
          onLoad={onLoad}
          onError={onError}
          style={{
            minWidth: '90%',
            minHeight: '90%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
      </div>
    </div>
  );
};
