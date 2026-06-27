import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineStatusBannerProps {
  isOnline: boolean;
  pendingItems: number;
  onRetry?: () => void;
  className?: string;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  isOnline,
  pendingItems,
  onRetry,
  className
}) => {
  if (isOnline && pendingItems === 0) {
    return null; // Don't show banner when online and no pending items
  }

  return (
    <Alert className={cn(
      "border-l-4 rounded-none shadow-sm",
      isOnline 
        ? "border-green-500 bg-green-50" 
        : "border-yellow-500 bg-yellow-50",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-yellow-600" />
          )}
          
          <div>
            <AlertDescription className="text-sm">
              {isOnline ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">Back online</span>
                  {pendingItems > 0 && (
                    <span className="text-green-700">
                      - Syncing {pendingItems} pending item{pendingItems !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-800">You're offline</span>
                  {pendingItems > 0 && (
                    <span className="text-yellow-700">
                      - {pendingItems} report{pendingItems !== 1 ? 's' : ''} queued for sync
                    </span>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>

        {!isOnline && pendingItems > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              <Upload className="w-3 h-3 mr-1" />
              {pendingItems} pending
            </Badge>
            
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {isOnline && pendingItems > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Upload className="w-3 h-3 mr-1" />
              Syncing...
            </Badge>
          </div>
        )}
      </div>
    </Alert>
  );
};