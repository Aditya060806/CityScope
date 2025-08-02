import { useState, useEffect, useCallback } from 'react';
import { LeaderboardUser } from '@/types/civic';

// Mock leaderboard data
const generateMockLeaderboard = (timeframe: 'weekly' | 'monthly' | 'all-time'): LeaderboardUser[] => {
  const baseUsers = [
    {
      id: '1',
      name: 'Priya Sharma',
      avatar: '/placeholder.svg',
      reportsCount: timeframe === 'weekly' ? 8 : timeframe === 'monthly' ? 32 : 85,
      resolvedCount: timeframe === 'weekly' ? 6 : timeframe === 'monthly' ? 28 : 72,
      badge: 'street_star'
    },
    {
      id: '2',
      name: 'Rajesh Kumar',
      avatar: '/placeholder.svg',
      reportsCount: timeframe === 'weekly' ? 6 : timeframe === 'monthly' ? 28 : 78,
      resolvedCount: timeframe === 'weekly' ? 5 : timeframe === 'monthly' ? 24 : 65,
      badge: 'clean_champ'
    },
    {
      id: '3',
      name: 'Anita Singh',
      avatar: '/placeholder.svg',
      reportsCount: timeframe === 'weekly' ? 5 : timeframe === 'monthly' ? 25 : 69,
      resolvedCount: timeframe === 'weekly' ? 4 : timeframe === 'monthly' ? 21 : 58,
      badge: 'report_pro'
    },
    {
      id: '4',
      name: 'Vikram Patel',
      avatar: '/placeholder.svg',
      reportsCount: timeframe === 'weekly' ? 4 : timeframe === 'monthly' ? 22 : 62,
      resolvedCount: timeframe === 'weekly' ? 3 : timeframe === 'monthly' ? 18 : 51,
    },
    {
      id: '5',
      name: 'Neha Agarwal',
      avatar: '/placeholder.svg',
      reportsCount: timeframe === 'weekly' ? 3 : timeframe === 'monthly' ? 19 : 56,
      resolvedCount: timeframe === 'weekly' ? 2 : timeframe === 'monthly' ? 15 : 44,
    },
    {
      id: 'current',
      name: 'You',
      reportsCount: timeframe === 'weekly' ? 2 : timeframe === 'monthly' ? 15 : 41,
      resolvedCount: timeframe === 'weekly' ? 1 : timeframe === 'monthly' ? 12 : 33,
      isCurrentUser: true
    }
  ];

  return baseUsers.map((user, index) => ({
    ...user,
    rank: index + 1,
    verifiedPercentage: Math.round((user.resolvedCount / user.reportsCount) * 100)
  }));
};

export const useLeaderboard = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const leaderboardData = generateMockLeaderboard(timeframe);
      setUsers(leaderboardData);
      setLoading(false);
    };

    loadLeaderboard();
  }, [timeframe]);

  const updateTimeframe = useCallback((newTimeframe: 'weekly' | 'monthly' | 'all-time') => {
    setTimeframe(newTimeframe);
  }, []);

  const getCurrentUser = useCallback((): LeaderboardUser | undefined => {
    return users.find(user => user.isCurrentUser);
  }, [users]);

  const triggerRankUpCelebration = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const getUserBadges = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];

    const badges = [];
    
    if (user.reportsCount >= 50) badges.push('street_star');
    if (user.verifiedPercentage >= 80) badges.push('clean_champ');
    if (user.reportsCount >= 25) badges.push('report_pro');
    
    return badges;
  }, [users]);

  return {
    users,
    loading,
    timeframe,
    showConfetti,
    updateTimeframe,
    getCurrentUser,
    triggerRankUpCelebration,
    getUserBadges
  };
};