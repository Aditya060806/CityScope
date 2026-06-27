import { useState, useEffect, useCallback, useRef } from 'react';
import { Issue } from '@/types/civic';
import { issueService } from '@/services/IssueService';

export const useMapData = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const signatureRef = useRef('');
  const realtimeUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getIssuesSignature = useCallback((items: Issue[]) => {
    return items
      .map((issue) => `${issue.id}:${issue.status}:${issue.upvotes}:${(issue as { updatedAt?: string }).updatedAt || ''}`)
      .join('|');
  }, []);

  const setIssuesIfChanged = useCallback((nextIssues: Issue[]) => {
    const nextSignature = getIssuesSignature(nextIssues);
    if (signatureRef.current === nextSignature) return;
    signatureRef.current = nextSignature;
    setIssues(nextIssues);
  }, [getIssuesSignature]);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const { issues: data } = await issueService.getIssues({ limit: 200, includeHidden: false });
      setIssuesIfChanged(data);
    } catch (error) {
      console.error('Error fetching map issues:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setIssuesIfChanged]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Subscribe to real-time issue updates
  useEffect(() => {
    const subscription = issueService.subscribeToIssues((updatedIssues) => {
      if (realtimeUpdateTimerRef.current) {
        clearTimeout(realtimeUpdateTimerRef.current);
      }

      realtimeUpdateTimerRef.current = setTimeout(() => {
        setIssuesIfChanged(updatedIssues);
      }, 180);
    });

    return () => {
      if (realtimeUpdateTimerRef.current) {
        clearTimeout(realtimeUpdateTimerRef.current);
        realtimeUpdateTimerRef.current = null;
      }
      subscription?.unsubscribe();
    };
  }, [setIssuesIfChanged]);

  return {
    issues,
    isLoading,
    refreshIssues: fetchIssues
  };
};