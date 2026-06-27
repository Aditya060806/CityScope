import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Issue, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import {
  MapPin,
  Clock,
  ThumbsUp,
  Flag,
  MessageCircle,
  Calendar,
  User,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IssueCardProps {
  issue: Issue;
  onUpvote: (id: string) => void;
  onFlag: (id: string) => void;
  onClick: (issue: Issue) => void;
  className?: string;
  isOffline?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onUpvote,
  onFlag,
  onClick,
  className,
  isOffline = false
}) => {
  const categoryConfig = CATEGORY_CONFIG[issue.category];
  const statusConfig = STATUS_CONFIG[issue.status];

  const getStatusIcon = () => {
    switch (issue.status) {
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (issue.status) {
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const getPriorityColor = () => {
    switch (issue.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:shadow-sleek-lg hover:-translate-y-1 border border-gray-200/50 bg-white',
        isOffline && 'opacity-75 border-dashed',
        className
      )}
      onClick={() => onClick(issue)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal/10 to-royal/20 flex items-center justify-center">
                  <span className="text-lg">{categoryConfig.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-royal transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">{categoryConfig.label}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={cn('border font-semibold', getStatusColor())}>
                {getStatusIcon()}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>

              {issue.priority !== 'low' && (
                <Badge variant="outline" className={cn('text-xs', getPriorityColor())}>
                  {issue.priority.toUpperCase()}
                </Badge>
              )}

              {/* Verification Status Badge */}
              {issue.verificationStatus && issue.verificationStatus !== 'pending_review' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold',
                    issue.verificationStatus === 'approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
                    issue.verificationStatus === 'declined_fake' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
                    issue.verificationStatus === 'escalated' && 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                  )}
                >
                  {issue.verificationStatus === 'approved' && <><ShieldCheck className="w-3 h-3 mr-1" /> Verified</>}
                  {issue.verificationStatus === 'declined_fake' && <><ShieldX className="w-3 h-3 mr-1" /> Declined</>}
                  {issue.verificationStatus === 'escalated' && <><ShieldAlert className="w-3 h-3 mr-1" /> Escalated</>}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {issue.description}
          </p>

          {/* Location & Time */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="font-medium truncate max-w-[200px]">
                {issue.location.address}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Reporter Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${issue.reporterName}`} />
              <AvatarFallback className="bg-royal/10 text-royal text-xs font-bold">
                {issue.isAnonymous ? 'A' : issue.reporterName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700">
                {issue.isAnonymous ? 'Anonymous Reporter' : issue.reporterName}
              </p>
              <p className="text-xs text-gray-500">
                Reported {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
              </p>
            </div>

            {issue.distance && (
              <div className="text-right">
                <p className="text-sm font-bold text-royal">
                  {issue.distance.toFixed(1)} km
                </p>
                <p className="text-xs text-gray-500">away</p>
              </div>
            )}
          </div>

          {/* Images Preview */}
          {issue.images && issue.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {issue.images.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                >
                  <img
                    src={image}
                    alt={`Issue image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {issue.images.length > 3 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">
                    +{issue.images.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpvote(issue.id);
                }}
                className="text-gray-600 hover:text-royal hover:bg-royal/5 transition-colors"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span className="font-semibold">{issue.upvotes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-royal hover:bg-royal/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="font-semibold">
                  {issue.timeline?.length || 0}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isOffline && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  Offline
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlag(issue.id);
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Indicator for In-Progress Issues */}
          {issue.status === 'in-progress' && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">Work in Progress</span>
              </div>
              {issue.resolutionNotes && (
                <p className="text-sm text-yellow-700 leading-relaxed">
                  {issue.resolutionNotes}
                </p>
              )}
            </div>
          )}

          {/* Resolution Info for Resolved Issues */}
          {issue.status === 'resolved' && issue.resolvedAt && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Resolved</span>
              </div>
              <p className="text-xs text-green-700">
                Completed {formatDistanceToNow(issue.resolvedAt, { addSuffix: true })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};