import { supabase } from '@/lib/supabase';
import { NoiseSample, NoiseHeatmapPoint, NoiseTimelineEntry } from '@/types/sound-scope';

// ============================================================================
// SoundScopeService — Supabase CRUD for noise samples, heatmap, timeline
// ============================================================================

class SoundScopeService {
  /** Set to true after first PGRST205 to stop hammering missing table */
  private tableUnavailable = false;

  /**
   * Submit a batch of noise samples to the backend.
   * Called periodically by SoundScopeContext.
   */
  async submitSamples(samples: NoiseSample[]): Promise<boolean> {
    if (!supabase || samples.length === 0 || this.tableUnavailable) return false;
    try {
      const rows = samples.map((s) => ({
        id: s.id,
        user_id: s.userId,
        latitude: s.location.latitude,
        longitude: s.location.longitude,
        db_level: s.dbLevel,
        peak_db: s.peakDb,
        classification: s.classification,
        severity: s.severity,
        confidence: s.confidence,
        duration: s.duration,
        spectral_snapshot: s.spectralSnapshot,
        created_at: s.createdAt.toISOString(),
      }));

      const { error } = await supabase.from('noise_samples').insert(rows);
      if (error) {
        // Table might not exist yet — graceful degradation
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          this.tableUnavailable = true;
          console.warn('⚠️ SoundScope: noise_samples table not found — run migration-new-features.sql in Supabase');
          return false;
        }
        console.error('❌ SoundScope: Failed to submit samples:', error);
        return false;
      }
      console.log(`📡 SoundScope: Submitted ${samples.length} noise samples`);
      return true;
    } catch (err) {
      console.error('❌ SoundScope: Submit failed:', err);
      return false;
    }
  }

  /**
   * Get aggregated noise heatmap data for a map viewport.
   */
  async getNoiseHeatmap(
    bounds: { north: number; south: number; east: number; west: number },
    hoursBack = 24
  ): Promise<NoiseHeatmapPoint[]> {
    if (!supabase || this.tableUnavailable) return [];
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('noise_samples')
        .select('latitude, longitude, db_level, classification, created_at')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error || !data) {
        if ((error as { code?: string })?.code === 'PGRST205') this.tableUnavailable = true;
        return [];
      }
      const grid = new Map<string, { lat: number; lng: number; totalDb: number; count: number; classifications: Record<string, number>; lastUpdated: Date }>();
      
      for (const row of data) {
        const gridKey = `${(row.latitude * 100).toFixed(0)}_${(row.longitude * 100).toFixed(0)}`;
        const entry = grid.get(gridKey) || {
          lat: row.latitude,
          lng: row.longitude,
          totalDb: 0,
          count: 0,
          classifications: {},
          lastUpdated: new Date(row.created_at),
        };
        entry.totalDb += row.db_level;
        entry.count++;
        entry.classifications[row.classification] = (entry.classifications[row.classification] || 0) + 1;
        grid.set(gridKey, entry);
      }

      return Array.from(grid.values()).map((g) => {
        const dominant = Object.entries(g.classifications).sort((a, b) => b[1] - a[1])[0];
        return {
          latitude: g.lat,
          longitude: g.lng,
          avgDb: parseFloat((g.totalDb / g.count).toFixed(1)),
          sampleCount: g.count,
          dominantClassification: (dominant?.[0] || 'unknown') as NoiseSample['classification'],
          lastUpdated: g.lastUpdated,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Get hourly noise timeline for a specific location (within ~500m radius).
   */
  async getNoiseTimeline(
    location: { latitude: number; longitude: number },
    hoursBack = 24
  ): Promise<NoiseTimelineEntry[]> {
    if (!supabase || this.tableUnavailable) return [];
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      const delta = 0.005; // ~500m

      const { data, error } = await supabase
        .from('noise_samples')
        .select('db_level, peak_db, classification, created_at')
        .gte('latitude', location.latitude - delta)
        .lte('latitude', location.latitude + delta)
        .gte('longitude', location.longitude - delta)
        .lte('longitude', location.longitude + delta)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error || !data) {
        if ((error as { code?: string })?.code === 'PGRST205') this.tableUnavailable = true;
        return [];
      }

      // Group by hour
      const hourly = new Map<number, { dbs: number[]; peaks: number[]; classifications: Record<string, number> }>();
      for (const row of data) {
        const hour = new Date(row.created_at).getHours();
        const entry = hourly.get(hour) || { dbs: [], peaks: [], classifications: {} };
        entry.dbs.push(row.db_level);
        entry.peaks.push(row.peak_db || row.db_level);
        entry.classifications[row.classification] = (entry.classifications[row.classification] || 0) + 1;
        hourly.set(hour, entry);
      }

      return Array.from(hourly.entries()).map(([hour, d]) => {
        const dominant = Object.entries(d.classifications).sort((a, b) => b[1] - a[1])[0];
        return {
          hour,
          avgDb: parseFloat((d.dbs.reduce((s, v) => s + v, 0) / d.dbs.length).toFixed(1)),
          minDb: Math.min(...d.dbs),
          maxDb: Math.max(...d.dbs),
          sampleCount: d.dbs.length,
          dominantClassification: (dominant?.[0] || 'unknown') as NoiseSample['classification'],
        };
      }).sort((a, b) => a.hour - b.hour);
    } catch {
      return [];
    }
  }
}

export const soundScopeService = new SoundScopeService();
