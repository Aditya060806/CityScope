import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { userService } from '@/services/UserService';
import { LeaderboardEntry, Badge as BadgeType } from '@/types/civic';
import { cn } from '@/lib/utils';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  CheckCircle
} from 'lucide-react';

interface HeroLeaderboardProps {
  limit?: number;
  showCurrentUser?: boolean;
  className?: string;
}

const RANK_ICONS = {
  1: Crown,
  2: Medal,
  3: Award
};

const RANK_COLORS = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600'
};

export const HeroLeaderboard: React.FC<HeroLeaderboardProps> = ({
  limit = 10,
  showCurrentUser = true,
  className
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    loadBadges();
  }, [limit, loadLeaderboard]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userService.getLeaderboard(limit);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const loadBadges = async () => {
    try {
      const badgeData = await userService.getBadges();
      setBadges(badgeData);
    } catch (err) {
      console.error('Error loading badges:', err);
    }
  };

  const getBadgeById = (badgeId: string): BadgeType | undefined => {
    return badges.find(badge => badge.id === badgeId);
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      const IconComponent = RANK_ICONS[rank as keyof typeof RANK_ICONS];
      return <IconComponent className={cn("w-5 h-5", RANK_COLORS[rank as keyof typeof RANK_COLORS])} />;
    }
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getChangeText = (change: number) => {
    if (change > 0) {
      return `+${change}`;
    } else if (change < 0) {
      return change.toString();
    }
    return '0';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card className={cn("border-royal/20", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-royal">
            <Trophy className="w-5 h-5" />
            Local Heroes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-bone/20">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-royal/20", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-royal">
            <Trophy className="w-5 h-5" />
            Local Heroes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadLeaderboard} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-royal/20 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-royal">
          <Trophy className="w-5 h-5" />
          Local Heroes
          <Badge variant="secondary" className="ml-auto">
            {leaderboard.length} Heroes
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top community members making a difference
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No heroes yet. Be the first to report an issue!</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.user.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-royal/5",
                index < 3 && "bg-gradient-to-r from-royal/5 to-royal/10 border border-royal/20"
              )}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 border-2 border-royal/20">
                <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                <AvatarFallback className="bg-royal/10 text-royal font-semibold">
                  {entry.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-royal truncate">
                    {entry.user.name}
                  </h4>
                  {entry.user.isVerified && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {entry.stats.reportsSubmitted} reports
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {entry.stats.reportsResolved} resolved
                  </span>
                </div>
              </div>

              {/* Points & Change */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-royal">
                    {entry.stats.totalPoints.toLocaleString()}
                  </span>
                </div>
                <div className={cn("flex items-center gap-1 text-xs", getChangeColor(entry.change))}>
                  {getChangeIcon(entry.change)}
                  <span>{getChangeText(entry.change)}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Badges Section */}
        {leaderboard.length > 0 && (
          <div className="pt-4 border-t border-royal/10">
            <h4 className="text-sm font-semibold text-royal mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Recent Badges
            </h4>
            <div className="flex flex-wrap gap-2">
              {leaderboard.slice(0, 3).flatMap(entry => 
                entry.badges.slice(0, 2).map(badgeId => {
                  const badge = getBadgeById(badgeId);
                  return badge ? (
                    <Badge
                      key={`${entry.user.id}-${badgeId}`}
                      variant="outline"
                      className="text-xs border-royal/30 text-royal"
                    >
                      <span className="mr-1">{badge.icon}</span>
                      {badge.name}
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="pt-4 border-t border-royal/10">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Want to become a local hero?
            </p>
            <Button 
              size="sm" 
              className="bg-royal hover:bg-royal/90"
              onClick={() => {
                // This would trigger the report modal
                const event = new CustomEvent('openReportModal');
                window.dispatchEvent(event);
              }}
            >
              <Target className="w-4 h-4 mr-2" />
              Report an Issue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
