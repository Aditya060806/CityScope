import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { 
  Shield, 
  Users, 
  Settings, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Activity,
  Search,
  Plus,
  Eye,
  Ban,
  Check,
  User,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface BasicAdminDashboardProps {
  className?: string;
}

interface AdminStats {
  totalUsers: number;
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  activeUsers: number;
  newUsersToday: number;
  systemHealth: number;
  averageResponseTime: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  is_active: boolean;
  total_points: number;
  issues_reported: number;
  created_at: string;
  last_login: string;
}

export const BasicAdminDashboard: React.FC<BasicAdminDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        // Mock data for development
        setAdminStats({
          totalUsers: 1247,
          totalIssues: 3456,
          resolvedIssues: 2890,
          pendingIssues: 566,
          activeUsers: 892,
          newUsersToday: 23,
          systemHealth: 98,
          averageResponseTime: 2.4
        });

        setUsers([
          {
            id: '1',
            name: 'Rajesh Kumar',
            email: 'rajesh@example.com',
            role: 'user',
            is_active: true,
            total_points: 1150,
            issues_reported: 23,
            created_at: '2024-01-15T10:30:00Z',
            last_login: '2024-01-20T14:22:00Z'
          },
          {
            id: '2',
            name: 'Priya Sharma',
            email: 'priya@example.com',
            role: 'moderator',
            is_active: true,
            total_points: 950,
            issues_reported: 19,
            created_at: '2024-01-10T09:15:00Z',
            last_login: '2024-01-20T16:45:00Z'
          }
        ]);
        setLoading(false);
        return;
      }

      // Real data from Supabase
      const [usersResult, issuesResult] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('issues').select('*')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (issuesResult.error) throw issuesResult.error;

      const usersData = usersResult.data || [];
      const issuesData = issuesResult.data || [];

      const stats: AdminStats = {
        totalUsers: usersData.length,
        totalIssues: issuesData.length,
        resolvedIssues: issuesData.filter(i => i.status === 'resolved').length,
        pendingIssues: issuesData.filter(i => i.status === 'pending').length,
        activeUsers: usersData.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        newUsersToday: usersData.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
        systemHealth: 98,
        averageResponseTime: 2.4
      };

      setAdminStats(stats);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You need admin privileges to access this dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal"></div>
      </div>
    );
  }

  if (!adminStats) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No admin data available</p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("space-y-8", className)}>
      <PageHeader
        icon={<Shield className="w-5 h-5" />}
        title="Admin Dashboard"
        description="Manage users, review issue operations, and tune civic platform settings."
        className="border-slate-200/80 bg-white/90 shadow-sleek"
        actions={
          <Button variant="outline" onClick={loadAdminData} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-black text-gray-900">{adminStats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{adminStats.newUsersToday} today
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-3xl font-black text-gray-900">{adminStats.totalIssues.toLocaleString()}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {adminStats.pendingIssues} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-3xl font-black text-gray-900">
                  {((adminStats.resolvedIssues / adminStats.totalIssues) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {adminStats.resolvedIssues} resolved
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
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-3xl font-black text-gray-900">{adminStats.systemHealth}%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Activity className="w-4 h-4 mr-1" />
                  All systems operational
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-slate-200/80 bg-white/90 p-1 text-slate-600 shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard className="bg-white/90" title="System Overview" icon={<BarChart3 className="w-5 h-5" />}>
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="font-bold">{adminStats.activeUsers}</span>
                  </div>
                  <Progress value={(adminStats.activeUsers / adminStats.totalUsers) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg. Response Time</span>
                    <span className="font-bold">{adminStats.averageResponseTime}d</span>
                  </div>
                  <Progress value={100 - (adminStats.averageResponseTime * 10)} className="h-2" />
                </div>
              </div>
            </SectionCard>

            <SectionCard className="bg-white/90" title="Recent Activity" icon={<Clock className="w-5 h-5" />}>
              <div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New user registered</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New issue reported</p>
                      <p className="text-xs text-gray-500">5 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Issue resolved</p>
                      <p className="text-xs text-gray-500">10 minutes ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="border-slate-200/80 bg-white/90 shadow-sleek">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-royal/10 to-royal/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-royal" />
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'moderator' ? 'secondary' : 'default'}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="font-bold text-royal">{user.total_points} pts</div>
                        <div className="text-sm text-gray-500">{user.issues_reported} issues</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        {user.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-slate-200/80 bg-white/90 shadow-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">System Name</label>
                  <Input defaultValue="CityScope" />
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Email</label>
                  <Input type="email" defaultValue="admin@cityscope.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Issues per User</label>
                  <Input type="number" defaultValue="100" />
                </div>
                <Button>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
