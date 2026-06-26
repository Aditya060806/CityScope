// ============================================================================
// SoundScope — Passive City Noise Intelligence Types
// ============================================================================

/** Classification of ambient noise source */
export type NoiseClassification =
  | 'traffic'
  | 'construction'
  | 'siren'
  | 'music'
  | 'horn_honking'
  | 'ambient'
  | 'silence'
  | 'unknown';

/** Noise severity level mapped to dB ranges */
export type NoiseSeverity = 'quiet' | 'moderate' | 'loud' | 'very_loud' | 'harmful';

/** A single noise reading from the microphone */
export interface NoiseReading {
  timestamp: number;
  dbLevel: number;               // A-weighted decibel level
  peakDb: number;                // peak dB in window
  spectralCentroid: number;      // weighted mean of frequencies (Hz)
  spectralBandwidth: number;     // spread of spectrum (Hz)
  spectralRolloff: number;       // frequency below which 85% of energy lives
  dominantFrequency: number;     // strongest frequency bin (Hz)
  zeroCrossingRate: number;      // how often signal crosses zero (roughness)
}

/** A classified noise sample ready for backend submission */
export interface NoiseSample {
  id: string;
  userId: string;
  location: { latitude: number; longitude: number };
  dbLevel: number;
  peakDb: number;
  classification: NoiseClassification;
  severity: NoiseSeverity;
  confidence: number;            // 0.0 – 1.0
  duration: number;              // ms — how long this classification held
  spectralSnapshot: number[];    // trimmed frequency bins for storage
  createdAt: Date;
  synced: boolean;
}

/** Aggregated noise data for heatmap display */
export interface NoiseHeatmapPoint {
  latitude: number;
  longitude: number;
  avgDb: number;
  sampleCount: number;
  dominantClassification: NoiseClassification;
  lastUpdated: Date;
}

/** Noise timeline entry for charts */
export interface NoiseTimelineEntry {
  hour: number;                  // 0-23
  avgDb: number;
  minDb: number;
  maxDb: number;
  sampleCount: number;
  dominantClassification: NoiseClassification;
}

/** Noise violation — exceeds legal limits */
export interface NoiseViolation {
  id: string;
  location: { latitude: number; longitude: number };
  dbLevel: number;
  legalLimit: number;
  classification: NoiseClassification;
  timestamp: Date;
  duration: number;              // how long the violation lasted (ms)
}

/** SoundScope configuration */
export interface SoundScopeConfig {
  /** FFT bin count (power of 2). Higher = better frequency resolution */
  fftSize: number;
  /** How often to emit readings (Hz) */
  readingRateHz: number;
  /** dB threshold below which we classify as "silence" */
  silenceThresholdDb: number;
  /** Batch submission interval (ms) — how often to send samples to backend */
  batchIntervalMs: number;
  /** Max samples to keep in local buffer */
  maxBufferSize: number;
  /** Whether to show real-time dB overlay in the app */
  showLiveIndicator: boolean;
}

export const DEFAULT_SOUNDSCOPE_CONFIG: SoundScopeConfig = {
  fftSize: 2048,
  readingRateHz: 4,              // 4 readings per second
  silenceThresholdDb: 30,
  batchIntervalMs: 30000,        // batch submit every 30s
  maxBufferSize: 500,
  showLiveIndicator: true,
};

// dB range mapping
export function getDbSeverity(db: number): NoiseSeverity {
  if (db < 40) return 'quiet';
  if (db < 60) return 'moderate';
  if (db < 80) return 'loud';
  if (db < 100) return 'very_loud';
  return 'harmful';
}

export function getDbColor(db: number): string {
  if (db < 40) return '#22c55e';  // green
  if (db < 60) return '#eab308';  // yellow
  if (db < 80) return '#f97316';  // orange
  if (db < 100) return '#ef4444'; // red
  return '#7c3aed';               // purple — harmful
}

export function getDbLabel(severity: NoiseSeverity): string {
  switch (severity) {
    case 'quiet': return 'Quiet';
    case 'moderate': return 'Moderate';
    case 'loud': return 'Loud';
    case 'very_loud': return 'Very Loud';
    case 'harmful': return 'Harmful';
  }
}

/** Indian CPCB noise limits (dB) by zone type and time */
export const NOISE_LIMITS = {
  residential: { day: 55, night: 45 },
  commercial: { day: 65, night: 55 },
  industrial: { day: 75, night: 70 },
  silence_zone: { day: 50, night: 40 },  // hospitals, schools
} as const;
