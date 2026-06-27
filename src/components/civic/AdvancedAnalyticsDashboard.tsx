import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { advancedAnalyticsService } from '@/services/AdvancedAnalyticsService';
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
  Download,
  RefreshCw,
  Calendar,
  Target,
  Award,
  Activity,
  Globe,
  PieChart,
  LineChart,
  Filter,
  Eye,
  FileText,
  Zap
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className
}) => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    granularity: 'day'
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<unknown>(null);
  const [issueTrends, setIssueTrends] = useState<unknown[]>([]);
  const [geographicAnalytics, setGeographicAnalytics] = useState<unknown>(null);
  const [userEngagement, setUserEngagement] = useState<unknown>(null);
  const [systemPerformance, setSystemPerformance] = useState<unknown>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, loadAnalyticsData]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        performanceData,
        trendsData,
        geographicData,
        engagementData,
        systemData,
        predictiveData
      ] = await Promise.all([
        advancedAnalyticsService.getPerformanceMetrics(timeRange),
        advancedAnalyticsService.getIssueTrends(timeRange),
        advancedAnalyticsService.getGeographicAnalytics(),
        advancedAnalyticsService.getUserEngagementAnalytics(),
        advancedAnalyticsService.getSystemPerformanceAnalytics(),
        advancedAnalyticsService.getPredictiveAnalytics()
      ]);

      setPerformanceMetrics(performanceData);
      setIssueTrends(trendsData);
      setGeographicAnalytics(geographicData);
      setUserEngagement(engagementData);
      setSystemPerformance(systemData);
      setPredictiveAnalytics(predictiveData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  const handleExportData = async (type: string, format: string) => {
    try {
      const blob = await advancedAnalyticsService.exportAnalyticsData(type as 'issues' | 'users' | 'performance', format as 'csv' | 'pdf' | 'excel', timeRange);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
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

  // Chart data preparation
  const trendsChartData = issueTrends.map(trend => ({
    period: trend.period,
    total: trend.count,
    resolved: trend.resolved,
    avgResolutionTime: trend.avgResolutionTime
  }));

  const departmentPerformanceData = performanceMetrics?.departmentPerformance.map((dept: unknown) => ({
    name: dept.department,
    total: dept.totalIssues,
    resolved: dept.resolvedIssues,
    avgTime: dept.avgResolutionTime,
    satisfaction: dept.satisfaction
  })) || [];

  const categoryDistributionData = issueTrends.length > 0 ? 
    Object.entries(issueTrends[issueTrends.length - 1]?.categoryBreakdown || {}).map(([category, count]) => ({
      name: category,
      value: count
    })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Advanced Analytics
          </h2>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange.granularity}
            onValueChange={(value) => setTimeRange(prev => ({ ...prev, granularity: value as 'hour' | 'day' | 'week' | 'month' }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                      <p className="text-2xl font-bold">{performanceMetrics.totalIssues}</p>
                    </div>
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                      <p className="text-2xl font-bold">{performanceMetrics.resolutionRate.toFixed(1)}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                      <p className="text-2xl font-bold">{performanceMetrics.avgResolutionTime.toFixed(1)}h</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                      <p className="text-2xl font-bold">{performanceMetrics.userSatisfaction.toFixed(1)}%</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" stroke="#82ca9d" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <RechartsPieChart
                      data={categoryDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={departmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="resolved" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performanceMetrics && (
            <>
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                        <p className="text-2xl font-bold">{performanceMetrics.totalIssues}</p>
                      </div>
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Resolved Issues</p>
                        <p className="text-2xl font-bold">{performanceMetrics.resolvedIssues}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                        <p className="text-2xl font-bold">{performanceMetrics.resolutionRate.toFixed(1)}%</p>
                      </div>
                      <Target className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Department Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceMetrics.departmentPerformance.map((dept: unknown, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{dept.department}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{dept.totalIssues} total issues</span>
                            <span>{dept.resolvedIssues} resolved</span>
                            <span>{dept.avgResolutionTime.toFixed(1)}h avg time</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {dept.satisfaction.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Satisfaction</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          {geographicAnalytics && (
            <>
              {/* Coverage Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                        <p className="text-2xl font-bold">{geographicAnalytics.coverage.coveragePercentage.toFixed(1)}%</p>
                      </div>
                      <Globe className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Hotspots</p>
                        <p className="text-2xl font-bold">{geographicAnalytics.hotspots.length}</p>
                      </div>
                      <MapPin className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Critical Areas</p>
                        <p className="text-2xl font-bold">
                          {geographicAnalytics.hotspots.filter((h: unknown) => h.severity === 'critical').length}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hotspots */}
              <Card>
                <CardHeader>
                  <CardTitle>Issue Hotspots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {geographicAnalytics.hotspots.map((hotspot: unknown, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            hotspot.severity === 'critical' ? 'bg-red-500' :
                            hotspot.severity === 'high' ? 'bg-orange-500' :
                            hotspot.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <h3 className="font-semibold">
                              {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{hotspot.issueCount} issues</span>
                              <span>Radius: {hotspot.radius.toFixed(2)}km</span>
                              <span>Categories: {hotspot.categories.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={
                          hotspot.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          hotspot.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          hotspot.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }>
                          {hotspot.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {userEngagement && (
            <>
              {/* Engagement Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{userEngagement.activeUsers}</p>
                      </div>
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">New Users</p>
                        <p className="text-2xl font-bold">{userEngagement.newUsers}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Power Users</p>
                        <p className="text-2xl font-bold">{userEngagement.engagementMetrics.powerUsers}</p>
                      </div>
                      <Award className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Reports/User</p>
                        <p className="text-2xl font-bold">{userEngagement.engagementMetrics.avgReportsPerUser.toFixed(1)}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Retention Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {userEngagement.userRetention.day1}%
                      </div>
                      <div className="text-sm text-muted-foreground">Day 1 Retention</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {userEngagement.userRetention.day7}%
                      </div>
                      <div className="text-sm text-muted-foreground">Day 7 Retention</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {userEngagement.userRetention.day30}%
                      </div>
                      <div className="text-sm text-muted-foreground">Day 30 Retention</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gamification Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Gamification Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {userEngagement.gamificationStats.totalPointsAwarded.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Points Awarded</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {userEngagement.gamificationStats.badgesEarned}
                      </div>
                      <div className="text-sm text-muted-foreground">Badges Earned</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {userEngagement.gamificationStats.leaderboardParticipation}%
                      </div>
                      <div className="text-sm text-muted-foreground">Leaderboard Participation</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {userEngagement.gamificationStats.rewardRedemptions}
                      </div>
                      <div className="text-sm text-muted-foreground">Reward Redemptions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {predictiveAnalytics && (
            <>
              {/* Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>Issue Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveAnalytics.forecast.map((forecast: unknown, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{forecast.period}</h3>
                          <p className="text-sm text-muted-foreground">
                            Factors: {forecast.factors.join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {forecast.predictedIssues}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: {(forecast.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Seasonal Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveAnalytics.seasonalPatterns.map((pattern: unknown, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">
                            {new Date(2024, pattern.month - 1).toLocaleString('default', { month: 'long' })} - {pattern.category}
                          </h3>
                          <p className="text-sm text-muted-foreground">{pattern.reason}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">
                            +{pattern.expectedIncrease}%
                          </div>
                          <div className="text-sm text-muted-foreground">Expected Increase</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Areas */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveAnalytics.riskAreas.map((area: unknown, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">
                            {area.location.lat.toFixed(4)}, {area.location.lng.toFixed(4)}
                          </h3>
                          <Badge className={
                            area.riskScore > 0.8 ? 'bg-red-100 text-red-800' :
                            area.riskScore > 0.6 ? 'bg-orange-100 text-orange-800' :
                            area.riskScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }>
                            Risk: {(area.riskScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Risk Factors:</p>
                            <p className="text-sm text-muted-foreground">{area.factors.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Recommendations:</p>
                            <p className="text-sm text-muted-foreground">{area.recommendations.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Analytics Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportData('issues', 'csv')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Issues (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('users', 'json')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Users (JSON)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('performance', 'excel')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Performance (Excel)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('geographic', 'json')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Geographic (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
