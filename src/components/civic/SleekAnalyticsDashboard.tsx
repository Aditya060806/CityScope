import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  pendingIssues: number;
  avgResolutionTime: number;
  communityEngagement: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
    icon: string;
  }>;
  weeklyTrend: Array<{
    day: string;
    reported: number;
    resolved: number;
  }>;
}

interface SleekAnalyticsDashboardProps {
  data: AnalyticsData;
  className?: string;
}

export const SleekAnalyticsDashboard: React.FC<SleekAnalyticsDashboardProps> = ({
  data,
  className
}) => {
  const statsCards = [
    {
      title: 'Total Issues',
      value: data.totalIssues.toString(),
      icon: AlertTriangle,
      color: 'text-royal',
      bgColor: 'bg-royal/10',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Resolved',
      value: data.resolvedIssues.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'In Progress',
      value: data.inProgressIssues.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '-3%',
      changeType: 'negative' as const
    },
    {
      title: 'Avg. Resolution',
      value: `${data.avgResolutionTime} days`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '-2 days',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Community engagement insights and trends</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-royal hover:bg-royal/90 text-white rounded-xl">
            <Activity className="w-4 h-4 mr-2" />
            Real-time View
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={stat.title} className="bg-white rounded-2xl shadow-sleek border border-gray-100 hover:shadow-sleek-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className="text-right">
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Trend Chart */}
        <Card className="lg:col-span-2 bg-white rounded-2xl shadow-sleek border border-gray-100">
          <CardHeader className="p-6 border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-900">Weekly Trend</CardTitle>
            <p className="text-gray-600">Issues reported vs resolved this week</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.weeklyTrend.map((day, index) => (
                <div key={day.day} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-600">{day.day}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-royal rounded-full"></div>
                      <span className="text-sm text-gray-600">Reported</span>
                      <span className="text-sm font-semibold text-royal">{day.reported}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Resolved</span>
                      <span className="text-sm font-semibold text-green-600">{day.resolved}</span>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {day.reported > 0 ? Math.round((day.resolved / day.reported) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-500">Resolution</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
          <CardHeader className="p-6 border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-900">Top Categories</CardTitle>
            <p className="text-gray-600">Most reported issue types</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-royal/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm">{category.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{category.category}</p>
                      <p className="text-sm text-gray-600">{category.count} issues</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-royal">{category.percentage}%</p>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-2 bg-royal rounded-full transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Engagement */}
      <Card className="bg-white rounded-2xl shadow-sleek border border-gray-100">
        <CardHeader className="p-6 border-b border-gray-100">
          <CardTitle className="text-xl font-bold text-gray-900">Community Engagement</CardTitle>
          <p className="text-gray-600">Citizen participation and impact metrics</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-royal to-royal/90 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-card">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{data.communityEngagement}</h3>
              <p className="text-gray-600 font-medium">Active Citizens</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-card">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {Math.round((data.resolvedIssues / data.totalIssues) * 100)}%
              </h3>
              <p className="text-gray-600 font-medium">Resolution Rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-card">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">15</h3>
              <p className="text-gray-600 font-medium">Areas Covered</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
