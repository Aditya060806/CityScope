import React from 'react';
import { IssueStatus, STATUS_CONFIG } from '@/types/civic';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: IssueStatus;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showAnimation = false,
  size = 'md' 
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.reported;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        'border-0 font-medium transition-all duration-300',
        sizeClasses[size],
        showAnimation && 'animate-civic-pulse',
        status === 'reported' && 'bg-status-reported/10 text-status-reported',
        status === 'verified' && 'bg-status-verified/10 text-status-verified',
        status === 'in_progress' && 'bg-status-progress/10 text-status-progress',
        status === 'resolved' && 'bg-status-resolved/10 text-status-resolved'
      )}
      style={{
        boxShadow: showAnimation ? `0 0 20px ${config.color}20` : undefined
      }}
    >
      <span 
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </Badge>
  );
};