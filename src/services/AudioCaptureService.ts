import {
  NoiseReading,
  SoundScopeConfig,
  DEFAULT_SOUNDSCOPE_CONFIG,
} from '@/types/sound-scope';

// ============================================================================
// AudioCaptureService — Wraps Web Audio API for real-time dB + spectral analysis
//
// Privacy-first design:
//   - NEVER records raw audio
//   - Only processes frequency-domain data (FFT bins)
//   - No speech content ever leaves the device
//   - Microphone stream is NOT piped to any recorder
// ============================================================================

type ReadingCallback = (reading: NoiseReading) => void;

class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private listeners: ReadingCallback[] = [];
  private isCapturing = false;
  private lastEmitTime = 0;
  private config: SoundScopeConfig = DEFAULT_SOUNDSCOPE_CONFIG;
  private permissionState: 'unknown' | 'granted' | 'denied' | 'prompt' = 'unknown';

  // Buffers (reused to avoid GC pressure)
  private freqDataFloat: Float32Array | null = null;
  private timeDataFloat: Float32Array | null = null;

  // ========================================================================
  // Permission
  // ========================================================================

  getPermissionState() {
    return this.permissionState;
  }

  async requestPermission(): Promise<'granted' | 'denied'> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop immediately — we just wanted to check permission
      stream.getTracks().forEach((t) => t.stop());
      this.permissionState = 'granted';
      console.log('🎤 SoundScope: Microphone permission granted');
      return 'granted';
    } catch {
      this.permissionState = 'denied';
      console.warn('🎤 SoundScope: Microphone permission denied');
      return 'denied';
    }
  }

  // ========================================================================
  // Capture Lifecycle
  // ========================================================================

  async startCapture(config?: Partial<SoundScopeConfig>): Promise<boolean> {
    if (this.isCapturing) return true;

    this.config = { ...DEFAULT_SOUNDSCOPE_CONFIG, ...config };

    try {
      // Acquire microphone stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,  // We WANT to capture real ambient noise
          autoGainControl: false,   // Don't normalize — we need real dB levels
        },
      });
      this.permissionState = 'granted';

      // Create audio pipeline
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(this.analyser);
      // NOTE: We do NOT connect analyser to audioContext.destination
      // This means nothing is played back / recorded — privacy safe

      // Allocate analysis buffers
      const binCount = this.analyser.frequencyBinCount;
      this.freqDataFloat = new Float32Array(binCount);
      this.timeDataFloat = new Float32Array(this.analyser.fftSize);

      this.isCapturing = true;
      this.lastEmitTime = 0;
      this.tick();

      console.log('🟢 SoundScope: Audio capture started', {
        fftSize: this.config.fftSize,
        readingRateHz: this.config.readingRateHz,
        sampleRate: this.audioContext.sampleRate,
      });

      return true;
    } catch (err) {
      console.error('❌ SoundScope: Failed to start capture:', err);
      this.permissionState = 'denied';
      return false;
    }
  }

  stopCapture(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;

    // Release microphone
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;

    // Tear down audio graph
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close().catch(() => {});
    }
    this.audioContext = null;
    this.analyser = null;

    console.log('🔴 SoundScope: Audio capture stopped');
  }

  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  isSupported(): boolean {
    return (
      typeof AudioContext !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function'
    );
  }

  // ========================================================================
  // Observer API
  // ========================================================================

  onReading(callback: ReadingCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private emit(reading: NoiseReading): void {
    for (const cb of this.listeners) {
      try {
        cb(reading);
      } catch (err) {
        console.error('❌ SoundScope: Listener error:', err);
      }
    }
  }

  // ========================================================================
  // Core Analysis Loop — runs via requestAnimationFrame
  // ========================================================================

  private tick = (): void => {
    if (!this.isCapturing || !this.analyser || !this.freqDataFloat || !this.timeDataFloat) return;

    const now = performance.now();
    const minInterval = 1000 / this.config.readingRateHz;

    if (now - this.lastEmitTime >= minInterval) {
      this.lastEmitTime = now;

      // Get frequency-domain data (dB scale)
      this.analyser.getFloatFrequencyData(this.freqDataFloat);
      // Get time-domain data (for zero-crossing rate)
      this.analyser.getFloatTimeDomainData(this.timeDataFloat);

      const reading = this.computeReading(this.freqDataFloat as Float32Array, this.timeDataFloat as Float32Array);
      this.emit(reading);
    }

    requestAnimationFrame(this.tick);
  };

  // ========================================================================
  // Spectral Feature Computation
  // ========================================================================

  private computeReading(freqData: Float32Array, timeData: Float32Array): NoiseReading {
    const sampleRate = this.audioContext!.sampleRate;
    const binCount = freqData.length;
    const binWidth = sampleRate / (binCount * 2); // Hz per bin

    // --- dB Level (RMS of time-domain signal → dB SPL approximation) ---
    let rmsSum = 0;
    for (let i = 0; i < timeData.length; i++) {
      rmsSum += timeData[i] * timeData[i];
    }
    const rms = Math.sqrt(rmsSum / timeData.length);
    // Convert to approximate dB SPL (calibrated for typical phone microphones)
    // Reference: 0 dB = 20 µPa, but phone mics aren't calibrated
    // We use a practical mapping: -60 dBFS ≈ 30 dB SPL, 0 dBFS ≈ 94 dB SPL
    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    const dbLevel = Math.max(0, Math.min(130, dbFS + 94)); // approximate SPL

    // --- Peak dB (max magnitude in frequency domain) ---
    let peakDb = -Infinity;
    let peakBinIndex = 0;
    for (let i = 1; i < binCount; i++) { // skip DC bin
      if (freqData[i] > peakDb) {
        peakDb = freqData[i];
        peakBinIndex = i;
      }
    }
    peakDb = Math.max(0, peakDb + 94);

    // --- Spectral Centroid (center of mass of spectrum) ---
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 1; i < binCount; i++) {
      const mag = Math.pow(10, freqData[i] / 20); // dB to linear
      const freq = i * binWidth;
      weightedSum += freq * mag;
      magnitudeSum += mag;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // --- Spectral Bandwidth (spread around centroid) ---
    let bwSum = 0;
    for (let i = 1; i < binCount; i++) {
      const mag = Math.pow(10, freqData[i] / 20);
      const freq = i * binWidth;
      bwSum += mag * Math.pow(freq - spectralCentroid, 2);
    }
    const spectralBandwidth = magnitudeSum > 0 ? Math.sqrt(bwSum / magnitudeSum) : 0;

    // --- Spectral Rolloff (frequency below which 85% of energy lives) ---
    const totalEnergy = magnitudeSum;
    let cumEnergy = 0;
    let spectralRolloff = 0;
    for (let i = 1; i < binCount; i++) {
      cumEnergy += Math.pow(10, freqData[i] / 20);
      if (cumEnergy >= totalEnergy * 0.85) {
        spectralRolloff = i * binWidth;
        break;
      }
    }

    // --- Dominant Frequency ---
    const dominantFrequency = peakBinIndex * binWidth;

    // --- Zero-Crossing Rate ---
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 0 && timeData[i - 1] < 0) || (timeData[i] < 0 && timeData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / timeData.length;

    return {
      timestamp: Date.now(),
      dbLevel: parseFloat(dbLevel.toFixed(1)),
      peakDb: parseFloat(peakDb.toFixed(1)),
      spectralCentroid: parseFloat(spectralCentroid.toFixed(0)),
      spectralBandwidth: parseFloat(spectralBandwidth.toFixed(0)),
      spectralRolloff: parseFloat(spectralRolloff.toFixed(0)),
      dominantFrequency: parseFloat(dominantFrequency.toFixed(0)),
      zeroCrossingRate: parseFloat(zeroCrossingRate.toFixed(4)),
    };
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  destroy(): void {
    this.stopCapture();
    this.listeners = [];
  }
}

export const audioCaptureService = new AudioCaptureService();
