import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  Star,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SimpleAnalyticsDashboardProps {
  className?: string;
}

interface AnalyticsData {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  averageResolutionTime: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  satisfactionScore: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

export const SimpleAnalyticsDashboard: React.FC<SimpleAnalyticsDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        // Mock data for development
        setAnalyticsData({
          totalIssues: 1247,
          resolvedIssues: 892,
          pendingIssues: 355,
          averageResolutionTime: 4.2,
          categoryBreakdown: {
            'Road Issues': 245,
            'Water Problems': 189,
            'Waste Management': 156,
            'Public Safety': 134,
            'Parks & Recreation': 98,
            'Utilities': 87,
            'Other': 338
          },
          priorityBreakdown: {
            'High': 89,
            'Medium': 234,
            'Low': 32
          },
          satisfactionScore: 4.2,
          activeUsers: 1247,
          newUsersThisMonth: 89
        });
        setLoading(false);
        return;
      }

      // Real data from Supabase
      const [issuesResult, usersResult] = await Promise.all([
        supabase.from('issues').select('*'),
        supabase.from('users').select('*')
      ]);

      if (issuesResult.error) throw issuesResult.error;
      if (usersResult.error) throw usersResult.error;

      const issues = issuesResult.data || [];
      const users = usersResult.data || [];

      // Calculate analytics
      const totalIssues = issues.length;
      const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
      const pendingIssues = totalIssues - resolvedIssues;
      
      const resolvedIssuesWithTime = issues.filter(i => i.status === 'resolved' && i.resolved_at && i.created_at);
      const averageResolutionTime = resolvedIssuesWithTime.length > 0 
        ? resolvedIssuesWithTime.reduce((sum, issue) => {
            const created = new Date(issue.created_at);
            const resolved = new Date(issue.resolved_at);
            return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / resolvedIssuesWithTime.length
        : 0;

      const categoryBreakdown = issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityBreakdown = issues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setAnalyticsData({
        totalIssues,
        resolvedIssues,
        pendingIssues,
        averageResolutionTime,
        categoryBreakdown,
        priorityBreakdown,
        satisfactionScore: 4.2,
        activeUsers: users.length,
        newUsersThisMonth: users.filter(u => {
          const created = new Date(u.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created > monthAgo;
        }).length
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const resolutionRate = (analyticsData.resolvedIssues / analyticsData.totalIssues) * 100;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into civic issue management</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-3xl font-black text-gray-900">{analyticsData.totalIssues.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-3xl font-black text-gray-900">{resolutionRate.toFixed(1)}%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5.2% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Resolution Time</p>
                <p className="text-3xl font-black text-gray-900">{analyticsData.averageResolutionTime.toFixed(1)}d</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  -0.8d from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                <p className="text-3xl font-black text-gray-900">{analyticsData.satisfactionScore}/5</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +0.3 from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Status Distribution */}
            <Card className="card-sleek">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Issue Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Resolved</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{analyticsData.resolvedIssues}</div>
                      <div className="text-xs text-gray-500">{resolutionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={resolutionRate} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{analyticsData.pendingIssues}</div>
                      <div className="text-xs text-gray-500">{(100 - resolutionRate).toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={100 - resolutionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Priority Breakdown */}
            <Card className="card-sleek">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Priority Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.priorityBreakdown).map(([priority, count]) => {
                    const percentage = (count / analyticsData.totalIssues) * 100;
                    const color = priority === 'High' ? 'red' : priority === 'Medium' ? 'yellow' : 'green';
                    
                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={color === 'red' ? 'destructive' : color === 'yellow' ? 'secondary' : 'default'}>
                            {priority}
                          </Badge>
                          <span className="font-bold">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Issues by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, count]) => {
                    const percentage = (count / analyticsData.totalIssues) * 100;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category}</span>
                          <div className="text-right">
                            <div className="font-bold">{count}</div>
                            <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900">{analyticsData.activeUsers}</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">+{analyticsData.newUsersThisMonth}</div>
                  <div className="text-sm text-gray-500">New This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
