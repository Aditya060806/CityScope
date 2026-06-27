import { supabase } from '@/lib/supabase';
import { apiService } from './ComprehensiveAPIService';

export interface ChatMessage {
  id: string;
  issue_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  message_type: 'text' | 'image' | 'voice' | 'file' | 'system';
  attachments: string[];
  created_at: string;
  is_read: boolean;
  reply_to?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatRoom {
  id: string;
  issue_id: string;
  participants: string[];
  last_message?: ChatMessage;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  user_id: string;
  user_name: string;
  is_typing: boolean;
  timestamp: string;
}

class RealtimeChatService {
  private subscriptions: Map<string, unknown> = new Map();
  private typingUsers: Map<string, TypingIndicator> = new Map();
  private typingTimeout: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('💬 Initializing Realtime Chat Service...');
      
      if (supabase) {
        // Test connection
        const { data, error } = await supabase.from('chat_messages').select('count').limit(1);
        if (error) {
          console.warn('⚠️ Chat service database connection failed:', error.message);
        } else {
          console.log('✅ Realtime Chat Service initialized successfully');
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize chat service:', error);
      throw error;
    }
  }

  // Subscribe to chat messages for an issue
  subscribeToIssueChat(issueId: string, onMessage: (message: ChatMessage) => void, onTyping: (typing: TypingIndicator) => void): () => void {
    if (!supabase) return () => {};

    const channelName = `issue-chat-${issueId}`;
    
    // Unsubscribe from existing subscription if any
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `issue_id=eq.${issueId}`
      }, (payload) => {
        const message = payload.new as ChatMessage;
        onMessage(message);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `issue_id=eq.${issueId}`
      }, (payload) => {
        const message = payload.new as ChatMessage;
        onMessage(message);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        onTyping(payload.payload as TypingIndicator);
      })
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
    };
  }

  // Send a message
  async sendMessage(issueId: string, senderId: string, senderName: string, message: string, messageType: 'text' | 'image' | 'voice' | 'file' = 'text', attachments: string[] = [], replyTo?: string): Promise<ChatMessage> {
    try {
      if (!supabase) throw new Error('Database not available');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          issue_id: issueId,
          sender_id: senderId,
          sender_name: senderName,
          message,
          message_type: messageType,
          attachments,
          reply_to: replyTo,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification to other participants
      await this.notifyMessageSent(issueId, senderId, data);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get chat history for an issue
  async getChatHistory(issueId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(issueId: string, userId: string): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('issue_id', issueId)
        .neq('sender_id', userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Send typing indicator
  sendTypingIndicator(issueId: string, userId: string, userName: string, isTyping: boolean): void {
    if (!supabase) return;

    const channelName = `issue-chat-${issueId}`;
    const channel = this.subscriptions.get(channelName);
    
    if (channel) {
      const typingData: TypingIndicator = {
        user_id: userId,
        user_name: userName,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      };

      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: typingData
      });

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        const timeoutKey = `${issueId}-${userId}`;
        
        // Clear existing timeout
        if (this.typingTimeout.has(timeoutKey)) {
          clearTimeout(this.typingTimeout.get(timeoutKey)!);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
          this.sendTypingIndicator(issueId, userId, userName, false);
          this.typingTimeout.delete(timeoutKey);
        }, 3000);

        this.typingTimeout.set(timeoutKey, timeout);
      }
    }
  }

  // Upload file attachment
  async uploadAttachment(file: File, issueId: string): Promise<string> {
    try {
      if (!supabase) throw new Error('Storage not available');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `chat-attachments/${issueId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  // Send voice message
  async sendVoiceMessage(issueId: string, senderId: string, senderName: string, audioBlob: Blob, transcription?: string): Promise<ChatMessage> {
    try {
      // Upload audio file
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      const audioUrl = await this.uploadAttachment(audioFile, issueId);

      // Send message with voice attachment
      return await this.sendMessage(
        issueId,
        senderId,
        senderName,
        transcription || '[Voice Message]',
        'voice',
        [audioUrl]
      );
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  }

  // Send image message
  async sendImageMessage(issueId: string, senderId: string, senderName: string, imageFile: File, caption?: string): Promise<ChatMessage> {
    try {
      // Upload image file
      const imageUrl = await this.uploadAttachment(imageFile, issueId);

      // Send message with image attachment
      return await this.sendMessage(
        issueId,
        senderId,
        senderName,
        caption || '[Image]',
        'image',
        [imageUrl]
      );
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }

  // Get unread message count for user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!supabase) return 0;

      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get chat rooms for user
  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      if (!supabase) return [];

      // Get issues where user is participant
      const { data: issues, error: issuesError } = await supabase
        .from('issues')
        .select('id, title, reporter_id, assigned_to')
        .or(`reporter_id.eq.${userId},assigned_to.eq.${userId}`);

      if (issuesError) throw issuesError;

      const chatRooms: ChatRoom[] = [];

      for (const issue of issues || []) {
        // Get last message
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('issue_id', issue.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('issue_id', issue.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        chatRooms.push({
          id: issue.id,
          issue_id: issue.id,
          participants: [issue.reporter_id, issue.assigned_to].filter(Boolean),
          last_message: lastMessage,
          unread_count: unreadCount || 0,
          created_at: new Date().toISOString(),
          updated_at: lastMessage?.created_at || new Date().toISOString()
        });
      }

      return chatRooms.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } catch (error) {
      console.error('Error getting user chat rooms:', error);
      return [];
    }
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      if (!supabase) return;

      // Check if user is the sender
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) throw new Error('Message not found');
      if (message.sender_id !== userId) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Edit message
  async editMessage(messageId: string, userId: string, newMessage: string): Promise<void> {
    try {
      if (!supabase) return;

      // Check if user is the sender
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) throw new Error('Message not found');
      if (message.sender_id !== userId) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          message: newMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Notify message sent
  private async notifyMessageSent(issueId: string, senderId: string, message: ChatMessage): Promise<void> {
    try {
      // Get issue participants
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .select('reporter_id, assigned_to, title')
        .eq('id', issueId)
        .single();

      if (issueError || !issue) return;

      const participants = [issue.reporter_id, issue.assigned_to].filter(id => id && id !== senderId);

      // Send push notifications
      for (const participantId of participants) {
        await apiService.sendEmailNotification(
          participantId, // This would be email in real implementation
          `New message in ${issue.title}`,
          `${message.sender_name}: ${message.message}`
        );
      }
    } catch (error) {
      console.error('Error notifying message sent:', error);
    }
  }

  // Cleanup
  cleanup(): void {
    // Unsubscribe from all channels
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // Clear typing timeouts
    this.typingTimeout.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.typingTimeout.clear();

    this.typingUsers.clear();
  }
}

// Export singleton instance
export const realtimeChatService = new RealtimeChatService();
export default realtimeChatService;
