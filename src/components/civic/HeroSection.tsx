import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, Users, TrendingUp } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  totalIssues: number;
  resolvedIssues: number;
  onGetStarted?: () => void;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalIssues,
  resolvedIssues,
  onGetStarted,
  className
}) => {
  const { userLocation } = useLocation();

  const impactStats = [
    {
      value: totalIssues.toString(),
      label: 'Issues Tracked',
      icon: TrendingUp,
      color: 'text-primary'
    },
    {
      value: resolvedIssues.toString(),
      label: 'Resolved',
      icon: Sparkles,
      color: 'text-secondary'
    },
    {
      value: '24h',
      label: 'Avg Response',
      icon: Users,
      color: 'text-accent'
    }
  ];

  return (
    <div className={cn('relative min-h-[500px] sm:min-h-[600px] lg:min-h-[750px] flex flex-col justify-center overflow-hidden border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950', className)}>
      {/* Ultra-premium subtle mesh background (instead of solid block) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-sky-100/40 dark:bg-sky-900/20 rounded-full blur-[100px] opacity-60 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-blue-50/50 dark:bg-blue-900/20 rounded-full blur-[100px] opacity-60 mix-blend-multiply dark:mix-blend-screen" />
        {/* Subtle grid pattern for structure */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGVsbGlwc2UgY3g9IjEiIGN5PSIxIiByeD0iMSIgcnk9IjEiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGVsbGlwc2UgY3g9IjEiIGN5PSIxIiByeD0iMSIgcnk9IjEiIGZpbGw9IiMzMzQxNTUiLz48L3N2Zz4=')] bg-[length:40px_40px] opacity-50 dark:opacity-20" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-10 text-center lg:text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-gray-200 dark:border-slate-800 shadow-sm animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-royal dark:bg-royal-400 animate-pulse"></span>
              <span className="font-semibold text-xs tracking-wide uppercase text-gray-600 dark:text-gray-400">Smart City Infrastructure</span>
            </div>

            {/* Headlines */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                Report. Resolve. <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal dark:from-royal-400 to-sky-600 dark:to-sky-400">
                  Rise Together.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                Your comprehensive view into city health. Report civic issues instantly, track real-time progress, and build stronger communities through hyperlocal engagement.
              </p>
            </div>

            {/* Actions & Location */}
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {onGetStarted && (
                <Button
                  onClick={onGetStarted}
                  className="bg-royal dark:bg-royal-600 hover:bg-slate-900 dark:hover:bg-slate-800 text-white active:scale-[0.98] transition-all duration-300 font-semibold text-base px-8 py-6 rounded-xl shadow-lg shadow-royal/20 group w-full sm:w-auto"
                >
                  <MapPin className="w-5 h-5 mr-3 group-hover:-translate-y-0.5 transition-transform" />
                  Start Reporting Now
                </Button>
              )}

              {userLocation && (
                <div className="inline-flex items-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm w-full sm:w-auto justify-center">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Region</span>
                    <span className="font-semibold truncate max-w-[140px] text-sm text-slate-800 dark:text-slate-200">
                      {userLocation.address.split(',')[0]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Stats Column */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-royal/5 dark:from-royal/20 to-sky-100/20 dark:to-sky-900/20 rounded-[2.5rem] transform rotate-3 scale-105 -z-10 transition-transform duration-500 hover:rotate-6"></div>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
              {/* Decorative glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent pointer-events-none" />

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
                <TrendingUp className="w-5 h-5 text-royal dark:text-royal-400" />
                Live Platform Impact
              </h3>

              <div className="space-y-6 relative z-10">
                {impactStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:scale-110 transition-all duration-300 shadow-sm border border-gray-100 dark:border-slate-800", stat.color.replace('text-', 'text-'))}>
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};