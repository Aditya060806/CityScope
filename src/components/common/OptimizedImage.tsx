import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  fallback?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  lazy = true,
  priority = false,
  placeholder = 'blur',
  fallback = '/placeholder.svg',
  style,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Convert PNG to WebP for better compression
  const getOptimizedSrc = (originalSrc: string): string => {
    // If it's a PNG in public folder, try to serve WebP version
    if (originalSrc.includes('.png') && originalSrc.startsWith('/')) {
      const webpSrc = originalSrc.replace('.png', '.webp');
      return webpSrc;
    }
    return originalSrc;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Try WebP first, fallback to original
        const webpSrc = getOptimizedSrc(src);
        const img = new Image();
        
        img.onload = () => {
          setImageSrc(webpSrc);
          setIsLoading(false);
          onLoad?.();
        };

        img.onerror = () => {
          // If WebP fails, try original
          if (webpSrc !== src) {
            const originalImg = new Image();
            originalImg.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
              onLoad?.();
            };
            originalImg.onerror = () => {
              setImageSrc(fallback);
              setIsLoading(false);
              setHasError(true);
              onError?.();
            };
            originalImg.src = src;
          } else {
            setImageSrc(fallback);
            setIsLoading(false);
            setHasError(true);
            onError?.();
          }
        };

        img.src = webpSrc;
      } catch (error) {
        console.error('Error loading image:', error);
        setImageSrc(fallback);
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
    };

    loadImage();
  }, [isInView, src, fallback, onLoad, onError]);

  // Loading placeholder
  if (isLoading) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse',
          className
        )}
        style={{ width, height }}
      >
        {placeholder === 'blur' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center',
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
      width={width}
      height={height}
      loading={lazy && !priority ? 'lazy' : 'eager'}
      decoding="async"
      style={{
        objectFit: 'cover',
        objectPosition: 'center',
        width: '100%',
        height: '100%',
        minWidth: '100%',
        minHeight: '100%',
        ...style
      }}
      onLoad={() => {
        setIsLoading(false);
        onLoad?.();
      }}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
};

// Hook for preloading critical images
export const useImagePreloader = () => {
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const preloadImages = async (srcs: string[]): Promise<void> => {
    try {
      await Promise.all(srcs.map(preloadImage));
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  };

  return { preloadImage, preloadImages };
};
