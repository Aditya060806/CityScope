import { supabase } from '@/lib/supabase';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'discount' | 'voucher' | 'cash' | 'experience' | 'recognition';
  value: number; // Cash value in cents or discount percentage
  currency: string;
  isActive: boolean;
  imageUrl?: string;
  termsAndConditions: string;
  expiryDays?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
}

interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'expired';
  redeemedAt: Date;
  expiresAt?: Date;
  transactionId?: string;
  paymentMethod?: string;
  deliveryMethod: 'email' | 'sms' | 'mail' | 'pickup';
  deliveryDetails: {
    email?: string;
    phone?: string;
    address?: string;
    pickupLocation?: string;
  };
  reward: RewardItem;
}

interface PaymentMethod {
  id: string;
  type: 'upi' | 'razorpay' | 'points';
  name: string;
  details: {
    upiId?: string;
    razorpayOrderId?: string;
  };
  isDefault: boolean;
}

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

interface UPIConfig {
  upiId: string;
  merchantName: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'reward_redemption' | 'points_purchase' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

class PaymentService {
  private razorpayConfig: RazorpayConfig;
  private upiConfig: UPIConfig;
  private isInitialized = false;

  constructor() {
    this.razorpayConfig = {
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
      keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || ''
    };
    
    this.upiConfig = {
      upiId: import.meta.env.VITE_UPI_ID || '',
      merchantName: import.meta.env.VITE_MERCHANT_NAME || 'CityScope'
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Razorpay if available
      if (this.razorpayConfig.keyId && typeof window !== 'undefined') {
        // Load Razorpay.js dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.head.appendChild(script);
      }

      this.isInitialized = true;
      console.log('Payment Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Payment Service:', error);
      this.isInitialized = true; // Allow service to work with basic functionality
    }
  }

  // Get available rewards
  async getAvailableRewards(): Promise<RewardItem[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading rewards:', error);
      return [];
    }
  }

  // Get user's reward history
  async getUserRewards(userId: string): Promise<UserReward[]> {
    const { data, error } = await supabase
      .from('user_rewards')
      .select(`
        *,
        reward:rewards(*)
      `)
      .eq('user_id', userId)
      .order('redeemed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get user's payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Redeem reward
  async redeemReward(
    userId: string,
    rewardId: string,
    paymentMethod: string,
    deliveryMethod: 'email' | 'sms' | 'mail' | 'pickup',
    deliveryDetails: UserReward['deliveryDetails']
  ): Promise<UserReward> {
    await this.initialize();

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    if (rewardError || !reward) {
      throw new Error('Reward not found or inactive');
    }

    // Check if user has enough points
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    if (user.total_points < reward.points_required) {
      throw new Error('Insufficient points');
    }

    // Check if reward is still available
    if (reward.max_redemptions && reward.current_redemptions >= reward.max_redemptions) {
      throw new Error('Reward is no longer available');
    }

    // Create user reward record
    const expiresAt = reward.expiry_days 
      ? new Date(Date.now() + reward.expiry_days * 24 * 60 * 60 * 1000)
      : undefined;

    const { data: userReward, error: userRewardError } = await supabase
      .from('user_rewards')
      .insert({
        user_id: userId,
        reward_id: rewardId,
        points_spent: reward.points_required,
        status: 'pending',
        delivery_method: deliveryMethod,
        delivery_details: deliveryDetails,
        expires_at: expiresAt?.toISOString()
      })
      .select(`
        *,
        reward:rewards(*)
      `)
      .single();

    if (userRewardError) throw userRewardError;

    // Process payment based on method
    let transactionId: string | undefined;
    
    if (paymentMethod === 'points') {
      // Deduct points from user
      await this.deductPoints(userId, reward.points_required);
      transactionId = `points_${Date.now()}`;
    } else {
      // Process external payment
      transactionId = await this.processPayment({
        amount: this.calculatePaymentAmount(reward, paymentMethod),
        currency: reward.currency,
        paymentMethod,
        description: `Reward redemption: ${reward.name}`,
        metadata: {
          rewardId,
          userId,
          userRewardId: userReward.id
        }
      });
    }

    // Update user reward with transaction ID
    const { data: updatedReward, error: updateError } = await supabase
      .from('user_rewards')
      .update({
        transaction_id: transactionId,
        payment_method: paymentMethod,
        status: 'processing'
      })
      .eq('id', userReward.id)
      .select(`
        *,
        reward:rewards(*)
      `)
      .single();

    if (updateError) throw updateError;

    // Update reward redemption count
    await supabase
      .from('rewards')
      .update({
        current_redemptions: reward.current_redemptions + 1
      })
      .eq('id', rewardId);

    // Send confirmation notification
    await this.sendRedemptionConfirmation(userId, updatedReward);

    return updatedReward;
  }

  // Process external payment
  private async processPayment(paymentData: {
    amount: number;
    currency: string;
    paymentMethod: string;
    description: string;
    metadata: Record<string, unknown>;
  }): Promise<string> {
    // This would integrate with actual payment processors
    // For now, we'll simulate the payment process
    
    if (paymentData.paymentMethod === 'razorpay') {
      return await this.processRazorpayPayment(paymentData);
    } else if (paymentData.paymentMethod === 'upi') {
      return await this.processUPIPayment(paymentData);
    } else if (paymentData.paymentMethod === 'points') {
      return await this.processPointsPayment(paymentData);
    } else {
      throw new Error('Unsupported payment method');
    }
  }

  // Process Razorpay payment
  private async processRazorpayPayment(paymentData: unknown): Promise<string> {
    // In a real implementation, this would use Razorpay.js
    // For demo purposes, we'll simulate the payment
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate payment success/failure
        if (Math.random() > 0.05) { // 95% success rate (better than international services)
          resolve(`razorpay_${Date.now()}`);
        } else {
          reject(new Error('Payment failed'));
        }
      }, 1500);
    });
  }

  // Process UPI Reward Transfer (Citizens receive money)
  private async processUPIPayment(paymentData: unknown): Promise<string> {
    // This is for REWARDING citizens, not collecting payments
    const amount = paymentData.amount / 100; // Convert from cents to rupees
    const citizenUpiId = paymentData.citizenUpiId; // Citizen's UPI ID
    
    // Generate UPI payment request TO the citizen
    const rewardTransferLink = `upi://pay?pa=${citizenUpiId}&pn=${paymentData.citizenName}&am=${amount}&cu=INR&tn=CityScope Reward - ${encodeURIComponent(paymentData.description)}`;
    
    console.log(`Reward Transfer: ₹${amount} to ${citizenUpiId} for ${paymentData.description}`);
    
    // In real implementation, this would:
    // 1. Notify admin to approve transfer
    // 2. Generate payment request to citizen
    // 3. Track reward distribution
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`reward_transfer_${Date.now()}`);
      }, 500);
    });
  }

  // Process Points payment (FREE - internal system)
  private async processPointsPayment(paymentData: unknown): Promise<string> {
    // Points payment is always free and instant
    return Promise.resolve(`points_${Date.now()}`);
  }

  // Process bank transfer
  private async processBankTransfer(paymentData: unknown): Promise<string> {
    // Simulate bank transfer
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.02) { // 98% success rate
          resolve(`bank_${Date.now()}`);
        } else {
          reject(new Error('Bank transfer failed'));
        }
      }, 3000);
    });
  }

  // Calculate payment amount based on reward and payment method
  private calculatePaymentAmount(reward: RewardItem, paymentMethod: string): number {
    if (paymentMethod === 'points') {
      return 0; // Points are already deducted
    }

    // For cash rewards, charge the full value
    if (reward.category === 'cash') {
      return reward.value;
    }

    // For discounts, charge a small processing fee
    if (reward.category === 'discount') {
      return Math.max(10, Math.round(reward.value * 0.05)); // 5% or minimum 10 cents
    }

    // For vouchers and experiences, charge the full value
    return reward.value;
  }

  // Deduct points from user
  private async deductPoints(userId: string, points: number): Promise<void> {
    const { error } = await supabase.rpc('deduct_user_points', {
      user_id: userId,
      points_to_deduct: points
    });

    if (error) throw error;
  }

  // Send redemption confirmation
  private async sendRedemptionConfirmation(userId: string, userReward: UserReward): Promise<void> {
    const { notificationService } = await import('@/services/NotificationService');
    
    await notificationService.sendNotification({
      userId,
      type: 'system',
      title: 'Reward Redemption Confirmed',
      message: `Your reward "${userReward.reward.name}" has been processed. ${this.getDeliveryMessage(userReward)}`,
      data: {
        userRewardId: userReward.id,
        rewardName: userReward.reward.name
      }
    });
  }

  // Get delivery message based on method
  private getDeliveryMessage(userReward: UserReward): string {
    switch (userReward.deliveryMethod) {
      case 'email':
        return `Check your email at ${userReward.deliveryDetails.email} for delivery details.`;
      case 'sms':
        return `SMS sent to ${userReward.deliveryDetails.phone} with delivery details.`;
      case 'mail':
        return `Will be delivered to ${userReward.deliveryDetails.address} within 5-7 business days.`;
      case 'pickup':
        return `Available for pickup at ${userReward.deliveryDetails.pickupLocation}.`;
      default:
        return 'Please check your account for delivery details.';
    }
  }

  // Get user's transaction history
  async getTransactionHistory(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Cancel reward redemption
  async cancelRewardRedemption(userRewardId: string): Promise<void> {
    const { data: userReward, error: fetchError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('id', userRewardId)
      .single();

    if (fetchError || !userReward) {
      throw new Error('Reward redemption not found');
    }

    if (userReward.status !== 'pending' && userReward.status !== 'processing') {
      throw new Error('Cannot cancel this redemption');
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ status: 'cancelled' })
      .eq('id', userRewardId);

    if (updateError) throw updateError;

    // Refund points if payment was made with points
    if (userReward.payment_method === 'points') {
      await this.refundPoints(userReward.user_id, userReward.points_spent);
    }

    // Process refund for external payments
    if (userReward.transaction_id && userReward.payment_method !== 'points') {
      await this.processRefund(userReward.transaction_id, userReward.payment_method);
    }
  }

  // Refund points to user
  private async refundPoints(userId: string, points: number): Promise<void> {
    const { error } = await supabase.rpc('add_user_points', {
      user_id: userId,
      points_to_add: points
    });

    if (error) throw error;
  }

  // Process refund for external payments
  private async processRefund(transactionId: string, paymentMethod: string): Promise<void> {
    // In a real implementation, this would call the payment processor's refund API
    console.log(`Processing refund for transaction ${transactionId} via ${paymentMethod}`);
  }

  // Get reward categories
  getRewardCategories(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'discount', name: 'Discounts', description: 'Discounts on municipal services' },
      { id: 'voucher', name: 'Vouchers', description: 'Gift vouchers and coupons' },
      { id: 'cash', name: 'Cash Rewards', description: 'Direct cash payments' },
      { id: 'experience', name: 'Experiences', description: 'Special experiences and events' },
      { id: 'recognition', name: 'Recognition', description: 'Certificates and recognition' }
    ];
  }

  // Get payment methods
  getSupportedPaymentMethods(): Array<{ id: string; name: string; description: string; icon: string }> {
    return [
      { id: 'points', name: 'Points', description: 'Use your earned points', icon: '⭐' },
      { id: 'stripe', name: 'Credit/Debit Card', description: 'Pay with your card', icon: '💳' },
      { id: 'upi', name: 'UPI', description: 'Pay via UPI', icon: '📱' },
      { id: 'bank_transfer', name: 'Bank Transfer', description: 'Direct bank transfer', icon: '🏦' }
    ];
  }

  // Check if user can redeem reward
  async canRedeemReward(userId: string, rewardId: string): Promise<{
    canRedeem: boolean;
    reason?: string;
  }> {
    try {
      // Get user points
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return { canRedeem: false, reason: 'User not found' };
      }

      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single();

      if (rewardError || !reward) {
        return { canRedeem: false, reason: 'Reward not available' };
      }

      // Check points
      if (user.total_points < reward.points_required) {
        return { canRedeem: false, reason: 'Insufficient points' };
      }

      // Check availability
      if (reward.max_redemptions && reward.current_redemptions >= reward.max_redemptions) {
        return { canRedeem: false, reason: 'Reward is sold out' };
      }

      return { canRedeem: true };
    } catch (error) {
      return { canRedeem: false, reason: 'Error checking eligibility' };
    }
  }
}

export const paymentService = new PaymentService();
