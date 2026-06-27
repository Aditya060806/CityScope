import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Users, Award, Star, TrendingUp, RefreshCw, Crown, Medal, Zap, Activity, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import { userService } from '@/services/UserService';
import { LeaderboardEntry } from '@/types/civic';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

export const EnhancedHeroes: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { stats: communityStats, loading: statsLoading } = useCommunityStats();

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await userService.getLeaderboard(20);
      setLeaderboard(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = userService.subscribeToLeaderboard((data) => {
      setLeaderboard(data);
      setLastUpdated(new Date());
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-royal">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'from-amber-50 to-amber-100 border-amber-200';
    return 'from-royal/5 to-royal/10 border-royal/20';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <PageHeader
            icon={<Trophy className="h-5 w-5" />}
            title="Local Heroes"
            description="Celebrate community members making a measurable impact by resolving civic issues."
            actions={
              <Button onClick={() => navigate('/report')} className="btn-royal">
                <Target className="w-4 h-4 mr-2" />
                Report an Issue
              </Button>
            }
          />
        </div>

          {/* Real-time Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-royal/5 to-powder/10 border-royal/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Live Updates</span>
                    <span className="text-xs text-gray-500">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLeaderboard}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="achievements" className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Achievements
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="leaderboard" className="space-y-6">
                  {/* Timeframe Selector */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-royal">Top Performers</h3>
                        <div className="flex gap-2">
                          {(['weekly', 'monthly', 'all-time'] as const).map((period) => (
                            <Button
                              key={period}
                              variant={timeframe === period ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTimeframe(period)}
                              className={cn(
                                "capitalize",
                                timeframe === period && "bg-royal hover:bg-royal/90"
                              )}
                            >
                              {period.replace('-', ' ')}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {loading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                              <Skeleton className="w-8 h-8 rounded-full" />
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                              <Skeleton className="h-6 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : error ? (
                        <div className="text-center py-8">
                          <p className="text-red-500 mb-4">{error}</p>
                          <Button onClick={loadLeaderboard} variant="outline">
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <AnimatePresence>
                            {leaderboard.map((entry, index) => {
                              const isTopThree = entry.rank <= 3;
                              const CardWrapper = 'div';
                              const wrapperProps = { className: 'rounded-2xl' };
                              
                              return (
                                <motion.div
                                  key={entry.user.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                  <CardWrapper {...wrapperProps}>
                                    <div className={cn(
                                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-sleek",
                                      `bg-gradient-to-r ${getRankColor(entry.rank)}`
                                    )}>
                                {/* Rank */}
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                  {getRankIcon(entry.rank)}
                                </div>

                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-royal/20 to-royal/30 flex items-center justify-center border-2 border-royal/30">
                                  <span className="text-lg font-bold text-royal">
                                    {entry.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-royal text-lg truncate">
                                      {entry.user.name}
                                    </h4>
                                    {entry.user.isVerified && (
                                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Target className="w-4 h-4" />
                                      {entry.stats.reportsSubmitted} reports
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      {entry.stats.reportsResolved} resolved
                                    </span>
                                  </div>
                                </div>

                                {/* Points & Change */}
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span className="font-bold text-royal text-lg">
                                      {entry.stats.totalPoints.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className={cn("flex items-center gap-1 text-sm", getChangeColor(entry.change))}>
                                    {getChangeIcon(entry.change)}
                                    <span>{entry.change > 0 ? `+${entry.change}` : entry.change}</span>
                                  </div>
                                </div>
                                    </div>
                                    </CardWrapper>
                                  </motion.div>
                                );
                              })}
                          </AnimatePresence>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="achievements" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-royal mb-4">Badge System</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: '🏆', name: 'Local Hero', desc: '10+ reports', color: 'from-yellow-50 to-yellow-100' },
                          { icon: '🔧', name: 'Problem Solver', desc: '5+ resolved', color: 'from-green-50 to-green-100' },
                          { icon: '🚀', name: 'Early Adopter', desc: 'First month', color: 'from-blue-50 to-blue-100' },
                          { icon: '👑', name: 'Community Champion', desc: 'Top 3 ranker', color: 'from-purple-50 to-purple-100' },
                          { icon: '⭐', name: 'Street Star', desc: '25+ reports', color: 'from-orange-50 to-orange-100' },
                          { icon: '🌱', name: 'Eco Warrior', desc: 'Environmental focus', color: 'from-emerald-50 to-emerald-100' },
                          { icon: '📊', name: 'Report Pro', desc: '50+ reports', color: 'from-indigo-50 to-indigo-100' },
                          { icon: '🎯', name: 'Accuracy Master', desc: '90%+ verified', color: 'from-pink-50 to-pink-100' }
                        ].map((badge, index) => (
                          <motion.div
                            key={badge.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={cn(
                              "text-center p-6 rounded-2xl border-2 border-gray-200 hover:scale-105 transition-all duration-300 cursor-pointer",
                              `bg-gradient-to-br ${badge.color}`
                            )}
                          >
                            <div className="text-4xl mb-3">{badge.icon}</div>
                            <h4 className="text-sm font-bold text-royal mb-1">{badge.name}</h4>
                            <p className="text-xs text-gray-600">{badge.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Community Stats */}
              <SectionCard
                title="Community Impact"
                icon={<Users className="w-5 h-5 text-royal" />}
                className="rounded-3xl overflow-hidden"
                contentClassName="p-8 pt-0 space-y-6"
              >
                  {statsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : communityStats ? (
                    <>
                      <div className="flex items-center justify-between p-4 bg-royal/5 rounded-2xl">
                        <span className="text-gray-700 font-semibold">Total Reports</span>
                        <Badge className="bg-gradient-to-r from-royal/10 to-royal/20 text-royal border-royal/30 px-4 py-2 rounded-xl font-bold">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          {communityStats.totalReports.toLocaleString()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                        <span className="text-gray-700 font-semibold">Issues Resolved</span>
                        <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 px-4 py-2 rounded-xl font-bold">
                          <Star className="w-4 h-4 mr-2" />
                          {communityStats.totalResolved.toLocaleString()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                        <span className="text-gray-700 font-semibold">Active Heroes</span>
                        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300 px-4 py-2 rounded-xl font-bold">
                          <Users className="w-4 h-4 mr-2" />
                          {communityStats.activeUsers.toLocaleString()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                        <span className="text-gray-700 font-semibold">Resolution Rate</span>
                        <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300 px-4 py-2 rounded-xl font-bold">
                          <Target className="w-4 h-4 mr-2" />
                          {communityStats.resolutionRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Unable to load community stats</p>
                    </div>
                  )}
              </SectionCard>

              {/* How to Become a Hero */}
              <SectionCard
                title="Become a Local Hero"
                icon={<Target className="w-5 h-5 text-royal" />}
                className="rounded-3xl overflow-hidden"
                contentClassName="p-8 pt-0 space-y-6"
              >
                  <div className="space-y-6">
                    {[
                      { step: 1, title: 'Report Issues', desc: 'Submit civic issues you encounter in your daily life' },
                      { step: 2, title: 'Earn Points', desc: 'Get points for each report and bonus points for resolved issues' },
                      { step: 3, title: 'Climb the Ranks', desc: 'Rise through the leaderboard and earn special badges' }
                    ].map((item, index) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-royal/10 to-royal/20 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-sm font-black text-royal">{item.step}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-royal text-lg">{item.title}</h4>
                          <p className="text-gray-600 font-medium">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => navigate('/report')}
                    className="w-full bg-gradient-to-r from-royal to-royal/90 hover:from-royal/90 hover:to-royal/80 text-white py-4 rounded-2xl font-bold shadow-sleek hover:shadow-sleek-lg transition-all duration-300 hover:scale-105"
                  >
                    <Target className="w-5 h-5 mr-3" />
                    Report an Issue
                  </Button>
              </SectionCard>
            </div>
          </div>
        </div>
    </div>
  );
};
