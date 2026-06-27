import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award, 
  Coins, 
  CreditCard,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'cash' | 'voucher' | 'badge';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  available: boolean;
}

interface UserStats {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentLevelPoints: number;
  streak: number;
  reportsSubmitted: number;
  issuesResolved: number;
}

interface SleekRewardsCenterProps {
  userStats: UserStats;
  availableRewards: Reward[];
  onRedeemReward: (rewardId: string) => void;
  className?: string;
}

export const SleekRewardsCenter: React.FC<SleekRewardsCenterProps> = ({
  userStats,
  availableRewards,
  onRedeemReward,
  className
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'rewards' | 'history'>('overview');

  const progressPercentage = (userStats.currentLevelPoints / userStats.nextLevelPoints) * 100;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'history', label: 'History', icon: Clock }
  ];

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rewards Center</h2>
          <p className="text-gray-600">Earn points and redeem rewards for your civic contributions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-royal/10 rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-royal" />
              <span className="font-bold text-royal">{userStats.totalPoints}</span>
              <span className="text-gray-600">points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setSelectedTab(tab.id as string)}
            className={cn(
              "flex-1 rounded-xl transition-all duration-300",
              selectedTab === tab.id
                ? "bg-white text-royal shadow-sleek"
                : "text-gray-600 hover:text-royal hover:bg-white/50"
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* Level Progress */}
          <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
            <CardHeader className="p-6 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Your Progress</CardTitle>
              <p className="text-gray-600">Level {userStats.level} • {userStats.nextLevelPoints - userStats.currentLevelPoints} points to next level</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-royal to-royal/90 rounded-2xl flex items-center justify-center shadow-card">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Level {userStats.level}</h3>
                      <p className="text-gray-600">Civic Champion</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Progress to Level {userStats.level + 1}</p>
                    <p className="text-2xl font-bold text-royal">{Math.round(progressPercentage)}%</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{userStats.currentLevelPoints} points</span>
                    <span className="text-gray-600">{userStats.nextLevelPoints} points</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{userStats.streak}</h3>
                    <p className="text-gray-600 font-medium">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{userStats.reportsSubmitted}</h3>
                    <p className="text-gray-600 font-medium">Reports Submitted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{userStats.issuesResolved}</h3>
                    <p className="text-gray-600 font-medium">Issues Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {selectedTab === 'rewards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map((reward) => (
              <Card 
                key={reward.id} 
                className={cn(
                  "bg-white rounded-2xl shadow-sleek border border-gray-100 hover:shadow-sleek-lg transition-all duration-300",
                  !reward.available && "opacity-50"
                )}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", reward.bgColor)}>
                        <img 
                          src={`/icons/rewards/${reward.type}.svg`} 
                          alt={`${reward.type} icon`} 
                          className="w-10 h-10" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-medium",
                          reward.type === 'cash' ? 'border-green-200 text-green-700 bg-green-50' :
                          reward.type === 'voucher' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                          'border-purple-200 text-purple-700 bg-purple-50'
                        )}
                      >
                        {reward.type}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{reward.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{reward.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-royal" />
                        <span className="font-bold text-royal">{reward.points}</span>
                        <span className="text-sm text-gray-600">points</span>
                      </div>
                      
                      <Button
                        onClick={() => onRedeemReward(reward.id)}
                        disabled={!reward.available || userStats.totalPoints < reward.points}
                        className={cn(
                          "rounded-xl transition-all duration-300",
                          reward.available && userStats.totalPoints >= reward.points
                            ? "bg-royal hover:bg-royal/90 text-white"
                            : "bg-gray-100 text-gray-400"
                        )}
                      >
                        {reward.available && userStats.totalPoints >= reward.points ? (
                          <>
                            Redeem
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          "Not Available"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {selectedTab === 'history' && (
        <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
          <CardHeader className="p-6 border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-900">Reward History</CardTitle>
            <p className="text-gray-600">Your recent redemptions and achievements</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { id: 1, title: "Reported Street Light Issue", points: 50, date: "2 days ago", type: "earned" },
                { id: 2, title: "Redeemed ₹100 Cash Reward", points: -500, date: "1 week ago", type: "redeemed" },
                { id: 3, title: "7-Day Streak Bonus", points: 100, date: "1 week ago", type: "bonus" },
                { id: 4, title: "Issue Resolution Confirmed", points: 200, date: "2 weeks ago", type: "earned" }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      item.type === 'earned' ? 'bg-green-100' :
                      item.type === 'redeemed' ? 'bg-red-100' :
                      'bg-yellow-100'
                    )}>
                      {item.type === 'earned' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : item.type === 'redeemed' ? (
                        <Gift className="w-5 h-5 text-red-600" />
                      ) : (
                        <Zap className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.date}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold",
                    item.points > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {item.points > 0 ? '+' : ''}{item.points} points
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
