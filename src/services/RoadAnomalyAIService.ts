import { AnomalyType, AnomalySeverity, AnomalyFeatures, AnomalyCluster } from '@/types/road-anomaly';

// ============================================================================
// RoadAnomalyAIService — AI classification using Gemini API
// Follows the GeminiAIService pattern: model cascade, structured prompt, fallback
// ============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const MODEL_NAMES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
];

interface AIClassificationResult {
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}

interface RoadHealthInsight {
  overallScore: number;
  summary: string;
  recommendations: string[];
  trend: 'improving' | 'stable' | 'degrading';
}

class RoadAnomalyAIService {
  private workingModel: string | null = null;

  // ==========================================================================
  // 1. CLASSIFY SENSOR FEATURES VIA AI
  // ==========================================================================

  /**
   * Send extracted sensor features to Gemini for enhanced classification.
   * Falls back to the rule-based engine result if AI is unavailable.
   */
  async classifySensorFeatures(
    features: AnomalyFeatures,
    ruleBasedType: AnomalyType,
    ruleBasedSeverity: AnomalySeverity
  ): Promise<AIClassificationResult> {
    // Fallback if no API key
    if (!GEMINI_API_KEY) {
      return {
        anomalyType: ruleBasedType,
        severity: ruleBasedSeverity,
        confidence: 0.5,
        reasoning: 'AI unavailable — using rule-based classification',
        suggestedAction: 'Monitor area for repeat detections',
      };
    }

    const prompt = `You are an expert road condition analyst for an Indian smart city platform.

Analyse these accelerometer features captured from a smartphone mounted in a vehicle traveling at ${(features.speed * 3.6).toFixed(1)} km/h and classify the road anomaly.

Sensor Features:
- Peak acceleration: ${features.peakMagnitude.toFixed(2)} m/s²
- Duration above threshold: ${features.duration.toFixed(0)} ms
- Frequency (zero-crossings): ${features.frequency}
- Vertical bias (z-axis energy ratio): ${features.verticalBias.toFixed(3)}
- Double peak detected: ${features.doublePeak}
- RMS acceleration: ${features.rmsAcceleration.toFixed(2)} m/s²

Rule-based guess: type="${ruleBasedType}", severity="${ruleBasedSeverity}"

Respond ONLY with valid JSON (no markdown):
{
  "anomalyType": "pothole" | "speed_breaker" | "rough_road" | "manhole" | "railway_crossing" | "unknown",
  "severity": "low" | "medium" | "high",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation",
  "suggestedAction": "recommended next step"
}`;

    try {
      const result = await this.callGemini(prompt);
      if (result) {
        const parsed = JSON.parse(result);
        return {
          anomalyType: parsed.anomalyType || ruleBasedType,
          severity: parsed.severity || ruleBasedSeverity,
          confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
          reasoning: parsed.reasoning || '',
          suggestedAction: parsed.suggestedAction || '',
        };
      }
    } catch (err) {
      console.warn('⚠️ PRAD AI: Classification failed, using rule-based fallback:', err);
    }

    return {
      anomalyType: ruleBasedType,
      severity: ruleBasedSeverity,
      confidence: 0.5,
      reasoning: 'AI classification failed — using rule-based result',
      suggestedAction: 'Monitor area for repeat detections',
    };
  }

  // ==========================================================================
  // 2. VERIFY ANOMALY WITH PHOTO (multi-modal)
  // ==========================================================================

  /**
   * Cross-validate a sensor detection with a user-uploaded photo.
   */
  async verifyWithPhoto(
    imageBase64: string,
    features: AnomalyFeatures,
    currentType: AnomalyType
  ): Promise<{ verified: boolean; confidence: number; details: string }> {
    if (!GEMINI_API_KEY) {
      return { verified: false, confidence: 0, details: 'AI unavailable' };
    }

    const prompt = `You are verifying a road anomaly detection from CityScope (Indian smart city platform).

The accelerometer detected a "${currentType}" with peak=${features.peakMagnitude.toFixed(1)} m/s².
The user has now uploaded a photo of the road at that location.

Look at the photo and determine:
1. Is there a visible road defect matching "${currentType}"?
2. How severe is it?

Respond ONLY with valid JSON (no markdown):
{
  "verified": true/false,
  "confidence": 0.0 to 1.0,
  "details": "what you see in the image"
}`;

    try {
      const result = await this.callGeminiWithImage(prompt, imageBase64);
      if (result) {
        const parsed = JSON.parse(result);
        return {
          verified: !!parsed.verified,
          confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0)),
          details: parsed.details || '',
        };
      }
    } catch (err) {
      console.warn('⚠️ PRAD AI: Photo verification failed:', err);
    }

    return { verified: false, confidence: 0, details: 'Verification failed' };
  }

  // ==========================================================================
  // 3. ROAD HEALTH INSIGHTS
  // ==========================================================================

  async generateRoadHealthInsight(
    clusters: AnomalyCluster[],
    totalDetections: number,
    averageScore: number
  ): Promise<RoadHealthInsight> {
    const fallback: RoadHealthInsight = {
      overallScore: averageScore,
      summary: `${totalDetections} anomalies detected across ${clusters.length} locations.`,
      recommendations: ['Continue monitoring road conditions'],
      trend: 'stable',
    };

    if (!GEMINI_API_KEY || clusters.length === 0) return fallback;

    const clusterSummary = clusters.slice(0, 20).map((c) => ({
      type: c.anomalyType,
      detections: c.detectionCount,
      severity: c.severityScore.toFixed(2),
      reporters: c.uniqueReporters,
    }));

    const prompt = `You are a municipal road infrastructure analyst for an Indian city.

Here is a summary of road anomaly detections from CityScope:
- Total anomalies detected: ${totalDetections}
- Active hotspot clusters: ${clusters.length}
- Average road health score: ${averageScore.toFixed(1)}/100

Top clusters (max 20):
${JSON.stringify(clusterSummary, null, 2)}

Provide a concise road health analysis. Respond ONLY with valid JSON (no markdown):
{
  "overallScore": number 0-100,
  "summary": "2-3 sentence overview",
  "recommendations": ["action 1", "action 2", "action 3"],
  "trend": "improving" | "stable" | "degrading"
}`;

    try {
      const result = await this.callGemini(prompt);
      if (result) {
        const parsed = JSON.parse(result);
        return {
          overallScore: parsed.overallScore ?? averageScore,
          summary: parsed.summary ?? fallback.summary,
          recommendations: parsed.recommendations ?? fallback.recommendations,
          trend: parsed.trend ?? 'stable',
        };
      }
    } catch (err) {
      console.warn('⚠️ PRAD AI: Health insight failed:', err);
    }
    return fallback;
  }

  // ==========================================================================
  // GEMINI API CALLS (following GeminiAIService pattern)
  // ==========================================================================

  private async callGemini(prompt: string): Promise<string | null> {
    for (const model of this.getModels()) {
      try {
        const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        });

        if (!resp.ok) continue;

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          this.workingModel = model;
          // Strip markdown code fences if present
          return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private async callGeminiWithImage(prompt: string, imageBase64: string): Promise<string | null> {
    for (const model of this.getModels()) {
      try {
        const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        });

        if (!resp.ok) continue;

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          this.workingModel = model;
          return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private getModels(): string[] {
    // Prioritise last working model
    if (this.workingModel) {
      return [this.workingModel, ...MODEL_NAMES.filter((m) => m !== this.workingModel)];
    }
    return MODEL_NAMES;
  }
}

export const roadAnomalyAIService = new RoadAnomalyAIService();
