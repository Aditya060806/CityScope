import { useState, useEffect } from 'react';
import { Issue } from '@/types/civic';

export const useOfflineCache = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedIssues, setCachedIssues] = useState<Issue[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    pendingItems: 0,
    lastSync: Date.now()
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached issues from localStorage
    const loadCachedIssues = () => {
      try {
        const cached = localStorage.getItem('civic_issues');
        if (cached) {
          const issues = JSON.parse(cached);
          setCachedIssues(issues);
        }
      } catch (error) {
        console.error('Failed to load cached issues:', error);
      }
    };

    loadCachedIssues();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    cachedIssues,
    queueStatus
  };
};