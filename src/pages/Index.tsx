import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/civic/HeroSection';
import { RealMapView } from '@/components/civic/RealMapView';
import { ReportModalEnhanced } from '@/components/civic/ReportModalEnhanced';
import { LeaderboardCard } from '@/components/civic/LeaderboardCard';
import { StatsGrid } from '@/components/civic/StatsGrid';
import { ConfettiCelebration } from '@/components/civic/ConfettiCelebration';
import { Button } from '@/components/ui/button';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSmartCategorizer } from '@/hooks/useSmartCategorizer';
import { ArrowRight, MapPin, Zap, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  
  const { issues, reportIssue } = useCivicIssues();
  const { users: leaderboardUsers, timeframe, updateTimeframe, getCurrentUser, triggerRankUpCelebration, showConfetti } = useLeaderboard();
  const { suggestion } = useSmartCategorizer();
  const showSmartSuggestion = !!suggestion;

  const currentUser = getCurrentUser();

  const stats = {
    total: issues.length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    recent: issues.filter(i => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(i.createdAt) > weekAgo;
    }).length
  };

  const handleReportSubmit = async (reportData: Record<string, unknown>) => {
    try {
      await reportIssue(reportData);
      setShowReportModal(false);
      if (currentUser && currentUser.reportsCount > 0 && currentUser.reportsCount % 5 === 0) {
        triggerRankUpCelebration();
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
      
      {/* Top Greeting & Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 pt-4 md:pt-8"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B1121] tracking-tight">
            Welcome back{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
            Here's what's happening in your city today.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setShowReportModal(true)}
            className="flex-1 md:flex-none clay-btn-primary bg-[#0070F3] hover:bg-[#005bb5] text-white h-12 px-6 rounded-xl border flex items-center justify-center gap-2 shadow-clay-md"
          >
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            Quick Report
          </Button>
        </div>
      </motion.div>

      {/* Main Bento Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Quick Stats Banner (Span full on mobile, span 8 on desktop) */}
        <motion.div variants={itemVariants} className="md:col-span-8 clay-card p-6 overflow-hidden relative group cursor-pointer" onClick={() => navigate('/analytics')}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mx-20 -my-20 opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#0B1121]">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Civic Impact Overview
            </h2>
            <Button variant="ghost" className="text-blue-600 hover:bg-blue-50/50 rounded-lg p-2 h-auto">
              View Analytics <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <StatsGrid 
            stats={[
              { title: 'Total Issues', value: stats.total.toString(), icon: Zap, color: 'text-[#0B1121]' },
              { title: 'Resolved', value: stats.resolved.toString(), icon: TrendingUp, color: 'text-emerald-600' },
              { title: 'In Progress', value: stats.inProgress.toString(), icon: MapPin, color: 'text-blue-600' },
              { title: 'This Week', value: stats.recent.toString(), icon: Users, color: 'text-purple-600' }
            ]}
          />
        </motion.div>

        {/* Action / AI Widget (Span 4 on desktop) */}
        <motion.div variants={itemVariants} className="md:col-span-4 clay-card p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-50 rounded-full blur-2xl opacity-60"></div>
          <div>
             <h2 className="text-lg font-bold text-[#0B1121] mb-2">Smart Detection</h2>
             <p className="text-sm text-slate-500 font-medium mb-4">
               {showSmartSuggestion 
                 ? "AI has detected anomalies near you." 
                 : "AI civic monitoring is active. No immediate hazards detected locally."}
             </p>
          </div>
          <div className="mt-auto">
             <Button onClick={() => setShowReportModal(true)} className="w-full bg-[#0B1121] hover:bg-[#151f38] text-white shadow-clay-sm h-12 rounded-xl transition-transform hover:-translate-y-0.5">
               Start Smart Report
             </Button>
          </div>
        </motion.div>

        {/* Live Map Preview (Span 8) */}
        <motion.div variants={itemVariants} className="md:col-span-8 h-[400px] clay-card p-2 relative group overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-clay-sm border border-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-sm text-slate-800">Live City Map</span>
          </div>
          <Button 
            onClick={() => navigate('/map')}
            className="absolute bottom-6 right-6 z-20 bg-white text-blue-600 shadow-clay-md hover:shadow-clay-lg rounded-xl transition-all hover:bg-slate-50 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
          >
            Expand Map <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <div className="w-full h-full rounded-2xl overflow-hidden relative pointer-events-none">
            {/* Overlay to prevent accidental scrolling on dashboard while scrolling down page */}
            <div className="absolute inset-0 bg-transparent z-10 transition-colors group-hover:bg-slate-900/5"></div>
            <RealMapView />
          </div>
        </motion.div>

        {/* Leaderboard Preview (Span 4) */}
        <motion.div variants={itemVariants} className="md:col-span-4 clay-card p-6 flex flex-col relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#0B1121]">
              <Users className="w-5 h-5 text-amber-500" /> Top Heroes
            </h2>
            <Button onClick={() => navigate('/heroes')} variant="ghost" className="text-amber-600 hover:bg-amber-50/50 rounded-lg p-2 h-auto text-xs">
              View All
            </Button>
          </div>
          <div className="flex-1 overflow-hidden pointer-events-none opacity-90 scale-95 origin-top">
            <LeaderboardCard
              users={leaderboardUsers.slice(0, 3)}
              timeframe={timeframe}
              onTimeframeChange={updateTimeframe}
              currentUser={currentUser}
            />
          </div>
        </motion.div>

      </motion.div>

      <ReportModalEnhanced open={showReportModal} onOpenChange={setShowReportModal} onSubmit={handleReportSubmit} />
      <ConfettiCelebration trigger={showConfetti} />
    </div>
  );
};

