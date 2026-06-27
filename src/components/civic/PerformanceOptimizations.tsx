import React, { lazy, Suspense } from 'react';
import { LoadingState } from './LoadingStates';
import { useImageOptimization, useDebounce, useThrottle, usePerformanceMonitor } from '@/hooks/usePerformance';

// Lazy load heavy components
export const LazyMapView = lazy(() => 
  import('./RealMapView').then(module => ({ default: module.RealMapView }))
);

export const LazyLeaderboard = lazy(() => 
  import('./LocalHeroesTab').then(module => ({ default: module.LocalHeroesTab }))
);

export const LazyReportModal = lazy(() => 
  import('./EnhancedReportModal').then(module => ({ default: module.EnhancedReportModal }))
);

// Performance wrapper component
interface PerformanceWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({ 
  children, 
  fallback = <LoadingState /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Optimized image component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  lazy = true 
}) => {
  const [imageSrc, setImageSrc] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const { optimizeImage } = useImageOptimization();

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        // In a real app, you'd optimize the image here
        setImageSrc(src);
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [src, optimizeImage]);

  if (isLoading) {
    return <div className={`animate-pulse bg-gray-200 ${className}`} style={{ width, height }} />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={lazy ? 'lazy' : 'eager'}
    />
  );
};