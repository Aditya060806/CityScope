import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Keyboard,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileText,
  Flag,
  Hash,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AdminIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  location: { latitude?: number; longitude?: number; address?: string } | null;
  images: string[];
  reporter_id: string;
  reporter_name: string;
  reporter_email?: string;
  is_anonymous: boolean;
  report_token?: string;
  verification_status: string;
  flag_count: number;
  upvotes: number;
  created_at: string;
  updated_at: string;
  resolution_notes: string | null;
}

interface AdminAction {
  id: string;
  admin_id: string;
  issue_id: string;
  action_type: string;
  reason: string;
  created_at: string;
}

interface AdminStats {
  totalIssues: number;
  pendingReview: number;
  approved: number;
  declined: number;
  escalated: number;
  todayActions: number;
  flaggedIssues: number;
  resolutionRate: number;
}

type ChartRange = '7d' | '30d' | '90d';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-100 text-rose-700',
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-rose-500',
};

const VERIFICATION_COLORS: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  declined_fake: 'bg-rose-100 text-rose-700',
  escalated: 'bg-violet-100 text-violet-700',
  soft_deleted: 'bg-slate-100 text-slate-700',
  hard_deleted: 'bg-slate-900 text-white',
};

const VERIFICATION_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  declined_fake: 'Declined (Fake)',
  escalated: 'Escalated',
  soft_deleted: 'Soft Deleted',
  hard_deleted: 'Hard Deleted',
};

const ACTION_ICON_SHELL: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  declined_fake: 'bg-rose-100 text-rose-700',
  escalated: 'bg-violet-100 text-violet-700',
  close: 'bg-slate-200 text-slate-700',
};

const ACTION_LABELS: Record<string, string> = {
  approved: 'Approved',
  declined_fake: 'Declined (Fake)',
  escalated: 'Escalated',
  close: 'Closed',
};

const CHART_COLORS = ['#0f766e', '#22c55e', '#6366f1', '#f59e0b', '#ef4444'];

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('queue');
  const [chartRange, setChartRange] = useState<ChartRange>('7d');

  const searchIssueByToken = useCallback(async (token: string): Promise<string | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('report_tokens')
      .select('issue_id')
      .eq('token', token)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;

    return data?.issue_id || null;
  }, []);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (issuesError) throw issuesError;

      const reporterIds = Array.from(new Set((issuesData || []).map((issue) => issue.reporter_id).filter(Boolean)));

      let reporterEmailById: Record<string, string> = {};
      if (reporterIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id,email')
          .in('id', reporterIds);

        if (!usersError && usersData) {
          reporterEmailById = usersData.reduce<Record<string, string>>((acc, userItem) => {
            acc[userItem.id] = userItem.email;
            return acc;
          }, {});
        }
      }

      const normalizedIssues: AdminIssue[] = (issuesData || []).map((issue) => ({
        ...issue,
        reporter_email: reporterEmailById[issue.reporter_id] || '',
        report_token: issue.report_token || issue.report_jwt_token || '',
      }));
      setIssues(normalizedIssues);

      const { data: actionsData, error: actionsError } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!actionsError) setActions(actionsData || []);

      const allIssues = normalizedIssues;
      const today = new Date().toISOString().split('T')[0];
      const todayActions = (actionsData || []).filter((action) => action.created_at?.startsWith(today)).length;

      setStats({
        totalIssues: allIssues.length,
        pendingReview: allIssues.filter((issue) => issue.verification_status === 'pending_review' || !issue.verification_status).length,
        approved: allIssues.filter((issue) => issue.verification_status === 'approved').length,
        declined: allIssues.filter((issue) => issue.verification_status === 'declined_fake').length,
        escalated: allIssues.filter((issue) => issue.verification_status === 'escalated').length,
        todayActions,
        flaggedIssues: allIssues.filter((issue) => issue.flag_count > 0).length,
        resolutionRate: allIssues.length > 0
          ? Math.round((allIssues.filter((issue) => issue.status === 'resolved').length / allIssues.length) * 100)
          : 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to load admin data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user?.role, fetchData]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('admin-issues-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchData]);

  const appendAdminAction = async (issueId: string, actionType: string, reason: string) => {
    if (!supabase) throw new Error('No Supabase');

    const { error } = await supabase.from('admin_actions').insert({
      admin_id: user!.id,
      issue_id: issueId,
      action_type: actionType,
      reason,
    });

    if (error) throw error;
  };

  const handleApprove = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      if (!supabase) throw new Error('No Supabase');

      const { error: updateError } = await supabase
        .from('issues')
        .update({ verification_status: 'approved', is_hidden: false, updated_at: new Date().toISOString() })
        .eq('id', issueId);

      if (updateError) throw updateError;

      await appendAdminAction(issueId, 'approved', 'Report verified as legitimate');
      toast({ title: 'Approved', description: 'Issue marked as legitimate.' });
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve issue';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (issueId: string) => {
    const reason = declineReasons[issueId] || '';
    if (!reason.trim()) {
      toast({ title: 'Reason required', description: 'Provide a reason for declining.', variant: 'destructive' });
      return;
    }

    setActionLoading(issueId);
    try {
      if (!supabase) throw new Error('No Supabase');

      const { error: updateError } = await supabase
        .from('issues')
        .update({ verification_status: 'declined_fake', is_hidden: true, updated_at: new Date().toISOString() })
        .eq('id', issueId);

      if (updateError) throw updateError;

      await appendAdminAction(issueId, 'declined_fake', reason);
      setDeclineReasons((prev) => {
        const next = { ...prev };
        delete next[issueId];
        return next;
      });
      toast({ title: 'Declined', description: 'Issue marked as fake and hidden.' });
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline issue';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalate = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      if (!supabase) throw new Error('No Supabase');

      const { error: updateError } = await supabase
        .from('issues')
        .update({ verification_status: 'escalated', priority: 'urgent', is_hidden: false, updated_at: new Date().toISOString() })
        .eq('id', issueId);

      if (updateError) throw updateError;

      await appendAdminAction(issueId, 'escalated', 'Escalated for urgent attention');
      toast({ title: 'Escalated', description: 'Issue escalated to urgent priority.' });
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to escalate issue';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSoftDelete = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      if (!supabase) throw new Error('No Supabase');

      const { error: updateError } = await supabase
        .from('issues')
        .update({ is_hidden: true, verification_status: 'declined_fake', updated_at: new Date().toISOString() })
        .eq('id', issueId);

      if (updateError) throw updateError;

      await appendAdminAction(issueId, 'declined_fake', 'Issue hidden by admin moderation');
      toast({ title: 'Soft deleted', description: 'Issue is hidden from public views.' });
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to soft delete issue';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async (issueId: string) => {
    const confirmed = window.confirm('This permanently deletes the issue and cannot be undone. Continue?');
    if (!confirmed) return;

    setActionLoading(issueId);
    try {
      if (!supabase) throw new Error('No Supabase');

      await appendAdminAction(issueId, 'close', 'Issue permanently deleted by admin');

      const { error: deleteError } = await supabase
        .from('issues')
        .delete()
        .eq('id', issueId);

      if (deleteError) throw deleteError;

      toast({ title: 'Destroyed', description: 'Issue permanently removed.' });
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to destroy issue';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch = !normalizedQuery
      || issue.title.toLowerCase().includes(normalizedQuery)
      || issue.description.toLowerCase().includes(normalizedQuery)
      || issue.id.toLowerCase().includes(normalizedQuery)
      || (issue.reporter_email || '').toLowerCase().includes(normalizedQuery)
      || (issue.report_token || '').toLowerCase().includes(normalizedQuery);

    const matchesFilter = filterStatus === 'all'
      || (filterStatus === 'pending' && (!issue.verification_status || issue.verification_status === 'pending_review'))
      || issue.verification_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    const candidate = value.trim();
    if (!candidate || candidate.length < 16) return;

    const maybeIssueId = await searchIssueByToken(candidate);
    if (!maybeIssueId) return;

    setSearchQuery(maybeIssueId);
    toast({ title: 'Token resolved', description: 'Mapped token to report ID for search.' });
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Status', 'Priority', 'Verification', 'Reporter', 'Created', 'Flags', 'Upvotes'];
    const rows = filteredIssues.map((issue) => [
      issue.id,
      issue.title,
      issue.category,
      issue.status,
      issue.priority,
      issue.verification_status || 'pending_review',
      issue.reporter_name,
      new Date(issue.created_at).toLocaleDateString(),
      issue.flag_count,
      issue.upvotes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((col) => `"${col}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cityscope-admin-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filteredIssues.length} issues exported to CSV.` });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const primaryStats = stats
    ? [
        { label: 'Pending Review', value: stats.pendingReview, subtext: 'Needs moderation now', icon: Clock, iconShell: 'bg-amber-100 text-amber-700' },
        { label: 'Approved', value: stats.approved, subtext: 'Verified as legitimate', icon: CheckCircle2, iconShell: 'bg-emerald-100 text-emerald-700' },
        { label: 'Escalated', value: stats.escalated, subtext: 'Urgent handoff queue', icon: ArrowUpCircle, iconShell: 'bg-violet-100 text-violet-700' },
        { label: 'Declined (Fake)', value: stats.declined, subtext: 'Removed from public feed', icon: XCircle, iconShell: 'bg-rose-100 text-rose-700' },
      ]
    : [];

  const secondaryStats = stats
    ? [
        { label: 'Total Reports', value: stats.totalIssues, icon: FileText, tone: 'text-slate-900' },
        { label: 'Flagged Reports', value: stats.flaggedIssues, icon: Flag, tone: 'text-amber-700' },
        { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: TrendingUp, tone: 'text-emerald-700' },
        { label: "Today's Actions", value: stats.todayActions, icon: Activity, tone: 'text-indigo-700' },
      ]
    : [];

  const moderationActivity = useMemo(() => {
    const days = chartRange === '7d' ? 7 : chartRange === '30d' ? 30 : 90;
    const bucketCount = days <= 14 ? days : 10;
    const bucketSize = Math.ceil(days / bucketCount);
    const now = Date.now();

    return Array.from({ length: bucketCount }).map((_, index) => {
      const startOffset = days - (bucketCount - index) * bucketSize;
      const endOffset = days - (bucketCount - index - 1) * bucketSize;

      const bucketStart = new Date(now - Math.max(0, endOffset) * 24 * 60 * 60 * 1000);
      bucketStart.setHours(0, 0, 0, 0);
      const bucketEnd = new Date(now - Math.max(0, startOffset) * 24 * 60 * 60 * 1000);
      bucketEnd.setHours(23, 59, 59, 999);

      const reports = issues.filter((issue) => {
        const t = new Date(issue.created_at).getTime();
        return t >= bucketStart.getTime() && t <= bucketEnd.getTime();
      }).length;

      const decisions = actions.filter((action) => {
        const t = new Date(action.created_at).getTime();
        return t >= bucketStart.getTime() && t <= bucketEnd.getTime();
      }).length;

      const label = days <= 14
        ? bucketEnd.toLocaleDateString('en-US', { weekday: 'short' })
        : `${bucketEnd.toLocaleDateString('en-US', { month: 'short' })} ${bucketEnd.getDate()}`;

      return {
        day: label,
        reports,
        decisions,
      };
    });
  }, [issues, actions, chartRange]);

  const verificationBreakdown = [
    { name: 'Pending', value: stats?.pendingReview || 0 },
    { name: 'Approved', value: stats?.approved || 0 },
    { name: 'Escalated', value: stats?.escalated || 0 },
    { name: 'Declined', value: stats?.declined || 0 },
  ].filter((item) => item.value > 0);

  const pendingRatio = stats?.totalIssues
    ? Math.max(0, Math.min(100, Math.round((stats.pendingReview / stats.totalIssues) * 100)))
    : 0;

  const queueHealthData = [
    {
      name: 'Queue Health',
      value: 100 - pendingRatio,
      fill: '#0f766e',
    },
  ];

  const queueAgingCount = useMemo(() => {
    const fortyEightHours = Date.now() - 48 * 60 * 60 * 1000;
    return issues.filter((issue) => {
      const isPending = !issue.verification_status || issue.verification_status === 'pending_review';
      return isPending && new Date(issue.created_at).getTime() < fortyEightHours;
    }).length;
  }, [issues]);

  const urgentAttentionCount = useMemo(() => {
    return issues.filter((issue) => issue.priority === 'urgent' && issue.verification_status !== 'approved').length;
  }, [issues]);

  const topCategoryInsights = useMemo(() => {
    const counts = issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));
  }, [issues]);

  const maxCategoryCount = Math.max(...topCategoryInsights.map((item) => item.count), 1);

  if (!user || user.role !== 'admin') {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold text-red-800">Access Denied</h2>
            <p className="text-red-700">You do not have admin privileges. Contact your administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,23,42,0.08),transparent_62%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_58%)]" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-7xl space-y-6 pb-4">
          <PageHeader
            icon={<Shield className="h-5 w-5" />}
            title="Moderation Command Center"
            description="Professional triage workspace for report verification, queue management, and audit visibility."
            className="border-slate-200/80 bg-white/85 shadow-sleek-lg"
            actions={
              <>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl">
                  <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button variant="royal" size="sm" onClick={exportCSV} className="rounded-xl">
                  <Download className="mr-1 h-4 w-4" /> Export CSV
                </Button>
              </>
            }
          />

          {stats ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {primaryStats.map((stat) => (
                  <Card key={stat.label} className="border-slate-200/80 bg-white/90 shadow-sleek transition-all hover:-translate-y-0.5 hover:shadow-sleek-lg">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconShell}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.subtext}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {secondaryStats.map((stat) => (
                  <Card key={stat.label} className="border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
                        <p className={`mt-1 text-2xl font-extrabold tracking-tight ${stat.tone}`}>{stat.value}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 xl:grid-cols-3">
                <SectionCard
                  title="Moderation Activity"
                  description="Reports vs decisions over the selected window"
                  icon={<BarChart3 className="h-4 w-4 text-emerald-700" />}
                  className="bg-white/90 xl:col-span-2"
                  actions={
                    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
                      {(['7d', '30d', '90d'] as ChartRange[]).map((range) => (
                        <Button
                          key={range}
                          size="sm"
                          variant={chartRange === range ? 'royal' : 'ghost'}
                          className="h-8 rounded-lg px-3 text-xs uppercase"
                          onClick={() => setChartRange(range)}
                        >
                          {range}
                        </Button>
                      ))}
                    </div>
                  }
                  contentClassName="pt-2"
                >
                  <div className="h-[230px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moderationActivity} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.45)',
                          }}
                        />
                        <Bar dataKey="reports" name="Reports" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="decisions" name="Decisions" fill="#0f766e" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Reports</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Decisions</span>
                    <span className="ml-auto text-slate-500">Window: {chartRange.toUpperCase()}</span>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Queue Health"
                  description="How balanced the moderation queue is right now"
                  icon={<TrendingUp className="h-4 w-4 text-emerald-700" />}
                  className="bg-white/90"
                >
                  <div className="space-y-5">
                    <div className="mx-auto h-[170px] w-full max-w-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          data={queueHealthData}
                          startAngle={210}
                          endAngle={-30}
                          innerRadius="58%"
                          outerRadius="98%"
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar dataKey="value" cornerRadius={14} background fill="#0f766e" />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black tracking-tight text-slate-900">{100 - pendingRatio}%</p>
                      <p className="text-sm text-slate-500">Queue health score</p>
                      <p className="mt-2 text-xs text-slate-500">Pending load: {pendingRatio}% of total reports</p>
                    </div>
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="Operational Focus"
                description="SLA pressure and category concentration at a glance"
                icon={<AlertTriangle className="h-4 w-4 text-amber-700" />}
                className="bg-white/90"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Pending over 48h</p>
                      <p className="mt-1 text-3xl font-black text-amber-900">{queueAgingCount}</p>
                      <p className="text-xs text-amber-700/80">SLA attention needed</p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Urgent unresolved</p>
                      <p className="mt-1 text-3xl font-black text-rose-900">{urgentAttentionCount}</p>
                      <p className="text-xs text-rose-700/80">Escalation watchlist</p>
                    </div>
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">Action throughput</p>
                      <p className="mt-1 text-3xl font-black text-indigo-900">{stats.todayActions}</p>
                      <p className="text-xs text-indigo-700/80">Actions completed today</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Top Categories</p>
                    {topCategoryInsights.length === 0 ? (
                      <p className="text-sm text-slate-500">No categories available yet.</p>
                    ) : (
                      topCategoryInsights.map((item) => (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700 capitalize">{item.category}</span>
                            <span className="font-semibold text-slate-900">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-teal-600 to-indigo-500"
                              style={{ width: `${Math.max(10, (item.count / maxCategoryCount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Verification Breakdown"
                description="Current composition of moderation outcomes"
                icon={<Activity className="h-4 w-4 text-indigo-700" />}
                className="bg-white/90"
              >
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="mx-auto h-[220px] w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={verificationBreakdown}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          strokeWidth={2}
                          stroke="#ffffff"
                        >
                          {verificationBreakdown.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.45)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {verificationBreakdown.length === 0 ? (
                      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No moderation outcomes yet.</p>
                    ) : (
                      verificationBreakdown.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </SectionCard>
            </>
          ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="sticky top-2 z-20 mb-4 flex h-auto w-full flex-wrap items-center justify-start gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-2 text-slate-600 shadow-sm backdrop-blur">
              <TabsTrigger value="queue" className="rounded-xl px-4 py-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 data-[state=active]:shadow-none">
                <Clock className="mr-1 h-4 w-4" /> Review Queue
                {stats?.pendingReview ? (
                  <span className="ml-2 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white">{stats.pendingReview}</span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-800 data-[state=active]:shadow-none">
                <FileText className="mr-1 h-4 w-4" /> All Reports
              </TabsTrigger>
              <TabsTrigger value="log" className="rounded-xl px-4 py-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 data-[state=active]:shadow-none">
                <Activity className="mr-1 h-4 w-4" /> Action Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-0">
              <SectionCard
                title="Priority Moderation Queue"
                description="Pending reports sorted for fast triage and verification actions."
                icon={<Clock className="h-4 w-4 text-amber-700" />}
                className="bg-white/90"
              >
                <IssueList
                  issues={issues.filter((issue) => !issue.verification_status || issue.verification_status === 'pending_review')}
                  searchQuery={searchQuery}
                  setSearchQuery={handleSearch}
                  expandedIssue={expandedIssue}
                  setExpandedIssue={setExpandedIssue}
                  declineReasons={declineReasons}
                  setDeclineReasons={setDeclineReasons}
                  actionLoading={actionLoading}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  onEscalate={handleEscalate}
                  onSoftDelete={handleSoftDelete}
                  onHardDelete={handleHardDelete}
                  formatDate={formatDate}
                  loading={loading}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="all" className="mt-0 space-y-4">
              <SectionCard
                title="Report Registry"
                description="Filter across all moderation states and inspect verification outcomes."
                icon={<FileText className="h-4 w-4 text-indigo-700" />}
                actions={
                  <div className="flex flex-wrap gap-2">
                    {['all', 'pending_review', 'approved', 'declined_fake', 'escalated'].map((status) => (
                      <Button
                        key={status}
                        variant={filterStatus === status ? 'royal' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus(status)}
                        className="capitalize"
                      >
                        {status === 'all' ? 'All' : status.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                }
                className="bg-white/90"
              >
                <IssueList
                  issues={filteredIssues}
                  searchQuery={searchQuery}
                  setSearchQuery={handleSearch}
                  expandedIssue={expandedIssue}
                  setExpandedIssue={setExpandedIssue}
                  declineReasons={declineReasons}
                  setDeclineReasons={setDeclineReasons}
                  actionLoading={actionLoading}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  onEscalate={handleEscalate}
                  onSoftDelete={handleSoftDelete}
                  onHardDelete={handleHardDelete}
                  formatDate={formatDate}
                  loading={loading}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="log" className="mt-0">
              <SectionCard
                title="Moderation Timeline"
                description="Auditable stream of verification and escalation decisions."
                icon={<Activity className="h-4 w-4 text-slate-700" />}
                className="bg-white/90"
              >
                {actions.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No moderation actions yet"
                    description="As admins process reports, the activity timeline will appear here."
                    className="py-12"
                  />
                ) : (
                  <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                    {actions.map((action) => {
                      const shell = ACTION_ICON_SHELL[action.action_type] || 'bg-slate-100 text-slate-600';
                      const label = ACTION_LABELS[action.action_type] || action.action_type;
                      const badgeClass = VERIFICATION_COLORS[action.action_type] || 'bg-slate-100 text-slate-700';

                      return (
                        <div key={action.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${shell}`}>
                              {action.action_type === 'approved' ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : action.action_type === 'declined_fake' ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>{label}</span>
                                <span className="text-xs font-medium text-slate-500">Issue #{action.issue_id.slice(0, 8)}</span>
                                <span className="text-xs text-slate-400">{formatDate(action.created_at)}</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-700">{action.reason}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

interface IssueListProps {
  issues: AdminIssue[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  expandedIssue: string | null;
  setExpandedIssue: (id: string | null) => void;
  declineReasons: Record<string, string>;
  setDeclineReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onEscalate: (id: string) => void;
  onSoftDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
  formatDate: (d: string) => string;
  loading: boolean;
}

const IssueList: React.FC<IssueListProps> = ({
  issues,
  searchQuery,
  setSearchQuery,
  expandedIssue,
  setExpandedIssue,
  declineReasons,
  setDeclineReasons,
  actionLoading,
  onApprove,
  onDecline,
  onEscalate,
  onSoftDelete,
  onHardDelete,
  formatDate,
  loading,
}) => {
  const filtered = issues.filter((issue) =>
    !searchQuery
    || issue.title.toLowerCase().includes(searchQuery.toLowerCase())
    || issue.description.toLowerCase().includes(searchQuery.toLowerCase())
    || issue.id.toLowerCase().includes(searchQuery.toLowerCase())
    || (issue.reporter_email || '').toLowerCase().includes(searchQuery.toLowerCase())
    || (issue.report_token || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIssue = issues.find((issue) => issue.id === expandedIssue) || null;

  useEffect(() => {
    if (!selectedIssue) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }

      if (actionLoading === selectedIssue.id) return;

      const key = event.key.toLowerCase();
      if (key === 'a') {
        event.preventDefault();
        onApprove(selectedIssue.id);
      } else if (key === 'd') {
        event.preventDefault();
        onDecline(selectedIssue.id);
      } else if (key === 'e') {
        event.preventDefault();
        onEscalate(selectedIssue.id);
      } else if (key === 'h') {
        event.preventDefault();
        onSoftDelete(selectedIssue.id);
      } else if (key === 'x' && event.shiftKey) {
        event.preventDefault();
        onHardDelete(selectedIssue.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedIssue, actionLoading, onApprove, onDecline, onEscalate, onSoftDelete, onHardDelete]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by title, report ID, reporter email, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">ID</Badge>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Email</Badge>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Token</Badge>
          <span className="ml-auto font-medium text-slate-600">{filtered.length} results</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-500" />
          <p className="text-sm text-slate-500">Loading moderation queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No reports to review"
          description="Queue is currently clear. New reports will appear here automatically."
          className="rounded-2xl border border-slate-200/80 bg-white py-14"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm transition-all hover:shadow-sleek">
                  <CardContent className="p-0">
                    <button className="w-full p-4 text-left sm:p-5" onClick={() => setExpandedIssue(issue.id)}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT_COLORS[issue.priority] || 'bg-slate-400'}`} />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-900">{issue.title}</h3>
                            {issue.flag_count > 0 ? (
                              <Badge variant="warning" className="gap-1">
                                <Flag className="h-3 w-3" /> {issue.flag_count} flagged
                              </Badge>
                            ) : null}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERIFICATION_COLORS[issue.verification_status || 'pending_review'] || 'bg-slate-100 text-slate-700'}`}>
                              {VERIFICATION_LABELS[issue.verification_status || 'pending_review'] || 'Pending Review'}
                            </span>
                          </div>

                          <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(issue.created_at)}</div>
                            <div className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {issue.is_anonymous ? 'Anonymous' : issue.reporter_name}</div>
                            <div className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> {issue.id.slice(0, 8)}</div>
                            <div className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {issue.category}</div>
                            <div className="flex items-center gap-1"><ArrowUpCircle className="h-3.5 w-3.5" /> {issue.upvotes} upvotes</div>
                            {issue.reporter_email ? (
                              <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {issue.reporter_email}</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Open</span>
                        </div>
                      </div>
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sheet open={!!selectedIssue} onOpenChange={(open) => { if (!open) setExpandedIssue(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto border-slate-200 bg-white p-0 sm:max-w-2xl">
          {selectedIssue ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                <SheetTitle className="pr-8 text-xl font-bold text-slate-900">{selectedIssue.title}</SheetTitle>
                <SheetDescription>
                  Report #{selectedIssue.id.slice(0, 8)} • {VERIFICATION_LABELS[selectedIssue.verification_status || 'pending_review'] || 'Pending Review'}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-5 px-6 py-5">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_COLORS[selectedIssue.priority] || 'bg-slate-100 text-slate-700'}`}>
                    {selectedIssue.priority}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${VERIFICATION_COLORS[selectedIssue.verification_status || 'pending_review'] || 'bg-slate-100 text-slate-700'}`}>
                    {VERIFICATION_LABELS[selectedIssue.verification_status || 'pending_review'] || 'Pending Review'}
                  </span>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{selectedIssue.category}</Badge>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(selectedIssue.created_at)}</div>
                  <div className="flex items-center gap-2"><Hash className="h-4 w-4" /> {selectedIssue.id}</div>
                  <div className="flex items-center gap-2"><User className="h-4 w-4" /> {selectedIssue.is_anonymous ? 'Anonymous' : selectedIssue.reporter_name}</div>
                  {selectedIssue.reporter_email ? (
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {selectedIssue.reporter_email}</div>
                  ) : null}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Description</p>
                  <p className="text-sm leading-6 text-slate-700">{selectedIssue.description}</p>
                </div>

                {selectedIssue.location ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    {(selectedIssue.location as { address?: string }).address || 'Location provided'}
                  </div>
                ) : null}

                {selectedIssue.images && selectedIssue.images.length > 0 && selectedIssue.images[0] !== '/placeholder.svg' ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Evidence</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIssue.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="font-medium text-slate-600">Upvotes</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedIssue.upvotes}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="font-medium text-slate-600">Flags</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedIssue.flag_count}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
                  <h4 className="text-sm font-semibold text-slate-800">Moderation Actions</h4>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <Keyboard className="h-3.5 w-3.5" />
                      Quick Shortcuts
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">A Approve</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">D Decline</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">E Escalate</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">H Hide</span>
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">Shift+X Destroy</span>
                    </div>
                  </div>
                  <Input
                    placeholder="Reason for declining (required)..."
                    value={declineReasons[selectedIssue.id] || ''}
                    onChange={(e) => setDeclineReasons((prev) => ({ ...prev, [selectedIssue.id]: e.target.value }))}
                    className="h-10 border-slate-200 bg-white text-sm"
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button size="sm" variant="success" disabled={actionLoading === selectedIssue.id} onClick={() => onApprove(selectedIssue.id)}>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {actionLoading === selectedIssue.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="destructive" disabled={actionLoading === selectedIssue.id} onClick={() => onDecline(selectedIssue.id)}>
                      <XCircle className="mr-1 h-4 w-4" /> Decline
                    </Button>
                    <Button size="sm" variant="powder" disabled={actionLoading === selectedIssue.id} onClick={() => onEscalate(selectedIssue.id)}>
                      <ArrowUpCircle className="mr-1 h-4 w-4" /> Escalate
                    </Button>
                    <Button size="sm" variant="outline" disabled={actionLoading === selectedIssue.id} onClick={() => onSoftDelete(selectedIssue.id)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Hide
                    </Button>
                  </div>

                  <Separator />

                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actionLoading === selectedIssue.id}
                    onClick={() => onHardDelete(selectedIssue.id)}
                    className="w-full"
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Destroy Permanently
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};
