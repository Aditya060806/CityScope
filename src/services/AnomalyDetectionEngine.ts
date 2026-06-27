import {
  SensorReading,
  AnomalyFeatures,
  AnomalyType,
  AnomalySeverity,
  DetectionConfig,
  DEFAULT_DETECTION_CONFIG,
  RoadAnomaly,
  AnomalyCluster,
} from '@/types/road-anomaly';

// ============================================================================
// AnomalyDetectionEngine — Pure algorithm, no network / DB dependencies
// Spike detection, feature extraction, classification, client-side clustering
// ============================================================================

interface SpikeEvent {
  timestamp: number;
  features: AnomalyFeatures;
  snapshot: SensorReading[];      // readings ±0.5 s around spike
  classification: {
    type: AnomalyType;
    severity: AnomalySeverity;
    confidence: number;
  };
}

class AnomalyDetectionEngine {
  private config: DetectionConfig;

  // Running statistics for adaptive threshold (O(1) incremental)
  private runningSum = 0;
  private runningSumSq = 0;
  private runningCount = 0;
  private readonly STATS_WINDOW = 100; // readings for running stats
  private recentMagnitudes: number[] = [];

  // Auto-calibration: capture noise floor during first few seconds
  private calibrated = false;
  private calibrationSamples: number[] = [];
  private noiseFloor = 0;  // baseline noise magnitude
  private readonly CALIBRATION_SAMPLES = 75; // ~3 seconds at 25 Hz

  // Pocket-mode detection: orientation is ambiguous when phone is in pocket
  private isPocketMode = false;

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };
  }

  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==========================================================================
  // 1. SPIKE DETECTION
  // ==========================================================================

  /**
   * Analyse a ring-buffer of recent readings and detect a spike.
   * Call this after each new reading is appended to the buffer.
   *
   * @returns SpikeEvent if a spike was detected, null otherwise
   */
  detectSpike(buffer: SensorReading[], currentSpeed: number): SpikeEvent | null {
    if (buffer.length < 8) return null;   // need at least 8 readings

    const latest = buffer[buffer.length - 1];
    const magnitude = latest.magnitude;

    // --- Auto-calibration phase: collect noise floor ---
    if (!this.calibrated) {
      this.calibrationSamples.push(magnitude);
      if (this.calibrationSamples.length >= this.CALIBRATION_SAMPLES) {
        const sum = this.calibrationSamples.reduce((s, v) => s + v, 0);
        this.noiseFloor = sum / this.calibrationSamples.length;
        this.calibrated = true;
        console.log(`📐 PRAD: Calibrated — noise floor = ${this.noiseFloor.toFixed(2)} m/s²`);
      }
      // Still update stats but don't detect during calibration
      this.updateRunningStats(magnitude);
      return null;
    }

    // --- Pocket-mode detection based on vertical bias ---
    // In pocket, phone orientation is random so verticalBias is ambiguous (0.2–0.5)
    // We detect this and use magnitude-only features
    if (buffer.length >= 25) {
      const recent = buffer.slice(-25);
      let zEnergy = 0, totalEnergy = 0;
      for (const r of recent) {
        zEnergy += r.az * r.az;
        totalEnergy += r.ax * r.ax + r.ay * r.ay + r.az * r.az;
      }
      const vBias = totalEnergy > 0 ? zEnergy / totalEnergy : 0.33;
      // In pocket: orientation is neither clearly vertical (>0.6) nor clearly flat (<0.15)
      this.isPocketMode = vBias > 0.15 && vBias < 0.55;
    }

    // Update running statistics (O(1) incremental)
    this.updateRunningStats(magnitude);

    const mean = this.getRunningMean();
    const stddev = this.getRunningStddev();

    // Use calibrated threshold: noise floor + absolute threshold
    const effectiveThreshold = this.calibrated
      ? Math.max(this.config.absoluteThreshold, this.noiseFloor + this.config.absoluteThreshold * 0.6)
      : this.config.absoluteThreshold;

    // Dual threshold: absolute OR adaptive
    const adaptiveThreshold = mean + this.config.adaptiveMultiplier * stddev;
    const isSpike =
      magnitude > effectiveThreshold ||
      (stddev > 1.0 && magnitude > adaptiveThreshold);

    // Speed gate — if configured, require minimum speed to avoid stationary false positives
    if (this.config.minSpeedMs > 0 && currentSpeed < this.config.minSpeedMs) return null;

    if (!isSpike) return null;

    // Extract surrounding window for feature computation
    const windowSize = Math.min(buffer.length, Math.floor(this.config.samplingRateHz * 1));
    const window = buffer.slice(-windowSize);
    const snapshot = buffer.slice(-Math.floor(this.config.samplingRateHz * 0.5));

    const features = this.extractFeatures(window, currentSpeed);
    const classification = this.classify(features);

    if (classification.confidence < this.config.minConfidence) return null;

    return {
      timestamp: latest.timestamp,
      features,
      snapshot: [...snapshot],
      classification,
    };
  }

  // ==========================================================================
  // 2. FEATURE EXTRACTION
  // ==========================================================================

  private extractFeatures(window: SensorReading[], speed: number): AnomalyFeatures {
    let peakMagnitude = 0;
    let sumSq = 0;
    let zeroCrossings = 0;
    let zAxisEnergy = 0;
    let totalEnergy = 0;

    // Track consecutive above-threshold runs for accurate duration
    let currentRunLength = 0;
    let longestRunLength = 0;

    // Check for double-peak pattern (speed breaker signature)
    const peaks: number[] = [];
    const threshold = this.config.absoluteThreshold * 0.7;

    for (let i = 0; i < window.length; i++) {
      const r = window[i];
      const mag = r.magnitude;

      if (mag > peakMagnitude) peakMagnitude = mag;
      sumSq += mag * mag;

      if (mag > threshold) {
        currentRunLength++;
        if (currentRunLength > longestRunLength) {
          longestRunLength = currentRunLength;
        }
        // Track peak indices for double-peak detection
        if (i === 0 || window[i - 1].magnitude <= threshold) {
          peaks.push(r.timestamp);
        }
      } else {
        currentRunLength = 0;
      }

      // Zero-crossing detection
      if (i > 0) {
        const prev = window[i - 1];
        if ((r.az > 0 && prev.az <= 0) || (r.az < 0 && prev.az >= 0)) {
          zeroCrossings++;
        }
      }

      // Energy decomposition
      zAxisEnergy += r.az * r.az;
      totalEnergy += r.ax * r.ax + r.ay * r.ay + r.az * r.az;
    }

    const rmsAcceleration = Math.sqrt(sumSq / window.length);
    const verticalBias = totalEnergy > 0 ? zAxisEnergy / totalEnergy : 0;
    const sampleDuration = 1000 / this.config.samplingRateHz;
    // Duration = longest consecutive run above threshold (not total count)
    const duration = longestRunLength * sampleDuration;

    // Double peak: two distinct peaks within 500 ms
    let doublePeak = false;
    if (peaks.length >= 2) {
      for (let i = 1; i < peaks.length; i++) {
        if (peaks[i] - peaks[i - 1] < 500 && peaks[i] - peaks[i - 1] > 50) {
          doublePeak = true;
          break;
        }
      }
    }

    return {
      peakMagnitude,
      duration,
      frequency: zeroCrossings,
      verticalBias,
      doublePeak,
      rmsAcceleration,
      speed,
    };
  }

  // ==========================================================================
  // 3. CLASSIFICATION — Rule-Based
  // ==========================================================================

  private classify(features: AnomalyFeatures): {
    type: AnomalyType;
    severity: AnomalySeverity;
    confidence: number;
  } {
    let type: AnomalyType = 'unknown';
    let confidence = 0.5;

    // In pocket mode, verticalBias is unreliable — rely on magnitude + duration
    const effectiveVerticalBias = this.isPocketMode
      ? Math.max(features.verticalBias, 0.5) // assume vertical when in pocket
      : features.verticalBias;

    // --- Speed Breaker ---
    // Signature: double peak, moderate magnitude, strong z-axis
    if (features.doublePeak && effectiveVerticalBias > 0.5) {
      type = 'speed_breaker';
      confidence = 0.7 + Math.min(0.25, effectiveVerticalBias * 0.3);
      if (features.peakMagnitude > 25) confidence += 0.05;
    }
    // --- Pothole ---
    // Signature: single sharp spike, short duration, high z-bias
    else if (
      features.duration < 300 &&
      features.peakMagnitude > 8 &&
      effectiveVerticalBias > 0.35
    ) {
      type = 'pothole';
      confidence = 0.55 + Math.min(0.35, (features.peakMagnitude - 8) * 0.04);
      if (effectiveVerticalBias > 0.7) confidence += 0.05;
    }
    // --- Railway Crossing --- (MUST be before rough_road — was unreachable before)
    // Signature: sustained high vibration with many zero crossings
    else if (features.duration > 600 && features.frequency > 10 && features.rmsAcceleration > 8) {
      type = 'railway_crossing';
      confidence = 0.6 + Math.min(0.2, (features.frequency - 10) * 0.02);
    }
    // --- Rough Road ---
    // Signature: sustained elevation, many zero-crossings, lower peak
    else if (features.duration > 400 && features.frequency > 6) {
      type = 'rough_road';
      confidence = 0.55 + Math.min(0.25, features.frequency * 0.02);
    }
    // --- Manhole ---
    // Signature: single sharp spike at any speed, moderate z-bias
    else if (
      features.duration < 200 &&
      effectiveVerticalBias > 0.4
    ) {
      type = 'manhole';
      confidence = 0.45;
    }
    // --- Unknown ---
    else {
      type = 'unknown';
      confidence = 0.4;
    }

    // Pocket-mode bonus: if we got a strong signal through random orientation, it's real
    if (this.isPocketMode && features.peakMagnitude > this.config.absoluteThreshold * 1.3) {
      confidence = Math.min(1.0, confidence + 0.08);
    }

    confidence = Math.min(1.0, Math.max(0, confidence));

    const severity = this.classifySeverity(features);

    return { type, severity, confidence };
  }

  private classifySeverity(features: AnomalyFeatures): AnomalySeverity {
    // Calibrated for real road events (absoluteThreshold = 8 m/s²)
    if (features.peakMagnitude > 20 || features.rmsAcceleration > 13) return 'critical';
    if (features.peakMagnitude > 14 || features.rmsAcceleration > 9)  return 'high';
    if (features.peakMagnitude > 8  || features.rmsAcceleration > 5)  return 'medium';
    return 'low';
  }

  // ==========================================================================
  // 4. CLIENT-SIDE CLUSTERING (DBSCAN-inspired)
  // ==========================================================================

  /**
   * Cluster a set of anomalies by spatial proximity.
   * Useful for offline / real-time display before server-side aggregation.
   */
  clusterDetections(
    anomalies: RoadAnomaly[],
    radiusM: number = this.config.clusterRadiusM,
    minPoints: number = this.config.minClusterCount
  ): AnomalyCluster[] {
    const visited = new Set<string>();
    const clusters: AnomalyCluster[] = [];

    for (const anomaly of anomalies) {
      if (visited.has(anomaly.id)) continue;
      visited.add(anomaly.id);

      // Find neighbors
      const neighbors = anomalies.filter(
        (other) =>
          !visited.has(other.id) &&
          this.haversineMeters(
            anomaly.location.latitude,
            anomaly.location.longitude,
            other.location.latitude,
            other.location.longitude
          ) <= radiusM
      );

      const all = [anomaly, ...neighbors];
      neighbors.forEach((n) => visited.add(n.id));

      if (all.length < minPoints) continue;

      // Compute cluster
      const centroidLat = all.reduce((s, a) => s + a.location.latitude, 0) / all.length;
      const centroidLng = all.reduce((s, a) => s + a.location.longitude, 0) / all.length;

      // Most common type
      const typeCounts: Record<string, number> = {};
      all.forEach((a) => {
        typeCounts[a.anomalyType] = (typeCounts[a.anomalyType] || 0) + 1;
      });
      const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0] as AnomalyType;

      // Average severity
      const severityMap = { low: 0.3, medium: 0.6, high: 0.9 };
      const avgSeverity = all.reduce((s, a) => s + (severityMap[a.severity] || 0.5), 0) / all.length;

      const uniqueReporters = new Set(all.map((a) => a.reporterId)).size;

      const timestamps = all.map((a) => a.createdAt.getTime());

      clusters.push({
        id: `cluster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        centroidLat,
        centroidLng,
        anomalyType: dominantType,
        severityScore: Math.min(1, avgSeverity),
        detectionCount: all.length,
        detectionRadiusM: radiusM,
        status: all.length >= minPoints ? 'probable' : 'unverified',
        issueId: null,
        firstDetected: new Date(Math.min(...timestamps)),
        lastDetected: new Date(Math.max(...timestamps)),
        uniqueReporters,
      });
    }

    return clusters;
  }

  // ==========================================================================
  // 5. HELPERS
  // ==========================================================================

  /** Haversine distance in metres */
  private haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  // Running statistics — O(1) incremental update
  private updateRunningStats(magnitude: number): void {
    this.recentMagnitudes.push(magnitude);
    this.runningSum += magnitude;
    this.runningSumSq += magnitude * magnitude;
    this.runningCount++;

    // Evict oldest value when window is full
    if (this.recentMagnitudes.length > this.STATS_WINDOW) {
      const oldest = this.recentMagnitudes.shift()!;
      this.runningSum -= oldest;
      this.runningSumSq -= oldest * oldest;
      this.runningCount--;
    }
  }

  private getRunningMean(): number {
    return this.runningCount > 0 ? this.runningSum / this.runningCount : 0;
  }

  private getRunningStddev(): number {
    if (this.runningCount < 2) return 0;
    const mean = this.getRunningMean();
    const variance = this.runningSumSq / this.runningCount - mean * mean;
    return Math.sqrt(Math.max(0, variance));
  }

  /** Reset running statistics — call when starting a new trip */
  resetStats(): void {
    this.recentMagnitudes = [];
    this.runningSum = 0;
    this.runningSumSq = 0;
    this.runningCount = 0;
    // Reset calibration so the next trip gets fresh noise floor
    this.calibrated = false;
    this.calibrationSamples = [];
    this.noiseFloor = 0;
    this.isPocketMode = false;
  }

  /** Whether the engine has completed its calibration phase */
  isCalibrated(): boolean {
    return this.calibrated;
  }

  /** Whether the engine thinks the phone is in a pocket */
  getIsPocketMode(): boolean {
    return this.isPocketMode;
  }

  /** Infer transport mode from speed (m/s) */
  inferTransportMode(speedMs: number): 'stationary' | 'walking' | 'cycling' | 'vehicle' {
    if (speedMs < 0.5) return 'stationary';
    if (speedMs < 1.7) return 'walking';    // < ~6 km/h
    if (speedMs < 7) return 'cycling';      // < ~25 km/h
    return 'vehicle';
  }
}

export const anomalyDetectionEngine = new AnomalyDetectionEngine();
