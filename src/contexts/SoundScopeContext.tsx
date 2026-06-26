import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { audioCaptureService } from '@/services/AudioCaptureService';
import { noiseClassificationEngine } from '@/services/NoiseClassificationEngine';
import { soundScopeService } from '@/services/SoundScopeService';
import {
  NoiseReading,
  NoiseClassification,
  NoiseSeverity,
  NoiseSample,
  DEFAULT_SOUNDSCOPE_CONFIG,
  getDbSeverity,
} from '@/types/sound-scope';

// ============================================================================
// SoundScopeContext — App-wide passive noise monitoring
//
// Runs alongside PRADAutoDetectionContext. On mobile, auto-starts microphone
// capture (with user permission), classifies ambient noise in real-time,
// and submits aggregated samples to the backend periodically.
// ============================================================================

const SOUNDSCOPE_ENABLED = import.meta.env.VITE_ENABLE_SOUNDSCOPE !== 'false';

export interface SoundScopeContextValue {
  // State
  isListening: boolean;
  permissionState: 'unknown' | 'granted' | 'denied' | 'prompt';
  isSupported: boolean;

  // Real-time metrics
  currentDb: number;
  peakDb: number;
  currentClassification: NoiseClassification;
  currentSeverity: NoiseSeverity;
  classificationConfidence: number;

  // Session data
  sampleCount: number;
  sessionDurationMs: number;

  // Controls
  enableSoundScope: () => Promise<void>;
  disableSoundScope: () => void;
  requestPermission: () => Promise<'granted' | 'denied'>;
}

const SoundScopeContext = createContext<SoundScopeContextValue | null>(null);

export const useSoundScope = () => {
  const ctx = useContext(SoundScopeContext);
  if (!ctx) throw new Error('useSoundScope must be within SoundScopeProvider');
  return ctx;
};

export const useSoundScopeSafe = () => useContext(SoundScopeContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const SoundScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const isSupported = audioCaptureService.isSupported() && SOUNDSCOPE_ENABLED;
  const isMobile = typeof window !== 'undefined' && (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth < 1024)
  );

  // State
  const [isListening, setIsListening] = useState(false);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [currentDb, setCurrentDb] = useState(0);
  const [peakDb, setPeakDb] = useState(0);
  const [currentClassification, setCurrentClassification] = useState<NoiseClassification>('unknown');
  const [currentSeverity, setCurrentSeverity] = useState<NoiseSeverity>('quiet');
  const [classificationConfidence, setClassificationConfidence] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [sessionStart] = useState(Date.now());

  // Refs
  const unsubRef = useRef<(() => void) | null>(null);
  const pendingSamplesRef = useRef<NoiseSample[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const autoTriedRef = useRef(false);
  const classificationStartRef = useRef(Date.now());
  const lastClassificationRef = useRef<NoiseClassification>('unknown');

  const config = DEFAULT_SOUNDSCOPE_CONFIG;

  // GPS watch for geotagging noise samples
  const startGPS = useCallback(() => {
    if (!navigator.geolocation || gpsWatchRef.current !== null) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        locationRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 10000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
  }, []);

  // Handle each noise reading
  const handleReading = useCallback((reading: NoiseReading) => {
    // Update real-time display
    setCurrentDb(reading.dbLevel);
    setPeakDb((prev) => Math.max(prev, reading.peakDb));

    // Classify
    const result = noiseClassificationEngine.addReadingAndClassify(reading);
    setCurrentClassification(result.type);
    setClassificationConfidence(parseFloat(result.confidence.toFixed(2)));
    setCurrentSeverity(getDbSeverity(reading.dbLevel));

    // Track classification duration for sample creation
    if (result.type !== lastClassificationRef.current) {
      // Classification changed — create a sample for the previous classification
      const loc = locationRef.current;
      if (loc && lastClassificationRef.current !== 'unknown') {
        const stats = noiseClassificationEngine.getWindowStats();
        const sample: NoiseSample = {
          id: `ns_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          userId: user?.id || 'anonymous',
          location: { ...loc },
          dbLevel: stats.avgDb,
          peakDb: stats.peakDb,
          classification: lastClassificationRef.current,
          severity: getDbSeverity(stats.avgDb),
          confidence: result.confidence,
          duration: Date.now() - classificationStartRef.current,
          spectralSnapshot: [reading.spectralCentroid, reading.spectralBandwidth, reading.spectralRolloff],
          createdAt: new Date(),
          synced: false,
        };
        pendingSamplesRef.current.push(sample);
        if (pendingSamplesRef.current.length > config.maxBufferSize) {
          pendingSamplesRef.current.shift();
        }
        setSampleCount((c) => c + 1);
      }
      lastClassificationRef.current = result.type;
      classificationStartRef.current = Date.now();
    }
  }, [user?.id, config.maxBufferSize]);

  // Batch submit to backend
  const flushSamples = useCallback(async () => {
    if (pendingSamplesRef.current.length === 0) return;
    const batch = [...pendingSamplesRef.current];
    pendingSamplesRef.current = [];
    await soundScopeService.submitSamples(batch);
  }, []);

  // Start listening
  const enableSoundScope = useCallback(async () => {
    if (isListening) return;
    if (!isSupported) return;

    let perm = audioCaptureService.getPermissionState();
    if (perm !== 'granted') {
      perm = await audioCaptureService.requestPermission();
      setPermissionState(perm);
      if (perm !== 'granted') return;
    }

    noiseClassificationEngine.reset();
    lastClassificationRef.current = 'unknown';
    classificationStartRef.current = Date.now();

    const started = await audioCaptureService.startCapture(config);
    if (!started) return;

    startGPS();
    unsubRef.current = audioCaptureService.onReading(handleReading);

    // Batch submit timer
    batchTimerRef.current = setInterval(flushSamples, config.batchIntervalMs);

    setIsListening(true);
    console.log('🟢 SoundScope: Passive noise monitoring STARTED');
  }, [isListening, isSupported, config, startGPS, handleReading, flushSamples]);

  const disableSoundScope = useCallback(() => {
    if (!isListening) return;
    audioCaptureService.stopCapture();
    unsubRef.current?.();
    unsubRef.current = null;
    stopGPS();
    if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    batchTimerRef.current = null;
    flushSamples(); // flush remaining
    setIsListening(false);
    console.log('🔴 SoundScope: Passive noise monitoring STOPPED');
  }, [isListening, stopGPS, flushSamples]);

  const requestPermission = useCallback(async () => {
    const result = await audioCaptureService.requestPermission();
    setPermissionState(result);
    return result;
  }, []);

  // Auto-start on mobile (if previously enabled)
  useEffect(() => {
    if (!SOUNDSCOPE_ENABLED || !isSupported || !isMobile) return;
    if (autoTriedRef.current) return;
    autoTriedRef.current = true;

    const saved = localStorage.getItem('soundscope_enabled');
    if (saved === 'false') return;

    // Only auto-start if mic was previously granted
    if (audioCaptureService.getPermissionState() === 'granted') {
      const timer = setTimeout(() => {
        enableSoundScope().catch((err) =>
          console.warn('🎤 SoundScope: Auto-start failed:', err)
        );
      }, 3000); // slight delay after PRAD starts
      return () => clearTimeout(timer);
    }
  }, [isSupported, isMobile, enableSoundScope]);

  // Persist preference
  useEffect(() => {
    if (isListening) localStorage.setItem('soundscope_enabled', 'true');
  }, [isListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioCaptureService.stopCapture();
      unsubRef.current?.();
      if (batchTimerRef.current) clearInterval(batchTimerRef.current);
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, []);

  const value: SoundScopeContextValue = {
    isListening,
    permissionState,
    isSupported,
    currentDb,
    peakDb,
    currentClassification,
    currentSeverity,
    classificationConfidence,
    sampleCount,
    sessionDurationMs: Date.now() - sessionStart,
    enableSoundScope,
    disableSoundScope,
    requestPermission,
  };

  return (
    <SoundScopeContext.Provider value={value}>
      {children}
    </SoundScopeContext.Provider>
  );
};
