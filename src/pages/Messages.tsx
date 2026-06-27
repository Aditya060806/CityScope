import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Users, 
  CheckCheck,
  Loader2,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user?.id || !supabase) {
      setLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        // Get all messages involving this user, grouped by partner
        const { data, error } = await supabase
          .from('user_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const convMap = new Map<string, Conversation>();
        for (const msg of (data || [])) {
          const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (!convMap.has(partnerId)) {
            convMap.set(partnerId, {
              id: partnerId,
              partner_id: partnerId,
              partner_name: msg.sender_id === user.id ? (msg.receiver_name || 'User') : (msg.sender_name || 'User'),
              partner_avatar: undefined,
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0,
            });
          } else if (!msg.is_read && msg.receiver_id === user.id) {
            const conv = convMap.get(partnerId)!;
            conv.unread_count += 1;
          }
        }

        setConversations(Array.from(convMap.values()));
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Real-time subscription
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        // Add to current messages if in active conversation
        if (selectedConversation && 
            (newMsg.sender_id === selectedConversation.partner_id)) {
          setMessages(prev => [...prev, newMsg]);
        }
        // Refresh conversations
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedConversation?.partner_id]);

  // Search users for new conversation
  useEffect(() => {
    if (!userSearchQuery.trim() || !supabase || !user?.id) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email')
          .neq('id', user.id)
          .or(`name.ilike.%${userSearchQuery}%,email.ilike.%${userSearchQuery}%`)
          .limit(10);
        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, user?.id]);

  const startNewConversation = (partner: { id: string; name: string }) => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.partner_id === partner.id);
    if (existing) {
      setSelectedConversation(existing);
    } else {
      const newConv: Conversation = {
        id: partner.id,
        partner_id: partner.id,
        partner_name: partner.name,
        partner_avatar: undefined,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      };
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
    }
    setShowNewConversation(false);
    setUserSearchQuery('');
    setSearchResults([]);
  };

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user?.id || !supabase) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation.partner_id}),and(sender_id.eq.${selectedConversation.partner_id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        // Mark as read
        await supabase
          .from('user_messages')
          .update({ is_read: true })
          .eq('sender_id', selectedConversation.partner_id)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      }
    };

    loadMessages();
  }, [selectedConversation?.partner_id, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id || !supabase) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          sender_name: user.name || 'User',
          receiver_id: selectedConversation.partner_id,
          receiver_name: selectedConversation.partner_name,
          content: newMessage.trim(),
          is_read: false,
        });

      if (error) throw error;

      // Optimistically add message
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: selectedConversation.partner_id,
        content: newMessage.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      }]);

      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.partner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Please sign in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader
          icon={<MessageCircle className="h-5 w-5" />}
          title="Messages"
          description={`${conversations.length} conversation${conversations.length !== 1 ? 's' : ''} in your inbox`}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Conversation List */}
          <Card className={cn(
            "md:col-span-1 flex flex-col border-slate-200/80 bg-white/90",
            selectedConversation && "hidden md:flex"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0 h-10 w-10 border-royal/30 text-royal hover:bg-royal/5"
                  onClick={() => setShowNewConversation(!showNewConversation)}
                  title="New message"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              {showNewConversation && (
                <div className="border border-royal/20 rounded-lg p-3 bg-royal/5 space-y-2">
                  <p className="text-xs font-semibold text-royal">Start new conversation</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                      autoFocus
                    />
                  </div>
                  {searchingUsers && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-royal" />
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 rounded border border-gray-200">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => startNewConversation(u)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-royal/10 text-royal font-bold text-xs">
                              {u.name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {userSearchQuery.trim() && !searchingUsers && searchResults.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No users found</p>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-royal" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <Users className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new conversation from the plus button above</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-royal/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conv.partner_avatar} />
                          <AvatarFallback className="bg-royal/10 text-royal font-bold text-sm">
                            {conv.partner_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {conv.partner_name}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-500 truncate">
                              {conv.last_message}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge className="bg-royal text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className={cn(
            "md:col-span-2 flex flex-col border-slate-200/80 bg-white/90",
            !selectedConversation && "hidden md:flex"
          )}>
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden w-8 h-8"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={selectedConversation.partner_avatar} />
                    <AvatarFallback className="bg-royal/10 text-royal font-bold text-sm">
                      {selectedConversation.partner_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {selectedConversation.partner_name}
                    </h3>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                            isMine 
                              ? 'bg-royal text-white rounded-br-md' 
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          )}>
                            <p>{msg.content}</p>
                            <div className={cn(
                              'flex items-center gap-1 mt-1',
                              isMine ? 'justify-end' : 'justify-start'
                            )}>
                              <span className={cn(
                                'text-[10px]',
                                isMine ? 'text-white/60' : 'text-gray-400'
                              )}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && msg.is_read && (
                                <CheckCheck className="w-3 h-3 text-white/60" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-100">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sending}
                      className="bg-royal hover:bg-royal/90 text-white rounded-xl w-10 h-10 shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose from your existing conversations to start chatting</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
