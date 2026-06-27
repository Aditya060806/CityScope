import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Navigation,
  Gauge,
  BarChart3,
  Route,
  CheckCircle,
  XCircle,
  Timer,
  WifiOff,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import { usePradLiveSeries } from '@/hooks/usePradLiveSeries';
import { RoadHealthIndex } from './RoadHealthIndex';
import {
  AnomalyCluster,
  Trip,
  PRADStats,
  ANOMALY_TYPE_CONFIG,
  ANOMALY_SEVERITY_CONFIG,
} from '@/types/road-anomaly';
import { motion } from 'framer-motion';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AnomalyDashboardProps {
  userId?: string;
  className?: string;
}

export const AnomalyDashboard: React.FC<AnomalyDashboardProps> = ({ userId, className }) => {
  const [stats, setStats] = useState<PRADStats | null>(null);
  const [clusters, setClusters] = useState<AnomalyCluster[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  // Ticker so "Updated Xs ago" counts down live between polls
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const {
    points: liveSeries,
    loading: liveSeriesLoading,
    latestAnomaly,
    isRefreshing: liveSeriesRefreshing,
    lastRefreshed,
  } = usePradLiveSeries({
    reporterId: userId,
    source: 'app',
    enabled: dbConnected,
    intervalMinutes: 5,
    bootstrapLimit: 140,
    maxPoints: 72,
  });

  const liveIndicators = useMemo(() => {
    return liveSeries.reduce(
      (acc, point) => {
        acc.red += point.red;
        acc.yellow += point.yellow;
        return acc;
      },
      { red: 0, yellow: 0 }
    );
  }, [liveSeries]);

  const loadData = async () => {
    try {
      // Quick connection check
      const connected = roadAnomalyService.isConnected();
      setDbConnected(connected);
      if (!connected) {
        console.warn('⚠️ PRAD Dashboard: Supabase not connected — stats will be empty');
        setLoading(false);
        return;
      }

      const [statsData, clustersData, tripsData] = await Promise.all([
        roadAnomalyService.getStats(),
        roadAnomalyService.getClusters(),
        userId ? roadAnomalyService.getUserTrips(userId, 10) : Promise.resolve([]),
      ]);
      setStats(statsData);
      setClusters(clustersData);
      setTrips(tripsData);
    } catch (err) {
      console.error('❌ Failed to load PRAD dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Real-time: re-fetch stats when new anomalies or clusters change
  useEffect(() => {
    let anomalyTimer: ReturnType<typeof setTimeout> | null = null;
    let clusterTimer: ReturnType<typeof setTimeout> | null = null;

    const anomalySub = roadAnomalyService.subscribeToAnomalies(
      () => {
        if (anomalyTimer) clearTimeout(anomalyTimer);
        anomalyTimer = setTimeout(() => loadData(), 800);
      },
      {
        event: 'INSERT',
        source: 'app',
      }
    );
    const clusterSub = roadAnomalyService.subscribeToClusters(() => {
      if (clusterTimer) clearTimeout(clusterTimer);
      clusterTimer = setTimeout(() => loadData(), 800);
    });
    return () => {
      if (anomalyTimer) clearTimeout(anomalyTimer);
      if (clusterTimer) clearTimeout(clusterTimer);
      anomalySub?.();
      clusterSub?.();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Use the road health score computed by the service from real cluster severity data
  const roadHealthScore = stats?.roadHealthScore ?? 100;

  const activeHotspots = clusters.filter(c => c.status === 'probable' || c.status === 'verified').length;

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const hasData = (stats?.totalAnomalies ?? 0) > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Road Analytics</h2>
          <p className="text-sm text-gray-500">Community-detected road conditions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Database connection warning */}
      {!dbConnected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <WifiOff className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Database Offline</p>
              <p className="text-xs text-red-600 mt-1">
                Supabase is not configured. Stats, trips, and hotspots require a database connection.
                Check your <code className="bg-red-100 px-1 rounded text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-red-100 px-1 rounded text-[10px]">VITE_SUPABASE_ANON_KEY</code> environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state — no data yet */}
      {dbConnected && !hasData && (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-6 text-center">
            <Smartphone className="h-10 w-10 mx-auto text-blue-300 mb-3" />
            <p className="text-sm font-medium text-blue-800">No road data yet</p>
            <p className="text-xs text-blue-600 mt-1 max-w-xs mx-auto">
              Go to the <strong>Detect</strong> tab, start a trip, and drive or walk over bumps.
              Real detections will appear here automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Road Health Index */}
      <RoadHealthIndex
        score={roadHealthScore}
        trend={
          (stats?.averageSeverity ?? 0) < 3 ? 'improving' :
          (stats?.averageSeverity ?? 0) > 5 ? 'declining' : 'stable'
        }
        totalDetections={stats?.totalAnomalies ?? 0}
        activeHotspots={activeHotspots}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: AlertTriangle,
            color: 'text-orange-500 bg-orange-50',
            label: 'Anomalies',
            value: stats?.totalAnomalies ?? 0,
          },
          {
            icon: MapPin,
            color: 'text-red-500 bg-red-50',
            label: 'Hotspots',
            value: stats?.totalClusters ?? 0,
          },
          {
            icon: Route,
            color: 'text-blue-500 bg-blue-50',
            label: 'Trips',
            value: stats?.totalTrips ?? 0,
          },
          {
            icon: Users,
            color: 'text-green-500 bg-green-50',
            label: 'Contributors',
            value: stats?.uniqueContributors ?? 0,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-lg p-2', stat.color)}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live series chart */}
      <Card className="border-red-100/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Live PRAD Timeline
                {liveSeriesRefreshing && (
                  <RefreshCw className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                App detections stream in real time and split as pothole vs rough road.
                {lastRefreshed && (
                  <span className="ml-2 text-[10px] text-green-600 font-medium">
                    ↻ Updated {Math.round((Date.now() - lastRefreshed.getTime()) / 1000)}s ago
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                Red flags: {liveIndicators.red}
              </Badge>
              <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                Yellow flags: {liveIndicators.yellow}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {liveSeriesLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : liveSeries.length === 0 ? (
            <div className="h-64 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 flex items-center justify-center text-center p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Waiting for live phone detections</p>
                <p className="text-xs text-gray-500 mt-1">
                  Once the mobile app sends anomaly events, this graph updates automatically.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liveSeries} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-35}
                      textAnchor="end"
                      height={54}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        borderColor: '#e5e7eb',
                        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="pothole"
                      name="Pothole"
                      stroke="#dc2626"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="roughRoad"
                      name="Rough Road"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="red"
                      name="High Severity"
                      stroke="#b91c1c"
                      strokeDasharray="6 3"
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="yellow"
                      name="Medium Severity"
                      stroke="#d97706"
                      strokeDasharray="6 3"
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {latestAnomaly && (
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                  Last event: {latestAnomaly.anomalyType.replace('_', ' ')} at {new Date(latestAnomaly.createdAt).toLocaleString([], {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                  {!latestAnomaly.tripId && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                      background
                    </span>
                  )}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Hotspots / Trip History / Type Breakdown */}
      <Tabs defaultValue="hotspots">
        <TabsList className="w-full">
          <TabsTrigger value="hotspots" className="flex-1">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            Hotspots
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex-1">
            <Route className="h-3.5 w-3.5 mr-1" />
            My Trips
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex-1">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        {/* Hotspots Tab */}
        <TabsContent value="hotspots" className="space-y-2 mt-3">
          {clusters.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No hotspots detected yet</p>
                <p className="text-xs">Start a trip to begin detecting road anomalies</p>
              </CardContent>
            </Card>
          ) : (
            clusters.slice(0, 10).map((cluster, i) => {
              const typeConfig = ANOMALY_TYPE_CONFIG[cluster.anomalyType];
              const sevScore = cluster.severityScore ?? 5;
              const sevColor = sevScore >= 8 ? 'bg-red-100 text-red-700'
                : sevScore >= 6 ? 'bg-orange-100 text-orange-700'
                : sevScore >= 4 ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700';

              return (
                <motion.div
                  key={cluster.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="text-2xl">{typeConfig?.icon ?? '📍'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">
                            {typeConfig?.label ?? cluster.anomalyType}
                          </p>
                          <Badge variant="secondary" className={cn('text-[10px]', sevColor)}>
                            {sevScore.toFixed(1)}/10
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {cluster.detectionCount} detections • {cluster.uniqueReporters} reporter{cluster.uniqueReporters !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', {
                          'border-green-300 text-green-700': cluster.status === 'probable',
                          'border-blue-300 text-blue-700': cluster.status === 'verified',
                          'border-gray-300 text-gray-500': cluster.status === 'resolved',
                        })}
                      >
                        {cluster.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-2 mt-3">
          {trips.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Route className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No trips recorded yet</p>
                <p className="text-xs">Use the trip recorder to start detecting anomalies</p>
              </CardContent>
            </Card>
          ) : (
            trips.map((trip, i) => {
              const duration = trip.endTime
                ? new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()
                : 0;
              const durationMin = Math.round(duration / 60000);

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-semibold">
                            {new Date(trip.startTime).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px]', {
                            'bg-green-100 text-green-700': trip.status === 'completed',
                            'bg-blue-100 text-blue-700': trip.status === 'recording',
                            'bg-yellow-100 text-yellow-700': trip.status === 'paused',
                          })}
                        >
                          {trip.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {trip.distanceKm?.toFixed(1) ?? '0.0'} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {durationMin > 0 ? `${durationMin} min` : '< 1 min'}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {trip.anomalyCount ?? 0} anomalies
                        </span>
                        {trip.transportMode && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {trip.transportMode.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* Type Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-3 mt-3">
          {stats?.byType && Object.keys(stats.byType).length > 0 ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">By Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const config = ANOMALY_TYPE_CONFIG[type as keyof typeof ANOMALY_TYPE_CONFIG];
                    const total = stats.totalAnomalies || 1;
                    const pct = (count / total) * 100;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span>{config?.icon ?? '⚠️'}</span>
                            <span>{config?.label ?? type}</span>
                          </span>
                          <span className="text-gray-500 text-xs">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {stats.bySeverity && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">By Severity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['low', 'medium', 'high', 'critical'] as const).map(sev => {
                        const count = stats.bySeverity?.[sev] ?? 0;
                        const config = ANOMALY_SEVERITY_CONFIG[sev];
                        return (
                          <div key={sev} className={cn(
                            'text-center p-3 rounded-lg',
                            sev === 'low' ? 'bg-green-50' :
                            sev === 'medium' ? 'bg-yellow-50' :
                            sev === 'high' ? 'bg-orange-50' : 'bg-red-50'
                          )}>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{config.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <BarChart3 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No data available yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
