import { SensorReading, SensorPermissionState, DetectionConfig, DEFAULT_DETECTION_CONFIG, DeviceInfo } from '@/types/road-anomaly';

// ============================================================================
// SensorDataService — Wraps DeviceMotion / DeviceOrientation APIs
// Handles permission, capture, down-sampling, gravity removal, battery awareness
// ============================================================================

type ReadingCallback = (reading: SensorReading) => void;

// Extend window for iOS 13+ permission API
interface DeviceMotionEventIOS extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

class SensorDataService {
  private isCapturing = false;
  private listeners: ReadingCallback[] = [];
  private permissionState: SensorPermissionState = 'unknown';
  private lastEmitTime = 0;
  private config: DetectionConfig = DEFAULT_DETECTION_CONFIG;

  // Gravity estimation using low-pass filter
  // 0.95 = very slow gravity adaptation → preserves sharp jolts (was 0.8 — too aggressive)
  private gravity = { x: 0, y: 0, z: 0 };
  private readonly GRAVITY_FILTER_ALPHA = 0.95;

  // Wake Lock — keeps screen/CPU awake for background detection
  private wakeLock: WakeLockSentinel | null = null;

  // Battery awareness
  private batteryLevel = 1.0;
  private batteryMonitorInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.detectCapabilities();
    this.monitorBattery();
    // Re-acquire Wake Lock when page becomes visible again
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // ==========================================================================
  // Permission Handling
  // ==========================================================================

  /** Check current permission state without requesting */
  getPermissionState(): SensorPermissionState {
    return this.permissionState;
  }

  /**
   * Request sensor permission from the user.
   * On iOS 13+ this must be called from a user gesture (click/tap handler).
   */
  async requestPermission(): Promise<SensorPermissionState> {
    // Check if DeviceMotionEvent exists at all
    if (typeof DeviceMotionEvent === 'undefined') {
      console.warn('⚠️ PRAD: DeviceMotionEvent not available');
      this.permissionState = 'unsupported';
      return this.permissionState;
    }

    // iOS 13+ requires explicit permission request
    const DME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        this.permissionState = result === 'granted' ? 'granted' : 'denied';
        console.log(`📱 PRAD: iOS sensor permission: ${this.permissionState}`);
      } catch (err) {
        console.error('❌ PRAD: iOS permission request failed:', err);
        this.permissionState = 'denied';
      }
      return this.permissionState;
    }

    // Android / desktop Chrome — permission is granted automatically
    // Verify sensor actually fires by doing a quick test
    try {
      const works = await this.probeSensor();
      this.permissionState = works ? 'granted' : 'unsupported';
    } catch {
      this.permissionState = 'unsupported';
    }
    console.log(`📱 PRAD: Sensor permission: ${this.permissionState}`);
    return this.permissionState;
  }

  /** 1-second probe to see if devicemotion fires at all */
  private probeSensor(): Promise<boolean> {
    return new Promise((resolve) => {
      let received = false;
      const handler = () => {
        received = true;
        window.removeEventListener('devicemotion', handler);
        resolve(true);
      };
      window.addEventListener('devicemotion', handler);
      setTimeout(() => {
        if (!received) {
          window.removeEventListener('devicemotion', handler);
          resolve(false);
        }
      }, 1500);
    });
  }

  // ==========================================================================
  // Capture Lifecycle
  // ==========================================================================

  /** Start capturing sensor data with the given config */
  startCapture(config?: Partial<DetectionConfig>): void {
    if (this.isCapturing) {
      console.warn('⚠️ PRAD: Sensor capture already running');
      return;
    }
    if (this.permissionState !== 'granted') {
      console.error('❌ PRAD: Cannot start capture — permission not granted');
      return;
    }

    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };
    this.isCapturing = true;
    this.lastEmitTime = 0;
    this.gravity = { x: 0, y: 0, z: 0 };

    window.addEventListener('devicemotion', this.handleMotionEvent);
    this.requestWakeLock(); // Keep screen/CPU alive for background detection
    console.log('🟢 PRAD: Sensor capture started', { samplingRateHz: this.config.samplingRateHz });
  }

  /** Stop capturing */
  stopCapture(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;
    window.removeEventListener('devicemotion', this.handleMotionEvent);
    this.releaseWakeLock();
    console.log('🔴 PRAD: Sensor capture stopped');
  }

  /** Whether the service is currently capturing sensor data */
  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  // ==========================================================================
  // Observer API — subscribe to processed readings
  // ==========================================================================

  onReading(callback: ReadingCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private emit(reading: SensorReading): void {
    for (const cb of this.listeners) {
      try {
        cb(reading);
      } catch (err) {
        console.error('❌ PRAD: Listener error:', err);
      }
    }
  }

  // ==========================================================================
  // Core Motion Handler
  // ==========================================================================

  private handleMotionEvent = (event: DeviceMotionEvent): void => {
    const now = performance.now();

    // Down-sample: only emit at configured Hz
    const minInterval = 1000 / this.getEffectiveSamplingRate();
    if (now - this.lastEmitTime < minInterval) return;
    this.lastEmitTime = now;

    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const rawX = acc.x ?? 0;
    const rawY = acc.y ?? 0;
    const rawZ = acc.z ?? 0;

    // Low-pass filter to separate gravity
    this.gravity.x = this.GRAVITY_FILTER_ALPHA * this.gravity.x + (1 - this.GRAVITY_FILTER_ALPHA) * rawX;
    this.gravity.y = this.GRAVITY_FILTER_ALPHA * this.gravity.y + (1 - this.GRAVITY_FILTER_ALPHA) * rawY;
    this.gravity.z = this.GRAVITY_FILTER_ALPHA * this.gravity.z + (1 - this.GRAVITY_FILTER_ALPHA) * rawZ;

    // Linear acceleration = raw - gravity
    const ax = rawX - this.gravity.x;
    const ay = rawY - this.gravity.y;
    const az = rawZ - this.gravity.z;

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    // Optional gyroscope data
    const rot = event.rotationRate;

    const reading: SensorReading = {
      timestamp: Date.now(),
      ax,
      ay,
      az,
      magnitude,
      gx: rot?.alpha ?? undefined,
      gy: rot?.beta ?? undefined,
      gz: rot?.gamma ?? undefined,
    };

    this.emit(reading);
  };

  // ==========================================================================
  // Battery Awareness
  // ==========================================================================

  /** Effective sampling rate adjusted for battery level */
  private getEffectiveSamplingRate(): number {
    if (this.batteryLevel < 0.1) return 5;    // critical
    if (this.batteryLevel < 0.2) return 10;   // low
    return this.config.samplingRateHz;         // normal
  }

  /** Whether battery is too low and detection should pause */
  isBatteryCritical(): boolean {
    return this.batteryLevel < 0.1;
  }

  getBatteryLevel(): number {
    return this.batteryLevel;
  }

  private async monitorBattery(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as unknown as { getBattery: () => Promise<{
          level: number;
          addEventListener: (type: string, cb: () => void) => void;
        }> }).getBattery();
        this.batteryLevel = battery.level;
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          if (this.batteryLevel < 0.1 && this.isCapturing) {
            console.warn('🪫 PRAD: Battery critical — consider pausing detection');
          }
        });
      }
    } catch {
      // Battery API not available — assume full battery
      this.batteryLevel = 1.0;
    }
  }

  // ==========================================================================
  // Device Info
  // ==========================================================================

  getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      hasAccelerometer: typeof DeviceMotionEvent !== 'undefined',
      hasGyroscope: typeof DeviceOrientationEvent !== 'undefined',
      screenOrientation: screen?.orientation?.type || 'unknown',
      platform: navigator.platform || 'unknown',
    };
  }

  /** Quick check — can this device run PRAD at all? */
  isSupported(): boolean {
    return typeof DeviceMotionEvent !== 'undefined' && typeof window !== 'undefined';
  }

  // ==========================================================================
  // Capability Detection
  // ==========================================================================

  private detectCapabilities(): void {
    if (typeof DeviceMotionEvent === 'undefined') {
      this.permissionState = 'unsupported';
      console.warn('⚠️ PRAD: DeviceMotionEvent not available on this device');
    } else {
      // On iOS 13+, permission is `prompt` until requested
      const DME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      this.permissionState = typeof DME.requestPermission === 'function' ? 'prompt' : 'unknown';
    }
  }

  // ==========================================================================
  // Wake Lock — prevents device from sleeping during detection
  // ==========================================================================

  private async requestWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          console.log('🔓 PRAD: Wake Lock released');
          this.wakeLock = null;
        });
        console.log('🔒 PRAD: Wake Lock acquired — device will stay awake');
      }
    } catch (err) {
      console.warn('⚠️ PRAD: Wake Lock request failed:', err);
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  private handleVisibilityChange = (): void => {
    // Re-acquire Wake Lock when page becomes visible (it auto-releases on hide)
    if (document.visibilityState === 'visible' && this.isCapturing) {
      this.requestWakeLock();
    }
  };

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  destroy(): void {
    this.stopCapture();
    this.listeners = [];
    this.releaseWakeLock();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.batteryMonitorInterval) {
      clearInterval(this.batteryMonitorInterval);
    }
  }
}

export const sensorDataService = new SensorDataService();
