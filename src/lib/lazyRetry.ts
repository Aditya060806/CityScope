import { lazy, ComponentType } from 'react';

/**
 * Wrapper around React.lazy that retries failed dynamic imports.
 * After a new Vercel deploy, old chunk filenames no longer exist.
 * This detects that and does a single hard reload to fetch fresh chunks.
 */
export function lazyRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = 'lazyRetry_reloaded';
    const hasReloaded = sessionStorage.getItem(storageKey) === 'true';

    try {
      const module = await importFn();
      // Successful load — clear the flag
      sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      if (!hasReloaded) {
        // First failure — set flag and hard‑reload to get new asset manifest
        sessionStorage.setItem(storageKey, 'true');
        window.location.reload();
        // Return a never-resolving promise so React doesn't render the error
        return new Promise(() => {});
      }
      // Already retried once — throw so ErrorBoundary can handle it
      throw error;
    }
  });
}
