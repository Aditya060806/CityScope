import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { issueService } from '@/services/IssueService';
import { userService } from '@/services/UserService';
import { Issue, IssueStatus, IssueCategory, AnalyticsData, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  Eye,
  Edit,
  Flag,
  UserCheck,
  TrendingUp,
  MapPin,
  Calendar,
  MoreHorizontal,
  Shield,
  Settings,
  Download
} from 'lucide-react';

interface AdminDashboardProps {
  className?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Issue>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, issuesData] = await Promise.all([
        issueService.getAnalytics(),
        issueService.getIssues({ limit: 100, includeHidden: true })
      ]);
      
      setAnalytics(analyticsData);
      setIssues(issuesData.issues);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateIssue = async (issueId: string, updates: Partial<Issue>) => {
    try {
      const updatedIssue = await issueService.updateIssue(issueId, updates);
      if (updatedIssue) {
        setIssues(prev => prev.map(issue => 
          issue.id === issueId ? updatedIssue : issue
        ));
        setShowEditDialog(false);
        setSelectedIssue(null);
      }
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const handleFlagIssue = async (issueId: string) => {
    try {
      await issueService.flagIssue(issueId, 'admin');
      loadData(); // Reload to get updated flag count
    } catch (error) {
      console.error('Error flagging issue:', error);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  return (
    <div className={cn("space-y-6", className)}>
      <PageHeader
        icon={<Shield className="h-5 w-5" />}
        title="Admin Dashboard"
        description="Manage civic issues, triage moderation queues, and monitor platform performance."
        className="border-slate-200/80 bg-white/90 shadow-sleek"
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </>
        }
      />

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold text-royal">{analytics.totalIssues}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-royal/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{analytics.issuesByStatus.pending || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.issuesByStatus['in-progress'] || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.issuesByStatus.resolved || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-slate-200/80 bg-white/90 p-1 text-slate-600 shadow-sm">
          <TabsTrigger value="issues">Issues Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        {/* Issues Management Tab */}
        <TabsContent value="issues" className="space-y-4">
          {/* Filters */}
          <SectionCard className="bg-white/90" contentClassName="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IssueStatus | 'all')}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as IssueCategory | 'all')}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                      <SelectItem key={category} value={category}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </SectionCard>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Card key={issue.id} className="border-slate-200/80 bg-white/95 shadow-sm transition-all hover:shadow-sleek">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-royal">{issue.title}</h3>
                        <Badge className={getStatusColor(issue.status)}>
                          {STATUS_CONFIG[issue.status].label}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                        {issue.flags > 0 && (
                          <Badge variant="destructive">
                            <Flag className="w-3 h-3 mr-1" />
                            {issue.flags} flags
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {issue.location.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {issue.reporterName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setEditForm(issue);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Issue</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Status</label>
                              <Select
                                value={editForm.status}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as IssueStatus }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Priority</label>
                              <Select
                                value={editForm.priority}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'urgent' }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Department</label>
                              <Input
                                value={editForm.department || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                                placeholder="e.g., Public Works, Sanitation"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Assigned To</label>
                              <Input
                                value={editForm.assignedTo || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                                placeholder="Worker ID or name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Resolution Notes</label>
                              <Textarea
                                value={editForm.resolutionNotes || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                                placeholder="Add notes about the resolution..."
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setShowEditDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleUpdateIssue(issue.id, editForm)}
                                className="bg-royal hover:bg-royal/90"
                              >
                                Update Issue
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFlagIssue(issue.id)}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Issues by Category */}
              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Issues by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.issuesByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{CATEGORY_CONFIG[category as IssueCategory].icon}</span>
                          <span className="text-sm font-medium">{CATEGORY_CONFIG[category as IssueCategory].label}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Reporters */}
              <Card className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Reporters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topReporters.slice(0, 5).map((reporter, index) => (
                      <div key={reporter.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <span className="text-sm">{reporter.name}</span>
                        </div>
                        <Badge variant="outline">{reporter.count} reports</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trends */}
              <Card className="border-slate-200/80 bg-white/90 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Trends (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-32">
                    {analytics.recentTrends.map((trend, index) => (
                      <div key={trend.date} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-royal rounded-t transition-all duration-300 hover:bg-royal/80"
                          style={{ height: `${(trend.count / Math.max(...analytics.recentTrends.map(t => t.count))) * 100}%` }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs font-medium text-royal">{trend.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-slate-200/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
