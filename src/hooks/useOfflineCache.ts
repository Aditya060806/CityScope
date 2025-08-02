import { useState, useEffect, useCallback } from 'react';
import { CivicIssue, OfflineCache, Location } from '@/types/civic';

const CACHE_KEY = 'civictrack_offline_cache';
const MAX_CACHED_ISSUES = 20;

export const useOfflineCache = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedIssues, setCachedIssues] = useState<CivicIssue[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const cacheData: OfflineCache = JSON.parse(cached);
          setCachedIssues(cacheData.issues);
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheIssues = useCallback((issues: CivicIssue[], userLocation?: Location) => {
    try {
      // Keep only the most recent issues
      const issuesToCache = issues.slice(0, MAX_CACHED_ISSUES);
      
      const cacheData: OfflineCache = {
        issues: issuesToCache,
        lastUpdated: new Date(),
        userLocation
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedIssues(issuesToCache);
    } catch (error) {
      console.error('Error caching issues:', error);
    }
  }, []);

  const getCachedIssues = useCallback((): CivicIssue[] => {
    return cachedIssues;
  }, [cachedIssues]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedIssues([]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const retryConnection = useCallback(async () => {
    setIsReconnecting(true);
    
    // Simulate connection attempt
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setIsOnline(true);
      }
    } catch (error) {
      // Connection still failed
      console.log('Connection retry failed');
    } finally {
      setIsReconnecting(false);
    }
  }, []);

  const getLastCacheUpdate = useCallback((): Date | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData: OfflineCache = JSON.parse(cached);
        return new Date(cacheData.lastUpdated);
      }
    } catch (error) {
      console.error('Error getting cache timestamp:', error);
    }
    return null;
  }, []);

  return {
    isOnline,
    isReconnecting,
    cachedIssues,
    cacheIssues,
    getCachedIssues,
    clearCache,
    retryConnection,
    getLastCacheUpdate,
    cachedItemsCount: cachedIssues.length
  };
};
