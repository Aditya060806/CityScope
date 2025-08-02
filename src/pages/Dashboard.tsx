import React, { useState, useEffect } from 'react';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { IssueCardEnhanced } from '@/components/civic/IssueCardEnhanced';
import { HeroSection } from '@/components/civic/HeroSection';
import { StatsGrid } from '@/components/civic/StatsGrid';
import { MapViewEnhanced } from '@/components/civic/MapViewEnhanced';
import { LoadingState } from '@/components/civic/LoadingStates';
import { NoIssuesFound, ErrorState } from '@/components/civic/EmptyStates';
import { IssueDetail } from '@/components/civic/IssueDetail';
import { FilterDrawer } from '@/components/civic/FilterDrawer';
import { ReportModalEnhanced } from '@/components/civic/ReportModalEnhanced';
import { EnhancedReportModal } from '@/components/civic/EnhancedReportModal';
import { LocalHeroesTab } from '@/components/civic/LocalHeroesTab';
import { AccessibilityProvider } from '@/components/civic/AccessibilityEnhancements';
import { LocationPrompt } from '@/components/civic/LocationPrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { useLocation } from '@/contexts/LocationContext';
import { CivicIssue, CATEGORY_CONFIG } from '@/types/civic';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { OfflineStatusBanner } from '@/components/civic/OfflineStatusBanner';
import { LeaderboardCard } from '@/components/civic/LeaderboardCard';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useLeaderboard } from '@/hooks/useLeaderboard';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingReportRequest, setPendingReportRequest] = useState(false);
  
  
  const { userLocation, isLocationEnabled, error: locationError, isLoading: locationLoading, requestLocation } = useLocation();
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
  
  const {
    isOnline,
    isReconnecting,
    cachedIssues,
    cacheIssues,
    retryConnection,
    cachedItemsCount
  } = useOfflineCache();
  
  const {
    users: leaderboardUsers,
    loading: leaderboardLoading,
    timeframe,
    updateTimeframe,
    getCurrentUser
  } = useLeaderboard();

  // All hooks are called first, then conditional returns

  const statsCards = [
    {
      title: 'Total Issues',
      value: totalIssues.toString(),
      icon: AlertTriangle,
      color: 'text-primary'
    },
    {
      title: 'Resolved',
      value: issues.filter(i => i.status === 'resolved').length.toString(),
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      title: 'In Progress',
      value: issues.filter(i => i.status === 'in_progress').length.toString(),
      icon: TrendingUp,
      color: 'text-warning'
    },
    {
      title: 'Your Area',
      value: userLocation ? '5km radius' : 'Unknown',
      icon: MapPin,
      color: 'text-accent'
    }
  ];

  const handleReportClick = () => {
    if (!isLocationEnabled) {
      // Request location before opening report modal
      setPendingReportRequest(true);
      requestLocation();
      return;
    }
    setShowReportModal(true);
  };

  // Open report modal once location is granted
  useEffect(() => {
    if (pendingReportRequest && isLocationEnabled) {
      setShowReportModal(true);
      setPendingReportRequest(false);
    }
  }, [pendingReportRequest, isLocationEnabled]);

  const handleReportSubmit = async (issueData: any) => {
    await reportIssue(issueData);
  };

  // Show location prompt if location is being requested
  if (locationLoading && !isLocationEnabled) {
    return <LocationPrompt />;
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Location Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              {locationError}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-gradient-hero">
      <NavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReportClick={handleReportClick}
        onFilterClick={() => setShowFilters(true)}
        pendingReports={issues.filter(i => i.status === 'reported').length}
      />

      <main className="container mx-auto px-3 sm:px-4 pb-20 sm:pb-24 pt-4 sm:pt-6">
        {/* Offline Status Banner */}
        {!isOnline && (
          <div className="mb-4">
            <OfflineStatusBanner
              isOnline={isOnline}
              isReconnecting={isReconnecting}
              onRetry={retryConnection}
              cachedItemsCount={cachedItemsCount}
            />
          </div>
        )}
        
        {isOnline && isReconnecting && (
          <div className="mb-4">
            <OfflineStatusBanner
              isOnline={true}
              isReconnecting={false}
            />
          </div>
        )}

        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Enhanced Hero Section */}
            <HeroSection
              totalIssues={totalIssues}
              resolvedIssues={issues.filter(i => i.status === 'resolved').length}
              onGetStarted={handleReportClick}
              className="animate-fade-in"
            />

            {/* Stats Grid */}
            <StatsGrid 
              stats={statsCards}
              className="animate-slide-up"
            />

            {/* Issues List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-civic bg-clip-text text-transparent">
                  Recent Issues
                </h2>
              </div>

              {loading ? (
                <LoadingState type="issues" count={3} />
              ) : error ? (
                <ErrorState onRetry={() => window.location.reload()} message={error} />
              ) : issues.length === 0 ? (
                <NoIssuesFound onReport={handleReportClick} />
              ) : (
                  <div className="space-y-4">
                   {(isOnline ? issues : cachedIssues).map((issue, index) => (
                     <IssueCardEnhanced
                       key={issue.id}
                       issue={issue}
                       onUpvote={upvoteIssue}
                       onFlag={flagIssue}
                       onClick={setSelectedIssue}
                       className={`animate-slide-up ${!isOnline ? 'opacity-75' : ''}`}
                       isOffline={!isOnline}
                     />
                   ))}
                 </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="animate-fade-in">
            {loading ? (
              <LoadingState type="map" />
            ) : (
              <MapViewEnhanced
                issues={isOnline ? issues : cachedIssues}
                onIssueSelect={setSelectedIssue}
                onFilterToggle={() => setShowFilters(true)}
                mapView={filters.mapView}
                mapStyle={filters.mapStyle}
                onMapViewChange={(view) => updateFilters({ mapView: view })}
                onMapStyleChange={(style) => updateFilters({ mapStyle: style })}
              />
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-fade-in">
            {leaderboardLoading ? (
              <LoadingState type="issues" count={5} />
            ) : (
              <LocalHeroesTab
                users={leaderboardUsers}
                timeframe={timeframe}
                onTimeframeChange={updateTimeframe}
                currentUser={getCurrentUser()}
                loading={leaderboardLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Your Civic Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {issues.filter(i => i.reportedBy !== 'anonymous').length}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Issues Reported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-success">
                      {issues.filter(i => i.status === 'resolved' && i.reportedBy !== 'anonymous').length}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Issues Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Most Reported Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                    const count = issues.filter(i => i.category === category).length;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Modals and Drawers */}
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
    </AccessibilityProvider>
  );
};