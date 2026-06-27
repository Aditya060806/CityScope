import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
};

export const IssueCardSkeleton: React.FC = () => (
  <Card className="glass-card animate-pulse">
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <Skeleton className="w-12 h-12 rounded-lg" />
          <Skeleton className="w-12 h-12 rounded-lg" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Skeleton className="w-16 h-8 rounded" />
          <Skeleton className="w-12 h-8 rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const StatsCardSkeleton: React.FC = () => (
  <Card className="glass-card animate-pulse">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const MapSkeleton: React.FC = () => (
  <Card className="glass-card animate-pulse">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="w-20 h-8 rounded" />
      </div>
      <Skeleton className="h-10 w-full rounded" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded" />
        ))}
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <Skeleton className="h-96 mx-4 mb-4 rounded-lg" />
    </CardContent>
  </Card>
);

interface LoadingStateProps {
  type: 'issues' | 'stats' | 'map' | 'hero';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  type, 
  count = 3, 
  className 
}) => {
  if (type === 'hero') {
    return (
      <div className={cn('relative overflow-hidden rounded-2xl', className)}>
        <Skeleton className="h-48 w-full" />
        <div className="absolute inset-0 p-6 flex flex-col justify-center items-center space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'map') {
    return <MapSkeleton />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
          {type === 'issues' && <IssueCardSkeleton />}
          {type === 'stats' && <StatsCardSkeleton />}
        </div>
      ))}
    </div>
  );
};