import { useState, useEffect, useCallback } from 'react';
import { 
  Reward, 
  Partner, 
  UserReward, 
  RewardsFilter, 
  PartnersFilter 
} from '@/types/civic';
import { rewardsService } from '@/services/RewardsService';

export const useRewards = (userId: string) => {
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserPoints = useCallback(async () => {
    try {
      const points = await rewardsService.getUserPoints(userId);
      setUserPoints(points);
    } catch (error) {
      console.error('Failed to load user points:', error);
      setError('Failed to load user points');
    }
  }, [userId]);

  const loadRewards = useCallback(async (filter: RewardsFilter = {}) => {
    try {
      const data = await rewardsService.getRewards(filter);
      setRewards(data);
    } catch (error) {
      console.error('Failed to load rewards:', error);
      setError('Failed to load rewards');
    }
  }, []);

  const loadPartners = useCallback(async (filter: PartnersFilter = {}) => {
    try {
      const data = await rewardsService.getPartners(filter);
      setPartners(data);
    } catch (error) {
      console.error('Failed to load partners:', error);
      setError('Failed to load partners');
    }
  }, []);

  const loadUserRewards = useCallback(async () => {
    try {
      const data = await rewardsService.getUserRewards(userId);
      setUserRewards(data);
    } catch (error) {
      console.error('Failed to load user rewards:', error);
      setError('Failed to load user rewards');
    }
  }, [userId]);

  const redeemReward = async (rewardId: string) => {
    try {
      const response = await rewardsService.redeemReward({
        reward_id: rewardId,
        user_id: userId
      });
      
      if (response.success) {
        // Refresh all data after successful redemption
        await Promise.all([
          loadUserPoints(),
          loadUserRewards(),
          loadRewards()
        ]);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      setError('Failed to redeem reward');
      return {
        success: false,
        error: 'Failed to redeem reward'
      };
    }
  };

  const updateUserRewardStatus = async (userRewardId: string, status: string) => {
    try {
      const success = await rewardsService.updateUserRewardStatus(userRewardId, status);
      if (success) {
        await loadUserRewards();
      }
      return success;
    } catch (error) {
      console.error('Failed to update user reward status:', error);
      setError('Failed to update reward status');
      return false;
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadUserPoints(),
        loadRewards(),
        loadPartners(),
        loadUserRewards()
      ]);
    } catch (error) {
      console.error('Failed to refresh rewards data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [loadUserPoints, loadRewards, loadPartners, loadUserRewards]);

  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId, refreshAll]);

  return {
    userPoints,
    rewards,
    partners,
    userRewards,
    loading,
    error,
    loadUserPoints,
    loadRewards,
    loadPartners,
    loadUserRewards,
    redeemReward,
    updateUserRewardStatus,
    refreshAll
  };
};
