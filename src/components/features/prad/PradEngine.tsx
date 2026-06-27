import React, { useMemo } from 'react';
import { Activity, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePradLiveSeries } from '@/hooks/usePradLiveSeries';
import { Issue } from '@/types/civic';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PradEngineProps {
  issues?: Issue[];
}

export const PradEngine: React.FC<PradEngineProps> = ({ issues = [] }) => {
  const {
    points,
    loading,
    latestAnomaly,
  } = usePradLiveSeries({
    source: 'app',
    intervalMinutes: 10,
    bootstrapLimit: 96,
    maxPoints: 48,
    enabled: true,
  });

  const liveTotals = useMemo(() => {
    return points.reduce(
      (acc, point) => {
        acc.total += point.total;
        acc.pothole += point.pothole;
        acc.roughRoad += point.roughRoad;
        return acc;
      },
      { total: 0, pothole: 0, roughRoad: 0 }
    );
  }, [points]);

  const recentAnomalies = issues
    .filter(i => i.priority === 'urgent' || i.priority === 'high')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <h3 className="text-[15px] font-extrabold text-slate-800">PRAD Engine Active</h3>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50/50 border-indigo-200/60 px-2 py-0.5 tracking-wider rounded-md">
          Live Sensor Feed
        </Badge>
      </div>

      {/* Hero Horizontal Beam */}
      <div className="w-full h-[1.5px] bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-300 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)] mb-6 opacity-80" />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-[9px] uppercase tracking-wide text-slate-500 font-semibold">Window Events</p>
          <p className="text-sm font-bold text-slate-800">{liveTotals.total}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/70 p-2.5">
          <p className="text-[9px] uppercase tracking-wide text-red-500 font-semibold">Potholes</p>
          <p className="text-sm font-bold text-red-700">{liveTotals.pothole}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-2.5">
          <p className="text-[9px] uppercase tracking-wide text-amber-600 font-semibold">Rough Roads</p>
          <p className="text-sm font-bold text-amber-700">{liveTotals.roughRoad}</p>
        </div>
      </div>

      <div className="h-44 rounded-xl border border-slate-200 bg-slate-50/40 p-2 mb-5">
        {loading ? (
          <div className="w-full h-full animate-pulse rounded-lg bg-slate-100" />
        ) : points.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-center">
            <p className="text-[11px] text-slate-500 font-medium">Waiting for app detections...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: '#cbd5e1',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.15)',
                }}
              />
              <Line
                type="monotone"
                dataKey="pothole"
                name="Pothole"
                stroke="#e11d48"
                strokeWidth={2.4}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="roughRoad"
                name="Rough Road"
                stroke="#f59e0b"
                strokeWidth={2.4}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {latestAnomaly && (
        <p className="text-[10px] text-slate-500 mb-4">
          Latest: {latestAnomaly.anomalyType.replace('_', ' ')} at {new Date(latestAnomaly.createdAt).toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-3 flex-1 overflow-auto no-scrollbar">
        <p className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest mb-3 pl-1">Escalated Civic Issues</p>
        
        {recentAnomalies.length > 0 ? recentAnomalies.map(a => (
          <div key={a.id} className="flex justify-between items-center p-3.5 bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-full shrink-0 ${a.priority === 'urgent' ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}>
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-slate-900 transition-colors">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <p className="text-[12px] font-bold truncate tracking-tight">{a.location?.address || 'Unknown'}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium pl-4.5">
                  {new Date(a.createdAt || 0).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                </p>
              </div>
            </div>
            <div className={`shrink-0 text-[9px] font-extrabold px-2 py-1 rounded-[4px] tracking-wide ml-3 ${a.priority === 'urgent' ? 'bg-rose-50 text-rose-500 border border-rose-100/50' : 'bg-orange-50 text-orange-500 border border-orange-100/50'}`}>
              {a.priority.toUpperCase()}
            </div>
          </div>
        )) : (
           <div className="flex items-center justify-center py-10 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
            <p className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4" /> No Active Anomalies Detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
