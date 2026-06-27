import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/services/SupabaseService';
import { ChatMessage } from '@/types/civic';

interface UseRealtimeChatProps {
  issueId: string;
  userId: string;
  userName: string;
}

export const useRealtimeChat = ({ issueId, userId, userName }: UseRealtimeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const channelRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [issueId, loadMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!issueId) return;

    // Create real-time channel
    const channel = supabase
      .channel(`chat:${issueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `issue_id=eq.${issueId}`
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            issue_id: string;
            sender_id: string;
            sender_name: string;
            message: string;
            timestamp: string;
            is_admin: boolean;
          };
          const transformedMessage = {
            id: newMessage.id,
            issueId: newMessage.issue_id,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender_name,
            message: newMessage.message,
            messageType: newMessage.message_type,
            attachments: newMessage.attachments || [],
            createdAt: new Date(newMessage.created_at),
            isRead: newMessage.is_read
          };

          setMessages(prev => [...prev, transformedMessage]);
          
          // Mark as read if it's not from current user
          if (newMessage.sender_id !== userId) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `issue_id=eq.${issueId}`
        },
        (payload) => {
          const updatedMessage = payload.new as {
            id: string;
            issue_id: string;
            sender_id: string;
            sender_name: string;
            message: string;
            timestamp: string;
            is_admin: boolean;
          };
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id 
                ? { ...msg, isRead: updatedMessage.is_read }
                : msg
            )
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [issueId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const chatMessages = await supabaseService.getChatMessages(issueId, 100);
      setMessages(chatMessages);
    } catch (err) {
      console.error('Error loading chat messages:', err);
      setError('Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  const sendMessage = async (
    message: string,
    messageType: 'text' | 'image' | 'voice' | 'file' = 'text',
    attachments: string[] = []
  ) => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      setIsSending(true);
      setError(null);

      const newMessage = await supabaseService.sendChatMessage({
        issueId,
        senderId: userId,
        senderName: userName,
        message: message.trim(),
        messageType,
        attachments
      });

      // Message will be added via real-time subscription
      // No need to manually add it here
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const markAllMessagesAsRead = async () => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('issue_id', issueId)
        .neq('sender_id', userId);
    } catch (err) {
      console.error('Error marking all messages as read:', err);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const retryConnection = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    // Re-subscribe
    const channel = supabase
      .channel(`chat:${issueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `issue_id=eq.${issueId}`
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            issue_id: string;
            sender_id: string;
            sender_name: string;
            message: string;
            timestamp: string;
            is_admin: boolean;
          };
          const transformedMessage = {
            id: newMessage.id,
            issueId: newMessage.issue_id,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender_name,
            message: newMessage.message,
            messageType: newMessage.message_type,
            attachments: newMessage.attachments || [],
            createdAt: new Date(newMessage.created_at),
            isRead: newMessage.is_read
          };

          setMessages(prev => [...prev, transformedMessage]);
          
          if (newMessage.sender_id !== userId) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  };

  const getUnreadCount = () => {
    return messages.filter(msg => !msg.isRead && msg.senderId !== userId).length;
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = message.createdAt.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  return {
    messages,
    isLoading,
    isSending,
    error,
    isConnected,
    messagesEndRef,
    sendMessage,
    markMessageAsRead,
    markAllMessagesAsRead,
    scrollToBottom,
    retryConnection,
    getUnreadCount,
    formatMessageTime,
    groupMessagesByDate,
    loadMessages
  };
};
