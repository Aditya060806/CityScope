import { useState, useEffect, useCallback } from 'react';
import { LeaderboardUser } from '@/types/civic';
import { userService } from '@/services/UserService';
import { useAuth } from '@/hooks/useAuth';

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load leaderboard data from Supabase via UserService
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const entries = await userService.getLeaderboard(20);

        const leaderboardUsers: LeaderboardUser[] = entries.map(entry => ({
          id: entry.user.id,
          name: entry.user.name,
          avatar: entry.user.avatar,
          rank: entry.rank,
          reportsCount: entry.stats.reportsSubmitted,
          resolvedCount: entry.stats.reportsResolved,
          verifiedPercentage: entry.stats.reportsSubmitted > 0
            ? Math.round((entry.stats.reportsResolved / entry.stats.reportsSubmitted) * 100)
            : 0,
          badge: entry.badges?.[0],
          isCurrentUser: entry.user.id === user?.id
        }));

        setUsers(leaderboardUsers);
      } catch (err) {
        setError('Failed to load leaderboard data');
        console.error('Leaderboard loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [timeframe, user?.id]);

  // Subscribe to real-time leaderboard changes
  useEffect(() => {
    const subscription = userService.subscribeToLeaderboard(async () => {
      // Refresh when user data changes
      try {
        const entries = await userService.getLeaderboard(20);
        const leaderboardUsers: LeaderboardUser[] = entries.map(entry => ({
          id: entry.user.id,
          name: entry.user.name,
          avatar: entry.user.avatar,
          rank: entry.rank,
          reportsCount: entry.stats.reportsSubmitted,
          resolvedCount: entry.stats.reportsResolved,
          verifiedPercentage: entry.stats.reportsSubmitted > 0
            ? Math.round((entry.stats.reportsResolved / entry.stats.reportsSubmitted) * 100)
            : 0,
          badge: entry.badges?.[0],
          isCurrentUser: entry.user.id === user?.id
        }));
        setUsers(leaderboardUsers);
      } catch (err) {
        console.error('Error refreshing leaderboard:', err);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user?.id]);

  const updateTimeframe = useCallback((newTimeframe: 'weekly' | 'monthly' | 'all-time') => {
    setTimeframe(newTimeframe);
  }, []);

  const getCurrentUser = useCallback((): LeaderboardUser | undefined => {
    return users.find(u => u.isCurrentUser);
  }, [users]);

  const triggerRankUpCelebration = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const getUserBadges = useCallback((userId: string) => {
    const u = users.find(u => u.id === userId);
    if (!u) return [];

    const badges = [];
    if (u.reportsCount >= 50) badges.push('street_star');
    if (u.verifiedPercentage >= 80) badges.push('clean_champ');
    if (u.reportsCount >= 25) badges.push('report_pro');
    return badges;
  }, [users]);

  return {
    users,
    loading,
    error,
    timeframe,
    showConfetti,
    updateTimeframe,
    getCurrentUser,
    triggerRankUpCelebration,
    getUserBadges,
  };
};