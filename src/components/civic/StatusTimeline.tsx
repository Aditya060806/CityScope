import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusUpdate, STATUS_CONFIG } from '@/types/civic';
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusTimelineProps {
  timeline: StatusUpdate[];
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  timeline,
  className
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return Zap;
      case 'verified': return AlertCircle;
      case 'in_progress': return Clock;
      case 'resolved': return CheckCircle;
      default: return Zap;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={cn('glass-card border-powder/30 p-4', className)}>
      <h3 className="font-semibold text-royal mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Status Timeline
      </h3>
      
      <div className="space-y-4">
        {timeline.map((update, index) => {
          const StatusIcon = getStatusIcon(update.status);
          const config = STATUS_CONFIG[update.status];
          const isLatest = index === timeline.length - 1;
          
          return (
            <div key={index} className="flex gap-3">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                    isLatest 
                      ? 'bg-royal text-white shadow-royal animate-pulse-royal' 
                      : 'bg-powder text-royal'
                  )}
                  style={{ backgroundColor: isLatest ? undefined : config.color }}
                >
                  <StatusIcon className="w-4 h-4" />
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-8 bg-powder/50 mt-2" />
                )}
              </div>
              
              {/* Timeline Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${config.color}15`,
                      borderColor: config.color,
                      color: config.color
                    }}
                  >
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(update.timestamp)}
                  </span>
                </div>
                
                {update.note && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {update.note}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Updated by {update.updatedBy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};