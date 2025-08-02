import React from 'react';
import { CivicIssue } from '@/types/civic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { Heart, Flag, MapPin, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IssueCardProps {
  issue: CivicIssue;
  onUpvote: (issueId: string) => void;
  onFlag: (issueId: string) => void;
  onClick: (issue: CivicIssue) => void;
  className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({ 
  issue, 
  onUpvote, 
  onFlag, 
  onClick,
  className 
}) => {
  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpvote(issue.id);
  };

  const handleFlag = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlag(issue.id);
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-300 hover:shadow-civic hover:scale-[1.02] animate-slide-up bg-card/80 backdrop-blur-sm border-border/50',
        className
      )}
      onClick={() => onClick(issue)}
    >
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <CategoryIcon category={issue.category} size="sm" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg leading-tight text-foreground line-clamp-2">
                {issue.title}
              </h3>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                {issue.description}
              </p>
            </div>
          </div>
          <StatusBadge status={issue.status} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Location & Distance */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate flex-1">{issue.location.address}</span>
            {issue.distance && (
              <span className="font-medium">
                {issue.distance.toFixed(1)}km
              </span>
            )}
          </div>

          {/* Reporter & Time */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>
                {issue.isAnonymous ? 'Anonymous' : issue.reportedBy}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(issue.reportedAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Images Preview */}
          {issue.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {issue.images.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`Issue image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {issue.images.length > 3 && (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{issue.images.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Heart className="w-4 h-4" />
              <span>{issue.upvotes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlag}
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Flag className="w-4 h-4" />
              <span className="text-xs">Flag</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};