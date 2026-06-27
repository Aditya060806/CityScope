import { supabase } from '@/lib/supabase';
import { LeaderboardEntry, UserStats, Badge } from '@/types/civic';

// User Profile Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinDate: string;
  totalPoints: number;
  reportsSubmitted: number;
  reportsResolved: number;
  verificationRate: number;
  badges: Badge[];
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    locationSharing: boolean;
  };
}

export interface UserActivity {
  id: string;
  user_id: string;
  type: 'report_submitted' | 'report_resolved' | 'badge_earned' | 'points_earned' | 'profile_updated';
  description: string;
  points?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  preferences?: {
    notifications?: boolean;
    publicProfile?: boolean;
    locationSharing?: boolean;
  };
}

class UserService {
  // Get leaderboard data from Supabase
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      if (!supabase) {
        console.warn('Supabase not available');
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          avatar_url,
          reports_count,
          verified_percentage,
          badges,
          total_points,
          created_at
        `)
        .eq('is_active', true)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          name: user.name || 'Anonymous',
          avatar: user.avatar_url,
          isVerified: (user.verified_percentage ?? 0) >= 80
        },
        stats: {
          reportsSubmitted: user.reports_count ?? 0,
          reportsResolved: Math.round((user.reports_count ?? 0) * ((user.verified_percentage ?? 0) / 100)),
          totalPoints: user.total_points ?? 0,
          rank: index + 1
        },
        badges: user.badges || [],
        change: 0 // Real change tracking would need a previous-rank snapshot
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Get user statistics with real rank calculation
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      if (!supabase) {
        return { reportsSubmitted: 0, reportsResolved: 0, totalPoints: 0, rank: 0 };
      }

      const { data, error } = await supabase
        .from('users')
        .select('reports_count, verified_percentage, total_points')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const reportsSubmitted = data.reports_count ?? 0;
      const verifiedPct = data.verified_percentage ?? 0;
      const reportsResolved = Math.round(reportsSubmitted * (verifiedPct / 100));
      const totalPoints = data.total_points ?? 0;

      // Calculate real rank
      const { count: higherRanked } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', totalPoints)
        .eq('is_active', true);

      return {
        reportsSubmitted,
        reportsResolved,
        totalPoints,
        rank: (higherRanked ?? 0) + 1
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { reportsSubmitted: 0, reportsResolved: 0, totalPoints: 0, rank: 0 };
    }
  }

  // Get available badges from Supabase
  async getBadges(): Promise<Badge[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        criteria: badge.criteria
      }));
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  }

  // Get community statistics from Supabase
  async getCommunityStats(): Promise<{
    totalUsers: number;
    totalReports: number;
    totalResolved: number;
    resolutionRate: number;
    activeUsers: number;
  }> {
    const empty = { totalUsers: 0, totalReports: 0, totalResolved: 0, resolutionRate: 0, activeUsers: 0 };
    try {
      if (!supabase) return empty;

      const [usersRes, reportsRes, resolvedRes, activeRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('issues').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
        supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved').eq('is_hidden', false),
        supabase.from('issues').select('reporter_id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .eq('is_hidden', false)
      ]);

      const totalUsers = usersRes.count ?? 0;
      const totalReports = reportsRes.count ?? 0;
      const totalResolved = resolvedRes.count ?? 0;
      const activeUsers = activeRes.count ?? 0;
      const resolutionRate = totalReports > 0 ? Math.round(((totalResolved / totalReports) * 100) * 10) / 10 : 0;

      return { totalUsers, totalReports, totalResolved, resolutionRate, activeUsers };
    } catch (error) {
      console.error('Error fetching community stats:', error);
      return empty;
    }
  }

  // Subscribe to leaderboard changes
  subscribeToLeaderboard(callback: (leaderboard: LeaderboardEntry[]) => void) {
    if (!supabase) {
      console.warn('Supabase not available for real-time subscriptions');
      return null;
    }

    return supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        async () => {
          try {
            const leaderboard = await this.getLeaderboard(10);
            callback(leaderboard);
          } catch (error) {
            console.error('Error refreshing leaderboard:', error);
          }
        }
      )
      .subscribe();
  }

  // Get user profile from Supabase
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          avatar_url,
          bio,
          location_text,
          phone,
          preferences,
          created_at,
          reports_count,
          verified_percentage,
          total_points,
          badges
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const reportsCount = data.reports_count ?? 0;
      const verifiedPct = data.verified_percentage ?? 0;

      return {
        id: data.id,
        name: data.name || 'User',
        email: data.email || '',
        avatar: data.avatar_url || undefined,
        bio: data.bio || '',
        location: data.location_text || '',
        joinDate: data.created_at || new Date().toISOString(),
        totalPoints: data.total_points ?? 0,
        reportsSubmitted: reportsCount,
        reportsResolved: Math.round(reportsCount * (verifiedPct / 100)),
        verificationRate: verifiedPct,
        badges: data.badges || [],
        preferences: data.preferences ?? {
          notifications: true,
          publicProfile: true,
          locationSharing: false
        }
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Get user activity from Supabase
  async getUserActivity(userId: string): Promise<UserActivity[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data) return [];

      return data.map(activity => ({
        id: activity.id,
        user_id: activity.user_id,
        type: (activity.type || 'report_submitted') as UserActivity['type'],
        description: activity.description || '',
        points: activity.points ?? undefined,
        metadata: activity.metadata || {},
        created_at: activity.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }

  // Update user profile - now saves bio, location, preferences
  async updateUserProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile | null> {
    try {
      if (!supabase) return null;

      const validUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) validUpdates.name = updates.name;
      if (updates.bio !== undefined) validUpdates.bio = updates.bio;
      if (updates.location !== undefined) validUpdates.location_text = updates.location;
      if (updates.phone !== undefined) validUpdates.phone = updates.phone;
      if (updates.preferences !== undefined) validUpdates.preferences = updates.preferences;

      if (Object.keys(validUpdates).length === 0) {
        return this.getUserProfile(userId);
      }

      validUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .update(validUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error:', error);
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.error('RLS Policy Error: Run fix-users-update-policy.sql');
        }
        throw error;
      }

      // Record activity
      await this.addUserActivity({
        user_id: userId,
        type: 'profile_updated',
        description: 'Profile updated',
        metadata: { fields: Object.keys(validUpdates) }
      });

      return this.getUserProfile(userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  // Add user activity
  async addUserActivity(activityData: Omit<UserActivity, 'id' | 'created_at'>): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: activityData.user_id,
          type: activityData.type,
          description: activityData.description,
          points: activityData.points,
          metadata: activityData.metadata
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding user activity:', error);
      return false;
    }
  }

  // Delete user account
  async deleteAccount(userId: string): Promise<boolean> {
    try {
      if (!supabase) return false;

      // Soft-delete: mark user as inactive
      const { error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, prefs: Record<string, boolean>): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { data: currentUser } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

      const currentPrefs = currentUser?.preferences ?? {};
      const merged = { ...currentPrefs, ...prefs };

      const { error } = await supabase
        .from('users')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
}

export const userService = new UserService();
export default userService;