import React, { useState, useEffect } from 'react';
import { HeroSection } from '@/components/civic/HeroSection';
import { MapViewEnhanced } from '@/components/civic/MapViewEnhanced';
import { ReportModalEnhanced } from '@/components/civic/ReportModalEnhanced';
import { FilterDrawer } from '@/components/civic/FilterDrawer';
import { LeaderboardCard } from '@/components/civic/LeaderboardCard';
import { OfflineStatusBanner } from '@/components/civic/OfflineStatusBanner';
import { SmartSuggestionBanner } from '@/components/civic/SmartSuggestionBanner';
import { StatsGrid } from '@/components/civic/StatsGrid';
import { ConfettiCelebration } from '@/components/civic/ConfettiCelebration';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationProvider } from '@/contexts/LocationContext';
import { Toaster } from '@/components/ui/toaster';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useSmartCategorizer } from '@/hooks/useSmartCategorizer';
import { IssueCategory, IssueStatus, FilterOptions } from '@/types/civic';
import { MapPin, Filter, Users, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'map' | 'stats' | 'community'>('map');
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: ['reported', 'verified', 'in_progress'],
    categories: ['roads', 'lighting', 'water', 'cleanliness', 'safety', 'obstructions'],
    distance: 5,
    sortBy: 'recent',
    mapView: 'pins',
    mapStyle: 'default'
  });

  const { issues, loading: issuesLoading, reportIssue, upvoteIssue } = useCivicIssues();
  const { 
    users: leaderboardUsers, 
    loading: leaderboardLoading, 
    timeframe, 
    updateTimeframe,
    getCurrentUser,
    triggerRankUpCelebration,
    showConfetti
  } = useLeaderboard();
  
  const { isOnline, cachedIssues, cachedItemsCount } = useOfflineCache();
  const { 
    suggestion, 
    isAnalyzing, 
    isVisible: showSmartSuggestion,
    analyzeImageForCategory,
    acceptSuggestion,
    rejectSuggestion
  } = useSmartCategorizer();

  // Filter issues based on current filters
  const filteredIssues = issues.filter(issue => {
    const statusMatch = filters.status.includes(issue.status);
    const categoryMatch = filters.categories.includes(issue.category);
    const distanceMatch = !issue.distance || issue.distance <= filters.distance;
    
    return statusMatch && categoryMatch && distanceMatch;
  });

  // Sort issues based on filter preference
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    switch (filters.sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'upvotes':
        return b.upvotes - a.upvotes;
      case 'recent':
      default:
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    }
  });

  const stats = {
    total: issues.length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    recent: issues.filter(i => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(i.reportedAt) > weekAgo;
    }).length
  };

  const handleReportSubmit = async (reportData: any) => {
    try {
      await reportIssue(reportData);
      setShowReportModal(false);
      
      // Trigger celebration if this unlocks a new rank
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.reportsCount > 0 && currentUser.reportsCount % 5 === 0) {
        triggerRankUpCelebration();
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const handleGetStarted = () => {
    setShowReportModal(true);
  };

  const currentUser = getCurrentUser();

  return (
    <LocationProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        {/* Navigation */}
        <NavigationBar
          activeTab={selectedTab}
          onTabChange={(tab: string) => setSelectedTab(tab as 'map' | 'stats' | 'community')}
          onReportClick={() => setShowReportModal(true)}
          onFilterClick={() => setShowFilterDrawer(true)}
        />

        {/* Offline Status Banner */}
        {!isOnline && (
          <OfflineStatusBanner 
            isOnline={isOnline}
            cachedItemsCount={cachedItemsCount}
          />
        )}

        {/* Smart Suggestion Banner */}
        {showSmartSuggestion && suggestion && (
          <SmartSuggestionBanner 
            suggestion={suggestion}
            isVisible={showSmartSuggestion}
            onAccept={acceptSuggestion}
            onReject={rejectSuggestion}
          />
        )}

        {/* Main Content */}
        <div className="relative">
          {/* Hero Section */}
          <HeroSection 
            totalIssues={stats.total}
            resolvedIssues={stats.resolved}
            onGetStarted={handleGetStarted}
            className="relative z-10"
          />

          {/* Main App Interface */}
          <div className="container mx-auto px-4 -mt-20 relative z-20">
            <div className="glass-card border-powder/30 rounded-3xl overflow-hidden shadow-float">
              
              {/* Tab Navigation */}
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="w-full">
                <div className="bg-bone/50 border-b border-powder/30 p-4">
                  <TabsList className="grid w-full grid-cols-3 bg-white/80 rounded-2xl p-1 shadow-sm">
                    <TabsTrigger 
                      value="map" 
                      className="rounded-xl data-[state=active]:bg-royal data-[state=active]:text-white font-semibold transition-all duration-300"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Map View
                    </TabsTrigger>
                    <TabsTrigger 
                      value="stats" 
                      className="rounded-xl data-[state=active]:bg-royal data-[state=active]:text-white font-semibold transition-all duration-300"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="community" 
                      className="rounded-xl data-[state=active]:bg-royal data-[state=active]:text-white font-semibold transition-all duration-300"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Community
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Map View Tab */}
                <TabsContent value="map" className="m-0 p-0">
                  <div className="relative">
                    {/* Quick Actions Bar */}
                    <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowFilterDrawer(true)}
                          variant="secondary"
                          size="sm"
                          className="glass-card bg-white/90 hover:bg-white shadow-md border-0 rounded-xl"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filters
                        </Button>
                        
                        <Button
                          onClick={() => setShowReportModal(true)}
                          className="bg-royal hover:bg-royal/90 text-white shadow-royal rounded-xl"
                          size="sm"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Quick Report
                        </Button>
                      </div>

                      {/* Issue Counter */}
                      <div className="glass-card bg-white/90 px-3 py-1 rounded-xl border-0 shadow-md">
                        <span className="text-sm font-semibold text-royal">
                          {sortedIssues.length} Issues
                        </span>
                      </div>
                    </div>

                    {/* Map Component */}
                    <div className="h-[600px] relative">
                      <MapViewEnhanced 
                        issues={sortedIssues}
                        mapView={filters.mapView}
                        mapStyle={filters.mapStyle}
                        onMapViewChange={(view) => setFilters(prev => ({ ...prev, mapView: view }))}
                        onMapStyleChange={(style) => setFilters(prev => ({ ...prev, mapStyle: style }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="stats" className="m-0 p-6">
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-royal mb-2">Civic Impact Analytics</h2>
                      <p className="text-muted-foreground">Track community engagement and resolution progress</p>
                    </div>
                    
                    <StatsGrid 
                      stats={[
                        { title: 'Total Issues', value: stats.total.toString(), icon: TrendingUp, color: 'text-royal' },
                        { title: 'Resolved', value: stats.resolved.toString(), icon: Users, color: 'text-green-500' },
                        { title: 'In Progress', value: stats.inProgress.toString(), icon: Zap, color: 'text-yellow-500' },
                        { title: 'This Week', value: stats.recent.toString(), icon: MapPin, color: 'text-blue-500' }
                      ]}
                    />
                  </div>
                </TabsContent>

                {/* Community Tab */}
                <TabsContent value="community" className="m-0 p-6">
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-royal mb-2">Community Leaderboard</h2>
                      <p className="text-muted-foreground">Celebrate our top civic champions</p>
                    </div>
                    
                    <LeaderboardCard 
                      users={leaderboardUsers}
                      timeframe={timeframe}
                      onTimeframeChange={updateTimeframe}
                      currentUser={currentUser}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Footer spacing */}
          <div className="h-20" />
        </div>

        {/* Modals */}
        <ReportModalEnhanced 
          open={showReportModal}
          onOpenChange={setShowReportModal}
          onSubmit={handleReportSubmit}
        />

        <FilterDrawer 
          open={showFilterDrawer}
          onOpenChange={setShowFilterDrawer}
          filters={filters}
          onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          totalIssues={sortedIssues.length}
        />

        {/* Confetti Celebration */}
        <ConfettiCelebration show={showConfetti} />
        
        {/* Toast Notifications */}
        <Toaster />
      </div>
    </LocationProvider>
  );
};

export default Index;
