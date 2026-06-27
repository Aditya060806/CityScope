import { useState, useEffect } from 'react';
import { Issue, FilterOptions, IssueCategory, IssueStatus } from '@/types/civic';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { issueService } from '@/services/IssueService';

const ISSUE_CACHE_TTL_MS = 5000;
let cachedIssues: Issue[] | null = null;
let cacheTimestamp = 0;
let inFlightIssuesRequest: Promise<Issue[]> | null = null;
const rawIssueListeners = new Set<(issues: Issue[]) => void>();
let sharedIssueSubscription: { unsubscribe: () => void } | null = null;

const broadcastRawIssues = (issues: Issue[]) => {
  cachedIssues = issues;
  cacheTimestamp = Date.now();
  rawIssueListeners.forEach((listener) => listener(issues));
};

const ensureSharedIssueSubscription = () => {
  if (sharedIssueSubscription) return;
  sharedIssueSubscription = issueService.subscribeToIssues((updatedIssues) => {
    broadcastRawIssues(updatedIssues);
  });
};

const cleanupSharedIssueSubscriptionIfIdle = () => {
  if (rawIssueListeners.size === 0 && sharedIssueSubscription) {
    sharedIssueSubscription.unsubscribe();
    sharedIssueSubscription = null;
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getBaseIssues = async (): Promise<Issue[]> => {
  const now = Date.now();
  if (cachedIssues && now - cacheTimestamp < ISSUE_CACHE_TTL_MS) {
    return cachedIssues;
  }

  if (inFlightIssuesRequest) {
    return inFlightIssuesRequest;
  }

  inFlightIssuesRequest = (async () => {
    const { issues: serviceIssues } = await issueService.getIssues({ limit: 1500 });
    cachedIssues = serviceIssues;
    cacheTimestamp = Date.now();
    return serviceIssues;
  })();

  try {
    return await inFlightIssuesRequest;
  } finally {
    inFlightIssuesRequest = null;
  }
};

const applyDistanceFilter = (baseIssues: Issue[], userLocation: { latitude: number; longitude: number } | null, maxDistanceKm: number) => {
  if (!userLocation) {
    return baseIssues;
  }

  return baseIssues
    .map(issue => ({
      ...issue,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        issue.location.latitude,
        issue.location.longitude
      )
    }))
    .filter(issue => (issue.distance || 0) <= maxDistanceKm);
};

export const useCivicIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userLocation } = useLocation();
  const { user } = useAuth();

  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    categories: [],
    distance: 100000, // Effectively unlimited radius by default for global view
    sortBy: 'recent',
    mapView: 'pins',
    mapStyle: 'default'
  });

  useEffect(() => {
    let isMounted = true;

    const handleRawIssues = (updatedIssues: Issue[]) => {
      const processedIssues = applyDistanceFilter(updatedIssues, userLocation, filters.distance);
      if (isMounted) {
        setIssues(processedIssues);
      }
    };

    const loadIssues = async () => {
      try {
        setLoading(true);
        setError(null);

        const serviceIssues = await getBaseIssues();
        const processedIssues = applyDistanceFilter(serviceIssues, userLocation, filters.distance);

        if (isMounted) {
          setIssues(processedIssues);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load civic issues');
          setIssues([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    rawIssueListeners.add(handleRawIssues);
    ensureSharedIssueSubscription();
    loadIssues();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      rawIssueListeners.delete(handleRawIssues);
      cleanupSharedIssueSubscriptionIfIdle();
    };
  }, [userLocation, filters.distance]);

  const filteredIssues = issues.filter(issue => {
    // Filter by status
    if (filters.status.length > 0 && !filters.status.includes(issue.status)) {
      return false;
    }
    
    // Filter by category
    if (filters.categories.length > 0 && !filters.categories.includes(issue.category)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by selected criteria
    switch (filters.sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'upvotes':
        return b.upvotes - a.upvotes;
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const reportIssue = async (issueData: Partial<Issue>) => {
    try {
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('User must be authenticated to report issues');
      }
      
      // Convert legacy format to new service format
      const createData = {
        title: issueData.title!,
        description: issueData.description!,
        category: issueData.category!,
        location: issueData.location!,
        images: issueData.images || [],
        reporterId: user.id, // Use authenticated user's UUID
        reporterName: issueData.isAnonymous ? 'Anonymous' : (issueData.reporterName || user.name || 'Anonymous'),
        priority: 'medium' as const
      };

      const newIssue = await issueService.createIssue(createData);
      cachedIssues = null;
      cacheTimestamp = 0;
      
      // Issue is already in correct format
      setIssues(prev => [newIssue, ...prev]);
      return newIssue;
    } catch (err) {
      console.error('❌ Error reporting issue:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to report issue');
    }
  };

  const upvoteIssue = async (issueId: string) => {
    try {
      if (!user?.id) {
        console.warn('User must be authenticated to upvote issues');
        return;
      }
      
      const upvoted = await issueService.upvoteIssue(issueId, user.id);
      
      // Update local state
      setIssues(prev => prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, upvotes: upvoted ? issue.upvotes + 1 : issue.upvotes - 1 }
          : issue
      ));
    } catch (error) {
      console.error('Failed to upvote issue:', error);
    }
  };

  const flagIssue = async (issueId: string) => {
    try {
      if (!user?.id) {
        console.warn('User must be authenticated to flag issues');
        return;
      }
      
      const flagged = await issueService.flagIssue(issueId, user.id);
      
      if (flagged) {
        // Update local state
        setIssues(prev => prev.map(issue => 
          issue.id === issueId 
            ? { ...issue, flags: issue.flags + 1 }
            : issue
        ));
      }
    } catch (error) {
      console.error('Failed to flag issue:', error);
    }
  };

  return {
    issues: filteredIssues,
    loading,
    error,
    filters,
    updateFilters,
    reportIssue,
    upvoteIssue,
    flagIssue,
    totalIssues: issues.length
  };
};