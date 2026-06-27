import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  RefreshCw,
  Activity,
  Zap,
  Target,
  AlertTriangle,
  Calendar,
  PieChart,
  LineChart,
  Globe
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import { analyticsService } from '@/services/AnalyticsService';
import { IssueCategory, IssueStatus, IssuePriority } from '@/types/civic';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';

export const EnhancedAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { analytics, realTimeData, loading, error, refreshAnalytics } = useAnalytics(timeframe);
  const { stats: communityStats } = useCommunityStats();

  // Set up real-time subscription
  useEffect(() => {
    const subscription = analyticsService.subscribeToAnalytics((data) => {
      setLastUpdated(new Date());
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: IssueStatus) => {
    const colors = {
      'pending': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'in-progress': 'text-blue-600 bg-blue-50 border-blue-200',
      'resolved': 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPriorityColor = (priority: IssuePriority) => {
    const colors = {
      'low': 'text-green-600 bg-green-50 border-green-200',
      'medium': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'high': 'text-orange-600 bg-orange-50 border-orange-200',
      'urgent': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getCategoryIcon = (category: IssueCategory) => {
    const icons = {
      'roads': '🛣️',
      'lighting': '💡',
      'sanitation': '🗑️',
      'water': '💧',
      'traffic': '🚦',
      'parks': '🌳',
      'other': '📋'
    };
    return icons[category] || '📋';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading && !analytics) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="relative z-10 pb-24 md:pb-12 pt-1 md:pt-3 px-1 md:px-2 max-w-[1600px] mx-auto overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 relative"
        >
          <PageHeader
            icon={<BarChart3 className="h-5 w-5" />}
            title="Civic Analytics"
            description="Real-time insights and comprehensive civic engagement statistics."
            actions={
              <>
                <div className="flex items-center gap-2 text-sm text-gray-500 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                  <span>•</span>
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>
              </>
            }
          />

          {/* Timeframe Selector */}
          <div className="mt-4 flex gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
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
                {period}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Real-time Stats */}
        {realTimeData && Object.keys(realTimeData).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-royal/5 to-powder/10 border-royal/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-royal" />
                      <span className="font-semibold text-royal">Today's Activity</span>
                    </div>
                    {realTimeData.totalIssues && (
                      <Badge className="bg-royal/10 text-royal border-royal/30">
                        {realTimeData.totalIssues} new issues
                      </Badge>
                    )}
                    {realTimeData.resolutionRate && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        {realTimeData.resolutionRate}% resolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="w-4 h-4" />
                    <span>Real-time updates</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Issues',
                  value: analytics?.totalIssues || 0,
                  icon: BarChart3,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200',
                  spotlightColor: '#3b82f6'
                },
                {
                  title: 'Resolved',
                  value: analytics?.issuesByStatus?.resolved || 0,
                  icon: CheckCircle,
                  color: 'text-green-600',
                  bgColor: 'bg-green-50',
                  borderColor: 'border-green-200',
                  spotlightColor: '#10b981'
                },
                {
                  title: 'In Progress',
                  value: analytics?.issuesByStatus?.['in-progress'] || 0,
                  icon: Clock,
                  color: 'text-yellow-600',
                  bgColor: 'bg-yellow-50',
                  borderColor: 'border-yellow-200',
                  spotlightColor: '#f59e0b'
                },
                {
                  title: 'Resolution Rate',
                  value: `${analytics?.resolutionRate || 0}%`,
                  icon: TrendingUp,
                  color: 'text-purple-600',
                  bgColor: 'bg-purple-50',
                  borderColor: 'border-purple-200',
                  spotlightColor: '#8b5cf6'
                }
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-clay-lg transition-all duration-300 border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">{metric.title}</p>
                          <p className="text-3xl font-extrabold text-[#0B1121]">{formatNumber(metric.value as number)}</p>
                        </div>
                        <div className={`p-4 rounded-[1.25rem] ${metric.bgColor} shadow-inner`}>
                          <metric.icon className={`w-7 h-7 ${metric.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <PieChart className="w-5 h-5 text-indigo-500" />
                    Issues by Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {analytics?.issuesByStatus && Object.entries(analytics.issuesByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${getStatusColor(status as IssueStatus).split(' ')[1]}`}></div>
                          <span className="text-[13px] font-bold tracking-widest uppercase text-slate-500">
                            {status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(status as IssueStatus).split(' ')[1]}`}
                              style={{ width: `${(count / analytics.totalIssues) * 100}%` }}
                            />
                          </div>
                          <span className="text-[17px] font-black tracking-tight text-slate-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <AlertTriangle className="w-5 h-5 text-indigo-500" />
                    Issues by Priority
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {analytics?.issuesByPriority && Object.entries(analytics.issuesByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${getPriorityColor(priority as IssuePriority).split(' ')[1]}`}></div>
                          <span className="text-[13px] font-bold tracking-widest uppercase text-slate-500">
                            {priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${getPriorityColor(priority as IssuePriority).split(' ')[1]}`}
                              style={{ width: `${(count / analytics.totalIssues) * 100}%` }}
                            />
                          </div>
                          <span className="text-[17px] font-black tracking-tight text-slate-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Reporters */}
            <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics?.topReporters?.slice(0, 10).map((reporter, index) => (
                    <div key={reporter.userId} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100/50 shadow-sm">
                        <span className="text-[13px] font-black tracking-tight text-indigo-600">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-bold tracking-tight text-slate-900 truncate mb-0.5">{reporter.name}</h4>
                        <p className="text-[13px] font-medium text-slate-500 truncate">{reporter.count} reports</p>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold tracking-widest shadow-sm">
                        {reporter.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Category Selector */}
            <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl px-4 shadow-sm' 
                      : 'h-10 rounded-xl px-4 font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all bg-slate-50 border-slate-200/60'}
                  >
                    All Categories
                  </Button>
                  {analytics?.issuesByCategory && Object.keys(analytics.issuesByCategory).map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category as IssueCategory)}
                      className={selectedCategory === category 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl px-4 shadow-sm' 
                        : 'h-10 rounded-xl px-4 font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all bg-slate-50 border-slate-200/60'}
                    >
                      <span className="mr-2.5 opacity-80">{getCategoryIcon(category as IssueCategory)}</span>
                      {category.replace('_', ' ').toUpperCase()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics?.issuesByCategory && Object.entries(analytics.issuesByCategory).map(([category, count]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3.5">
                          <span className="text-[28px] drop-shadow-sm">{getCategoryIcon(category as IssueCategory)}</span>
                          <div>
                            <h3 className="text-[17px] font-black tracking-tight text-slate-900 capitalize mb-0.5">
                              {category.replace('_', ' ')}
                            </h3>
                            <p className="text-[13px] font-bold text-slate-500">
                              {analytics.categoryResolutionRates?.[category as IssueCategory] || 0}% resolved
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-royal/10 text-royal border-royal/30">
                          {count}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-royal to-royal/80 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(count / analytics.totalIssues) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-8">
            {/* Recent Trends Chart */}
            {/* Recent Trends Chart */}
            <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                  <LineChart className="w-5 h-5 text-indigo-500" />
                  Recent Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 flex items-end justify-between gap-3">
                  {analytics?.recentTrends?.map((trend, index) => (
                    <div key={trend.date} className="flex-1 flex flex-col items-center group">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        style={{ height: `${(trend.count / Math.max(...analytics.recentTrends.map(t => t.count))) * 200}px` }}
                      />
                      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-3 group-hover:text-indigo-600 transition-colors">
                        {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Stats */}
            {/* Monthly Stats */}
            <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Monthly Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analytics?.monthlyStats?.slice(-6).map((month, index) => (
                    <div key={month.month} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100/50 transition-colors gap-4">
                      <div>
                        <h4 className="text-[15px] font-bold tracking-tight text-slate-900 mb-0.5">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                        <p className="text-[13px] font-medium text-slate-500">
                          {month.resolved} of {month.issues} resolved
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[17px] font-black tracking-tight text-slate-900">{month.issues}</p>
                          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Total</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[17px] font-black tracking-tight text-emerald-600">{month.resolved}</p>
                          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Resolved</p>
                        </div>
                        <div className="w-16 bg-slate-200 rounded-full h-2 shadow-inner overflow-hidden hidden md:block">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full"
                            style={{ width: `${(month.resolved / month.issues) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Average Resolution Time',
                  value: `${analytics?.averageResolutionTime || 0} days`,
                  icon: Clock,
                  color: 'text-indigo-600',
                  bgColor: 'bg-indigo-50'
                },
                {
                  title: 'Response Time (Avg)',
                  value: `${analytics?.responseTimeStats?.average || 0}h`,
                  icon: Zap,
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-50'
                },
                {
                  title: 'System Uptime',
                  value: '99.8%',
                  icon: Activity,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50'
                },
                {
                  title: 'User Satisfaction',
                  value: '4.3/5',
                  icon: Target,
                  color: 'text-amber-600',
                  bgColor: 'bg-amber-50'
                }
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2">{metric.title}</p>
                          <p className="text-[28px] font-black tracking-tighter text-slate-900 leading-none">{metric.value}</p>
                        </div>
                        <div className={`p-4 rounded-[1.25rem] ${metric.bgColor} shadow-inner`}>
                          <metric.icon className={`w-7 h-7 ${metric.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {analytics?.categoryResolutionRates && Object.entries(analytics.categoryResolutionRates).map(([category, rate]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl drop-shadow-sm">{getCategoryIcon(category as IssueCategory)}</span>
                          <span className="text-[13px] font-bold tracking-widest uppercase text-slate-500">
                            {category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-[17px] font-black tracking-tight text-slate-900 w-12 text-right">
                            {rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Response Time Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <span className="text-[14px] font-bold tracking-tight text-slate-500">Average Time</span>
                      <span className="text-[20px] font-black tracking-tighter text-slate-900">
                        {analytics?.responseTimeStats?.average || 0}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <span className="text-[14px] font-bold tracking-tight text-slate-500">Median Time</span>
                      <span className="text-[20px] font-black tracking-tighter text-slate-900">
                        {analytics?.responseTimeStats?.median || 0}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <span className="text-[14px] font-bold tracking-tight text-slate-500">95th Percentile</span>
                      <span className="text-[20px] font-black tracking-tighter text-slate-900">
                        {analytics?.responseTimeStats?.p95 || 0}h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
