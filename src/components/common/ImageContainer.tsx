import React from 'react';
import { OptimizedImage } from './OptimizedImage';
import { cn } from '@/lib/utils';

interface ImageContainerProps {
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
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  padding?: boolean;
}

export const ImageContainer: React.FC<ImageContainerProps> = ({
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
  onError,
  aspectRatio = 'auto',
  objectFit = 'contain',
  padding = true
}) => {
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[4/3]';
      default:
        return '';
    }
  };

  const getObjectFitClass = () => {
    switch (objectFit) {
      case 'contain':
        return 'object-contain';
      case 'cover':
        return 'object-cover';
      case 'fill':
        return 'object-fill';
      case 'none':
        return 'object-none';
      case 'scale-down':
        return 'object-scale-down';
      default:
        return 'object-cover';
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        getAspectRatioClass(),
        containerClassName
      )}
    >
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <OptimizedImage
          src={src}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            getObjectFitClass(),
            padding ? 'p-1' : '',
            className
          )}
          width={width}
          height={height}
          lazy={lazy}
          priority={priority}
          fallback={fallback}
          onLoad={onLoad}
          onError={onError}
        />
      </div>
    </div>
  );
};
