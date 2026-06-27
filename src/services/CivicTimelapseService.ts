import { supabase } from '@/lib/supabase';
import { MonitoringPoint, TimelapseCapture, DecayTimeline } from '@/types/civic-timelapse';

// ============================================================================
// CivicTimelapseService — Infrastructure decay tracking with AI analysis
// ============================================================================

class CivicTimelapseService {
  // ========================================================================
  // Monitoring Points CRUD
  // ========================================================================

  async createMonitoringPoint(
    title: string,
    description: string,
    category: MonitoringPoint['category'],
    location: { latitude: number; longitude: number },
    userId: string
  ): Promise<MonitoringPoint | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('monitoring_points')
        .insert({
          title, description, category,
          latitude: location.latitude,
          longitude: location.longitude,
          created_by: userId,
          decay_score: 0,
          capture_count: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') { console.warn('⚠️ TimeLapse: table not found'); return null; }
        throw error;
      }
      return this.convertPoint(data);
    } catch (err) {
      console.error('❌ TimeLapse: Failed to create monitoring point:', err);
      return null;
    }
  }

  async getNearbyPoints(
    location: { latitude: number; longitude: number },
    radiusKm = 5
  ): Promise<MonitoringPoint[]> {
    if (!supabase) return [];
    try {
      const delta = radiusKm / 111;
      const { data } = await supabase
        .from('monitoring_points')
        .select('*')
        .gte('latitude', location.latitude - delta)
        .lte('latitude', location.latitude + delta)
        .gte('longitude', location.longitude - delta)
        .lte('longitude', location.longitude + delta)
        .order('decay_score', { ascending: false })
        .limit(50);
      return (data || []).map(this.convertPoint);
    } catch { return []; }
  }

  // ========================================================================
  // Capture Submission
  // ========================================================================

  async submitCapture(
    pointId: string,
    userId: string,
    photo: File,
    notes?: string
  ): Promise<{ success: boolean; capture?: TimelapseCapture; message: string }> {
    if (!supabase) return { success: false, message: 'Database unavailable' };

    try {
      // 1. Upload photo
      const fileName = `timelapse/${pointId}/${Date.now()}_${photo.name.replace(/\s+/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('timelapse-photos').upload(fileName, photo);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('timelapse-photos').getPublicUrl(fileName);
      const photoUrl = urlData?.publicUrl || '';

      // 2. Get previous capture for diff comparison
      const { data: prevCaptures } = await supabase
        .from('timelapse_captures')
        .select('id, photo_url, ai_analysis')
        .eq('monitoring_point_id', pointId)
        .order('captured_at', { ascending: false })
        .limit(1);

      const prevCapture = prevCaptures?.[0] || null;

      // 3. AI analysis of the photo
      const aiAnalysis = await this.analyzeInfrastructure(photoUrl, prevCapture?.photo_url);

      // 4. Compute visual diff score (simple estimation from AI)
      const diffScore = prevCapture ? this.estimateDiffScore(prevCapture.ai_analysis, aiAnalysis) : null;

      // 5. Insert capture
      const { data: capture, error: insertErr } = await supabase
        .from('timelapse_captures')
        .insert({
          monitoring_point_id: pointId,
          captured_by: userId,
          photo_url: photoUrl,
          thumbnail_url: photoUrl,
          ai_analysis: aiAnalysis,
          diff_score: diffScore,
          notes,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 6. Update monitoring point stats
      const newScore = aiAnalysis?.conditionScore ? (100 - aiAnalysis.conditionScore) : 0;
      await supabase
        .from('monitoring_points')
        .update({
          decay_score: newScore,
          capture_count: prevCapture ? (prevCaptures?.length || 0) + 1 : 1,
          last_captured_at: new Date().toISOString(),
        })
        .eq('id', pointId);

      return { success: true, capture: this.convertCapture(capture), message: 'Capture submitted with AI analysis' };
    } catch (err) {
      console.error('❌ TimeLapse: Capture failed:', err);
      return { success: false, message: 'Failed to submit capture' };
    }
  }

  // ========================================================================
  // Decay Timeline
  // ========================================================================

  async getDecayTimeline(pointId: string): Promise<DecayTimeline | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase
        .from('timelapse_captures')
        .select('*')
        .eq('monitoring_point_id', pointId)
        .order('captured_at', { ascending: true });

      if (!data || data.length === 0) return null;

      const captures = data.map(this.convertCapture);
      const decayTrend = captures.map((c) => ({
        date: c.capturedAt,
        score: c.aiAnalysis ? (100 - c.aiAnalysis.conditionScore) : 0,
      }));

      // Compute overall decay rate
      let rate: DecayTimeline['overallDecayRate'] = 'stable';
      if (decayTrend.length >= 2) {
        const first = decayTrend[0].score;
        const last = decayTrend[decayTrend.length - 1].score;
        const diff = last - first;
        if (diff > 40) rate = 'critical';
        else if (diff > 25) rate = 'rapid';
        else if (diff > 10) rate = 'moderate';
        else if (diff > 3) rate = 'slow';
      }

      return { monitoringPointId: pointId, captures, decayTrend, overallDecayRate: rate };
    } catch { return null; }
  }

  // ========================================================================
  // AI Analysis (Gemini Vision via Supabase Edge Function or direct API)
  // ========================================================================

  private async analyzeInfrastructure(
    photoUrl: string,
    _prevPhotoUrl?: string
  ): Promise<TimelapseCapture['aiAnalysis']> {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return this.fallbackAnalysis();

      const prompt = `Analyze this infrastructure photo. Rate the structural condition from 0-100 (100=perfect, 0=destroyed). List specific issues detected (cracks, erosion, rust, displacement, etc). Rate decay rate as: stable, slow, moderate, rapid, or critical. Provide a 1-sentence recommendation. Return JSON only: {"conditionScore": number, "issuesDetected": string[], "decayRate": string, "recommendation": string}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: await this.urlToBase64(photoUrl) } }
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
          }),
        }
      );

      if (!response.ok) return this.fallbackAnalysis();

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.fallbackAnalysis();

      return JSON.parse(jsonMatch[0]);
    } catch {
      return this.fallbackAnalysis();
    }
  }

  private async urlToBase64(url: string): Promise<string> {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || '');
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  private fallbackAnalysis(): TimelapseCapture['aiAnalysis'] {
    return {
      conditionScore: 70,
      issuesDetected: ['Visual analysis unavailable — manual review recommended'],
      decayRate: 'stable',
      recommendation: 'Schedule periodic monitoring to track changes over time',
    };
  }

  private estimateDiffScore(
    prevAnalysis: any,
    currentAnalysis: TimelapseCapture['aiAnalysis']
  ): number {
    if (!prevAnalysis || !currentAnalysis) return 0;
    const prevScore = prevAnalysis.conditionScore || 70;
    const currentScore = currentAnalysis.conditionScore || 70;
    return Math.abs(currentScore - prevScore) / 100;
  }

  // ========================================================================
  // Converters
  // ========================================================================

  private convertPoint(row: Record<string, any>): MonitoringPoint {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      category: row.category || 'other',
      location: { latitude: row.latitude, longitude: row.longitude },
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      captureCount: row.capture_count || 0,
      decayScore: row.decay_score || 0,
      lastCapturedAt: row.last_captured_at ? new Date(row.last_captured_at) : null,
    };
  }

  private convertCapture(row: Record<string, any>): TimelapseCapture {
    return {
      id: row.id,
      monitoringPointId: row.monitoring_point_id,
      capturedBy: row.captured_by,
      photoUrl: row.photo_url,
      thumbnailUrl: row.thumbnail_url || row.photo_url,
      aiAnalysis: row.ai_analysis || null,
      diffScore: row.diff_score,
      capturedAt: new Date(row.captured_at || row.created_at),
      notes: row.notes,
    };
  }
}

export const civicTimelapseService = new CivicTimelapseService();
