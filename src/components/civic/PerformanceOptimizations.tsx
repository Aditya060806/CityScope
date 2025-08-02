import React, { lazy, Suspense } from 'react';
import { LoadingState } from './LoadingStates';

// Lazy load heavy components
export const LazyMapView = lazy(() => 
  import('./MapViewEnhanced').then(module => ({ default: module.MapViewEnhanced }))
);

export const LazyLeaderboard = lazy(() => 
  import('./LocalHeroesTab').then(module => ({ default: module.LocalHeroesTab }))
);

export const LazyReportModal = lazy(() => 
  import('./EnhancedReportModal').then(module => ({ default: module.EnhancedReportModal }))
);

// Image optimization hook
export const useImageOptimization = () => {
  const optimizeImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const compressImage = async (file: File): Promise<string> => {
    if (file.size > 1024 * 1024) { // 1MB
      return optimizeImage(file, 800, 0.7);
    }
    return optimizeImage(file, 1200, 0.9);
  };

  return { optimizeImage, compressImage };
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  React.useEffect(() => {
    const observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });

    return () => observer.disconnect();
  }, [callback, options]);
};

// Performance wrapper component
export const PerformanceWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <LoadingState type="issues" count={1} /> }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};