import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardUser } from '@/types/civic';
import { ConfettiCelebration } from './ConfettiCelebration';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Star,
  TrendingUp,
  Users,
  MapPin,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocalHeroesTabProps {
  users: LeaderboardUser[];
  timeframe: 'weekly' | 'monthly' | 'all-time';
  onTimeframeChange: (timeframe: 'weekly' | 'monthly' | 'all-time') => void;
  currentUser?: LeaderboardUser;
  loading?: boolean;
}

const BADGE_CONFIG = {
  street_star: { icon: '⭐', label: 'Street Star', color: 'bg-yellow-100 text-yellow-800' },
  clean_champ: { icon: '🧹', label: 'Clean Champ', color: 'bg-green-100 text-green-800' },
  report_pro: { icon: '📝', label: 'Report Pro', color: 'bg-blue-100 text-blue-800' }
};

export const LocalHeroesTab: React.FC<LocalHeroesTabProps> = ({
  users,
  timeframe,
  onTimeframeChange,
  currentUser,
  loading = false
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-royal">#{rank}</span>;
    }
  };

  const getRankCardStyle = (rank: number, isCurrentUser: boolean) => {
    let baseStyle = 'glass-card transition-all duration-300 hover:scale-[1.02] cursor-pointer';
    
    if (isCurrentUser) {
      baseStyle += ' ring-2 ring-royal/30 bg-royal/5';
    }
    
    switch (rank) {
      case 1:
        return baseStyle + ' bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-glow';
      case 2:
        return baseStyle + ' bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return baseStyle + ' bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return baseStyle;
    }
  };

  const handleRankUpCelebration = () => {
    setShowConfetti(true);
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'all-time': return 'All Time';
    }
  };

  const getTimeframeStats = () => {
    const totalReports = users.reduce((sum, user) => sum + user.reportsCount, 0);
    const totalResolved = users.reduce((sum, user) => sum + user.resolvedCount, 0);
    const avgResolutionRate = totalReports > 0 ? Math.round((totalResolved / totalReports) * 100) : 0;

    return { totalReports, totalResolved, avgResolutionRate };
  };

  const stats = getTimeframeStats();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-powder/50 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-powder/50 rounded animate-pulse" />
                  <div className="h-3 bg-powder/30 rounded animate-pulse w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confetti for rank up */}
      <ConfettiCelebration 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)}
      />

      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-civic bg-clip-text text-transparent mb-2">
            🏆 Local Heroes
          </h1>
          <p className="text-muted-foreground">
            Top contributors making a difference in your community
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center">
          <div className="glass-card p-1 flex gap-1">
            {(['weekly', 'monthly', 'all-time'] as const).map(period => (
              <Button
                key={period}
                onClick={() => onTimeframeChange(period)}
                variant={timeframe === period ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-xl transition-all duration-300',
                  timeframe === period 
                    ? 'bg-royal text-white shadow-royal' 
                    : 'hover:bg-powder/30 text-royal'
                )}
              >
                {period === 'weekly' && <Calendar className="w-4 h-4 mr-2" />}
                {period === 'monthly' && <TrendingUp className="w-4 h-4 mr-2" />}
                {period === 'all-time' && <Star className="w-4 h-4 mr-2" />}
                {period.charAt(0).toUpperCase() + period.slice(1).replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Current User Banner */}
      {currentUser && (
        <Card className="glass-card bg-gradient-to-r from-royal/10 to-powder/20 border-royal/20 shadow-civic animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-royal/20 rounded-full p-2">
                <TrendingUp className="w-5 h-5 text-royal" />
              </div>
              
              <div className="flex-1">
                <p className="font-bold text-royal text-lg">
                  You're #{currentUser.rank} in your area this {timeframe === 'all-time' ? 'year' : timeframe.replace('ly', '')} — Keep going! 🚀
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-royal/10 text-royal border-royal/30">
                    {currentUser.reportsCount} reports
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {currentUser.verifiedPercentage}% verified
                  </Badge>
                  {currentUser.badge && (
                    <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                      {BADGE_CONFIG[currentUser.badge as keyof typeof BADGE_CONFIG]?.icon} {BADGE_CONFIG[currentUser.badge as keyof typeof BADGE_CONFIG]?.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Stats */}
      <Card className="glass-card bg-gradient-to-r from-royal/5 to-powder/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-royal">
            <Users className="w-5 h-5" />
            Community Impact ({getTimeframeLabel()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-royal">{stats.totalReports}</p>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalResolved}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-royal">{stats.avgResolutionRate}%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <div className="space-y-3">
        {users.map((user, index) => (
          <Card 
            key={user.id} 
            className={getRankCardStyle(user.rank, user.isCurrentUser || false)}
            onClick={user.rank === 1 && !showConfetti ? handleRankUpCelebration : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bone border-2 border-powder">
                  {getRankIcon(user.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="w-12 h-12 border-2 border-powder shadow-md">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-royal text-white font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      'font-bold truncate',
                      user.isCurrentUser ? 'text-royal' : 'text-foreground'
                    )}>
                      {user.name}
                      {user.isCurrentUser && (
                        <Badge className="ml-2 bg-royal/10 text-royal border-royal/20 text-xs">
                          You
                        </Badge>
                      )}
                    </h3>
                    
                    {user.badge && BADGE_CONFIG[user.badge as keyof typeof BADGE_CONFIG] && (
                      <Badge className={cn(
                        'text-xs font-medium',
                        BADGE_CONFIG[user.badge as keyof typeof BADGE_CONFIG].color
                      )}>
                        {BADGE_CONFIG[user.badge as keyof typeof BADGE_CONFIG].icon}
                        {BADGE_CONFIG[user.badge as keyof typeof BADGE_CONFIG].label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {user.reportsCount} reports
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {user.verifiedPercentage}% verified
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-xl font-bold text-royal">
                    {user.resolvedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    resolved
                  </div>
                </div>
              </div>

              {/* Progress bar for verification rate */}
              <div className="mt-3 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={cn(
                    'h-full transition-all duration-1000 ease-out',
                    user.verifiedPercentage >= 80 ? 'bg-green-500' :
                    user.verifiedPercentage >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                  )}
                  style={{ width: `${user.verifiedPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current User Highlight */}
      {currentUser && !users.find(u => u.isCurrentUser) && (
        <Card className="glass-card bg-royal/5 border-royal/30">
          <CardContent className="p-4">
            <div className="text-center">
              <Trophy className="w-8 h-8 text-royal mx-auto mb-2" />
              <p className="font-semibold text-royal mb-1">Your Current Rank</p>
              <p className="text-2xl font-bold text-royal">#{currentUser.rank}</p>
              <p className="text-sm text-muted-foreground">
                {currentUser.reportsCount} reports • {currentUser.verifiedPercentage}% verified
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};