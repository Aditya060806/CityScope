import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import { anomalyDetectionEngine } from '@/services/AnomalyDetectionEngine';
import { Trip, TripStatus, TransportMode } from '@/types/road-anomaly';

const PRAD_WEB_READ_ONLY = import.meta.env.VITE_PRAD_WEB_READ_ONLY !== 'false';

interface RoutePt {
  lat: number;
  lng: number;
  timestamp: number;
}

interface UseTripRecordingReturn {
  currentTrip: Trip | null;
  tripStatus: TripStatus | null;
  route: RoutePt[];
  distanceKm: number;
  durationMs: number;
  transportMode: TransportMode;
  avgSpeedKmh: number;
  pastTrips: Trip[];

  startTrip: () => Promise<void>;
  pauseTrip: () => void;
  resumeTrip: () => void;
  endTrip: () => Promise<void>;
  loadPastTrips: () => Promise<void>;
}

/**
 * useTripRecording — Manages the trip lifecycle for PRAD.
 * Tracks route polyline, distance, speed, and transport mode.
 */
export const useTripRecording = (): UseTripRecordingReturn => {
  const { user } = useAuth();

  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const [route, setRoute] = useState<RoutePt[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [transportMode, setTransportMode] = useState<TransportMode>('vehicle');
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(0);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);

  const gpsWatchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeRef = useRef<RoutePt[]>([]);
  const totalDistRef = useRef(0);

  // ========== Start ==========

  const startTrip = useCallback(async () => {
    if (PRAD_WEB_READ_ONLY) {
      console.warn('⚠️ PRAD: Web is in read-only mode. Trip creation is disabled.');
      return;
    }

    if (!user?.id) return;

    const trip = await roadAnomalyService.createTrip(user.id);
    if (!trip) return;

    setCurrentTrip(trip);
    setTripStatus('recording');
    setRoute([]);
    setDistanceKm(0);
    setDurationMs(0);
    routeRef.current = [];
    totalDistRef.current = 0;
    startTimeRef.current = Date.now();

    // Duration timer
    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current);
    }, 1000);

    // GPS tracking — reduced resolution route recording
    let lastPt: RoutePt | null = null;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: RoutePt = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        };

        // Only record point if > 50m from last (reduce resolution)
        if (
          !lastPt ||
          haversineM(lastPt.lat, lastPt.lng, pt.lat, pt.lng) >= 50
        ) {
          // Accumulate distance
          if (lastPt) {
            totalDistRef.current += haversineM(lastPt.lat, lastPt.lng, pt.lat, pt.lng) / 1000;
            setDistanceKm(totalDistRef.current);
          }

          routeRef.current.push(pt);
          setRoute([...routeRef.current]);
          lastPt = pt;

          // Speed & transport mode
          const speedMs = pos.coords.speed ?? 0;
          setAvgSpeedKmh(speedMs * 3.6);
          setTransportMode(anomalyDetectionEngine.inferTransportMode(speedMs));
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 }
    );

    console.log('🛣️ PRAD: Trip started', trip.id);
  }, [user?.id]);

  // ========== Pause / Resume ==========

  const pauseTrip = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setTripStatus('paused');
    console.log('⏸️ PRAD: Trip paused');
  }, []);

  const resumeTrip = useCallback(() => {
    setTripStatus('recording');
    startTimeRef.current = Date.now() - durationMs; // preserve elapsed
    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current);
    }, 1000);
    // Re-start GPS
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: RoutePt = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now() };
        const last = routeRef.current[routeRef.current.length - 1];
        if (!last || haversineM(last.lat, last.lng, pt.lat, pt.lng) >= 50) {
          if (last) {
            totalDistRef.current += haversineM(last.lat, last.lng, pt.lat, pt.lng) / 1000;
            setDistanceKm(totalDistRef.current);
          }
          routeRef.current.push(pt);
          setRoute([...routeRef.current]);
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 }
    );
    console.log('▶️ PRAD: Trip resumed');
  }, [durationMs]);

  // ========== End ==========

  const endTrip = useCallback(async () => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);

    if (!PRAD_WEB_READ_ONLY && currentTrip?.id) {
      await roadAnomalyService.finalizeTrip(currentTrip.id, {
        route: routeRef.current,
        distanceKm: totalDistRef.current,
        transportMode,
        avgSpeed: avgSpeedKmh,
      });
    }

    setTripStatus('completed');
    console.log('🏁 PRAD: Trip ended', currentTrip?.id);
    setCurrentTrip(null);
    setTripStatus(null);
  }, [currentTrip?.id, transportMode, avgSpeedKmh]);

  // ========== Past Trips ==========

  const loadPastTrips = useCallback(async () => {
    if (!user?.id) return;
    const trips = await roadAnomalyService.getUserTrips(user.id);
    setPastTrips(trips);
  }, [user?.id]);

  // ========== Cleanup ==========

  useEffect(() => {
    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    currentTrip,
    tripStatus,
    route,
    distanceKm,
    durationMs,
    transportMode,
    avgSpeedKmh,
    pastTrips,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
    loadPastTrips,
  };
};

// ============================================================================
// HELPERS
// ============================================================================

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
