import { FC, useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IssueDetail } from '@/components/civic/IssueDetail';
import { FilterDrawer } from '@/components/civic/FilterDrawer';
import { EnhancedReportModal } from '@/components/civic/EnhancedReportModal';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { useLocation } from '@/hooks/useLocation';
import { Issue } from '@/types/civic';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, CheckCircle, Activity, MapPin, Radio, Download
} from 'lucide-react';
import { OfflineStatusBanner } from '@/components/civic/OfflineStatusBanner';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useNavigate } from 'react-router-dom';


// New Features
import { StatCard } from '@/components/features/dashboard/StatCard';
import { OverviewChart } from '@/components/features/dashboard/OverviewChart';
import { AIInsightCard } from '@/components/features/dashboard/AIInsightCard';
import { RecentIssuesTable } from '@/components/features/dashboard/RecentIssuesTable';
import { PradEngine } from '@/components/features/prad/PradEngine';
import { RealMapView } from '@/components/civic/RealMapView';

export const Dashboard: FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [mountMap, setMountMap] = useState(false);

  const { userLocation, isLocationEnabled, error: locationError, isLoading: locationLoading } = useLocation();
  const {
    issues,
    loading,
    error,
    filters,
    updateFilters,
    reportIssue,
    upvoteIssue,
    flagIssue,
    totalIssues
  } = useCivicIssues();

  const { isOnline, cachedIssues, queueStatus } = useOfflineCache();


  useEffect(() => {
    const timer = window.setTimeout(() => setMountMap(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const resolvedIssuesCount = issues.filter(i => i.status === 'resolved').length;
  // const inProgressIssuesCount = issues.filter(i => i.status === 'in-progress').length;
  // const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssuesCount / totalIssues) * 100) : 0;
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const reportsToday = issues.filter((issue) => {
    const created = issue.createdAt instanceof Date ? issue.createdAt : new Date((issue as unknown as { createdAt?: string }).createdAt || 0);
    return !Number.isNaN(created.getTime()) && created >= todayStart;
  }).length;

  const handleReportSubmit = async (issueData: any) => {
    try {
      await reportIssue(issueData);
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to submit issue:', error);
    }
  };

  const activeIssuesList = isOnline ? issues : cachedIssues;

  const statMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDate = (value: Date | string | null | undefined): Date => {
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d;
      }
      return new Date(0);
    };

    const isSameDay = (a: Date, b: Date): boolean => (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );

    const endOfDay = (d: Date): Date => {
      const eod = new Date(d);
      eod.setHours(23, 59, 59, 999);
      return eod;
    };

    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });

    const total = days.map((day) => activeIssuesList.filter((issue) => {
      const issueDate = toDate(issue.createdAt);
      return isSameDay(issueDate, day);
    }).length);

    const resolved = days.map((day) => activeIssuesList.filter((issue) => {
      if (issue.status !== 'resolved') return false;
      const resolvedDate = issue.resolvedAt ? toDate(issue.resolvedAt) : toDate(issue.createdAt);
      return isSameDay(resolvedDate, day);
    }).length);

    const active = days.map((day) => {
      const checkpoint = endOfDay(day);
      return activeIssuesList.filter((issue) => {
        const createdAt = toDate(issue.createdAt);
        const resolvedAt = issue.resolvedAt ? toDate(issue.resolvedAt) : null;
        return createdAt.getTime() <= checkpoint.getTime() && (!resolvedAt || resolvedAt.getTime() > checkpoint.getTime());
      }).length;
    });

    const urgent = days.map((day) => {
      const checkpoint = endOfDay(day);
      return activeIssuesList.filter((issue) => {
        if (issue.priority !== 'urgent') return false;
        const createdAt = toDate(issue.createdAt);
        const resolvedAt = issue.resolvedAt ? toDate(issue.resolvedAt) : null;
        return createdAt.getTime() <= checkpoint.getTime() && (!resolvedAt || resolvedAt.getTime() > checkpoint.getTime());
      }).length;
    });

    return { total, resolved, active, urgent };
  }, [activeIssuesList]);

  const statChanges = useMemo(() => {
    const calcChange = (series: number[]) => {
      if (!series.length) return 0;
      const split = Math.floor(series.length / 2);
      const previous = series.slice(0, split).reduce((sum, v) => sum + v, 0);
      const current = series.slice(split).reduce((sum, v) => sum + v, 0);

      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }

      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      total: calcChange(statMetrics.total),
      resolved: calcChange(statMetrics.resolved),
      active: calcChange(statMetrics.active),
      urgent: calcChange(statMetrics.urgent),
    };
  }, [statMetrics]);

  const activeCasesCount = activeIssuesList.filter(i => i.status !== 'resolved').length;
  const urgentCasesCount = activeIssuesList.filter(i => i.priority === 'urgent').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div ref={pageRef} className="w-full h-full">

      <div className="w-full max-w-[1760px] mx-auto pb-24 md:pb-12">
        <div className="mb-4">
          <OfflineStatusBanner isOnline={isOnline} pendingItems={queueStatus.pendingItems} />
        </div>

        {/* Top Header / Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Real-time city analytics and system health.</p>
          </div>
        </div>

        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Row 1: STATS GRID */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6" data-tutorial="stats-grid">
            <StatCard 
              title="Total Reports" 
              value={totalIssues || 0} 
              change={statChanges.total} 
              subtitle="vs. last week" 
              icon={AlertTriangle} 
              data={statMetrics.total}
            />
            <StatCard 
              title="Resolved Issues" 
              value={resolvedIssuesCount || 0} 
              change={statChanges.resolved} 
              subtitle="resolution velocity" 
              icon={CheckCircle} 
              data={statMetrics.resolved}
            />
            <StatCard 
              title="Active Cases" 
              value={activeCasesCount} 
              change={statChanges.active} 
              subtitle="currently open" 
              icon={Activity} 
              data={statMetrics.active}
            />
            <StatCard 
              title="Critical Alerts" 
              value={urgentCasesCount} 
              change={statChanges.urgent} 
              subtitle="urgent priority" 
              icon={Radio} 
              data={statMetrics.urgent}
            />
          </motion.div>

          {/* Row 2: MAIN CHART + PRAD ENGINE */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col">
              <OverviewChart issues={activeIssuesList} />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              <AIInsightCard issues={activeIssuesList} />
              <div className="flex-1 min-h-[250px]">
                <PradEngine issues={activeIssuesList} />
              </div>
            </div>
          </motion.div>

          {/* Row 3: DATA TABLE + LIVE MAP */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col min-h-[400px]">
              <RecentIssuesTable issues={activeIssuesList} />
            </div>
            <div className="lg:col-span-4">
               <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full min-h-[400px] flex flex-col" data-tutorial="live-map">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> Live Field Map</h3>
                   <button onClick={() => navigate('/map')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95">Expand ↗</button>
                 </div>
                 <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-50 relative">
                   {mountMap ? (
                     <RealMapView
                       onIssueSelect={setSelectedIssue}
                       selectedIssueId={selectedIssue?.id}
                       userLocation={userLocation || undefined}
                     />
                   ) : (
                     <div className="text-center">
                       <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                       <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Loading Map Engine</p>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Modals */}
      <IssueDetail
        issue={selectedIssue}
        open={!!selectedIssue}
        onOpenChange={(open) => !open && setSelectedIssue(null)}
        onUpvote={upvoteIssue}
        onFlag={flagIssue}
      />
      <FilterDrawer
        filters={filters}
        onFiltersChange={updateFilters}
        totalIssues={issues.length}
        open={showFilters}
        onOpenChange={setShowFilters}
      />
      <EnhancedReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
};