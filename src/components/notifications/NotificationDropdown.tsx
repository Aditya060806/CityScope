import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  AlertCircle,
  Gift,
  MessageCircle,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }: { type: string }) => {
  const iconMap = {
    'issue_update': AlertCircle,
    'reward_earned': Gift,
    'system_alert': Info,
    'community_news': MessageCircle,
    'reminder': Clock,
    'default': Bell
  };

  const Icon = iconMap[type as keyof typeof iconMap] || iconMap.default;

  const colorMap = {
    'issue_update': 'text-blue-500',
    'reward_earned': 'text-green-500',
    'system_alert': 'text-red-500',
    'community_news': 'text-purple-500',
    'reminder': 'text-yellow-500',
    'default': 'text-gray-500'
  };

  return <Icon className={cn('w-4 h-4', colorMap[type as keyof typeof colorMap] || colorMap.default)} />;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colorMap = {
    'low': 'bg-gray-100 text-gray-600',
    'medium': 'bg-blue-100 text-blue-600',
    'high': 'bg-orange-100 text-orange-600',
    'urgent': 'bg-red-100 text-red-600'
  };

  return (
    <Badge
      variant="secondary"
      className={cn('text-xs', colorMap[priority as keyof typeof colorMap] || colorMap.low)}
    >
      {priority}
    </Badge>
  );
};

// Mock notification type
interface Notification {
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

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:text-royal hover:bg-transparent"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute top-1.5 right-1.5 h-4 w-4 p-0 text-[10px] bg-red-500 hover:bg-red-500 flex items-center justify-center border-2 border-white dark:border-slate-900 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 p-0 sm:w-80 w-[calc(100vw-2rem)]"
        sideOffset={8}
      >
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="text-lg font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-royal hover:text-royal hover:bg-royal/5"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-royal border-t-transparent mx-auto mb-2" />
              Loading notifications...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-gray-400">We'll notify you when something important happens</p>
            </div>
          ) : (
            <div className="p-2">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/20 border-l-2 border-l-royal"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <NotificationIcon type={notification.type} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium text-gray-900 dark:text-gray-100 truncate",
                          !notification.is_read && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <PriorityBadge priority={notification.priority} />
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-royal rounded-full" />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {index < recentNotifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-royal hover:bg-royal/5"
                onClick={() => setIsOpen(false)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
