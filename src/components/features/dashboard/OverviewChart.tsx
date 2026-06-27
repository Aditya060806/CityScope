import React, { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Issue } from '@/types/civic';

interface OverviewChartProps {
  issues?: Issue[];
}

export const OverviewChart: React.FC<OverviewChartProps> = ({ issues = [] }) => {
  const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Yearly');

  const chartData = useMemo(() => {
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

    const rangeFilter = (date: Date, start: Date, end: Date) => (
      date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
    );

    if (timeframe === 'Weekly') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        
        const dayIssues = issues.filter(issue => {
          const issueDate = toDate(issue.createdAt);
          return isSameDay(issueDate, d);
        });
        
        const resolved = issues.filter(issue => {
          if (issue.status !== 'resolved') return false;
          const resolveDate = issue.resolvedAt ? toDate(issue.resolvedAt) : toDate(issue.createdAt);
          return isSameDay(resolveDate, d);
        });

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        return {
          name: dayName,
          reports: dayIssues.length,
          resolved: resolved.length
        };
      });
    } else if (timeframe === 'Monthly') {
      return Array.from({ length: 8 }, (_, i) => {
        const weeksAgo = 7 - i;
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (weeksAgo * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekIssues = issues.filter(issue => {
          const d = toDate(issue.createdAt);
          return rangeFilter(d, weekStart, weekEnd);
        });
        
        const resolved = issues.filter(issue => {
          if (issue.status !== 'resolved') return false;
          const d = issue.resolvedAt ? toDate(issue.resolvedAt) : toDate(issue.createdAt);
          return rangeFilter(d, weekStart, weekEnd);
        });

        const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        return {
          name: label,
          reports: weekIssues.length,
          resolved: resolved.length
        };
      });
    } else {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today);
        d.setMonth(d.getMonth() - (11 - i));
        
        const monthIssues = issues.filter(issue => {
          const issueDate = toDate(issue.createdAt);
          return issueDate.getMonth() === d.getMonth() && issueDate.getFullYear() === d.getFullYear();
        });
        
        const resolved = issues.filter(issue => {
          if (issue.status !== 'resolved') return false;
          const resolveDate = issue.resolvedAt ? toDate(issue.resolvedAt) : toDate(issue.createdAt);
          return resolveDate.getMonth() === d.getMonth() && resolveDate.getFullYear() === d.getFullYear();
        });

        const monthName = d.toLocaleDateString('en-US', { month: 'short' });

        return {
          name: monthName,
          reports: monthIssues.length,
          resolved: resolved.length
        };
      });
    }
  }, [issues, timeframe]);

  const hasRealData = useMemo(() => {
    return chartData.some((item) => item.reports > 0 || item.resolved > 0);
  }, [chartData]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] w-full h-full min-h-[420px] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Project Overview</h3>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">Real-time tracking of civic reports and resolution velocity.</p>
        </div>
        <div className="flex bg-slate-50/80 border border-slate-100/50 rounded-lg p-1 shrink-0">
          {(['Weekly', 'Monthly', 'Yearly'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${timeframe === tf ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={12} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dx={-10} tickCount={5} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 700 }}
              labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}
            />
            <Area type="linear" dataKey="reports" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReports)" name="Reports" activeDot={{r: 6, strokeWidth: 0, fill: '#f97316'}} />
            <Area type="linear" dataKey="resolved" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" activeDot={{r: 6, strokeWidth: 0, fill: '#4f46e5'}} />
          </AreaChart>
        </ResponsiveContainer>

        {!hasRealData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-500 backdrop-blur-sm">
              No report activity yet for selected timeframe.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
