import {
  AnomalyType,
  AnomalySeverity,
  ANOMALY_VIBRATION_PATTERNS,
  SEVERITY_VIBRATION_SCALE,
} from '@/types/road-anomaly';

// ============================================================================
// HapticFeedbackService — Vibration API wrapper for anomaly feedback
//
// Provides tactile feedback when a speed breaker, pothole, or other road
// anomaly is detected.  The vibration pattern and intensity scale with the
// anomaly type and severity so the rider *feels* what was detected.
// ============================================================================

class HapticFeedbackService {
  private isSupported: boolean;
  private enabled: boolean = true;
  private readonly debug = false;

  constructor() {
    this.isSupported =
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function';

    if (this.debug) {
      if (this.isSupported) {
        console.log('📳 PRAD Haptic: Vibration API supported');
      } else {
        console.log('📳 PRAD Haptic: Vibration API NOT supported — fallback to visual only');
      }
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /** Trigger haptic feedback for a detected anomaly */
  vibrateForAnomaly(type: AnomalyType, severity: AnomalySeverity): void {
    if (!this.enabled || !this.isSupported) return;

    const pattern = ANOMALY_VIBRATION_PATTERNS[type] ?? ANOMALY_VIBRATION_PATTERNS.unknown;
    const scale = SEVERITY_VIBRATION_SCALE[severity] ?? 1.0;

    // Scale vibration durations by severity
    const scaledPattern = pattern.map((ms, i) =>
      // Only scale vibrate segments (even indices), not pause segments (odd indices)
      i % 2 === 0 ? Math.round(ms * scale) : ms
    );

    try {
      navigator.vibrate(scaledPattern);
      if (this.debug) {
        console.log(`📳 PRAD Haptic: ${type}/${severity} → pattern [${scaledPattern.join(',')}]ms`);
      }
    } catch (err) {
      console.warn('📳 PRAD Haptic: vibrate() failed:', err);
    }
  }

  /** Quick single pulse — used for UI confirmations */
  pulse(durationMs = 50): void {
    if (!this.enabled || !this.isSupported) return;
    try {
      navigator.vibrate(durationMs);
    } catch {
      // ignore
    }
  }

  /** Strong alert vibration — used for critical detections */
  alertVibrate(): void {
    if (!this.enabled || !this.isSupported) return;
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch {
      // ignore
    }
  }

  /** Cancel any ongoing vibration */
  cancel(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }

  /** Enable / disable haptic feedback  */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
    if (this.debug) {
      console.log(`📳 PRAD Haptic: ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  getIsSupported(): boolean {
    return this.isSupported;
  }
}

export const hapticFeedbackService = new HapticFeedbackService();
