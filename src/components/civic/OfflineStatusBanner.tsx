import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface OfflineStatusBannerProps {
  isOnline: boolean;
  isReconnecting?: boolean;
  onRetry?: () => void;
  cachedItemsCount?: number;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  isOnline,
  isReconnecting = false,
  onRetry,
  cachedItemsCount = 0
}) => {
  if (isOnline) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 animate-slide-up">
        <div className="p-3">
          <div className="flex items-center gap-2 text-green-800">
            <Wifi className="w-4 h-4" />
            <span className="font-medium">🟢 Back Online – Syncing Now…</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-bone border-orange-200 shadow-civic animate-slide-up">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 rounded-full p-2">
              <WifiOff className="w-4 h-4 text-orange-600" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-royal">
                  🚫 No Internet? Viewing recent reports.
                </span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {cachedItemsCount} cached
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You're viewing the last {cachedItemsCount} reports from your cache
              </p>
            </div>
          </div>
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-orange-200 hover:bg-orange-50 rounded-xl"
              disabled={isReconnecting}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isReconnecting ? 'animate-spin' : ''}`} />
              {isReconnecting ? 'Connecting...' : 'Retry'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};