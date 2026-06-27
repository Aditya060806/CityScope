import { NoiseReading, NoiseClassification } from '@/types/sound-scope';

// ============================================================================
// NoiseClassificationEngine — Rule-based ambient noise classifier
//
// Uses spectral features (centroid, bandwidth, rolloff, dominant frequency,
// zero-crossing rate, dB level) to classify noise sources without ML models.
// Privacy-safe: only analyses frequency-domain features, never raw audio.
// ============================================================================

interface ClassificationResult {
  type: NoiseClassification;
  confidence: number;  // 0.0 – 1.0
}

class NoiseClassificationEngine {
  // Running average for stable classification (accumulates over N readings)
  private recentReadings: NoiseReading[] = [];
  private readonly WINDOW_SIZE = 10; // ~2.5 seconds at 4 Hz

  /**
   * Classify the current noise environment from a single reading.
   * For better accuracy, call `classifyWindow()` with buffered readings.
   */
  classifySingle(reading: NoiseReading): ClassificationResult {
    // --- Silence ---
    if (reading.dbLevel < 35) {
      return { type: 'silence', confidence: 0.9 };
    }

    // --- Siren --- (high-pitched, narrow bandwidth, very loud)
    // Sirens have dominant frequency 500-3000 Hz, very narrow spectral bandwidth
    if (
      reading.dominantFrequency > 500 &&
      reading.dominantFrequency < 3000 &&
      reading.spectralBandwidth < 800 &&
      reading.dbLevel > 70
    ) {
      return { type: 'siren', confidence: 0.7 + Math.min(0.2, (reading.dbLevel - 70) * 0.01) };
    }

    // --- Horn Honking --- (sharp bursts, mid-frequency, high zero-crossing)
    if (
      reading.dominantFrequency > 300 &&
      reading.dominantFrequency < 1500 &&
      reading.zeroCrossingRate > 0.15 &&
      reading.dbLevel > 65
    ) {
      return { type: 'horn_honking', confidence: 0.6 + Math.min(0.2, reading.zeroCrossingRate * 0.5) };
    }

    // --- Construction --- (low-frequency dominant, high power, broadband)
    // Jackhammers, drilling: strong <500 Hz, high dB, broad spectrum
    if (
      reading.spectralCentroid < 800 &&
      reading.dominantFrequency < 500 &&
      reading.spectralBandwidth > 1500 &&
      reading.dbLevel > 65
    ) {
      return { type: 'construction', confidence: 0.65 + Math.min(0.2, (reading.dbLevel - 65) * 0.01) };
    }

    // --- Traffic --- (broadband, mid-centroid, steady, moderate-to-loud)
    // Continuous road noise: centroid 500-2000 Hz, moderate bandwidth
    if (
      reading.spectralCentroid > 400 &&
      reading.spectralCentroid < 2500 &&
      reading.spectralBandwidth > 1000 &&
      reading.dbLevel > 50
    ) {
      return { type: 'traffic', confidence: 0.55 + Math.min(0.2, (reading.dbLevel - 50) * 0.005) };
    }

    // --- Music --- (harmonic, mid-to-high centroid, moderate bandwidth)
    if (
      reading.spectralCentroid > 1000 &&
      reading.spectralCentroid < 5000 &&
      reading.spectralBandwidth > 500 &&
      reading.spectralBandwidth < 3000 &&
      reading.dbLevel > 45
    ) {
      return { type: 'music', confidence: 0.45 };
    }

    // --- Ambient --- (low dB, broad spectrum, no dominant feature)
    if (reading.dbLevel < 55) {
      return { type: 'ambient', confidence: 0.6 };
    }

    return { type: 'unknown', confidence: 0.3 };
  }

  /**
   * Classify using a window of recent readings for more stable results.
   * Uses majority voting across individual classifications.
   */
  classifyWindow(readings: NoiseReading[]): ClassificationResult {
    if (readings.length === 0) return { type: 'unknown', confidence: 0 };

    const votes: Record<NoiseClassification, { count: number; totalConf: number }> = {
      traffic: { count: 0, totalConf: 0 },
      construction: { count: 0, totalConf: 0 },
      siren: { count: 0, totalConf: 0 },
      music: { count: 0, totalConf: 0 },
      horn_honking: { count: 0, totalConf: 0 },
      ambient: { count: 0, totalConf: 0 },
      silence: { count: 0, totalConf: 0 },
      unknown: { count: 0, totalConf: 0 },
    };

    for (const r of readings) {
      const c = this.classifySingle(r);
      votes[c.type].count++;
      votes[c.type].totalConf += c.confidence;
    }

    // Find winner by weighted score (count * avgConfidence)
    let winner: NoiseClassification = 'unknown';
    let bestScore = 0;

    for (const [type, data] of Object.entries(votes) as [NoiseClassification, { count: number; totalConf: number }][]) {
      const avgConf = data.count > 0 ? data.totalConf / data.count : 0;
      const score = data.count * avgConf;
      if (score > bestScore) {
        bestScore = score;
        winner = type;
      }
    }

    const winnerData = votes[winner];
    const confidence = winnerData.count > 0
      ? (winnerData.totalConf / winnerData.count) * Math.min(1, winnerData.count / (readings.length * 0.5))
      : 0;

    return {
      type: winner,
      confidence: Math.min(1, Math.max(0, confidence)),
    };
  }

  /**
   * Feed a reading and get running classification over the sliding window.
   */
  addReadingAndClassify(reading: NoiseReading): ClassificationResult {
    this.recentReadings.push(reading);
    if (this.recentReadings.length > this.WINDOW_SIZE) {
      this.recentReadings.shift();
    }
    return this.classifyWindow(this.recentReadings);
  }

  /**
   * Get the average dB and peak dB from the current window.
   */
  getWindowStats(): { avgDb: number; peakDb: number; readingCount: number } {
    if (this.recentReadings.length === 0) {
      return { avgDb: 0, peakDb: 0, readingCount: 0 };
    }
    const avgDb = this.recentReadings.reduce((s, r) => s + r.dbLevel, 0) / this.recentReadings.length;
    const peakDb = Math.max(...this.recentReadings.map((r) => r.peakDb));
    return { avgDb: parseFloat(avgDb.toFixed(1)), peakDb, readingCount: this.recentReadings.length };
  }

  reset(): void {
    this.recentReadings = [];
  }
}

export const noiseClassificationEngine = new NoiseClassificationEngine();
