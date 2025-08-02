import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MapPin, 
  Sparkles, 
  Search,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'no-issues' | 'no-search' | 'no-location' | 'offline' | 'error' | 'success';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  const configs = {
    'no-issues': {
      icon: Users,
      title: title || 'All Clear in Your Area! 🎉',
      description: description || 'No civic issues reported nearby. Your neighborhood is looking great! Be the first to help keep it that way.',
      actionLabel: actionLabel || 'Report an Issue',
      iconColor: 'text-secondary',
      bgColor: 'bg-secondary/5'
    },
    'no-search': {
      icon: Search,
      title: title || 'No Results Found',
      description: description || 'We couldn\'t find any issues matching your search. Try adjusting your filters or search terms.',
      actionLabel: actionLabel || 'Clear Filters',
      iconColor: 'text-muted-foreground',
      bgColor: 'bg-muted/5'
    },
    'no-location': {
      icon: MapPin,
      title: title || 'Location Access Needed',
      description: description || 'Enable location services to see civic issues in your area and start making a difference in your neighborhood.',
      actionLabel: actionLabel || 'Enable Location',
      iconColor: 'text-warning',
      bgColor: 'bg-warning/5'
    },
    'offline': {
      icon: WifiOff,
      title: title || 'You\'re Offline',
      description: description || 'Check your internet connection to see the latest civic issues and submit new reports.',
      actionLabel: actionLabel || 'Retry',
      iconColor: 'text-muted-foreground',
      bgColor: 'bg-muted/5'
    },
    'error': {
      icon: AlertTriangle,
      title: title || 'Something Went Wrong',
      description: description || 'We encountered an issue loading the data. Please try again in a moment.',
      actionLabel: actionLabel || 'Try Again',
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/5'
    },
    'success': {
      icon: CheckCircle,
      title: title || 'Success!',
      description: description || 'Your action was completed successfully.',
      actionLabel: actionLabel || 'Continue',
      iconColor: 'text-success',
      bgColor: 'bg-success/5'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Card className={cn('glass-card border-border/50', className)}>
      <CardContent className="p-8 md:p-12 text-center">
        <div className="space-y-6">
          {/* Icon */}
          <div className={cn(
            'w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center',
            config.bgColor
          )}>
            <Icon className={cn('w-8 h-8 md:w-10 md:h-10', config.iconColor)} />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              {config.title}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Action */}
          {onAction && config.actionLabel && (
            <Button 
              onClick={onAction}
              className={cn(
                'transition-all duration-300 hover:scale-105',
                type === 'no-issues' && 'btn-civic',
                type === 'error' && 'bg-destructive hover:bg-destructive/90',
                type === 'success' && 'bg-success hover:bg-success/90'
              )}
            >
              {type === 'no-issues' && <Plus className="w-4 h-4 mr-2" />}
              {config.actionLabel}
            </Button>
          )}

          {/* Decorative Elements */}
          {type === 'no-issues' && (
            <div className="flex justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-secondary" />
                <span>Clean Streets</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-success" />
                <span>Active Community</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface NoIssuesFoundProps {
  onReport?: () => void;
  className?: string;
}

export const NoIssuesFound: React.FC<NoIssuesFoundProps> = ({ onReport, className }) => (
  <EmptyState
    type="no-issues"
    onAction={onReport}
    className={className}
  />
);

interface SearchEmptyProps {
  onClearFilters?: () => void;
  className?: string;
}

export const SearchEmpty: React.FC<SearchEmptyProps> = ({ onClearFilters, className }) => (
  <EmptyState
    type="no-search"
    onAction={onClearFilters}
    className={className}
  />
);

interface LocationRequiredProps {
  onEnableLocation?: () => void;
  className?: string;
}

export const LocationRequired: React.FC<LocationRequiredProps> = ({ onEnableLocation, className }) => (
  <EmptyState
    type="no-location"
    onAction={onEnableLocation}
    className={className}
  />
);

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry, message, className }) => (
  <EmptyState
    type="error"
    description={message}
    onAction={onRetry}
    className={className}
  />
);