import React from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export const Leaderboard: React.FC = () => {
  const { users: leaderboard, loading, error } = useLeaderboard();

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#1E40AF] mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title="Error Loading Leaderboard"
          description={error}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-amber-500" />;
      case 2: return <Medal className="w-5 h-5 text-slate-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-4 h-4 text-slate-300" />;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-amber-50 to-white border-amber-200 shadow-sm';
      case 2: return 'bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-sm';
      case 3: return 'bg-gradient-to-r from-orange-50 to-white border-orange-200 shadow-sm';
      default: return 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]';
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          icon={<Trophy className="h-5 w-5" />}
          title="Civic Heroes"
          description="Top contributors making a measurable difference in city response."
        />

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard && leaderboard.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "rounded-[1.25rem] p-5 flex items-center justify-between border shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5",
                getRankBg(index + 1)
              )}
            >
              <div className="flex items-center gap-5">
                {/* Rank */}
                <div className={cn(
                  "w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg",
                  index < 3
                    ? "bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100/50"
                    : "bg-slate-50 text-slate-500 border border-slate-100/50"
                )}>
                  {index < 3 ? getRankIcon(index + 1) : index + 1}
                </div>
                {/* Name */}
                <div>
                  <h3 className="text-[17px] font-black tracking-tight text-slate-900 mb-0.5">{user.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <p className="text-[13px] font-bold text-slate-500 leading-none">{user.verifiedPercentage}% Verified</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center hidden sm:block">
                  <div className="text-[22px] font-black tracking-tighter text-slate-900 leading-none">{user.resolvedCount}</div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mt-1">Resolved</div>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-[22px] font-black tracking-tighter text-slate-900 leading-none">{user.reportsCount}</div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mt-1">Reports</div>
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black tracking-wider px-3 py-1 shadow-sm">
                  #{user.rank}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboard && leaderboard.length === 0 && (
          <EmptyState
            icon={<Trophy className="w-12 h-12" />}
            title="No Heroes Yet"
            description="Be the first contributor to resolve an issue."
          />
        )}
      </div>
    </div>
  );
};
