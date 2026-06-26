import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sensorDataService } from '@/services/SensorDataService';
import { anomalyDetectionEngine } from '@/services/AnomalyDetectionEngine';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import { hapticFeedbackService } from '@/services/HapticFeedbackService';
import {
  SensorReading,
  RoadAnomaly,
  AnomalyCluster,
  AnomalySeverity,
  DEFAULT_DETECTION_CONFIG,
  SensorPermissionState,
} from '@/types/road-anomaly';

// ============================================================================
// PRADAutoDetectionContext — App-wide passive road anomaly detection
//
// Wraps the entire app. On mobile devices it auto-starts accelerometer
// capture the moment the user opens the web-app, detecting every pothole
// and speed-breaker in the background while the user goes about using
// any other page. The phone vibrates on detection, metrics are computed
// continuously, and everything is synced to the backend.
// ============================================================================

const PRAD_ENABLED = import.meta.env.VITE_ENABLE_ROAD_ANOMALY_DETECTION !== 'false';
const PRAD_WEB_READ_ONLY = import.meta.env.VITE_PRAD_WEB_READ_ONLY !== 'false';

export interface PRADContextValue {
  // Detection state
  isDetecting: boolean;
  isAutoMode: boolean;
  permissionState: SensorPermissionState;
  isSupported: boolean;
  isMobile: boolean;

  // Real-time metrics — updated every sensor reading
  currentGForce: number;        // acceleration in g (1g = 9.81 m/s²)
  vibrationIntensity: number;   // 0-100 smoothed vibration level
  currentSpeedKmh: number;      // GPS speed in km/h
  batteryLevel: number;         // 0.0 – 1.0

  // Cumulative session metrics
  anomalyCount: number;
  anomalies: RoadAnomaly[];
  clusters: AnomalyCluster[];
  sessionDistanceKm: number;
  sessionDurationMs: number;
  lastAnomaly: RoadAnomaly | null;

  // Controls
  enableAutoDetection: () => Promise<void>;
  disableAutoDetection: () => void;
  requestPermission: () => Promise<SensorPermissionState>;
  setHapticEnabled: (enabled: boolean) => void;
}

const PRADAutoDetectionContext = createContext<PRADContextValue | null>(null);

export const usePRADAutoDetection = () => {
  const ctx = useContext(PRADAutoDetectionContext);
  if (!ctx) {
    throw new Error('usePRADAutoDetection must be within PRADAutoDetectionProvider');
  }
  return ctx;
};

/** Optional hook that returns null when outside the provider (safe for lazy use) */
export const usePRADAutoDetectionSafe = () => useContext(PRADAutoDetectionContext);

// ---------------------------------------------------------------------------
// Haversine helper — distance between two GPS points in metres
// ---------------------------------------------------------------------------

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const PRADAutoDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Feature gate
  const isSupported = typeof DeviceMotionEvent !== 'undefined' && PRAD_ENABLED && !PRAD_WEB_READ_ONLY;
  const isMobile = typeof window !== 'undefined' && (
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth < 1024)
  );

  // State
  const [isDetecting, setIsDetecting] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [permissionState, setPermissionState] = useState<SensorPermissionState>(
    sensorDataService.getPermissionState()
  );

  // Real-time metrics
  const [currentGForce, setCurrentGForce] = useState(0);
  const [vibrationIntensity, setVibrationIntensity] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(1);

  // Detections
  const [anomalies, setAnomalies] = useState<RoadAnomaly[]>([]);
  const [clusters, setClusters] = useState<AnomalyCluster[]>([]);
  const [lastAnomaly, setLastAnomaly] = useState<RoadAnomaly | null>(null);
  const [sessionDistanceKm, setSessionDistanceKm] = useState(0);
  const [sessionStart] = useState(Date.now());

  // Refs
  const bufferRef = useRef<SensorReading[]>([]);
  const gpsWatchRef = useRef<number | null>(null);
  const lastDetectionRef = useRef(0);
  const speedRef = useRef(0);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const prevLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const routeRef = useRef<{ latitude: number; longitude: number }[]>([]);
  const sensorUnsubRef = useRef<(() => void) | null>(null);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);
  const autoTriedRef = useRef(false);

  const config = DEFAULT_DETECTION_CONFIG;

  // ==========================================================================
  // Permission
  // ==========================================================================

  const requestPermission = useCallback(async (): Promise<SensorPermissionState> => {
    try {
      const state = await sensorDataService.requestPermission();
      setPermissionState(state);
      return state;
    } catch {
      setPermissionState('denied');
      return 'denied';
    }
  }, []);

  // ==========================================================================
  // GPS
  // ==========================================================================

  const startGPS = useCallback(() => {
    if (!navigator.geolocation || gpsWatchRef.current !== null) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        locationRef.current = newLoc;
        const speedMs = pos.coords.speed ?? 0;
        speedRef.current = speedMs;
        setCurrentSpeedKmh(parseFloat((speedMs * 3.6).toFixed(1)));

        // Track real route + accumulate distance
        routeRef.current.push(newLoc);
        if (prevLocationRef.current) {
          const dMeters = haversineMeters(
            prevLocationRef.current.latitude, prevLocationRef.current.longitude,
            newLoc.latitude, newLoc.longitude
          );
          // Only accumulate if the movement is plausible (>2m, <500m per fix)
          if (dMeters > 2 && dMeters < 500) {
            setSessionDistanceKm(prev => parseFloat((prev + dMeters / 1000).toFixed(3)));
          }
        }
        prevLocationRef.current = newLoc;
      },
      () => { /* silent */ },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
  }, []);

  // ==========================================================================
  // Sensor handler — processes every reading + detects spikes
  // ==========================================================================

  const handleReading = useCallback((reading: SensorReading) => {
    reading.speed = speedRef.current;
    const buffer = bufferRef.current;
    buffer.push(reading);
    if (buffer.length > config.bufferSize) buffer.shift();

    // --- Real-time metrics ---
    const gForce = reading.magnitude / 9.81;
    setCurrentGForce(parseFloat(gForce.toFixed(2)));
    const rawIntensity = Math.min(100, (reading.magnitude / config.absoluteThreshold) * 100);
    setVibrationIntensity((prev) =>
      parseFloat((0.3 * rawIntensity + 0.7 * prev).toFixed(1))
    );

    // --- Spike detection ---
    const spike = anomalyDetectionEngine.detectSpike(buffer, speedRef.current);
    if (!spike) return;

    const now = Date.now();
    if (now - lastDetectionRef.current < config.debounceMs) return;
    lastDetectionRef.current = now;

    const loc = locationRef.current;
    if (!loc) return;

    let severity: AnomalySeverity = spike.classification.severity;
    if (spike.features.peakMagnitude > config.absoluteThreshold * 2) {
      severity = 'critical';
    }

    const detectedAt = new Date();
    const anomaly: RoadAnomaly = {
      id: `prad_${now}_${Math.random().toString(36).slice(2, 8)}`,
      tripId: 'auto',
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
      `🚧 PRAD-AUTO: ${spike.classification.type} (${severity}) ` +
      `peak=${spike.features.peakMagnitude.toFixed(1)} ` +
      `(${gForce.toFixed(1)}g) ` +
      `conf=${spike.classification.confidence.toFixed(2)} ` +
      `@ [${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}]`
    );

    // 📳 VIBRATE the phone!
    hapticFeedbackService.vibrateForAnomaly(spike.classification.type, severity);

    setAnomalies((prev) => [anomaly, ...prev].slice(0, 500));
    setLastAnomaly(anomaly);

    // Async backend submit
    roadAnomalyService.submitAnomaly(anomaly).catch(async () => {
      try {
        const { offlineService } = await import('@/services/OfflineService');
        await offlineService.queueOperation('SUBMIT_ANOMALY' as never, anomaly, 'medium');
      } catch { /* give up silently */ }
    });
  }, [user?.id, config]);

  // ==========================================================================
  // Start / Stop
  // ==========================================================================

  const startDetection = useCallback(async () => {
    if (PRAD_WEB_READ_ONLY) return;
    if (isDetecting) return;
    if (!isSupported) return;

    // Request permission if needed
    let perm = sensorDataService.getPermissionState();
    if (perm !== 'granted') {
      perm = await requestPermission();
      if (perm !== 'granted') return;
    }

    bufferRef.current = [];
    anomalyDetectionEngine.resetStats();
    lastDetectionRef.current = 0;

    startGPS();
    sensorDataService.startCapture(config);
    sensorUnsubRef.current = sensorDataService.onReading(handleReading);

    // Real-time subscription for community detections
    realtimeUnsubRef.current = roadAnomalyService.subscribeToAnomalies((a) => {
      setAnomalies((prev) => {
        if (prev.some((x) => x.id === a.id)) return prev;
        return [a, ...prev].slice(0, 500);
      });
    });

    setIsDetecting(true);
    setIsAutoMode(true);
    console.log('🟢 PRAD-AUTO: Passive detection STARTED on mobile');
  }, [isDetecting, isSupported, requestPermission, startGPS, handleReading, config]);

  const stopDetection = useCallback(() => {
    if (!isDetecting) return;
    sensorDataService.stopCapture();
    sensorUnsubRef.current?.();
    sensorUnsubRef.current = null;
    realtimeUnsubRef.current?.();
    realtimeUnsubRef.current = null;
    stopGPS();
    setIsDetecting(false);
    setIsAutoMode(false);
    console.log('🔴 PRAD-AUTO: Passive detection STOPPED');
  }, [isDetecting, stopGPS]);

  const enableAutoDetection = useCallback(async () => {
    await startDetection();
  }, [startDetection]);

  const disableAutoDetection = useCallback(() => {
    stopDetection();
  }, [stopDetection]);

  const setHapticEnabled = useCallback((enabled: boolean) => {
    hapticFeedbackService.setEnabled(enabled);
  }, []);

  // ==========================================================================
  // AUTO-START on mobile — this is the magic
  // ==========================================================================

  useEffect(() => {
    if (!PRAD_ENABLED || PRAD_WEB_READ_ONLY || !isSupported || !isMobile) return;
    if (autoTriedRef.current) return;
    autoTriedRef.current = true;

    // Check if we've previously been granted permission (persist across sessions)
    const savedPref = localStorage.getItem('prad_auto_enabled');
    if (savedPref === 'false') return; // user explicitly opted-out

    const perm = sensorDataService.getPermissionState();
    // On Android, permission is 'unknown' (auto-granted). On iOS, it's 'prompt' until user taps.
    // We auto-start when it's 'granted' or 'unknown' (Android).
    if (perm === 'granted' || perm === 'unknown') {
      console.log('📱 PRAD-AUTO: Mobile device detected — auto-starting in 2s...');
      const timer = setTimeout(() => {
        startDetection().catch((err) =>
          console.warn('📱 PRAD-AUTO: Auto-start failed:', err)
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isMobile, startDetection]);

  // Battery monitor
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(sensorDataService.getBatteryLevel());

      // Auto-pause on critical battery
      if (sensorDataService.isBatteryCritical() && isDetecting) {
        console.warn('🪫 PRAD-AUTO: Battery critical — pausing detection');
        stopDetection();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isDetecting, stopDetection]);

  // Visibility monitor — warn when page goes to background
  // Detection continues via Wake Lock + devicemotion, but tab throttling may occur
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && isDetecting) {
        console.log('👁️ PRAD-AUTO: Page hidden — detection continues via Wake Lock');
      } else if (document.visibilityState === 'visible' && isDetecting) {
        console.log('👁️ PRAD-AUTO: Page visible — resuming full-speed detection');
        // Re-initialize GPS in case it was throttled
        if (gpsWatchRef.current === null) {
          startGPS();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isDetecting, startGPS]);

  // Re-cluster when anomalies change
  useEffect(() => {
    if (anomalies.length > 2) {
      setClusters(anomalyDetectionEngine.clusterDetections(anomalies));
    }
  }, [anomalies]);

  // Cleanup
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

  // Persist auto-mode preference
  useEffect(() => {
    if (isAutoMode) {
      localStorage.setItem('prad_auto_enabled', 'true');
    }
  }, [isAutoMode]);

  const sessionDurationMs = Date.now() - sessionStart;

  const value: PRADContextValue = {
    isDetecting,
    isAutoMode,
    permissionState,
    isSupported,
    isMobile,
    currentGForce,
    vibrationIntensity,
    currentSpeedKmh,
    batteryLevel,
    anomalyCount: anomalies.length,
    anomalies,
    clusters,
    sessionDistanceKm,
    sessionDurationMs,
    lastAnomaly,
    enableAutoDetection,
    disableAutoDetection,
    requestPermission,
    setHapticEnabled,
  };

  return (
    <PRADAutoDetectionContext.Provider value={value}>
      {children}
    </PRADAutoDetectionContext.Provider>
  );
};
