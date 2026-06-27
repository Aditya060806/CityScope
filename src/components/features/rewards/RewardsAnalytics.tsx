import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Award,
  Coins,
  Leaf,
  Calendar,
  Target,
  Users,
  Clock,
  Star,
  Gift,
  Trophy,
  Crown,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserReward, Reward, Partner } from '@/types/civic';

interface RewardsAnalyticsProps {
  userRewards: UserReward[];
  rewards: Reward[];
  partners: Partner[];
  userPoints: number;
  className?: string;
}

export const RewardsAnalytics: React.FC<RewardsAnalyticsProps> = ({
  userRewards,
  rewards,
  partners,
  userPoints,
  className
}) => {
  // Calculate analytics data
  const totalRedeemed = userRewards.length;
  const totalValue = userRewards.reduce((sum, reward) => sum + (reward.reward?.value || 0), 0);
  const totalPointsSpent = userRewards.reduce((sum, reward) => sum + reward.points_spent, 0);
  const ecoFriendlyRedeemed = userRewards.filter(r => 
    r.reward?.partner?.type === 'recycler' || r.reward?.partner?.type === 'eco-innovator'
  ).length;
  
  // Category breakdown
  const categoryBreakdown = userRewards.reduce((acc, reward) => {
    const category = reward.reward?.category || 'unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Partner breakdown
  const partnerBreakdown = userRewards.reduce((acc, reward) => {
    const partnerName = reward.reward?.partner?.name || 'Unknown';
    acc[partnerName] = (acc[partnerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Monthly trends (mock data for demonstration)
  const monthlyTrends = [
    { month: 'Jan', redeemed: 2, value: 500 },
    { month: 'Feb', redeemed: 3, value: 750 },
    { month: 'Mar', redeemed: 1, value: 300 },
    { month: 'Apr', redeemed: 4, value: 1200 },
    { month: 'May', redeemed: 2, value: 600 },
    { month: 'Jun', redeemed: 3, value: 900 }
  ];

  // Recent activity
  const recentActivity = userRewards
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Achievements progress
  const achievements = [
    {
      id: '1',
      name: 'First Redeemer',
      description: 'Redeem your first reward',
      icon: Trophy,
      progress: Math.min(totalRedeemed, 1),
      target: 1,
      unlocked: totalRedeemed >= 1,
      points: 50
    },
    {
      id: '2',
      name: 'Eco Warrior',
      description: 'Redeem 5 eco-friendly rewards',
      icon: Leaf,
      progress: ecoFriendlyRedeemed,
      target: 5,
      unlocked: ecoFriendlyRedeemed >= 5,
      points: 100
    },
    {
      id: '3',
      name: 'Loyal Customer',
      description: 'Redeem 10 rewards total',
      icon: Crown,
      progress: totalRedeemed,
      target: 10,
      unlocked: totalRedeemed >= 10,
      points: 200
    },
    {
      id: '4',
      name: 'High Roller',
      description: 'Spend 5000+ points',
      icon: Coins,
      progress: totalPointsSpent,
      target: 5000,
      unlocked: totalPointsSpent >= 5000,
      points: 300
    },
    {
      id: '5',
      name: 'Value Seeker',
      description: 'Redeem ₹5000+ in value',
      icon: Star,
      progress: totalValue / 100,
      target: 5000,
      unlocked: totalValue >= 500000,
      points: 250
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recognition': return <Award className="w-4 h-4" />;
      case 'experience': return <Calendar className="w-4 h-4" />;
      case 'voucher': return <Gift className="w-4 h-4" />;
      case 'discount': return <Target className="w-4 h-4" />;
      case 'cash': return <Coins className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'recognition': return 'bg-purple-100 text-purple-800';
      case 'experience': return 'bg-orange-100 text-orange-800';
      case 'voucher': return 'bg-blue-100 text-blue-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'cash': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Redeemed</p>
                <p className="text-2xl font-bold text-gray-900">{totalRedeemed}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{(totalValue / 100).toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Spent</p>
                <p className="text-2xl font-bold text-gray-900">{totalPointsSpent.toLocaleString()}</p>
              </div>
              <Star className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eco-Friendly</p>
                <p className="text-2xl font-bold text-gray-900">{ecoFriendlyRedeemed}</p>
              </div>
              <Leaf className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="font-medium capitalize">{category}</span>
                    </div>
                    <Badge className={getCategoryColor(category)}>
                      {count} rewards
                    </Badge>
                  </div>
                  <Progress value={(count / totalRedeemed) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Partner Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Partner Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(partnerBreakdown).map(([partner, count]) => (
                <div key={partner} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{partner}</span>
                    <Badge variant="outline">{count} rewards</Badge>
                  </div>
                  <Progress value={(count / totalRedeemed) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((month, index) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{month.month}</span>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{month.redeemed} redeemed</span>
                      <span>₹{month.value}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Progress value={(month.redeemed / 5) * 100} className="h-2 flex-1" />
                    <Progress value={(month.value / 1500) * 100} className="h-2 flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((reward, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{reward.reward?.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(reward.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    +{reward.points_spent} pts
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={cn(
                "p-4 rounded-lg border",
                achievement.unlocked 
                  ? "bg-green-50 border-green-200" 
                  : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    achievement.unlocked 
                      ? "bg-green-100 text-green-600" 
                      : "bg-gray-100 text-gray-400"
                  )}>
                    <achievement.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{achievement.name}</div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.target}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.target) * 100} 
                    className="h-2" 
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {achievement.unlocked ? 'Unlocked!' : `${achievement.target - achievement.progress} to go`}
                    </span>
                    <span className="text-xs font-medium text-yellow-600">
                      +{achievement.points} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Points Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{userPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Current Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">-{totalPointsSpent.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Points Spent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{(userPoints + totalPointsSpent).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
