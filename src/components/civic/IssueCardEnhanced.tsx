import React, { useState } from 'react';
import { CivicIssue } from '@/types/civic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { 
  Heart, 
  Flag, 
  MapPin, 
  Clock, 
  User, 
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IssueCardEnhancedProps {
  issue: CivicIssue;
  onUpvote: (issueId: string) => void;
  onFlag: (issueId: string) => void;
  onClick: (issue: CivicIssue) => void;
  onShare?: (issue: CivicIssue) => void;
  onBookmark?: (issueId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  isOffline?: boolean;
}

export const IssueCardEnhanced: React.FC<IssueCardEnhancedProps> = ({ 
  issue, 
  onUpvote, 
  onFlag, 
  onClick,
  onShare,
  onBookmark,
  className,
  variant = 'default',
  isOffline = false
}) => {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpvoted(!isUpvoted);
    onUpvote(issue.id);
  };

  const handleFlag = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlag(issue.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(issue);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(issue.id);
  };

  const getPriorityLevel = () => {
    if (issue.upvotes > 10) return 'high';
    if (issue.upvotes > 5) return 'medium';
    return 'low';
  };

  const priorityLevel = getPriorityLevel();

  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          'glass-card cursor-pointer transition-all duration-300 hover:shadow-float hover:scale-[1.02] group border-l-4',
          issue.status === 'reported' && 'border-l-status-reported',
          issue.status === 'verified' && 'border-l-status-verified',
          issue.status === 'in_progress' && 'border-l-status-progress',
          issue.status === 'resolved' && 'border-l-status-resolved',
          className
        )}
        onClick={() => onClick(issue)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CategoryIcon category={issue.category} size="sm" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {issue.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {issue.distance ? `${issue.distance.toFixed(1)}km away` : issue.location.address}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={issue.status} size="sm" />
              <span className="text-xs text-muted-foreground">
                {issue.upvotes} ❤️
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 group animate-slide-up overflow-hidden',
        'bg-bone/90 backdrop-blur-xl border-powder/30 rounded-2xl shadow-bone hover:shadow-royal',
        priorityLevel === 'high' && 'ring-2 ring-royal/30 pulse-royal',
        isOffline && 'border-orange-200 bg-orange-50/30',
        className
      )}
      onClick={() => onClick(issue)}
    >
      {/* Offline Badge */}
      {isOffline && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
            Cached
          </Badge>
        </div>
      )}
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-br from-powder/80 to-powder/40 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative">
              <CategoryIcon category={issue.category} size="md" />
              {priorityLevel === 'high' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-royal rounded-full animate-civic-pulse shadow-royal flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-lg sm:text-xl leading-tight text-royal line-clamp-2 group-hover:text-royal/80 transition-colors">
                  {issue.title}
                </h3>
                <StatusBadge status={issue.status} showAnimation size="sm" />
              </div>
              
              <p className="text-royal/70 text-sm leading-relaxed line-clamp-2">
                {issue.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 pt-4">
        <div className="space-y-5">
          {/* Location & Distance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-royal/70 flex-1 min-w-0">
              <MapPin className="w-5 h-5 text-royal flex-shrink-0" />
              <span className="truncate font-medium">{issue.location.address}</span>
            </div>
            {issue.distance && (
              <Badge className="bg-royal/10 text-royal border-royal/20 rounded-xl font-semibold">
                {issue.distance.toFixed(1)}km away
              </Badge>
            )}
          </div>

          {/* Reporter & Time */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-royal/70">
              <User className="w-5 h-5 text-royal" />
              <span className="font-semibold">
                {issue.isAnonymous ? 'Anonymous Citizen' : issue.reportedBy}
              </span>
            </div>
            <div className="flex items-center gap-2 text-royal/60">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatDistanceToNow(issue.reportedAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Enhanced Images Preview */}
          {issue.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {issue.images.slice(0, 3).map((image, index) => (
                  <div
                    key={index}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-powder/50 flex-shrink-0 overflow-hidden group/image shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <img
                      src={image}
                      alt={`Issue image ${index + 1}`}
                      className={cn(
                        'w-full h-full object-cover transition-all duration-300 group-hover/image:scale-110',
                        !isImageLoaded && 'opacity-0'
                      )}
                      onLoad={() => setIsImageLoaded(true)}
                    />
                    {!isImageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-powder/80">
                        <div className="w-6 h-6 border-3 border-royal border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    
                    {/* Enhanced overlay */}
                    <div className="absolute inset-0 bg-royal/0 group-hover/image:bg-royal/30 transition-all duration-300 flex items-center justify-center rounded-2xl">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover/image:opacity-100 transition-all duration-300 scale-75 group-hover/image:scale-100" />
                    </div>
                  </div>
                ))}
                
                {issue.images.length > 3 && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-powder/30 border-2 border-dashed border-royal/30 flex-shrink-0 flex items-center justify-center text-sm font-bold text-royal/70 hover:bg-powder/50 transition-all duration-300">
                    +{issue.images.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          {variant === 'detailed' && (
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Trending</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>5 comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>142 views</span>
              </div>
            </div>
          )}

          {/* Enhanced Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-powder/40">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUpvote}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 font-semibold',
                  isUpvoted 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-md' 
                    : 'text-royal/70 hover:text-red-600 hover:bg-red-50 bg-powder/40'
                )}
              >
                <Heart className={cn('w-5 h-5 transition-all duration-300', isUpvoted && 'fill-current scale-110')} />
                <span className="font-bold">{issue.upvotes + (isUpvoted ? 1 : 0)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={cn(
                  'p-3 rounded-xl transition-all duration-300 hover:scale-105',
                  isBookmarked 
                    ? 'text-royal bg-royal/10 hover:bg-royal/20 shadow-md' 
                    : 'text-royal/70 hover:text-royal hover:bg-royal/10 bg-powder/40'
                )}
              >
                <Bookmark className={cn('w-5 h-5 transition-all duration-300', isBookmarked && 'fill-current')} />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-3 rounded-xl text-royal/70 hover:text-royal hover:bg-powder/60 bg-powder/40 transition-all duration-300 hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFlag}
                className="p-3 rounded-xl text-royal/70 hover:text-orange-600 hover:bg-orange-50 bg-powder/40 transition-all duration-300 hover:scale-105"
              >
                <Flag className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};