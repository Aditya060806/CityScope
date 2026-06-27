import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, MoreHorizontal } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  subtitle: string;
  icon?: LucideIcon;
  data?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, subtitle, data }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white border border-slate-200/60 rounded-[1.25rem] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col min-h-[148px] w-full group">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10 w-full">
        <p className="text-[13px] font-medium text-slate-500 tracking-wide">{title}</p>
        <MoreHorizontal className="w-4 h-4 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Value */}
      <div className="relative z-10 mb-2">
        <h3 className="text-[36px] font-black tracking-tighter text-slate-900 leading-none">{value}</h3>
      </div>
      
      {/* Full bleed bottom chart */}
      {data && data.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-[105px] pointer-events-none opacity-[0.85] overflow-visible rounded-b-[1.25rem]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart data={data.map((d, i) => ({ val: d, index: i }))} margin={{ top: 5, right: -5, left: -5, bottom: 0 }}>
              <defs>
                <filter id={`shadow-${title.replace(/\s+/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor={isPositive ? "#10b981" : "#f43f5e"} floodOpacity="0.25" />
                </filter>
              </defs>
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke={isPositive ? "#34d399" : "#fb7185"} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={true} 
                style={{ filter: `url(#shadow-${title.replace(/\s+/g, '')})` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-end justify-between pt-6 relative z-10 w-full mb-0.5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">{subtitle}</p>
        <div className={cn(
          "flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] tracking-wide relative z-20 mix-blend-multiply",
          isPositive ? "text-emerald-700 bg-emerald-500/10" : "text-rose-700 bg-rose-500/10"
        )}>
          {isPositive ? '↗' : '↘'} {Math.abs(change)}%
        </div>
      </div>
    </div>
  );
};
