import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon,
  Wifi, 
  WifiOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  MoreVertical
} from 'lucide-react';

interface RealtimeChatProps {
  issueId: string;
  userId: string;
  userName: string;
  className?: string;
}

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  issueId,
  userId,
  userName,
  className
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [activeBlobUrls, setActiveBlobUrls] = useState<string[]>([]);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isSending,
    error,
    isConnected,
    messagesEndRef,
    sendMessage,
    markAllMessagesAsRead,
    retryConnection,
    getUnreadCount,
    formatMessageTime,
    groupMessagesByDate
  } = useRealtimeChat({ issueId, userId, userName });

  // Mark messages as read when component mounts
  useEffect(() => {
    markAllMessagesAsRead();
  }, [markAllMessagesAsRead]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [activeBlobUrls]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    await sendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    setIsTyping(true);

    // Clear typing indicator after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Handle file uploads
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // Upload images and send as attachments
      handleImageUpload(imageFiles);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    const blobUrls: string[] = [];
    try {
      // Create blob URLs for preview
      const attachments = files.map(file => {
        const blobUrl = URL.createObjectURL(file);
        blobUrls.push(blobUrl);
        setActiveBlobUrls(prev => [...prev, blobUrl]);
        return blobUrl;
      });
      
      await sendMessage('', 'image', attachments);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      // Clean up blob URLs after a short delay to allow for rendering
      setTimeout(() => {
        blobUrls.forEach(url => {
          URL.revokeObjectURL(url);
          setActiveBlobUrls(prev => prev.filter(activeUrl => activeUrl !== url));
        });
      }, 1000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isConsecutiveMessage = (current: unknown, previous: unknown) => {
    if (!previous) return false;
    
    const timeDiff = current.createdAt.getTime() - previous.createdAt.getTime();
    const isWithin5Minutes = timeDiff < 5 * 60 * 1000;
    
    return (
      current.senderId === previous.senderId &&
      isWithin5Minutes
    );
  };

  const renderMessage = (msg: unknown, index: number, allMessages: unknown[]) => {
    const isOwn = msg.senderId === userId;
    const isConsecutive = isConsecutiveMessage(msg, allMessages[index - 1]);
    const showAvatar = !isConsecutive;

    return (
      <div
        key={msg.id}
        className={cn(
          "flex gap-3 mb-2",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {showAvatar && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={`/avatars/${msg.senderId}.jpg`} />
            <AvatarFallback className="text-xs">
              {getInitials(msg.senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        
        {!showAvatar && <div className="w-8" />}
        
        <div className={cn(
          "flex flex-col max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}>
          {showAvatar && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {msg.senderName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
          )}
          
          <div className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isOwn 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}>
            {msg.messageType === 'image' && msg.attachments.length > 0 ? (
              <div className="space-y-2">
                <p>{msg.message}</p>
                <div className="grid grid-cols-2 gap-2">
                  {msg.attachments.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Attachment"
                      className="rounded-md max-w-full h-auto"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{msg.message}</p>
            )}
          </div>
          
          {!showAvatar && (
            <span className="text-xs text-muted-foreground mt-1">
              {formatMessageTime(msg.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderDateSeparator = (date: string) => (
    <div key={date} className="flex items-center justify-center my-4">
      <div className="flex items-center gap-2">
        <div className="h-px bg-border flex-1" />
        <Badge variant="secondary" className="text-xs">
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Badge>
        <div className="h-px bg-border flex-1" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading chat...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full h-[500px] flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Issue Discussion</CardTitle>
          <div className="flex items-center gap-2">
            {getUnreadCount() > 0 && (
              <Badge variant="destructive" className="text-xs">
                {getUnreadCount()} unread
              </Badge>
            )}
            
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {!isConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={retryConnection}
                className="h-6 px-2"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-1">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
                <div key={date}>
                  {renderDateSeparator(date)}
                  {dateMessages.map((msg, index) => 
                    renderMessage(msg, index, dateMessages)
                  )}
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>Someone is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Input
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isSending || !isConnected}
              className="flex-1"
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending || !isConnected}
              size="sm"
              className="flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};
