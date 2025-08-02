import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CivicIssue, STATUS_CONFIG } from '@/types/civic';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { 
  MapPin, 
  Clock, 
  User, 
  Heart, 
  Flag, 
  Eye,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface IssueDetailProps {
  issue: CivicIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpvote: (issueId: string) => void;
  onFlag: (issueId: string) => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  open,
  onOpenChange,
  onUpvote,
  onFlag
}) => {
  if (!issue) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return AlertCircle;
      case 'verified': return Eye;
      case 'in_progress': return PlayCircle;
      case 'resolved': return CheckCircle;
      default: return XCircle;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3">
            <CategoryIcon category={issue.category} size="sm" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold leading-tight">{issue.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={issue.status} showAnimation size="sm" />
                {issue.distance && (
                  <Badge variant="outline" className="text-xs">
                    {issue.distance.toFixed(1)}km away
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issue Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{issue.description}</p>
          </div>

          {/* Images */}
          {issue.images.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Photos</h3>
              <div className="grid grid-cols-2 gap-3">
                {issue.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={image}
                      alt={`Issue photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Location & Reporter Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </h3>
              <p className="text-sm text-muted-foreground">{issue.location.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {issue.location.latitude.toFixed(6)}, {issue.location.longitude.toFixed(6)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Reporter
              </h3>
              <p className="text-sm text-muted-foreground">
                {issue.isAnonymous ? 'Anonymous Citizen' : issue.reportedBy}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reported {formatDistanceToNow(issue.reportedAt, { addSuffix: true })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Status Timeline */}
          <div>
            <h3 className="font-semibold mb-4">Progress Timeline</h3>
            <div className="space-y-4">
              {issue.timeline.map((update, index) => {
                const StatusIcon = getStatusIcon(update.status);
                const isLatest = index === issue.timeline.length - 1;
                
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isLatest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      {index < issue.timeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-2" />
                      )}
                    </div>
                    
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {STATUS_CONFIG[update.status]?.label}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {format(update.timestamp, 'MMM dd, HH:mm')}
                        </Badge>
                      </div>
                      {update.note && (
                        <p className="text-sm text-muted-foreground">{update.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated by {update.updatedBy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpvote(issue.id)}
                className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
              >
                <Heart className="w-4 h-4" />
                <span>{issue.upvotes} upvotes</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onFlag(issue.id)}
                className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <Flag className="w-4 h-4" />
                <span>Flag</span>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(issue.updatedAt, { addSuffix: true })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};