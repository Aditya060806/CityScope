import { supabase } from '@/lib/supabase';
import { apiService } from './ComprehensiveAPIService';

export interface Notification {
  id: string;
  user_id: string;
  type: 'issue_update' | 'reward_earned' | 'system_alert' | 'community_news' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  expires_at?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private isInitialized = false;
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🔔 Initializing Notification Service...');
      
      this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        this.registration = await navigator.serviceWorker.ready;
        console.log('✅ Notification Service initialized successfully');
      } else {
        console.warn('⚠️ Push notifications not supported');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    try {
      if (!this.registration || !this.vapidPublicKey) {
        throw new Error('Service worker or VAPID key not available');
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Save subscription to database
      if (supabase) {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            subscription: subscription.toJSON(),
            created_at: new Date().toISOString()
          });
      }

      console.log('🔔 Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(userId: string): Promise<void> {
    try {
      if (!this.registration) return;

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      if (supabase) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);
      }

      console.log('🔔 Push subscription removed');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }

  // Send push notification
  async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      if (!supabase) return;

      // Get user's push subscription
      const { data: subscriptionData } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (!subscriptionData) {
        console.warn('No push subscription found for user:', userId);
        return;
      }

      // Send notification via your backend (you'd need to implement this endpoint)
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscriptionData.subscription,
          payload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      console.log('🔔 Push notification sent to user:', userId);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Create in-app notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      if (notification.priority === 'high' || notification.priority === 'urgent') {
        await this.sendPushNotification(notification.user_id, {
          title: notification.title,
          body: notification.message,
          data: notification.data
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Clear notification
  async clearNotification(notificationId: string): Promise<void> {
    try {
      if (!supabase) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing notification:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!supabase) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Send issue update notification
  async notifyIssueUpdate(issueId: string, updateType: string, details: string): Promise<void> {
    try {
      if (!supabase) return;

      // Get issue details
      const { data: issue } = await supabase
        .from('issues')
        .select('reporter_id, title, assigned_to')
        .eq('id', issueId)
        .single();

      if (!issue) return;

      const recipients = [issue.reporter_id, issue.assigned_to].filter(Boolean);
      
      for (const userId of recipients) {
        await this.createNotification({
          user_id: userId,
          type: 'issue_update',
          title: 'Issue Update',
          message: `${issue.title}: ${details}`,
          data: { issue_id: issueId, update_type: updateType },
          is_read: false,
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error sending issue update notification:', error);
    }
  }

  // Send reward notification
  async notifyRewardEarned(userId: string, points: number, reason: string): Promise<void> {
    try {
      await this.createNotification({
        user_id: userId,
        type: 'reward_earned',
        title: '🎉 Points Earned!',
        message: `You earned ${points} points for ${reason}`,
        data: { points, reason },
        is_read: false,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending reward notification:', error);
    }
  }

  // Send system alert
  async sendSystemAlert(userId: string, title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<void> {
    try {
      await this.createNotification({
        user_id: userId,
        type: 'system_alert',
        title,
        message,
        is_read: false,
        priority
      });
    } catch (error) {
      console.error('Error sending system alert:', error);
    }
  }

  // Send community news
  async sendCommunityNews(userId: string, title: string, message: string): Promise<void> {
    try {
      await this.createNotification({
        user_id: userId,
        type: 'community_news',
        title,
        message,
        is_read: false,
        priority: 'low'
      });
    } catch (error) {
      console.error('Error sending community news:', error);
    }
  }

  // Send reminder
  async sendReminder(userId: string, title: string, message: string, reminderTime: Date): Promise<void> {
    try {
      await this.createNotification({
        user_id: userId,
        type: 'reminder',
        title,
        message,
        is_read: false,
        priority: 'medium',
        expires_at: reminderTime.toISOString()
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  // Send email notification
  async sendEmailNotification(userId: string, subject: string, message: string): Promise<void> {
    try {
      if (!supabase) return;

      // Get user email
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user?.email) return;

      // Use EmailJS to send email
      await apiService.sendEmailNotification(user.email, subject, message);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Schedule notification
  async scheduleNotification(notification: Omit<Notification, 'id' | 'created_at'>, scheduleTime: Date): Promise<void> {
    try {
      const delay = scheduleTime.getTime() - Date.now();
      
      if (delay > 0) {
        setTimeout(async () => {
          await this.createNotification(notification);
        }, delay);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  // Helper methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Get permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;