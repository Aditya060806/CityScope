import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { issueService } from '@/services/IssueService';
import { userService } from '@/services/UserService';
import { AnalyticsData, IssueCategory, CATEGORY_CONFIG } from '@/types/civic';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Award,
  Activity
} from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedCategory]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await issueService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendText = (current: number, previous: number) => {
    if (previous === 0) return 'New';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return `${change > 0 ? '+' : ''}${change}%`;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-royal/20">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={cn("text-center py-12", className)}>
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button onClick={loadAnalytics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-royal">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights and trends for civic issue reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-royal/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold text-royal">{analytics.totalIssues}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.totalIssues, analytics.totalIssues - 5)}
                  <span className={cn("text-xs", getTrendColor(analytics.totalIssues, analytics.totalIssues - 5))}>
                    {getTrendText(analytics.totalIssues, analytics.totalIssues - 5)}
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-royal/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-royal/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.totalIssues > 0 
                    ? Math.round((analytics.issuesByStatus.resolved / analytics.totalIssues) * 100)
                    : 0}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">
                    {analytics.issuesByStatus.resolved} resolved
                  </span>
                </div>
              </div>
              <Target className="w-8 h-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-royal/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.averageResolutionTime.toFixed(1)}d
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-blue-600">
                    Target: 7 days
                  </span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-blue-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-royal/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Reporters</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.topReporters.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-purple-600">
                    Community engaged
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card className="border-royal/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Issue Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.issuesByStatus).map(([status, count]) => {
                    const percentage = analytics.totalIssues > 0 
                      ? (count / analytics.totalIssues * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {status.replace('-', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              status === 'pending' && "bg-yellow-500",
                              status === 'in-progress' && "bg-blue-500",
                              status === 'resolved' && "bg-green-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="border-royal/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.issuesByPriority).map(([priority, count]) => {
                    const percentage = analytics.totalIssues > 0 
                      ? (count / analytics.totalIssues * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {priority}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              priority === 'urgent' && "bg-red-500",
                              priority === 'high' && "bg-orange-500",
                              priority === 'medium' && "bg-yellow-500",
                              priority === 'low' && "bg-green-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="border-royal/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Issues by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analytics.issuesByCategory).map(([category, count]) => {
                  const config = CATEGORY_CONFIG[category as IssueCategory];
                  const percentage = analytics.totalIssues > 0 
                    ? (count / analytics.totalIssues * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-3 border border-royal/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <h4 className="font-medium text-royal">{config.label}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-royal">{count}</p>
                        <p className="text-sm text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-royal/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Report Volume</span>
                  <Badge variant="outline">Last 7 days</Badge>
                </div>
                
                <div className="flex items-end gap-2 h-32">
                  {analytics.recentTrends.map((trend, index) => {
                    const maxCount = Math.max(...analytics.recentTrends.map(t => t.count));
                    const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={trend.date} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-royal rounded-t transition-all duration-300 hover:bg-royal/80"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs font-medium text-royal">{trend.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <Card className="border-royal/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Community Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topReporters.slice(0, 10).map((reporter, index) => (
                  <div key={reporter.userId} className="flex items-center justify-between p-3 border border-royal/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-royal/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-royal">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-royal">{reporter.name}</h4>
                        <p className="text-sm text-muted-foreground">Community member</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-royal">{reporter.count}</p>
                      <p className="text-sm text-muted-foreground">reports</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
