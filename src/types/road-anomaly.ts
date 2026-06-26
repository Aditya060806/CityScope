// ============================================================================
// PRAD — Passive Road Anomaly Detection Types
// ============================================================================

/** Classification of detected road anomaly */
export type AnomalyType =
  | 'pothole'
  | 'speed_breaker'
  | 'rough_road'
  | 'manhole'
  | 'railway_crossing'
  | 'unknown';

/** Severity level of a detected anomaly */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

/** Trip recording lifecycle state */
export type TripStatus = 'recording' | 'paused' | 'completed';

/** Anomaly verification lifecycle */
export type AnomalyStatus =
  | 'detected'     // raw sensor event
  | 'classified'   // AI-assigned type
  | 'clustered'    // merged with nearby detections
  | 'verified'     // confirmed by crowd / admin
  | 'resolved'     // underlying issue fixed
  | 'dismissed';   // false positive

/** Cluster verification lifecycle */
export type ClusterStatus =
  | 'unverified'   // too few detections
  | 'probable'     // meets min threshold
  | 'verified'     // confirmed
  | 'escalated'    // converted to civic Issue
  | 'resolved';

/** Transport mode inferred from speed */
export type TransportMode = 'stationary' | 'walking' | 'cycling' | 'vehicle';

// ============================================================================
// Sensor & Detection
// ============================================================================

/** Single accelerometer + optional gyroscope reading */
export interface SensorReading {
  timestamp: number;          // ms since epoch
  ax: number;                 // acceleration X (m/s²)
  ay: number;                 // acceleration Y (m/s²)
  az: number;                 // acceleration Z (m/s²)
  gx?: number;                // gyroscope X (rad/s)
  gy?: number;                // gyroscope Y (rad/s)
  gz?: number;                // gyroscope Z (rad/s)
  magnitude: number;          // √(ax² + ay² + az²)  linear acceleration
  speed?: number;             // m/s from GPS
  heading?: number;           // degrees from GPS
}

/** Features extracted from a window of sensor data around a spike */
export interface AnomalyFeatures {
  peakMagnitude: number;      // max linear acceleration  (m/s²)
  duration: number;           // ms — consecutive readings above threshold
  frequency: number;          // zero-crossings in window (proxy for roughness)
  verticalBias: number;       // ratio of z-axis energy to total (0-1)
  doublePeak: boolean;        // two spikes within 500 ms (speed breaker signature)
  rmsAcceleration: number;    // root mean square of window
  speed: number;              // instantaneous speed from GPS  (m/s)
}

/** Configurable thresholds for the detection engine */
export interface DetectionConfig {
  /** Absolute acceleration magnitude to trigger spike (m/s²). Default 18 */
  absoluteThreshold: number;
  /** Standard-deviation multiplier for adaptive threshold. Default 3.0 */
  adaptiveMultiplier: number;
  /** Target sampling rate after down-sampling (Hz). Default 20 */
  samplingRateHz: number;
  /** Minimum speed to enable detection (m/s). Default ~1.4 ≈ 5 km/h */
  minSpeedMs: number;
  /** Minimum ms between two detections (debounce). Default 2000 */
  debounceMs: number;
  /** Ring buffer size (readings). Default 200 = 10s @ 20 Hz */
  bufferSize: number;
  /** Confidence floor — reject below this. Default 0.5 */
  minConfidence: number;
  /** Cluster radius in metres for merging nearby events. Default 25 */
  clusterRadiusM: number;
  /** Minimum independent detections to form a cluster. Default 3 */
  minClusterCount: number;
}

/** Default detection config — tuned for real pothole detection on mobile Chrome */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  absoluteThreshold: 8,     // 8 m/s² ≈ 0.8g — catches real road jolts
  adaptiveMultiplier: 2.8,  // adaptive gate
  samplingRateHz: 25,
  minSpeedMs: 1.0,          // ~3.6 km/h — must be moving to avoid stationary false positives
  debounceMs: 2000,         // 2 s debounce
  bufferSize: 150,
  minConfidence: 0.45,      // raised from 0.30 — reduces false positives
  clusterRadiusM: 25,
  minClusterCount: 3,
};

// ============================================================================
// Domain Entities
// ============================================================================

/** A single geo-tagged road anomaly event */
export interface RoadAnomaly {
  id: string;
  /** Null for background (notification-bar) detections that run without an active trip */
  tripId: string | null;
  reporterId: string;
  /** Origin of detection event (app preferred for PRAD bridge) */
  source?: 'app' | 'web' | 'manual';
  /** Optional stable device identifier provided by mobile app */
  deviceId?: string;
  /** Normalized intensity used for live graph severity coloring */
  intensity?: number;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;           // 0.0 – 1.0
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  features: AnomalyFeatures | Record<string, never>;
  sensorSnapshot: SensorReading[];  // ±0.5 s around event — empty for background saves
  status: AnomalyStatus;
  verifiedCount: number;
  clusterId?: string | null;
  deviceInfo?: DeviceInfo;
  createdAt: Date;
  updatedAt: Date;
  /** Alias for createdAt — used in UI components */
  detectedAt: Date;
  /** Whether this record has been synced to Supabase */
  synced?: boolean;
}

/** Recording session while user is traveling */
export interface Trip {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: TripStatus;
  route: Array<{ lat: number; lng: number; timestamp: number }>;
  anomalyCount: number;
  distanceKm: number;
  transportMode: TransportMode;
  avgSpeed: number;             // km/h
}

/** Cluster of nearby anomaly detections from multiple users */
export interface AnomalyCluster {
  id: string;
  centroidLat: number;
  centroidLng: number;
  anomalyType: AnomalyType;
  severityScore: number;        // 0.0 – 1.0
  detectionCount: number;
  detectionRadiusM: number;
  status: ClusterStatus;
  issueId?: string | null;      // civic Issue ID if escalated
  firstDetected: Date;
  lastDetected: Date;
  uniqueReporters: number;
}

/** Road health for a map segment */
export interface RoadHealthSegment {
  id: string;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  healthScore: number;          // 0 (terrible) – 100 (perfect)
  anomalyDensity: number;       // anomalies per km
  segmentLengthM: number;
  lastUpdated: Date;
}

/** Device capabilities snapshot */
export interface DeviceInfo {
  userAgent: string;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  screenOrientation: string;
  platform: string;
}

// ============================================================================
// PRAD Stats & Dashboard
// ============================================================================

export interface PRADStats {
  totalDetections: number;
  /** Alias for totalDetections — used in dashboard components */
  totalAnomalies: number;
  verifiedClusters: number;
  totalClusters: number;
  totalTrips: number;
  uniqueContributors: number;
  autoCreatedIssues: number;
  averageConfidence: number;
  /** Average severity score 0-10 */
  averageSeverity: number;
  detectionsByType: Record<AnomalyType, number>;
  /** Alias keyed breakdown for dashboard */
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  roadHealthScore: number;      // city-wide 0-100
  activeTrips: number;
  totalDistanceKm: number;
  topHotspots: Array<{
    lat: number;
    lng: number;
    count: number;
    severity: AnomalySeverity;
  }>;
}

/** Sensor permission state machine */
export type SensorPermissionState =
  | 'unknown'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported';

// ============================================================================
// Anomaly config display
// ============================================================================

export const ANOMALY_TYPE_CONFIG = {
  pothole: {
    label: 'Pothole',
    icon: '🕳️',
    color: '#ef4444',          // red-500
    description: 'Hole or depression in the road surface',
  },
  speed_breaker: {
    label: 'Speed Breaker',
    icon: '⬆️',
    color: '#f59e0b',          // amber-500
    description: 'Speed bump or road hump',
  },
  rough_road: {
    label: 'Rough Road',
    icon: '〰️',
    color: '#f97316',          // orange-500
    description: 'Extended rough or uneven surface',
  },
  manhole: {
    label: 'Manhole',
    icon: '⚫',
    color: '#8b5cf6',          // violet-500
    description: 'Raised or sunken manhole cover',
  },
  railway_crossing: {
    label: 'Railway Crossing',
    icon: '🚂',
    color: '#6366f1',          // indigo-500
    description: 'Railway track crossing',
  },
  unknown: {
    label: 'Unknown',
    icon: '❓',
    color: '#6b7280',          // gray-500
    description: 'Unclassified road anomaly',
  },
} as const;

/**
 * Haptic vibration patterns (ms) for each anomaly type.
 * Pattern alternates: [vibrate, pause, vibrate, pause, ...]
 */
export const ANOMALY_VIBRATION_PATTERNS: Record<AnomalyType, number[]> = {
  pothole:          [200, 100, 200],           // short double buzz
  speed_breaker:    [100, 50, 100, 50, 300],   // fast ramp-up
  rough_road:       [50, 30, 50, 30, 50, 30, 50], // rapid stutter
  manhole:          [150, 100, 150],           // medium double
  railway_crossing: [300, 100, 300, 100, 300], // long triple
  unknown:          [200],                     // single pulse
};

/** Severity-scaled vibration intensity multiplier */
export const SEVERITY_VIBRATION_SCALE: Record<AnomalySeverity, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.5,
  critical: 2.0,
};

export const ANOMALY_SEVERITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#22c55e',           // green-500
    description: 'Minor bump or roughness',
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',           // amber-500
    description: 'Noticeable road defect',
  },
  high: {
    label: 'High',
    color: '#ef4444',           // red-500
    description: 'Severe damage — hazardous',
  },
  critical: {
    label: 'Critical',
    color: '#dc2626',           // red-600
    description: 'Extreme hazard — immediate danger',
  },
} as const;
