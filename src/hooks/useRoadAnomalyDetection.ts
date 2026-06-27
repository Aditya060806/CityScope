import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { sensorDataService } from '@/services/SensorDataService';
import { anomalyDetectionEngine } from '@/services/AnomalyDetectionEngine';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import { roadAnomalyAIService } from '@/services/RoadAnomalyAIService';
import { hapticFeedbackService } from '@/services/HapticFeedbackService';
import { usePRADAutoDetectionSafe } from '@/contexts/PRADAutoDetectionContext';
import { DEFAULT_LOCATION } from '@/constants/location';
import {
  SensorReading,
  RoadAnomaly,
  DetectionConfig,
  DEFAULT_DETECTION_CONFIG,
  SensorPermissionState,
  AnomalyCluster,
  AnomalySeverity,
} from '@/types/road-anomaly';

const PRAD_ENABLED = import.meta.env.VITE_ENABLE_ROAD_ANOMALY_DETECTION !== 'false';
const PRAD_WEB_READ_ONLY = import.meta.env.VITE_PRAD_WEB_READ_ONLY !== 'false';

interface UseRoadAnomalyDetectionReturn {
  // State
  isDetecting: boolean;
  permissionState: SensorPermissionState;
  anomalies: RoadAnomaly[];
  clusters: AnomalyCluster[];
  error: string | null;
  stats: { detected: number; synced: number; pending: number };
  currentSpeed: number;            // km/h
  batteryLevel: number;
  isSupported: boolean;

  // Real-time metrics
  currentGForce: number;           // current acceleration in g
  vibrationIntensity: number;      // 0-100 smoothed vibration level
  isAutoMode: boolean;             // whether auto-detection is running

  // Actions
  requestPermission: () => Promise<SensorPermissionState>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  clearAnomalies: () => void;
  setAutoMode: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
}

/**
 * useRoadAnomalyDetection — Main PRAD orchestration hook
 *
 * Ties together SensorDataService → AnomalyDetectionEngine → RoadAnomalyService.
 * Manages a ring buffer, GPS watch, debounce, offline queue, and real-time subscription.
 */
export const useRoadAnomalyDetection = (
  config?: Partial<DetectionConfig>,
  options?: { autoStart?: boolean }
): UseRoadAnomalyDetectionReturn => {
  const { user } = useAuth();
  const { userLocation } = useLocation();

  // Check if global PRAD context is already running — if so, delegate to it
  const globalPRAD = usePRADAutoDetectionSafe();
  const globalIsActive = globalPRAD?.isDetecting ?? false;

  // Core state
  const [isDetecting, setIsDetecting] = useState(false);
  const [permissionState, setPermissionState] = useState<SensorPermissionState>(
    sensorDataService.getPermissionState()
  );
  const [anomalies, setAnomalies] = useState<RoadAnomaly[]>([]);
  const [clusters, setClusters] = useState<AnomalyCluster[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [stats, setStats] = useState({ detected: 0, synced: 0, pending: 0 });

  // Real-time metrics
  const [currentGForce, setCurrentGForce] = useState(0);
  const [vibrationIntensity, setVibrationIntensity] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(options?.autoStart ?? false);
  const autoStartAttempted = useRef(false);

  // Refs for mutable state
  const bufferRef = useRef<SensorReading[]>([]);
  const gpsWatchRef = useRef<number | null>(null);
  const lastDetectionRef = useRef(0);
  const tripIdRef = useRef<string | null>(null);
  const sensorUnsubRef = useRef<(() => void) | null>(null);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);
  const speedRef = useRef(0);
  const currentLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const prevLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const routeRef = useRef<{ latitude: number; longitude: number }[]>([]);
  const tripDistanceKmRef = useRef(0);

  const mergedConfig: DetectionConfig = { ...DEFAULT_DETECTION_CONFIG, ...config };

  const isSupported = sensorDataService.isSupported() && PRAD_ENABLED && !PRAD_WEB_READ_ONLY;

  // ==========================================================================
  // Permission
  // ==========================================================================

  const requestPermission = useCallback(async (): Promise<SensorPermissionState> => {
    try {
      const state = await sensorDataService.requestPermission();
      setPermissionState(state);
      if (state === 'denied') {
        setError('Motion sensor permission denied. Please enable it in your browser settings.');
      }
      return state;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Permission request failed';
      setError(msg);
      setPermissionState('denied');
      return 'denied';
    }
  }, []);

  // ==========================================================================
  // GPS Watch
  // ==========================================================================

  const startGPSWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not available');
      return;
    }

    // Initialise from context
    if (userLocation) {
      currentLocationRef.current = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
    }

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        currentLocationRef.current = newLoc;
        const speedMs = pos.coords.speed ?? 0;
        speedRef.current = speedMs;
        setCurrentSpeed(speedMs * 3.6); // m/s → km/h

        // Accumulate real route + distance
        routeRef.current.push(newLoc);
        if (prevLocationRef.current) {
          const R = 6371000;
          const dLat = ((newLoc.latitude - prevLocationRef.current.latitude) * Math.PI) / 180;
          const dLon = ((newLoc.longitude - prevLocationRef.current.longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((prevLocationRef.current.latitude * Math.PI) / 180) *
            Math.cos((newLoc.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
          const dMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dMeters > 2 && dMeters < 500) {
            tripDistanceKmRef.current += dMeters / 1000;
          }
        }
        prevLocationRef.current = newLoc;
      },
      (err) => {
        console.warn('⚠️ PRAD: GPS error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );
  }, [userLocation]);

  const stopGPSWatch = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
  }, []);

  // ==========================================================================
  // Sensor Data Handler
  // ==========================================================================

  const handleSensorReading = useCallback(
    (reading: SensorReading) => {
      const buffer = bufferRef.current;

      // Add speed from GPS
      reading.speed = speedRef.current;

      // Append to ring buffer
      buffer.push(reading);
      if (buffer.length > mergedConfig.bufferSize) {
        buffer.shift();
      }

      // --- Real-time metrics (update every reading) ---
      const gForce = reading.magnitude / 9.81;
      setCurrentGForce(parseFloat(gForce.toFixed(2)));

      // Smoothed vibration intensity (exponential moving average)
      const rawIntensity = Math.min(100, (reading.magnitude / mergedConfig.absoluteThreshold) * 100);
      setVibrationIntensity((prev) => {
        const alpha = 0.3; // smoothing factor
        return parseFloat((alpha * rawIntensity + (1 - alpha) * prev).toFixed(1));
      });

      // Spike detection
      const spike = anomalyDetectionEngine.detectSpike(buffer, speedRef.current);
      if (!spike) return;

      // Debounce
      const now = Date.now();
      if (now - lastDetectionRef.current < mergedConfig.debounceMs) return;
      lastDetectionRef.current = now;

      // Location — use GPS fix or fall back to last known / context location
      const loc = currentLocationRef.current
        ?? (userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null)
        ?? { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude };

      // Determine severity — bump to critical for extreme events
      let severity: AnomalySeverity = spike.classification.severity;
      if (spike.features.peakMagnitude > mergedConfig.absoluteThreshold * 2) {
        severity = 'critical';
      }

      const detectedAt = new Date();

      // Build anomaly event
      const anomaly: RoadAnomaly = {
        id: `prad_${now}_${Math.random().toString(36).slice(2, 8)}`,
        tripId: tripIdRef.current || 'local',
        reporterId: user?.id || 'anonymous',
        anomalyType: spike.classification.type,
        severity,
        confidence: spike.classification.confidence,
        location: { latitude: loc.latitude, longitude: loc.longitude },
        features: spike.features,
        sensorSnapshot: spike.snapshot,
        status: 'detected',
        verifiedCount: 0,
        clusterId: null,
        deviceInfo: sensorDataService.getDeviceInfo(),
        createdAt: detectedAt,
        updatedAt: detectedAt,
        detectedAt,
        synced: false,
      };

      console.log(
        `🚧 PRAD: ${spike.classification.type} detected ` +
          `(peak=${spike.features.peakMagnitude.toFixed(1)}, ` +
          `${gForce.toFixed(1)}g, ` +
          `conf=${spike.classification.confidence.toFixed(2)}, ` +
          `sev=${severity}) ` +
          `at [${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}]`
      );

      // 📳 HAPTIC VIBRATION FEEDBACK — the phone vibrates so the user *feels* the detection
      hapticFeedbackService.vibrateForAnomaly(spike.classification.type, severity);

      // Add to local state
      setAnomalies((prev) => {
        const next = [anomaly, ...prev];
        return next.length > 500 ? next.slice(0, 500) : next;
      });
      setStats((prev) => ({
        ...prev,
        detected: prev.detected + 1,
        pending: prev.pending + 1,
      }));

      // Async: submit to backend + optional AI enhancement
      submitAnomaly(anomaly);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  // ==========================================================================
  // Backend submission (async, non-blocking)
  // ==========================================================================

  const submitAnomaly = useCallback(
    async (anomaly: RoadAnomaly) => {
      if (PRAD_WEB_READ_ONLY) return;

      try {
        // Try backend submit
        const result = await roadAnomalyService.submitAnomaly(anomaly);
        if (result) {
          setStats((prev) => ({
            ...prev,
            synced: prev.synced + 1,
            pending: Math.max(0, prev.pending - 1),
          }));

          // Optional: AI enhancement (non-blocking)
          roadAnomalyAIService
            .classifySensorFeatures(anomaly.features, anomaly.anomalyType, anomaly.severity)
            .catch(() => {});
        } else {
          // Queue for offline sync
          await queueOfflineAnomaly(anomaly);
        }
      } catch {
        await queueOfflineAnomaly(anomaly);
      }
    },
    []
  );

  const queueOfflineAnomaly = async (anomaly: RoadAnomaly) => {
    try {
      const { offlineService } = await import('@/services/OfflineService');
      await offlineService.queueOperation('SUBMIT_ANOMALY' as never, anomaly, 'medium');
      console.log('📡 PRAD: Anomaly queued for offline sync');
    } catch (err) {
      console.error('❌ PRAD: Failed to queue anomaly for offline:', err);
    }
  };

  // ==========================================================================
  // Start / Stop
  // ==========================================================================

  const startDetection = useCallback(async () => {
    if (PRAD_WEB_READ_ONLY) {
      setError('PRAD web client is read-only. Use the mobile app to submit detections.');
      return;
    }

    if (isDetecting) return;
    if (!isSupported) {
      setError('Road anomaly detection is not supported on this device');
      return;
    }

    // If the global PRAD context is already detecting, don't start a second stream
    if (globalIsActive) {
      console.log('📱 PRAD: Global context already detecting — deferring to it');
      setIsDetecting(true); // reflect state for UI
      return;
    }

    if (permissionState !== 'granted') {
      const state = await requestPermission();
      if (state !== 'granted') return;
    }

    setError(null);
    bufferRef.current = [];
    anomalyDetectionEngine.resetStats();
    lastDetectionRef.current = 0;
    routeRef.current = [];
    tripDistanceKmRef.current = 0;
    prevLocationRef.current = null;

    // Create trip
    if (user?.id) {
      const trip = await roadAnomalyService.createTrip(user.id);
      tripIdRef.current = trip?.id ?? null;
    }

    // Start GPS
    startGPSWatch();

    // Start sensor capture
    sensorDataService.startCapture(mergedConfig);
    sensorUnsubRef.current = sensorDataService.onReading(handleSensorReading);

    // Subscribe to real-time anomaly updates
    realtimeUnsubRef.current = roadAnomalyService.subscribeToAnomalies((anomaly) => {
      setAnomalies((prev) => {
        if (prev.some((a) => a.id === anomaly.id)) return prev;
        return [anomaly, ...prev].slice(0, 500);
      });
    });

    setIsDetecting(true);
    console.log('🟢 PRAD: Detection started');
  }, [
    isDetecting,
    isSupported,
    globalIsActive,
    permissionState,
    requestPermission,
    user?.id,
    startGPSWatch,
    handleSensorReading,
    mergedConfig,
  ]);

  const stopDetection = useCallback(() => {
    if (!isDetecting) return;

    // If we were deferring to global context, just update UI state
    if (globalIsActive && !sensorUnsubRef.current) {
      setIsDetecting(false);
      console.log('🔴 PRAD: Page-level detection stopped (was deferring to global)');
      return;
    }

    // Stop sensor
    sensorDataService.stopCapture();
    sensorUnsubRef.current?.();
    sensorUnsubRef.current = null;

    // Stop GPS
    stopGPSWatch();

    // Stop real-time subscription
    realtimeUnsubRef.current?.();
    realtimeUnsubRef.current = null;

    // Finalize trip with REAL route + distance
    if (tripIdRef.current && user?.id) {
      roadAnomalyService.finalizeTrip(tripIdRef.current, {
        route: routeRef.current.slice(0, 1000), // cap at 1000 points
        distanceKm: parseFloat(tripDistanceKmRef.current.toFixed(3)),
        transportMode: anomalyDetectionEngine.inferTransportMode(speedRef.current),
        avgSpeed: currentSpeed,
      });
    }
    tripIdRef.current = null;
    routeRef.current = [];
    tripDistanceKmRef.current = 0;

    setIsDetecting(false);
    console.log('🔴 PRAD: Detection stopped');
  }, [isDetecting, globalIsActive, stopGPSWatch, user?.id, currentSpeed]);

  const clearAnomalies = useCallback(() => {
    setAnomalies([]);
    setClusters([]);
    setStats({ detected: 0, synced: 0, pending: 0 });
  }, []);

  // ==========================================================================
  // Auto-start on mobile — passive detection begins immediately
  // ==========================================================================

  const setAutoMode = useCallback((enabled: boolean) => {
    if (PRAD_WEB_READ_ONLY) {
      setIsAutoMode(false);
      return;
    }

    setIsAutoMode(enabled);
    if (enabled && !isDetecting && isSupported) {
      startDetection();
    } else if (!enabled && isDetecting) {
      stopDetection();
    }
  }, [isDetecting, isSupported, startDetection, stopDetection]);

  const setHapticEnabled = useCallback((enabled: boolean) => {
    hapticFeedbackService.setEnabled(enabled);
  }, []);

  /** Detect whether we're on a mobile device */
  const isMobileDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || ('ontouchstart' in window && window.innerWidth < 1024);
  }, []);

  // Auto-start: if on mobile + permissions already granted + feature enabled → start passively
  useEffect(() => {
    if (autoStartAttempted.current) return;
    if (!isSupported) return;
    if (PRAD_WEB_READ_ONLY) return;
    if (!isMobileDevice()) return;
    if (!isAutoMode && !options?.autoStart) return;

    autoStartAttempted.current = true;

    // If permission was already granted in a previous session, auto-start
    const currentPerm = sensorDataService.getPermissionState();
    if (currentPerm === 'granted' || currentPerm === 'unknown') {
      console.log('📱 PRAD: Mobile detected — auto-starting passive detection...');
      // Small delay to let the app fully mount
      const timer = setTimeout(() => {
        startDetection().catch((err) => {
          console.warn('📱 PRAD: Auto-start failed:', err);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isMobileDevice, isAutoMode, options?.autoStart, startDetection]);

  // ==========================================================================
  // Sync from global context when deferring
  // ==========================================================================

  useEffect(() => {
    if (globalIsActive && globalPRAD) {
      setAnomalies(globalPRAD.anomalies);
      setCurrentGForce(globalPRAD.currentGForce);
      setVibrationIntensity(globalPRAD.vibrationIntensity);
      setCurrentSpeed(globalPRAD.currentSpeedKmh);
      setBatteryLevel(globalPRAD.batteryLevel);
    }
  }, [globalIsActive, globalPRAD?.anomalies, globalPRAD?.currentGForce,
      globalPRAD?.vibrationIntensity, globalPRAD?.currentSpeedKmh, globalPRAD?.batteryLevel, globalPRAD]);

  // ==========================================================================
  // Battery monitor
  // ==========================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(sensorDataService.getBatteryLevel());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================================================
  // Cleanup on unmount
  // ==========================================================================

  useEffect(() => {
    return () => {
      sensorDataService.stopCapture();
      sensorUnsubRef.current?.();
      realtimeUnsubRef.current?.();
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // Client-side clustering for display
  // ==========================================================================

  useEffect(() => {
    if (anomalies.length > 2) {
      const c = anomalyDetectionEngine.clusterDetections(anomalies);
      setClusters(c);
    }
  }, [anomalies]);

  return {
    isDetecting,
    permissionState,
    anomalies,
    clusters,
    error,
    stats,
    currentSpeed,
    batteryLevel,
    isSupported,

    // Real-time metrics
    currentGForce,
    vibrationIntensity,
    isAutoMode,

    // Actions
    requestPermission,
    startDetection,
    stopDetection,
    clearAnomalies,
    setAutoMode,
    setHapticEnabled,
  };
};
