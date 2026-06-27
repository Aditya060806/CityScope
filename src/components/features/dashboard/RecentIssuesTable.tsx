import React, { useState } from 'react';
import { Issue } from '@/types/civic';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecentIssuesTableProps {
  issues: Issue[];
}

export const RecentIssuesTable: React.FC<RecentIssuesTableProps> = ({ issues }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = issues.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col w-full overflow-hidden shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Reports</h3>
          <p className="text-sm text-slate-500 mt-1">Track and manage citizen-reported anomalies.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
            <Calendar className="h-4 w-4" /> Date Filter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Reporter</th>
              <th className="pb-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Issue Title</th>
              <th className="pb-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Location</th>
              <th className="pb-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest relative -left-1.5">Priority</th>
              <th className="pb-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="pb-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right">Date Reported</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.slice(0, 8).map((issue) => (
              <tr key={issue.id} className="hover:bg-slate-50 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer relative z-0 hover:z-10 group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${issue.reporterId}`} 
                      className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 shrink-0" 
                      alt="avatar" 
                    />
                    <span className="text-[13px] font-bold text-slate-900 truncate max-w-[120px]">{issue.reporterName || `Citizen ${issue.reporterId?.substring(0,4) || 'Anon'}`}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-[13px] font-bold text-slate-700 truncate block max-w-[200px]" title={issue.title}>{issue.title}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-[13px] font-medium text-slate-500 truncate block max-w-[180px]">{issue.location?.address || 'Unknown Location'}</span>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 border-0 rounded-md ${
                    issue.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                    issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    issue.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {issue.priority}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      issue.status === 'resolved' ? 'bg-emerald-500' :
                      issue.status === 'in-progress' ? 'bg-indigo-500' :
                      'bg-slate-300'
                    }`} />
                    <span className="text-[13px] font-semibold text-slate-600 capitalize">{issue.status.replace('-', ' ')}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-[12px] font-semibold text-slate-500">
                    {new Date(issue.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in relative z-10">
            <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mb-4 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05)] animate-float">
               <Search className="w-7 h-7 text-slate-300" />
            </div>
            <h4 className="text-[14px] font-bold text-slate-900 mb-1 tracking-tight">No anomalies found</h4>
            <p className="text-[13px] font-medium text-slate-500 max-w-[200px]">
              We couldn't find any issues matching "{searchTerm}".
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1 shrink-0">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[13px] transition-colors">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600 font-bold text-[13px] transition-colors">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600 font-bold text-[13px] transition-colors">3</button>
          <span className="px-1 text-slate-400">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="text-[12px] font-semibold text-slate-400 flex items-center gap-4 shrink-0">
          <span>Showing 1 to {Math.min(filtered.length, 8)} of {filtered.length} entries</span>
          <button className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Show All →</button>
        </div>
      </div>
    </div>
  );
};
