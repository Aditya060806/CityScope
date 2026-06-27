import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/UserService';

export interface CommunityStats {
  totalUsers: number;
  totalReports: number;
  totalResolved: number;
  resolutionRate: number;
  activeUsers: number;
}

export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await userService.getCommunityStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading community stats:', err);
      setError('Failed to load community statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
};
