import { supabase } from '@/lib/supabase';
import {
  RoadAnomaly,
  Trip,
  AnomalyCluster,
  RoadHealthSegment,
  PRADStats,
  AnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  ClusterStatus,
  TripStatus,
  TransportMode,
} from '@/types/road-anomaly';
import { DEFAULT_LOCATION } from '@/constants/location';

interface AnomalyTimelineOptions {
  limit?: number;
  reporterId?: string;
  source?: 'app' | 'web' | 'manual';
  ascending?: boolean;
}

interface AnomalySubscriptionOptions {
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  reporterId?: string;
  source?: 'app' | 'web' | 'manual';
}

// ============================================================================
// RoadAnomalyService — All Supabase CRUD + real-time for the PRAD feature
// ============================================================================

class RoadAnomalyService {
  // ==========================================================================
  // CONNECTION CHECK
  // ==========================================================================

  /** Check if Supabase is connected and PRAD tables exist */
  isConnected(): boolean {
    return supabase !== null && supabase !== undefined;
  }

  /** Verify the PRAD tables exist by running a lightweight query */
  async verifyTables(): Promise<{ ok: boolean; error?: string }> {
    if (!supabase) return { ok: false, error: 'Supabase client is null — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' };
    try {
      const { error } = await supabase.from('road_anomalies').select('id', { count: 'exact', head: true });
      if (error) return { ok: false, error: `road_anomalies table query failed: ${error.message}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: `Connection test failed: ${err}` };
    }
  }

  // ==========================================================================
  // ANOMALIES
  // ==========================================================================

  /** Insert a single road anomaly */
  async submitAnomaly(anomaly: RoadAnomaly): Promise<RoadAnomaly | null> {
    if (!supabase) {
      console.warn('⚠️ PRAD: Supabase not available — anomaly NOT saved. Check env vars VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
      return null;
    }
    try {
      const row = this.anomalyToRow(anomaly);
      const { data, error } = await supabase
        .from('road_anomalies')
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ PRAD: Anomaly submitted', data.id);

      // Trigger server-side clustering via RPC
      await this.triggerClustering(data.id, anomaly.location.latitude, anomaly.location.longitude, anomaly.anomalyType, anomaly.severity, anomaly.reporterId);

      return this.rowToAnomaly(data);
    } catch (err) {
      console.error('❌ PRAD: Failed to submit anomaly:', err);
      return null;
    }
  }

  /** Batch insert for offline sync */
  async submitAnomalyBatch(anomalies: RoadAnomaly[]): Promise<number> {
    if (!supabase || anomalies.length === 0) return 0;
    try {
      const rows = anomalies.map((a) => this.anomalyToRow(a));
      const { data, error } = await supabase
        .from('road_anomalies')
        .insert(rows)
        .select();

      if (error) throw error;
      console.log(`✅ PRAD: Batch submitted ${data?.length ?? 0} anomalies`);

      // Trigger clustering for each
      for (const row of data ?? []) {
        await this.triggerClustering(
          row.id,
          (row.location as { latitude: number }).latitude,
          (row.location as { longitude: number }).longitude,
          row.anomaly_type,
          row.severity,
          row.reporter_id
        );
      }

      return data?.length ?? 0;
    } catch (err) {
      console.error('❌ PRAD: Batch submit failed:', err);
      return 0;
    }
  }

  /** Get anomalies within a bounding box */
  async getNearbyAnomalies(
    lat: number,
    lng: number,
    radiusKm: number = 2,
    limit: number = 500
  ): Promise<RoadAnomaly[]> {
    if (!supabase) return [];
    try {
      // Bounding box approximation
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

      const { data, error } = await supabase
        .from('road_anomalies')
        .select('*')
        .gte('location->>latitude', (lat - latDelta).toString())
        .lte('location->>latitude', (lat + latDelta).toString())
        .gte('location->>longitude', (lng - lngDelta).toString())
        .lte('location->>longitude', (lng + lngDelta).toString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((r) => this.rowToAnomaly(r));
    } catch (err) {
      console.error('❌ PRAD: Failed to get nearby anomalies:', err);
      return [];
    }
  }

  /** Get anomalies for a specific trip */
  async getTripAnomalies(tripId: string): Promise<RoadAnomaly[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('road_anomalies')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((r) => this.rowToAnomaly(r));
    } catch (err) {
      console.error('❌ PRAD: Failed to get trip anomalies:', err);
      return [];
    }
  }

  /**
   * Fetch anomaly timeline events for live graph bootstrapping.
   * Returns ordered events ready for client-side chart mapping.
   */
  async getAnomalyTimeline(options: AnomalyTimelineOptions = {}): Promise<RoadAnomaly[]> {
    if (!supabase) return [];

    const {
      limit = 120,
      reporterId,
      source,
      ascending = true,
    } = options;

    const runQuery = async (withSourceFilter: boolean) => {
      let query = supabase
        .from('road_anomalies')
        .select('*')
        .order('created_at', { ascending })
        .limit(limit);

      if (reporterId) {
        query = query.eq('reporter_id', reporterId);
      }

      if (withSourceFilter && source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => this.rowToAnomaly(r));
    };

    try {
      return await runQuery(true);
    } catch (err) {
      // Fallback for older deployments where source may not exist yet.
      if (source) {
        try {
          return await runQuery(false);
        } catch {
          // Keep the original error path below.
        }
      }

      console.error('❌ PRAD: Failed to get anomaly timeline:', err);
      return [];
    }
  }

  // ==========================================================================
  // TRIPS
  // ==========================================================================

  async createTrip(userId: string): Promise<Trip | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ PRAD: Trip created', data.id);
      return this.rowToTrip(data);
    } catch (err) {
      console.error('❌ PRAD: Failed to create trip:', err);
      return null;
    }
  }

  async finalizeTrip(
    tripId: string,
    stats: {
      route: Array<{ lat: number; lng: number; timestamp: number }>;
      distanceKm: number;
      transportMode: TransportMode;
      avgSpeed: number;
    }
  ): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'completed' as TripStatus,
          end_time: new Date().toISOString(),
          route: stats.route as unknown as Record<string, unknown>[],
          distance_km: stats.distanceKm,
          transport_mode: stats.transportMode,
          avg_speed: stats.avgSpeed,
        })
        .eq('id', tripId);

      if (error) throw error;
      console.log('✅ PRAD: Trip finalized', tripId);
    } catch (err) {
      console.error('❌ PRAD: Failed to finalize trip:', err);
    }
  }

  async getUserTrips(userId: string, limit = 20): Promise<Trip[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((r) => this.rowToTrip(r));
    } catch (err) {
      console.error('❌ PRAD: Failed to get user trips:', err);
      return [];
    }
  }

  // ==========================================================================
  // CLUSTERS
  // ==========================================================================

  // Default bounds: ~20 km around default map center.
  private static DEFAULT_BOUNDS = {
    north: DEFAULT_LOCATION.latitude + 0.18,
    south: DEFAULT_LOCATION.latitude - 0.18,
    east: DEFAULT_LOCATION.longitude + 0.20,
    west: DEFAULT_LOCATION.longitude - 0.20,
  };

  private static createBoundsFromCenter(lat: number, lng: number): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    return {
      north: lat + 0.18,
      south: lat - 0.18,
      east: lng + 0.20,
      west: lng - 0.20,
    };
  }

  /** Get clusters within map bounds (falls back to default map center when no bounds are provided). */
  async getClusters(
    bounds?: { north: number; south: number; east: number; west: number },
    statusFilter?: ClusterStatus[],
    center?: { latitude: number; longitude: number }
  ): Promise<AnomalyCluster[]> {
    if (!supabase) return [];
    const b = bounds
      ?? (center
        ? RoadAnomalyService.createBoundsFromCenter(center.latitude, center.longitude)
        : RoadAnomalyService.DEFAULT_BOUNDS);
    try {
      let query = supabase
        .from('anomaly_clusters')
        .select('*')
        .gte('centroid_lat', b.south)
        .lte('centroid_lat', b.north)
        .gte('centroid_lng', b.west)
        .lte('centroid_lng', b.east)
        .order('detection_count', { ascending: false });

      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => this.rowToCluster(r));
    } catch (err) {
      console.error('❌ PRAD: Failed to get clusters:', err);
      return [];
    }
  }

  /** Verify a cluster (increment detection) — called when user confirms */
  async verifyCluster(clusterId: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.rpc('verify_anomaly_cluster', {
        p_cluster_id: clusterId,
      });
      if (error) {
        // Fallback: manual update
        await supabase
          .from('anomaly_clusters')
          .update({ status: 'verified' })
          .eq('id', clusterId);
      }
      console.log('✅ PRAD: Cluster verified', clusterId);
    } catch (err) {
      console.error('❌ PRAD: Failed to verify cluster:', err);
    }
  }

  /**
   * Convert a verified cluster into a civic Issue.
   * This auto-creates an issue in the main `issues` table with category='roads'.
   */
  async convertToIssue(cluster: AnomalyCluster): Promise<string | null> {
    if (!supabase) return null;
    try {
      const { enhancedIssueService } = await import('./EnhancedIssueService');

      const typeLabel = cluster.anomalyType.replace(/_/g, ' ');
      const title = `Auto-detected: ${typeLabel} cluster (${cluster.detectionCount} detections)`;
      const description = [
        `A ${typeLabel} was automatically detected by ${cluster.uniqueReporters} citizens`,
        `at approximately (${cluster.centroidLat.toFixed(5)}, ${cluster.centroidLng.toFixed(5)}).`,
        `Severity score: ${cluster.severityScore.toFixed(0)}/10.`,
        `First detected: ${cluster.firstDetected.toISOString().split('T')[0]}.`,
        `This issue was auto-generated by CityScope's Passive Road Anomaly Detection system.`,
      ].join(' ');

      const issue = await enhancedIssueService.createIssue({
        title,
        description,
        category: 'roads',
        location: {
          latitude: cluster.centroidLat,
          longitude: cluster.centroidLng,
          address: `Near (${cluster.centroidLat.toFixed(4)}, ${cluster.centroidLng.toFixed(4)})`,
        },
        reporterId: 'system',
        reporterName: 'CityScope PRAD',
        priority: cluster.severityScore > 7 ? 'high' : cluster.severityScore > 4 ? 'medium' : 'low',
      });

      // Link cluster to issue
      if (issue?.id) {
        await supabase
          .from('anomaly_clusters')
          .update({ status: 'escalated', issue_id: issue.id })
          .eq('id', cluster.id);
        console.log('✅ PRAD: Cluster escalated to issue', issue.id);
      }

      return issue?.id ?? null;
    } catch (err) {
      console.error('❌ PRAD: Failed to convert cluster to issue:', err);
      return null;
    }
  }

  // ==========================================================================
  // ROAD HEALTH
  // ==========================================================================

  async getRoadHealth(
    bounds: { north: number; south: number; east: number; west: number }
  ): Promise<RoadHealthSegment[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('road_health_segments')
        .select('*')
        .order('health_score', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data ?? []).map((r) => this.rowToHealthSegment(r));
    } catch (err) {
      console.error('❌ PRAD: Failed to get road health:', err);
      return [];
    }
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  async getStats(): Promise<PRADStats> {
    const empty: PRADStats = {
      totalDetections: 0,
      totalAnomalies: 0,
      verifiedClusters: 0,
      totalClusters: 0,
      totalTrips: 0,
      uniqueContributors: 0,
      autoCreatedIssues: 0,
      averageConfidence: 0,
      averageSeverity: 0,
      detectionsByType: { pothole: 0, speed_breaker: 0, rough_road: 0, manhole: 0, railway_crossing: 0, unknown: 0 },
      byType: {},
      bySeverity: {},
      roadHealthScore: 100,
      activeTrips: 0,
      totalDistanceKm: 0,
      topHotspots: [],
    };
    if (!supabase) {
      console.warn('⚠️ PRAD getStats: Supabase is null — returning empty stats. Configure VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
      return empty;
    }

    try {
      console.log('📊 PRAD: Fetching real stats from Supabase...');
      // Fire all independent queries in parallel
      const [
        { count: totalDetections },
        { count: verifiedClusters },
        { count: totalClustersCount },
        { count: autoCreatedIssues },
        { count: activeTrips },
        { count: totalTripsCount },
        { data: confData },
        { data: typeData },
        { data: sevData },
        { data: contributorData },
        { data: clusterSevData },
        { data: distData },
        { data: hotspots },
      ] = await Promise.all([
        // Total detections
        supabase.from('road_anomalies').select('*', { count: 'exact', head: true }),
        // Verified/probable/escalated clusters
        supabase.from('anomaly_clusters').select('*', { count: 'exact', head: true })
          .in('status', ['verified', 'probable', 'escalated']),
        // Total clusters (all statuses)
        supabase.from('anomaly_clusters').select('*', { count: 'exact', head: true }),
        // Escalated clusters (auto-created issues)
        supabase.from('anomaly_clusters').select('*', { count: 'exact', head: true })
          .eq('status', 'escalated'),
        // Active trips (currently recording)
        supabase.from('trips').select('*', { count: 'exact', head: true })
          .eq('status', 'recording'),
        // Total trips (all statuses)
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        // Confidence values for average
        supabase.from('road_anomalies').select('confidence').limit(2000),
        // Group by anomaly_type — Supabase doesn't support GROUP BY directly, fetch raw
        supabase.from('road_anomalies').select('anomaly_type').limit(5000),
        // Group by severity
        supabase.from('road_anomalies').select('severity').limit(5000),
        // Unique contributors
        supabase.from('road_anomalies').select('reporter_id').limit(5000),
        // Cluster severity scores for average
        supabase.from('anomaly_clusters').select('severity_score').limit(1000),
        // Total distance from trips
        supabase.from('trips').select('distance_km').eq('status', 'completed').limit(5000),
        // Top hotspot clusters
        supabase.from('anomaly_clusters')
          .select('centroid_lat, centroid_lng, detection_count, severity_score')
          .order('detection_count', { ascending: false })
          .limit(10),
      ]);

      // Average confidence
      const avgConf =
        confData && confData.length > 0
          ? confData.reduce((s, r) => s + Number(r.confidence), 0) / confData.length
          : 0;

      // By type aggregation
      const byType: Record<string, number> = {};
      const detectionsByType = { ...empty.detectionsByType };
      if (typeData) {
        for (const row of typeData) {
          const t = row.anomaly_type as string;
          byType[t] = (byType[t] ?? 0) + 1;
          if (t in detectionsByType) {
            detectionsByType[t as keyof typeof detectionsByType] += 1;
          }
        }
      }

      // By severity aggregation
      const bySeverity: Record<string, number> = {};
      if (sevData) {
        for (const row of sevData) {
          const s = row.severity as string;
          bySeverity[s] = (bySeverity[s] ?? 0) + 1;
        }
      }

      // Unique contributors
      const uniqueContributors = contributorData
        ? new Set(contributorData.map(r => r.reporter_id)).size
        : 0;

      // Average severity from cluster scores (0-1 scale → 0-10)
      const avgSeverity =
        clusterSevData && clusterSevData.length > 0
          ? (clusterSevData.reduce((s, r) => s + Number(r.severity_score), 0) / clusterSevData.length) * 10
          : 0;

      // Total distance
      const totalDistanceKm =
        distData && distData.length > 0
          ? distData.reduce((s, r) => s + (Number(r.distance_km) || 0), 0)
          : 0;

      // Road health: inverse of average severity (0-10 → 100-0)
      const roadHealthScore = Math.max(0, Math.round(100 - avgSeverity * 10));

      console.log(`✅ PRAD Stats: ${totalDetections ?? 0} detections, ${totalClustersCount ?? 0} clusters, ${totalTripsCount ?? 0} trips, ${uniqueContributors} contributors`);

      return {
        totalDetections: totalDetections ?? 0,
        totalAnomalies: totalDetections ?? 0,
        verifiedClusters: verifiedClusters ?? 0,
        totalClusters: totalClustersCount ?? 0,
        totalTrips: totalTripsCount ?? 0,
        uniqueContributors,
        autoCreatedIssues: autoCreatedIssues ?? 0,
        averageConfidence: avgConf,
        averageSeverity: avgSeverity,
        detectionsByType,
        byType,
        bySeverity,
        roadHealthScore,
        activeTrips: activeTrips ?? 0,
        totalDistanceKm,
        topHotspots: (hotspots ?? []).map((h) => ({
          lat: h.centroid_lat,
          lng: h.centroid_lng,
          count: h.detection_count,
          severity: h.severity_score > 0.7 ? 'high' as AnomalySeverity : h.severity_score > 0.4 ? 'medium' as AnomalySeverity : 'low' as AnomalySeverity,
        })),
      };
    } catch (err) {
      console.error('❌ PRAD: Failed to get stats:', err);
      return empty;
    }
  }

  // ==========================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================================================

  subscribeToAnomalies(
    callback: (anomaly: RoadAnomaly) => void,
    options: AnomalySubscriptionOptions = {}
  ): (() => void) | null {
    if (!supabase) return null;
    const {
      event = 'INSERT',
      reporterId,
      source,
    } = options;

    try {
      const channelName = `prad-anomalies-${Math.random().toString(36).slice(2, 8)}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event, schema: 'public', table: 'road_anomalies' },
          (payload) => {
            if (!payload.new) return;

            const anomaly = this.rowToAnomaly(payload.new);
            if (reporterId && anomaly.reporterId !== reporterId) return;
            if (source && anomaly.source !== source) return;

            callback(anomaly);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('❌ PRAD: Failed to subscribe:', err);
      return null;
    }
  }

  subscribeToClusters(callback: (cluster: AnomalyCluster) => void): (() => void) | null {
    if (!supabase) return null;
    try {
      const channel = supabase
        .channel('prad-clusters')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'anomaly_clusters' },
          (payload) => {
            callback(this.rowToCluster(payload.new));
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (err) {
      console.error('❌ PRAD: Failed to subscribe to clusters:', err);
      return null;
    }
  }

  // ==========================================================================
  // SERVER-SIDE CLUSTERING (via RPC)
  // ==========================================================================

  private async triggerClustering(
    anomalyId: string,
    lat: number,
    lng: number,
    anomalyType: string,
    severity: string,
    reporterId: string
  ): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.rpc('find_or_create_cluster', {
        p_anomaly_id: anomalyId,
        p_lat: lat,
        p_lng: lng,
        p_anomaly_type: anomalyType,
        p_severity: severity,
        p_reporter_id: reporterId,
      });
    } catch (err) {
      console.warn('⚠️ PRAD: Server-side clustering failed (will retry on sync):', err);
    }
  }

  // ==========================================================================
  // DATA CONVERTERS  (snake_case DB ↔ camelCase TS)
  // ==========================================================================

  private anomalyToRow(a: RoadAnomaly): Record<string, unknown> {
    return {
      id: a.id,
      trip_id: a.tripId ?? null,
      reporter_id: a.reporterId,
      source: a.source ?? 'web',
      device_id: a.deviceId ?? null,
      intensity: a.intensity ?? a.features?.peakMagnitude ?? null,
      anomaly_type: a.anomalyType,
      severity: a.severity,
      confidence: a.confidence,
      location: a.location,
      features: a.features,
      sensor_snapshot: a.sensorSnapshot,
      status: a.status,
      verified_count: a.verifiedCount,
      cluster_id: a.clusterId ?? null,
      device_info: a.deviceInfo ?? {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rowToAnomaly(r: any): RoadAnomaly {
    return {
      id: r.id,
      tripId: r.trip_id,
      reporterId: r.reporter_id,
      source: (r.source as 'app' | 'web' | 'manual' | undefined) ?? 'web',
      deviceId: (r.device_id as string | undefined) ?? undefined,
      intensity: typeof r.intensity === 'number'
        ? r.intensity
        : typeof r.intensity === 'string'
          ? Number(r.intensity)
          : undefined,
      anomalyType: r.anomaly_type as AnomalyType,
      severity: r.severity as AnomalySeverity,
      confidence: Number(r.confidence),
      location: r.location as { latitude: number; longitude: number; address?: string },
      features: r.features ?? {},
      sensorSnapshot: r.sensor_snapshot ?? [],
      status: r.status as AnomalyStatus,
      verifiedCount: r.verified_count ?? 0,
      clusterId: r.cluster_id ?? null,
      deviceInfo: r.device_info ?? undefined,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      detectedAt: new Date(r.created_at),
      synced: true,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rowToTrip(r: any): Trip {
    return {
      id: r.id,
      userId: r.user_id,
      startTime: new Date(r.start_time),
      endTime: r.end_time ? new Date(r.end_time) : undefined,
      status: r.status as TripStatus,
      route: r.route ?? [],
      anomalyCount: r.anomaly_count ?? 0,
      distanceKm: Number(r.distance_km) || 0,
      transportMode: (r.transport_mode as TransportMode) ?? 'vehicle',
      avgSpeed: Number(r.avg_speed) || 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rowToCluster(r: any): AnomalyCluster {
    return {
      id: r.id,
      centroidLat: Number(r.centroid_lat),
      centroidLng: Number(r.centroid_lng),
      anomalyType: r.anomaly_type as AnomalyType,
      severityScore: Number(r.severity_score) * 10, // DB stores 0-1, UI expects 0-10
      detectionCount: r.detection_count ?? 0,
      detectionRadiusM: r.detection_radius_m ?? 25,
      status: r.status as ClusterStatus,
      issueId: r.issue_id ?? null,
      firstDetected: new Date(r.first_detected),
      lastDetected: new Date(r.last_detected),
      uniqueReporters: r.unique_reporters ?? 1,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rowToHealthSegment(r: any): RoadHealthSegment {
    return {
      id: r.id,
      startLocation: r.start_location as { latitude: number; longitude: number },
      endLocation: r.end_location as { latitude: number; longitude: number },
      healthScore: Number(r.health_score),
      anomalyDensity: Number(r.anomaly_density),
      segmentLengthM: r.segment_length_m ?? 0,
      lastUpdated: new Date(r.last_updated),
    };
  }
}

export const roadAnomalyService = new RoadAnomalyService();
