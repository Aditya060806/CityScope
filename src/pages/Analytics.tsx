import React from 'react';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, TrendingUp, Users, MapPin, Clock, CheckCircle } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { issues, loading } = useCivicIssues();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-sleek pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(issue => issue.status === 'resolved').length;
  const pendingIssues = issues.filter(issue => issue.status === 'pending').length;
  const inProgressIssues = issues.filter(issue => issue.status === 'in_progress').length;
  const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

  // Group by category
  const categoryStats = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by priority
  const priorityStats = issues.reduce((acc, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statsCards = [
    {
      title: 'Total Issues',
      value: totalIssues,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Resolved',
      value: resolvedIssues,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'In Progress',
      value: inProgressIssues,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Resolution Rate',
      value: `${resolutionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-sleek pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <PageHeader
            icon={<BarChart3 className="h-5 w-5" />}
            title="Civic Analytics"
            description="Insights and statistics about city-wide civic engagement."
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-sleek hover:border-royal/50 transition-all duration-300 glass-card bg-white border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <Card className="glass-card bg-white border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <MapPin className="w-5 h-5 text-royal" />
                Issues by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-royal h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(count / totalIssues) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Breakdown */}
          <Card className="glass-card bg-white border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-royal" />
                Issues by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(priorityStats).map(([priority, count]) => {
                  const priorityColors = {
                    high: 'bg-red-500',
                    medium: 'bg-yellow-500',
                    low: 'bg-green-500'
                  };

                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {priority} Priority
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${priorityColors[priority as keyof typeof priorityColors]}`}
                            style={{ width: `${(count / totalIssues) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {totalIssues === 0 && (
          <div className="mt-8">
            <EmptyState
              icon={<BarChart3 className="w-16 h-16" />}
              title="No Data Available"
              description="Start reporting issues to unlock analytics and trends."
              className="glass-card bg-white border-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};
