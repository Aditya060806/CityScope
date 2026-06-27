import { supabase } from '@/lib/supabase';
import { 
  Partner, 
  Reward, 
  UserReward, 
  RedeemRewardRequest, 
  RedeemRewardResponse,
  RewardsFilter,
  PartnersFilter
} from '@/types/civic';

class RewardsService {
  // Get all active partners from Supabase
  async getPartners(filter: PartnersFilter = {}): Promise<Partner[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('partners').select('*').order('name');

      if (filter.type) query = query.eq('type', filter.type);
      if (filter.is_active !== undefined) query = query.eq('is_active', filter.is_active);
      if (filter.search) query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%,location.ilike.%${filter.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(item => this.convertPartnerFromDatabase(item));
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      return [];
    }
  }

  // Get all active rewards from Supabase
  async getRewards(filter: RewardsFilter = {}): Promise<Reward[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('rewards').select('*, partner:partners(*)').eq('is_active', true).order('points_required');

      if (filter.category) query = query.eq('category', filter.category);
      if (filter.min_points !== undefined) query = query.gte('points_required', filter.min_points);
      if (filter.max_points !== undefined) query = query.lte('points_required', filter.max_points);

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []).map(item => this.convertRewardFromDatabase(item));

      if (filter.partner_type) {
        results = results.filter(r => r.partner?.type === filter.partner_type);
      }
      if (filter.is_available) {
        results = results.filter(r => r.stock_quantity === -1 || r.stock_quantity > r.redeemed_count);
      }

      return results;
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      return [];
    }
  }

  // Get user's redeemed rewards
  async getUserRewards(userId: string): Promise<UserReward[]> {
    if (!supabase || !this.isValidUUID(userId)) return [];
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward:rewards(*),
          partner:rewards(partner:partners(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((item) => this.convertUserRewardFromDatabase(item)) || [];
    } catch (error) {
      console.error('Failed to fetch user rewards:', error);
      return [];
    }
  }

  // Redeem a reward
  async redeemReward(request: RedeemRewardRequest): Promise<RedeemRewardResponse> {
    if (!supabase) return { success: false, error: 'Service unavailable' };
    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_user_id: request.user_id,
        p_reward_id: request.reward_id
      });

      if (error) throw error;
      return data as RedeemRewardResponse;
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem reward'
      };
    }
  }

  // Get user's current points
  async getUserPoints(userId: string): Promise<number> {
    if (!supabase || !this.isValidUUID(userId)) return 0;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.total_points || 0;
    } catch (error) {
      console.error('Failed to fetch user points:', error);
      return 0;
    }
  }

  // Update user reward status
  async updateUserRewardStatus(userRewardId: string, status: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({ 
          status,
          redeemed_at: status === 'redeemed' ? new Date().toISOString() : null
        })
        .eq('id', userRewardId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update user reward status:', error);
      return false;
    }
  }


  // Convert database partner to app format
  private convertPartnerFromDatabase(item: unknown): Partner {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description,
      image_url: item.image_url,
      contact_link: item.contact_link,
      website_url: item.website_url,
      instagram_url: item.instagram_url,
      location: item.location,
      specialties: item.specialties || [],
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    };
  }

  // Convert database reward to app format
  private convertRewardFromDatabase(item: unknown): Reward {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      points_required: item.points_required,
      partner_id: item.partner_id,
      image_url: item.image_url,
      category: item.category,
      is_active: item.is_active,
      stock_quantity: item.stock_quantity,
      redeemed_count: item.redeemed_count,
      expiry_days: item.expiry_days,
      terms_conditions: item.terms_conditions,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
      partner: item.partner ? this.convertPartnerFromDatabase(item.partner) : undefined
    };
  }

  // Convert database user reward to app format
  private convertUserRewardFromDatabase(item: unknown): UserReward {
    return {
      id: item.id,
      user_id: item.user_id,
      reward_id: item.reward_id,
      status: item.status,
      voucher_code: item.voucher_code,
      redeemed_at: item.redeemed_at ? new Date(item.redeemed_at) : null,
      expires_at: item.expires_at ? new Date(item.expires_at) : null,
      partner_contact_info: item.partner_contact_info || {},
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
      reward: item.reward ? this.convertRewardFromDatabase(item.reward) : undefined,
      partner: item.partner ? this.convertPartnerFromDatabase(item.partner) : undefined
    };
  }

  // Helper method to validate UUID format
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// Export singleton instance
export const rewardsService = new RewardsService();
export default rewardsService;
