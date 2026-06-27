/**
 * Hook for lazy loading components with error handling and retry
 */

import { lazy, ComponentType, LazyExoticComponent, Suspense } from 'react';
import { FullPageLoader } from '@/lib/loading-states';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface LazyComponentOptions {
  fallback?: ComponentType;
  errorBoundary?: boolean;
  retryOnError?: boolean;
}

/**
 * Create a lazy-loaded component with error handling
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const { fallback: Fallback = FullPageLoader, errorBoundary = true, retryOnError = true } = options;

  const LazyComponent = lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to load component:', error);
      
      if (retryOnError) {
        // Retry once after a delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          return await importFn();
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  });

  if (errorBoundary) {
    return LazyComponent as LazyExoticComponent<T>;
  }

  return LazyComponent as LazyExoticComponent<T>;
}

/**
 * Wrapper component for lazy-loaded components
 */
export function LazyComponentWrapper<T extends ComponentType<any>>({
  component,
  fallback,
  errorFallback,
}: {
  component: LazyExoticComponent<T>;
  fallback?: ComponentType;
  errorFallback?: ComponentType;
}) {
  const Fallback = fallback || FullPageLoader;
  const ErrorFallback = errorFallback;

  return (
    <ErrorBoundary fallback={ErrorFallback ? <ErrorFallback /> : undefined}>
      <Suspense fallback={<Fallback />}>
        {component}
      </Suspense>
    </ErrorBoundary>
  );
}

