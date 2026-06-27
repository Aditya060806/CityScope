import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeaderboardUser } from '@/types/civic';
import { Crown, Award, Star, TrendingUp } from 'lucide-react';

interface LeaderboardCardProps {
  users: LeaderboardUser[];
  timeframe: 'weekly' | 'monthly' | 'all-time';
  onTimeframeChange: (timeframe: 'weekly' | 'monthly' | 'all-time') => void;
  currentUser?: LeaderboardUser;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  users,
  timeframe,
  onTimeframeChange,
  currentUser
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Award className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Star className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getBadgeEmoji = (badge?: string) => {
    switch (badge) {
      case 'street_star':
        return '🏅';
      case 'clean_champ':
        return '💧';
      case 'report_pro':
        return '🛰️';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Timeframe Toggle */}
      <Card className="bg-bone/50 backdrop-blur-sm border-powder/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            {(['weekly', 'monthly', 'all-time'] as const).map((period) => (
              <Button
                key={period}
                onClick={() => onTimeframeChange(period)}
                variant={timeframe === period ? 'default' : 'ghost'}
                size="sm"
                className={`
                  rounded-xl text-xs font-medium transition-all duration-200
                  ${timeframe === period 
                    ? 'bg-royal text-white shadow-royal' 
                    : 'text-royal hover:bg-royal/10'
                  }
                `}
              >
                {period === 'all-time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      <Card className="bg-gradient-to-br from-royal/5 to-powder/20 border-powder/30 shadow-civic">
        <CardHeader>
          <CardTitle className="text-center text-royal flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {users.slice(0, 3).map((user, index) => (
              <div key={user.id} className="text-center space-y-3">
                <div className="relative">
                  <Avatar className={`
                    mx-auto border-2 transition-all duration-300
                    ${index === 0 ? 'w-16 h-16 border-yellow-400 shadow-glow' : 'w-12 h-12 border-powder/50'}
                  `}>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-powder text-royal font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`
                    absolute -top-1 -right-1 rounded-full p-1
                    ${index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-amber-100'}
                  `}>
                    {getRankIcon(user.rank)}
                  </div>
                </div>
                
                <div>
                  <p className={`font-semibold ${index === 0 ? 'text-lg' : 'text-sm'} text-royal`}>
                    {user.name}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs bg-royal/5">
                      {user.reportsCount} reports
                    </Badge>
                    {user.badge && (
                      <span className="text-lg">{getBadgeEmoji(user.badge)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current User Status */}
      {currentUser && (
        <Card className="bg-gradient-to-r from-royal/10 to-powder/20 border-royal/20 shadow-civic">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-royal/10 rounded-full p-2">
                <TrendingUp className="w-4 h-4 text-royal" />
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-royal">
                  You're #{currentUser.rank} in your area — Keep it up!
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-royal/5">
                    {currentUser.reportsCount} reports
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    {currentUser.verifiedPercentage}% verified
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-bone/50 backdrop-blur-sm border-powder/30">
        <CardHeader>
          <CardTitle className="text-royal">Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                ${user.isCurrentUser 
                  ? 'bg-royal/10 border border-royal/20' 
                  : 'hover:bg-powder/20'
                }
              `}>
                <div className="leaderboard-rank">
                  {user.rank <= 3 ? getRankIcon(user.rank) : user.rank}
                </div>
                
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-powder text-royal text-xs">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium text-royal">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {user.reportsCount} reports
                    </span>
                    <span className="text-xs text-green-600">
                      {user.verifiedPercentage}% verified
                    </span>
                  </div>
                </div>
                
                {user.badge && (
                  <div className="achievement-badge">
                    <span className="text-lg">{getBadgeEmoji(user.badge)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};