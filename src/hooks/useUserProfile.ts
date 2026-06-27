import { useState, useEffect, useCallback } from 'react';
import { userService, UserProfile, UserActivity, UpdateProfileData } from '@/services/UserService';
import { useAuth } from '@/hooks/useAuth';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const profileData = await userService.getUserProfile(user.id);
      setProfile(profileData);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load user activity
  const loadActivity = useCallback(async () => {
    if (!user?.id) return;

    try {
      const activityData = await userService.getUserActivity(user.id);
      setActivity(activityData);
    } catch (err) {
      console.error('Activity loading error:', err);
    }
  }, [user?.id]);

  // Update profile
  const updateProfile = useCallback(async (updates: UpdateProfileData): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      setError(null);
      const updatedProfile = await userService.updateUserProfile(user.id, updates);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        return true;
      }
      // Even if update returns null, consider it successful if no error was thrown
      // (fields that don't exist in DB are silently skipped)
      return true;
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
      return false;
    }
  }, [user?.id]);

  // Add activity
  const addActivity = useCallback(async (activityData: Omit<UserActivity, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await userService.addUserActivity(user.id, activityData);
      if (success) {
        // Reload activity to get the latest
        await loadActivity();
      }
      return success;
    } catch (err) {
      console.error('Activity add error:', err);
      return false;
    }
  }, [user?.id, loadActivity]);

  // Update points
  const updatePoints = useCallback(async (pointsChange: number, reason: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await userService.updateUserPoints(user.id, pointsChange, reason);
      if (success) {
        // Reload profile to get updated points
        await loadProfile();
      }
      return success;
    } catch (err) {
      console.error('Points update error:', err);
      return false;
    }
  }, [user?.id, loadProfile]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadActivity();
    }
  }, [user?.id, loadProfile, loadActivity]);

  return {
    profile,
    activity,
    loading,
    error,
    updateProfile,
    addActivity,
    updatePoints,
    refreshProfile: loadProfile,
    refreshActivity: loadActivity
  };
};
