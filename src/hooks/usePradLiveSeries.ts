import { useEffect, useMemo, useState } from 'react';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import { RoadAnomaly } from '@/types/road-anomaly';

export interface PradLiveSeriesPoint {
  bucketTs: number;
  timestamp: string;
  label: string;
  pothole: number;
  roughRoad: number;
  total: number;
  red: number;
  yellow: number;
}

/** How often (ms) the hook re-fetches the timeline from the DB. Default 15 s. */
export const PRAD_DEFAULT_REFRESH_MS = 15_000;

export interface UsePradLiveSeriesOptions {
  reporterId?: string;
  source?: 'app' | 'web' | 'manual';
  intervalMinutes?: number;
  bootstrapLimit?: number;
  maxPoints?: number;
  enabled?: boolean;
  /** Polling interval in ms to re-fetch from DB. 0 = disabled. Default 30 000. */
  refreshIntervalMs?: number;
}

interface SeriesBuildOptions {
  intervalMinutes: number;
  maxPoints: number;
}

const SEVERITY_INTENSITY: Record<string, number> = {
  low: 0.35,
  medium: 0.55,
  high: 0.78,
  critical: 0.95,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function getBucketTs(value: Date, intervalMinutes: number): number {
  const intervalMs = intervalMinutes * 60 * 1000;
  return Math.floor(value.getTime() / intervalMs) * intervalMs;
}

function formatBucketLabel(bucketTs: number): string {
  const d = new Date(bucketTs);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString([], { month: 'short' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day} ${month}, ${time}`;
}

function normalizeIntensity(anomaly: RoadAnomaly): number {
  if (typeof anomaly.intensity === 'number' && Number.isFinite(anomaly.intensity)) {
    return clamp(anomaly.intensity);
  }

  if (typeof anomaly.features?.peakMagnitude === 'number' && Number.isFinite(anomaly.features.peakMagnitude)) {
    // 20 m/s^2 is treated as very strong impact for chart severity.
    return clamp(anomaly.features.peakMagnitude / 20);
  }

  return SEVERITY_INTENSITY[anomaly.severity] ?? 0.5;
}

function classifyForSeries(anomaly: RoadAnomaly): { isPothole: boolean; red: number; yellow: number } {
  const intensity = normalizeIntensity(anomaly);
  const isPothole = anomaly.anomalyType === 'pothole';

  if (intensity >= 0.75) {
    return { isPothole, red: 1, yellow: 0 };
  }

  if (intensity >= 0.45) {
    return { isPothole, red: 0, yellow: 1 };
  }

  return { isPothole, red: 0, yellow: 0 };
}

function createPoint(bucketTs: number): PradLiveSeriesPoint {
  return {
    bucketTs,
    timestamp: new Date(bucketTs).toISOString(),
    label: formatBucketLabel(bucketTs),
    pothole: 0,
    roughRoad: 0,
    total: 0,
    red: 0,
    yellow: 0,
  };
}

function applyAnomalyToPoint(point: PradLiveSeriesPoint, anomaly: RoadAnomaly): PradLiveSeriesPoint {
  const { isPothole, red, yellow } = classifyForSeries(anomaly);

  return {
    ...point,
    pothole: point.pothole + (isPothole ? 1 : 0),
    roughRoad: point.roughRoad + (isPothole ? 0 : 1),
    total: point.total + 1,
    red: point.red + red,
    yellow: point.yellow + yellow,
  };
}

function enforceMaxPoints(points: PradLiveSeriesPoint[], maxPoints: number): PradLiveSeriesPoint[] {
  if (points.length <= maxPoints) return points;
  return points.slice(points.length - maxPoints);
}

function upsertPoint(
  existing: PradLiveSeriesPoint[],
  anomaly: RoadAnomaly,
  options: SeriesBuildOptions
): PradLiveSeriesPoint[] {
  const bucketTs = getBucketTs(anomaly.createdAt, options.intervalMinutes);
  const next = [...existing];
  const targetIndex = next.findIndex((point) => point.bucketTs === bucketTs);

  if (targetIndex >= 0) {
    next[targetIndex] = applyAnomalyToPoint(next[targetIndex], anomaly);
  } else {
    next.push(applyAnomalyToPoint(createPoint(bucketTs), anomaly));
    next.sort((a, b) => a.bucketTs - b.bucketTs);
  }

  return enforceMaxPoints(next, options.maxPoints);
}

function buildSeriesFromAnomalies(
  anomalies: RoadAnomaly[],
  options: SeriesBuildOptions
): PradLiveSeriesPoint[] {
  const ordered = [...anomalies].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return ordered.reduce<PradLiveSeriesPoint[]>(
    (acc, anomaly) => upsertPoint(acc, anomaly, options),
    []
  );
}

export function usePradLiveSeries(options: UsePradLiveSeriesOptions = {}) {
  const {
    reporterId,
    source = 'app',
    intervalMinutes = 5,
    bootstrapLimit = 120,
    maxPoints = 72,
    enabled = true,
    refreshIntervalMs = PRAD_DEFAULT_REFRESH_MS,
  } = options;

  const [points, setPoints] = useState<PradLiveSeriesPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [latestAnomaly, setLatestAnomaly] = useState<RoadAnomaly | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buildOptions = useMemo<SeriesBuildOptions>(() => {
    return {
      intervalMinutes,
      maxPoints,
    };
  }, [intervalMinutes, maxPoints]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const fetchTimeline = async (isInitial: boolean) => {
      if (!isInitial) setIsRefreshing(true);
      try {
        const timeline = await roadAnomalyService.getAnomalyTimeline({
          limit: bootstrapLimit,
          reporterId,
          source,
          ascending: true,
        });

        if (!active) return;

        if (isInitial) {
          // First load — replace everything
          setPoints(buildSeriesFromAnomalies(timeline, buildOptions));
        } else {
          // Subsequent polls — merge new points so real-time inserts aren't lost
          setPoints((prev) => {
            const refreshed = buildSeriesFromAnomalies(timeline, buildOptions);
            // Keep any real-time points that appeared after the latest bootstrap bucket
            const latestBootstrapTs = Math.max(...refreshed.map((p) => p.bucketTs), 0);
            const liveOnly = prev.filter((p) => p.bucketTs > latestBootstrapTs);
            return enforceMaxPoints([...refreshed, ...liveOnly], buildOptions.maxPoints);
          });
        }

        setLastRefreshed(new Date());
      } catch (err) {
        if (!active) return;
        if (isInitial) {
          setError(err instanceof Error ? err.message : 'Unable to load PRAD timeline');
        }
        // Silent fail on background polls — keeps existing data visible
      } finally {
        if (active) {
          if (isInitial) setLoading(false);
          else setIsRefreshing(false);
        }
      }
    };

    fetchTimeline(true);

    // ── 30-second polling refresh ─────────────────────────────────────────────
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    if (refreshIntervalMs > 0) {
      pollTimer = setInterval(() => {
        if (active) fetchTimeline(false);
      }, refreshIntervalMs);
    }

    const unsubscribe = roadAnomalyService.subscribeToAnomalies(
      (anomaly) => {
        if (!active) return;
        setLatestAnomaly(anomaly);
        setPoints((prev) => upsertPoint(prev, anomaly, buildOptions));
        setLastRefreshed(new Date());
      },
      {
        event: 'INSERT',
        reporterId,
        source,
      }
    );

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
      unsubscribe?.();
    };
  }, [enabled, bootstrapLimit, reporterId, source, buildOptions]);

  return {
    points,
    loading,
    error,
    latestAnomaly,
    lastRefreshed,
    isRefreshing,
  };
}
